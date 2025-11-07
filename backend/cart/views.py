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
        # vẫn giữ get_or_create như cũ để đảm bảo có cart
        cart, _ = Cart.objects.get_or_create(user=self.request.user)

        # nạp lại cart với đầy đủ prefetch để tránh N+1 khi serialize
        return (
            Cart.objects
            .filter(pk=cart.pk)
            .prefetch_related(
                "items__selected_options",   # M2M
                "items__menu_item",          # FK
                "combos__combo"              # FK
            )
            .get()
        )

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

        # Prefetch options cho tất cả item cùng menu_item trước khi so sánh
        candidates = (
            cart.items
            .filter(menu_item_id=menu_item_id)
            .prefetch_related("selected_options")
        )

        existing_item = None
        for item in candidates:
            if set(item.selected_options.values_list('id', flat=True)) == option_ids:
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
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return (
            CartItem.objects
            .filter(cart=cart)
            .select_related("menu_item")
            .prefetch_related("selected_options")
        )


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
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartCombo.objects.filter(cart=cart).select_related("combo")

class ClearCartView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        cart.combos.all().delete()
        return Response({'message': 'Cart đã được xóa'}, status=status.HTTP_204_NO_CONTENT)