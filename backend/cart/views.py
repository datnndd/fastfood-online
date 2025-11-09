# cart/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Prefetch
from .models import Cart, CartItem, CartCombo
from catalog.models import MenuItem, Combo, ComboItem
from .serializers import CartSerializer, CartItemSerializer, CartComboSerializer

class CartView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def get_object(self):
        # vẫn giữ get_or_create như cũ để đảm bảo có cart
        cart, _ = Cart.objects.get_or_create(user=self.request.user)

        items_queryset = (
            CartItem.objects
            .select_related("menu_item", "menu_item__category")
            .prefetch_related("selected_options")
        )

        combo_items_queryset = (
            ComboItem.objects
            .select_related("menu_item", "menu_item__category")
            .prefetch_related("selected_options")
        )

        combos_queryset = (
            CartCombo.objects
            .select_related("combo", "combo__category")
            .prefetch_related(
                Prefetch("combo__items", queryset=combo_items_queryset)
            )
        )

        # nạp lại cart với đầy đủ prefetch để tránh N+1 khi serialize
        return (
            Cart.objects
            .filter(pk=cart.pk)
            .prefetch_related(
                Prefetch("items", queryset=items_queryset),
                Prefetch("combos", queryset=combos_queryset),
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
        raw_option_ids = request.data.get('option_ids', [])
        try:
            option_ids = {int(opt_id) for opt_id in (raw_option_ids or [])}
        except (TypeError, ValueError):
            return Response({'detail': 'Danh sách tùy chọn không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'detail': 'Số lượng không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            return Response({'detail': 'Số lượng tối thiểu là 1'}, status=status.HTTP_400_BAD_REQUEST)

        if not menu_item_id:
            return Response({'detail': 'Thiếu menu_item_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
        except MenuItem.DoesNotExist:
            return Response({'detail': 'Món ăn không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        if not menu_item.is_available or menu_item.stock <= 0:
            return Response({'detail': f'{menu_item.name} đã hết hàng'}, status=status.HTTP_400_BAD_REQUEST)

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
            new_quantity = existing_item.quantity + quantity
            if new_quantity > menu_item.stock:
                return Response(
                    {'detail': f'{menu_item.name} chỉ còn {menu_item.stock} phần trong kho'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            existing_item.quantity = new_quantity
            existing_item.save()
            serializer = self.get_serializer(existing_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            if quantity > menu_item.stock:
                return Response(
                    {'detail': f'{menu_item.name} chỉ còn {menu_item.stock} phần trong kho'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payload = {
                'menu_item_id': menu_item_id,
                'quantity': quantity,
                'option_ids': list(option_ids),
                'note': request.data.get('note', '')
            }
            serializer = self.get_serializer(data=payload)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class UpdateItemView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return (
            CartItem.objects
            .filter(cart=cart)
            .select_related("menu_item", "menu_item__category")
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
        cart, _ = Cart.objects.get_or_create(user=request.user)
        combo_id = request.data.get('combo_id')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'detail': 'Số lượng không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            return Response({'detail': 'Số lượng tối thiểu là 1'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not combo_id:
            return Response({'detail': 'Thiếu combo_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            combo = Combo.objects.get(id=combo_id)
            if not combo.is_available or combo.stock <= 0:
                return Response(
                    {'detail': 'Combo này hiện không khả dụng'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Combo.DoesNotExist:
            return Response(
                {'detail': 'Combo không tồn tại'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        existing_combo = cart.combos.filter(combo_id=combo_id).first()
        
        if existing_combo:
            new_quantity = existing_combo.quantity + quantity
            if new_quantity > combo.stock:
                return Response(
                    {'detail': f'{combo.name} chỉ còn {combo.stock} suất trong kho'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            existing_combo.quantity = new_quantity
            existing_combo.save()
            serializer = self.get_serializer(existing_combo)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            if quantity > combo.stock:
                return Response(
                    {'detail': f'{combo.name} chỉ còn {combo.stock} suất trong kho'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payload = {
                'combo_id': combo_id,
                'quantity': quantity,
                'note': request.data.get('note', '')
            }
            serializer = self.get_serializer(data=payload)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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
