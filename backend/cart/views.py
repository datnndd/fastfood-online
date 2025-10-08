# cart/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Cart, CartItem, CartCombo
from .serializers import CartSerializer, CartItemSerializer, CartComboSerializer

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
        cart, _ = Cart.objects.get_or_create(user=request.user)
        menu_item_id = request.data.get('menu_item_id')
        option_ids = set(request.data.get('option_ids', []))
        
        existing_item = None
        for item in cart.items.filter(menu_item_id=menu_item_id):
            item_option_ids = set(item.selected_options.values_list('id', flat=True))
            if item_option_ids == option_ids:
                existing_item = item
                break
        
        if existing_item:
            existing_item.quantity += int(request.data.get('quantity', 1))
            existing_item.save()
            serializer = self.get_serializer(existing_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return super().create(request, *args, **kwargs)

class UpdateItemView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer
    
    def get_queryset(self):
        user_cart = Cart.objects.get_or_create(user=self.request.user)[0]
        return CartItem.objects.filter(cart=user_cart)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        context["cart"] = cart
        return context


class AddComboView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartComboSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        context["cart"] = cart
        return context
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        from catalog.models import Combo
        
        cart, _ = Cart.objects.get_or_create(user=request.user)
        combo_id = request.data.get('combo_id')
        
        try:
            combo = Combo.objects.get(id=combo_id)
            if not combo.is_available:
                return Response(
                    {'error': 'Combo này hiện không khả dụng'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Combo.DoesNotExist:
            return Response(
                {'error': 'Combo không tồn tại'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        existing_combo = cart.combos.filter(combo_id=combo_id).first()
        
        if existing_combo:
            existing_combo.quantity += int(request.data.get('quantity', 1))
            existing_combo.save()
            serializer = self.get_serializer(existing_combo)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return super().create(request, *args, **kwargs)

class UpdateComboView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartComboSerializer
    
    def get_queryset(self):
        user_cart = Cart.objects.get_or_create(user=self.request.user)[0]
        return CartCombo.objects.filter(cart=user_cart)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        context["cart"] = cart
        return context

class ClearCartView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        cart.combos.all().delete()
        return Response({'message': 'Cart đã được xóa'}, status=status.HTTP_204_NO_CONTENT)