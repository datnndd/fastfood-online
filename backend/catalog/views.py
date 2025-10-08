# catalog/views.py
from rest_framework import viewsets, permissions, filters
from accounts.permissions import IsManager
from .models import Category, MenuItem, Combo
from .serializers import (
    CategorySerializer, MenuItemSerializer,
    ComboListSerializer, ComboDetailSerializer, ComboCreateUpdateSerializer
)

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
    
class ComboViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]
    
    def get_queryset(self):
        queryset = Combo.objects.prefetch_related(
            'items__menu_item__category',
            'items__menu_item__option_groups__options',
            'items__selected_options'
        )
        
        if self.action in ['list', 'retrieve']:
            available = self.request.query_params.get('available')
            if available and available.lower() in ['true', '1']:
                queryset = queryset.filter(is_available=True)
        
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