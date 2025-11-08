# accounts/views.py
from rest_framework import generics, permissions, viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

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
    ManageUserListSerializer,
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


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = ManageUserListSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "full_name", "email"]
    ordering_fields = ["date_joined", "username", "role"]
    ordering = ["-date_joined"]


class ProvinceListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProvinceSerializer
    @method_decorator(cache_page(60 * 60 * 24))  # 24h
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        # chỉ các cột cần
        return Province.objects.all().only("id", "name", "code")


class WardListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WardSerializer

    @method_decorator(cache_page(60 * 60 * 24))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        qs = Ward.objects.select_related("province").only("id", "name", "code", "province_id")
        pid = self.request.query_params.get("province_id")
        if pid:
            qs = qs.filter(province_id=pid)
        return qs


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            DeliveryAddress.objects.filter(user=self.request.user)
            .select_related("province", "ward")
            .only(
                "id", "label", "contact_name", "contact_phone",
                "street_address", "additional_info", "province_id",
                "ward_id", "is_default", "created_at", "updated_at",
                "province__name", "ward__name"
            )
            .order_by("-is_default", "-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(["POST"])
@permission_classes([AllowAny])
def get_email_for_username(request):
    username = request.data.get("username")
    if not username:
        return Response({"detail": "Username is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.only("email").get(username__iexact=username)
        return Response({"email": user.email}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"detail": "Username not found."}, status=status.HTTP_404_NOT_FOUND)
    
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
