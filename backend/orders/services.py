# orders/services.py
from decimal import Decimal
from django.db import transaction
from cart.models import Cart
from catalog.models import Option
from .models import Order, OrderItem

@transaction.atomic
def create_order_from_cart(user, payment_method="cash", note=""):
    """
    Tạo order từ cart của user, tính toán đúng giá với options
    """
    try:
        cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
        raise ValueError("Cart không tồn tại")
    
    if not cart.items.exists():
        raise ValueError("Cart trống")
    
    # Tạo order
    order = Order.objects.create(
        user=user, 
        payment_method=payment_method, 
        note=note
    )
    
    total = Decimal("0.00")
    
    # Duyệt qua từng cart item
    for cart_item in cart.items.select_related("menu_item").prefetch_related("selected_options"):
        # Tính giá base của menu item
        base_price = cart_item.menu_item.price
        
        # Tính tổng price_delta của các options
        options_price = Decimal("0.00")
        selected_options_names = []
        
        if cart_item.selected_options.exists():
            for option in cart_item.selected_options.all():
                options_price += option.price_delta
                selected_options_names.append(option.name)
        
        # Giá cuối cùng cho một đơn vị
        unit_price = base_price + options_price
        
        # Tạo OrderItem
        OrderItem.objects.create(
            order=order,
            menu_item=cart_item.menu_item,
            quantity=cart_item.quantity,
            unit_price=unit_price,
            options_text=", ".join(selected_options_names)
        )
        
        # Cộng vào tổng tiền
        total += unit_price * cart_item.quantity
    
    # Cập nhật total_amount của order
    order.total_amount = total
    order.save()
    
    # Xóa cart sau khi đặt hàng thành công
    cart.items.all().delete()
    
    return order

def calculate_cart_total(cart):
    """
    Tính tổng tiền của cart (utility function)
    """
    total = Decimal("0.00")
    
    for item in cart.items.select_related('menu_item').prefetch_related('selected_options'):
        base_price = item.menu_item.price
        options_price = sum(opt.price_delta for opt in item.selected_options.all())
        total += (base_price + options_price) * item.quantity
    
    return total