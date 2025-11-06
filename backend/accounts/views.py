# accounts/views.py
from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import User, Province, Ward, DeliveryAddress
from .permissions import IsManager
from .serializers import (
    RegisterSerializer,
    CreateStaffSerializer,
    UpdateRoleSerializer,
    ProfileSerializer,
    ProvinceSerializer,
    WardSerializer,
    DeliveryAddressSerializer,
)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        dry_run = request.query_params.get("dry_run") == "1"
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if dry_run:
            return Response({"detail": "validated"}, status=status.HTTP_200_OK)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class MeView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class CreateStaffView(generics.CreateAPIView):
    serializer_class = CreateStaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]

class UpdateUserRoleView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UpdateRoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    lookup_field = "pk"


class ProvinceListView(generics.ListAPIView):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [permissions.AllowAny]


class WardListView(generics.ListAPIView):
    serializer_class = WardSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Ward.objects.select_related("province")
        province_id = self.request.query_params.get("province_id")
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        return queryset


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            DeliveryAddress.objects.filter(user=self.request.user)
            .select_related("province", "ward")
            .order_by("-is_default", "-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['POST'])
@permission_classes([AllowAny]) #Cho phép truy cập không cần token
def get_email_for_username(request):
    """
    Lấy email của người dùng dựa trên username.
    """
    username = request.data.get('username')
    if not username:
        return Response(
            {'detail': 'Username is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Dùng 'iexact' để tìm kiếm không phân biệt hoa thường
        user = User.objects.get(username__iexact=username)
        return Response({'email': user.email}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Username not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def set_password(request):
    """
    Đặt lại mật khẩu mới cho user (request.user).
    Được sử dụng sau khi Supabase xác thực token reset mật khẩu.
    """
    password = request.data.get('password')
    if not password:
        return Response(
            {'detail': 'Password is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = request.user
    try:
        # Validate mật khẩu theo rules của Django
        validate_password(password, user)
    except ValidationError as e:
        return Response({'detail': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password) # Hash và set mật khẩu
    user.save()
    return Response({'detail': 'Password set successfully in Django.'}, status=status.HTTP_200_OK)
