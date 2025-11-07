# orders/services.py
from decimal import Decimal
from django.db import transaction
from cart.models import Cart
from catalog.models import Option
from .models import Order, OrderItem
from decimal import Decimal, ROUND_HALF_UP

@transaction.atomic
def create_order_from_cart(user, payment_method="cash", note="", delivery_address=None):
    try:
        cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
        raise ValueError("Cart không tồn tại")

    if not cart.items.exists() and not cart.combos.exists():
        raise ValueError("Cart trống")

    if delivery_address is None:
        raise ValueError("Vui lòng chọn địa chỉ giao hàng")

    if delivery_address.user_id != user.id:
        raise ValueError("Địa chỉ giao hàng không hợp lệ")

    order = Order.objects.create(
        user=user,
        delivery_address=delivery_address,
        payment_method=payment_method,
        note=note
    )
    
    total = Decimal("0.00")
    
    for cart_item in cart.items.select_related("menu_item").prefetch_related("selected_options"):
        base_price = cart_item.menu_item.price
        options_price = Decimal("0.00")
        selected_options_names = []
        
        if cart_item.selected_options.exists():
            for option in cart_item.selected_options.all():
                options_price += option.price_delta
                selected_options_names.append(option.name)
        
        unit_price = base_price + options_price
        
        options_display = ", ".join(selected_options_names)
        if cart_item.note:
            options_display += f" | Ghi chú: {cart_item.note}"
        
        OrderItem.objects.create(
            order=order,
            menu_item=cart_item.menu_item,
            quantity=cart_item.quantity,
            unit_price=Decimal(unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            options_text=options_display
        )
        
        total += unit_price * cart_item.quantity
    
    for cart_combo in cart.combos.select_related("combo").prefetch_related(
        "combo__items__menu_item",
        "combo__items__selected_options"
    ):
        combo = cart_combo.combo
        
        combo_description = f"COMBO: {combo.name}"
        combo_items_list = []
        
        for combo_item in combo.items.all():
            item_desc = f"{combo_item.menu_item.name} x{combo_item.quantity}"
            
            if combo_item.selected_options.exists():
                opts = [opt.name for opt in combo_item.selected_options.all()]
                item_desc += f" ({', '.join(opts)})"
            
            combo_items_list.append(item_desc)
        
        combo_description += f" | {'; '.join(combo_items_list)}"
        combo_description += f" | Giảm {combo.discount_percentage}%"
        
        if cart_combo.note:
            combo_description += f" | Ghi chú: {cart_combo.note}"
        
        combo_unit_price = combo.calculate_final_price()
        
        OrderItem.objects.create(
            order=order,
            combo=combo,
            quantity=cart_combo.quantity,
            unit_price=Decimal(combo_unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            options_text=combo_description
        )
        
        total += combo_unit_price * cart_combo.quantity
    
    order.total_amount = total
    order.save()
    
    cart.items.all().delete()
    cart.combos.all().delete()
    
    return order

def calculate_cart_total(cart):
    total = Decimal("0.00")
    
    for item in cart.items.select_related('menu_item').prefetch_related('selected_options'):
        base_price = item.menu_item.price
        options_price = sum(opt.price_delta for opt in item.selected_options.all())
        total += (base_price + options_price) * item.quantity
    
    for combo_item in cart.combos.select_related('combo').prefetch_related(
        'combo__items__menu_item',
        'combo__items__selected_options'
    ):
        total += combo_item.get_total_price()
    
    return total
