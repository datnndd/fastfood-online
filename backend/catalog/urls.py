# catalog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet
router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="categories")
router.register("items", MenuItemViewSet, basename="items")
urlpatterns = [path("", include(router.urls))]