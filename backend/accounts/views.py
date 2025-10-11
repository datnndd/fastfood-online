# accounts/views.py
from rest_framework import generics, permissions, viewsets

from .models import User, Province, District, Ward, DeliveryAddress
from .permissions import IsManager
from .serializers import (
    RegisterSerializer,
    CreateStaffSerializer,
    UpdateRoleSerializer,
    ProfileSerializer,
    ProvinceSerializer,
    DistrictSerializer,
    WardSerializer,
    DeliveryAddressSerializer,
)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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


class DistrictListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = District.objects.select_related("province")
        province_id = self.request.query_params.get("province_id")
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        return queryset


class WardListView(generics.ListAPIView):
    serializer_class = WardSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Ward.objects.select_related("district__province")
        district_id = self.request.query_params.get("district_id")
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        return queryset


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            DeliveryAddress.objects.filter(user=self.request.user)
            .select_related("province", "district", "ward")
            .order_by("-is_default", "-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)