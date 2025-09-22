# cart/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer

class CartView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

class AddItemView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        context["cart"] = cart
        return context
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Kiểm tra xem item với cùng menu_item và options đã tồn tại chưa
        cart, _ = Cart.objects.get_or_create(user=request.user)
        menu_item_id = request.data.get('menu_item_id')
        option_ids = set(request.data.get('option_ids', []))
        
        # Tìm item có cùng menu_item và options
        existing_item = None
        for item in cart.items.filter(menu_item_id=menu_item_id):
            item_option_ids = set(item.selected_options.values_list('id', flat=True))
            if item_option_ids == option_ids:
                existing_item = item
                break
        
        if existing_item:
            # Cập nhật số lượng của item hiện có
            existing_item.quantity += int(request.data.get('quantity', 1))
            existing_item.save()
            serializer = self.get_serializer(existing_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Tạo item mới
            return super().create(request, *args, **kwargs)

class UpdateItemView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer
    
    def get_queryset(self):
        # Chỉ cho phép user thao tác với cart items của mình
        user_cart = Cart.objects.get_or_create(user=self.request.user)[0]
        return CartItem.objects.filter(cart=user_cart)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        context["cart"] = cart
        return context