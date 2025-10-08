# catalog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet, ComboViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="categories")
router.register("items", MenuItemViewSet, basename="items")
router.register("combos", ComboViewSet, basename="combos")

urlpatterns = [path("", include(router.urls))]