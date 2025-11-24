# content/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import boto3
import uuid
import os

from .models import Page, ContentItem, Store
from .serializers import (
    PageSerializer, PageWithContentSerializer, ContentItemSerializer,
    ContentItemCreateUpdateSerializer, StoreSerializer, StoreCreateUpdateSerializer
)


class IsManagerOrReadOnly(IsAuthenticated):
    """Permission class: managers can write, everyone can read"""
    def has_permission(self, request, view):
        # Allow read operations for everyone (including anonymous)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # For write operations, check if user is manager
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'role') and request.user.role == 'manager'


class PageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Pages - read-only for everyone
    """
    queryset = Page.objects.filter(is_active=True)
    serializer_class = PageSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def content(self, request, slug=None):
        """Get page with all its content items"""
        page = self.get_object()
        serializer = PageWithContentSerializer(page)
        return Response(serializer.data)


class ContentItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ContentItems
    - GET: public access
    - POST/PUT/PATCH/DELETE: manager only
    """
    queryset = ContentItem.objects.all()
    permission_classes = [AllowAny]  # Changed to AllowAny for GET, but still check in actions
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ContentItemCreateUpdateSerializer
        return ContentItemSerializer
    
    def get_queryset(self):
        queryset = ContentItem.objects.all()
        # Filter by page if provided (using 'page_slug' to avoid conflict with DRF pagination)
        page_slug = self.request.query_params.get('page_slug', None)
        if page_slug:
            # Check if page exists first to avoid errors
            try:
                page = Page.objects.get(slug=page_slug)
                queryset = queryset.filter(page=page)
            except Page.DoesNotExist:
                # Return empty queryset if page doesn't exist
                queryset = ContentItem.objects.none()
        # Filter by active status for non-managers
        user = self.request.user
        if not user.is_authenticated or not (hasattr(user, 'role') and user.role == 'manager'):
            queryset = queryset.filter(is_active=True)
        return queryset.select_related('page')


class StoreViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Stores
    - GET: public access
    - POST/PUT/PATCH/DELETE: manager only
    """
    queryset = Store.objects.all()
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """Allow public read, manager write"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StoreCreateUpdateSerializer
        return StoreSerializer
    
    def get_queryset(self):
        queryset = Store.objects.all()
        # Filter by active status for non-managers
        user = self.request.user
        if not user.is_authenticated or not (hasattr(user, 'role') and user.role == 'manager'):
            queryset = queryset.filter(is_active=True)
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """
    Upload image to Supabase Storage (S3-compatible)
    Manager only
    """
    # Check if user is manager
    if not (hasattr(request.user, 'role') and request.user.role == 'manager'):
        return Response(
            {'error': 'Only managers can upload images'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    image_file = request.FILES['image']
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if image_file.content_type not in allowed_types:
        return Response(
            {'error': 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    if image_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'File size too large. Maximum size is 5MB.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Generate unique filename
        ext = os.path.splitext(image_file.name)[1]
        filename = f"content/{uuid.uuid4()}{ext}"
        
        # Upload to S3/Supabase Storage
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION
        )
        
        s3_client.upload_fileobj(
            image_file,
            settings.S3_BUCKET,
            filename,
            ExtraArgs={'ContentType': image_file.content_type}
        )
        
        # Construct public URL
        image_url = f"{settings.S3_PUBLIC_BASE_URL}/{filename}"
        
        return Response({
            'url': image_url,
            'filename': filename
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Upload failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
