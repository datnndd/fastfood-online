# catalog/views.py
import os
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from core.utils.supabase_storage import upload_and_get_public_url
from rest_framework import viewsets, permissions, filters
from accounts.permissions import IsManager
from .models import Category, MenuItem, Combo
from django.db.models import ProtectedError
from .serializers import (
    CategorySerializer, MenuItemSerializer,
    ComboListSerializer, ComboDetailSerializer, ComboCreateUpdateSerializer,
    CategoryListSerializer, MenuItemListSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        from django.db.models import Count
        return Category.objects.annotate(
            items_count=Count('items', distinct=True),
            combos_count=Count('combos', distinct=True)
        )

    def get_permissions(self):
        if self.action in {"list","retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer
    
    @action(
        detail=True,
        methods=["POST"],
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[permissions.IsAuthenticated, IsManager],
        url_path="upload-image",
    )
    def upload_image(self, request, pk=None):
        obj = self.get_object()
        if "file" not in request.FILES:
            return Response({"detail": "Thiếu file"}, status=400)

        f = request.FILES["file"]
        ext = os.path.splitext(f.name)[1].lower() or ".jpg"
        dest_path = f"categories/{obj.id}{ext}"

        public_url = upload_and_get_public_url(f, dest_path, f.content_type or "image/jpeg")
        obj.image_url = public_url
        obj.save(update_fields=["image_url"])
        return Response({"image_url": public_url}, status=200)

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name","description","category__name"]

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('option_groups__options')
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return MenuItemListSerializer
        return MenuItemSerializer

    def get_permissions(self):
        if self.action in {"list","retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]
    
    @action(
        detail=True,
        methods=["POST"],
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[permissions.IsAuthenticated, IsManager],
        url_path="upload-image",
    )
    def upload_image(self, request, pk=None):
        obj = self.get_object()
        if "file" not in request.FILES:
            return Response({"detail": "Thiếu file"}, status=400)

        f = request.FILES["file"]
        ext = os.path.splitext(f.name)[1].lower() or ".jpg"
        dest_path = f"items/{obj.id}{ext}"

        public_url = upload_and_get_public_url(f, dest_path, f.content_type or "image/jpeg")
        obj.image_url = public_url
        obj.save(update_fields=["image_url"])
        obj.save(update_fields=["image_url"])
        return Response({"image_url": public_url}, status=200)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            protected_objects = list(e.protected_objects)
            combo_names = set()
            has_orders = False
            
            # Local import to avoid circular dependency if needed, 
            # though checking class name is safer for loose coupling
            for obj in protected_objects:
                # Check for ComboItem
                if hasattr(obj, 'combo') and hasattr(obj.combo, 'name'):
                    combo_names.add(obj.combo.name)
                # Check for OrderItem (has 'order' attribute)
                elif hasattr(obj, 'order'):
                    has_orders = True
            
            details = []
            if combo_names:
                details.append(f"đang có trong các Combo: {', '.join(combo_names)}")
            if has_orders:
                details.append("đã có trong đơn hàng")
            
            reason = " và ".join(details)
            message = f"Không thể xóa món ăn này vì {reason}." if reason else "Không thể xóa món ăn này vì nó đang được sử dụng."
            
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class ComboViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    def get_queryset(self):
        queryset = Combo.objects.select_related("category")
        
        if self.action == 'retrieve':
             queryset = queryset.prefetch_related(
                'items__menu_item__category',
                'items__menu_item__option_groups__options',
                'items__selected_options'
            )
        # List view doesn't need items anymore as we have cached fields
        
        if self.action in ['list', 'retrieve']:
            available = self.request.query_params.get('available')
            if available and available.lower() in ['true', '1']:
                queryset = queryset.filter(is_available=True)
        
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ComboListSerializer
        elif self.action == 'retrieve':
            return ComboDetailSerializer
        else:
            return ComboCreateUpdateSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]
    
    @action(
        detail=True,
        methods=["POST"],
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[permissions.IsAuthenticated, IsManager],
        url_path="upload-image",
    )
    def upload_image(self, request, pk=None):
        obj = self.get_object()
        if "file" not in request.FILES:
            return Response({"detail": "Thiếu file"}, status=400)

        f = request.FILES["file"]
        ext = os.path.splitext(f.name)[1].lower() or ".jpg"
        dest_path = f"combos/{obj.id}{ext}"

        public_url = upload_and_get_public_url(f, dest_path, f.content_type or "image/jpeg")
        obj.image_url = public_url
        obj.save(update_fields=["image_url"])
        return Response({"image_url": public_url}, status=200)