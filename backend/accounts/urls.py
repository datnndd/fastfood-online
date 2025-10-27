# accounts/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    MeView,
    CreateStaffView,
    UpdateUserRoleView,
    ProvinceListView,
    WardListView,
    DeliveryAddressViewSet,
)

router = DefaultRouter()
router.register("addresses", DeliveryAddressViewSet, basename="delivery-address")

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("me/", MeView.as_view()),
    path("staff/create/", CreateStaffView.as_view()),
    path("users/<int:pk>/role/", UpdateUserRoleView.as_view()),
    path("locations/provinces/", ProvinceListView.as_view()),
    path("locations/wards/", WardListView.as_view()),
    path("", include(router.urls)),
]
