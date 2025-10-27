# accounts/views.py
from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response

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
