# orders/services.py
from django.db import transaction
from cart.models import Cart
from catalog.models import Option, MenuItem, Combo
from .models import Order, OrderItem
from decimal import Decimal, ROUND_HALF_UP
from collections import Counter

@transaction.atomic
def create_order_from_cart(
    user,
    payment_method="cash",
    note="",
    delivery_address=None,
    clear_cart=True,
    selected_item_ids=None,
    selected_combo_ids=None,
):
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

    allowed_payment_methods = {"cash", "card"}
    if payment_method not in allowed_payment_methods:
        raise ValueError("Phương thức thanh toán không hợp lệ")

    # Xác định payment_status dựa trên payment_method (hiện tại đều pending)
    payment_status = "pending"
    order = Order.objects.create(
        user=user,
        delivery_address=delivery_address,
        payment_method=payment_method,
        payment_status=payment_status,
        note=note,
        delivery_fee=Decimal("0.00"),  # Mặc định phí giao hàng = 0
        discount_amount=Decimal("0.00")  # Mặc định giảm giá = 0
    )
    
    total = Decimal("0.00")
    
    # Normalize selections
    item_id_set = set(selected_item_ids or [])
    combo_id_set = set(selected_combo_ids or [])

    items_qs = cart.items.select_related("menu_item").prefetch_related("selected_options")
    if item_id_set:
        items_qs = items_qs.filter(id__in=item_id_set)

    items_qs = list(items_qs)
    combos_qs = cart.combos.select_related("combo").prefetch_related(
        "combo__items__menu_item",
        "combo__items__selected_options"
    )
    if combo_id_set:
        combos_qs = combos_qs.filter(id__in=combo_id_set)
    combos_qs = list(combos_qs)

    if not items_qs and not combos_qs:
        raise ValueError("Không có sản phẩm nào được chọn để đặt hàng.")

    menu_item_quantities = Counter()
    for cart_item in items_qs:
        if cart_item.menu_item_id:
            menu_item_quantities[cart_item.menu_item_id] += cart_item.quantity

    menu_items_to_update = []
    if menu_item_quantities:
        locked_items = {
            item.id: item
            for item in MenuItem.objects.select_for_update().filter(id__in=menu_item_quantities.keys())
        }
        missing_items = set(menu_item_quantities.keys()) - set(locked_items.keys())
        if missing_items:
            raise ValueError("Một số món ăn không còn tồn tại. Vui lòng làm mới giỏ hàng.")
        for menu_item_id, required_qty in menu_item_quantities.items():
            menu_item = locked_items[menu_item_id]
            available_stock = menu_item.stock or 0
            if not menu_item.is_available or available_stock <= 0:
                raise ValueError(f"{menu_item.name} đã hết hàng. Vui lòng bỏ món này khỏi giỏ.")
            if required_qty > available_stock:
                raise ValueError(f"{menu_item.name} chỉ còn {available_stock} phần trong kho.")
            menu_item.stock = max(available_stock - required_qty, 0)
            if menu_item.stock == 0:
                menu_item.is_available = False
            menu_items_to_update.append(menu_item)

    combo_quantities = Counter()
    for cart_combo in combos_qs:
        if cart_combo.combo_id:
            combo_quantities[cart_combo.combo_id] += cart_combo.quantity

    combos_to_update = []
    if combo_quantities:
        locked_combos = {
            combo.id: combo
            for combo in Combo.objects.select_for_update().filter(id__in=combo_quantities.keys())
        }
        missing_combos = set(combo_quantities.keys()) - set(locked_combos.keys())
        if missing_combos:
            raise ValueError("Một số combo không còn tồn tại. Vui lòng làm mới giỏ hàng.")
        for combo_id, required_qty in combo_quantities.items():
            combo = locked_combos[combo_id]
            available_stock = combo.stock or 0
            if not combo.is_available or available_stock <= 0:
                raise ValueError(f"{combo.name} đã hết hàng. Vui lòng bỏ combo này khỏi giỏ.")
            if required_qty > available_stock:
                raise ValueError(f"{combo.name} chỉ còn {available_stock} suất trong kho.")
            combo.stock = max(available_stock - required_qty, 0)
            if combo.stock == 0:
                combo.is_available = False
            combos_to_update.append(combo)

    for cart_item in items_qs:
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
    
    for cart_combo in combos_qs:
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
    
    if menu_items_to_update:
        MenuItem.objects.bulk_update(menu_items_to_update, ["stock", "is_available"])
    if combos_to_update:
        Combo.objects.bulk_update(combos_to_update, ["stock", "is_available"])

    # Dọn giỏ hàng theo cấu hình
    if item_id_set:
        cart.items.filter(id__in=item_id_set).delete()
    elif clear_cart:
        cart.items.all().delete()

    if combo_id_set:
        cart.combos.filter(id__in=combo_id_set).delete()
    elif clear_cart:
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
