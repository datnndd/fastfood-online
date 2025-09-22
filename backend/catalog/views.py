# catalog/views.py
from rest_framework import viewsets, permissions, filters
from accounts.permissions import IsManager
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().prefetch_related("items")
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_permissions(self):
        if self.action in {"list","retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name","description","category__name"]

    def get_permissions(self):
        if self.action in {"list","retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManager()]