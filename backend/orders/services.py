# orders/services.py
from django.db import transaction
from cart.models import Cart
from catalog.models import Option, MenuItem, Combo, ComboItem
from .models import Order, OrderItem
from decimal import Decimal, ROUND_HALF_UP
from collections import Counter


def update_affected_combos(menu_item_ids: list):
    """
    Cập nhật stock và is_available của tất cả combo chứa các menu items bị ảnh hưởng.
    Nếu combo hết stock thì tự động set is_available = False.
    """
    if not menu_item_ids:
        return
    
    # Tìm tất cả combo chứa các menu item bị ảnh hưởng
    affected_combo_ids = ComboItem.objects.filter(
        menu_item_id__in=menu_item_ids
    ).values_list('combo_id', flat=True).distinct()
    
    if not affected_combo_ids:
        return
    
    combos_to_update = []
    for combo in Combo.objects.filter(id__in=affected_combo_ids):
        new_stock = combo.calculate_stock()
        combo.stock = new_stock
        # Auto disable combo if out of stock
        if new_stock <= 0:
            combo.is_available = False
        combos_to_update.append(combo)
    
    if combos_to_update:
        Combo.objects.bulk_update(combos_to_update, ['stock', 'is_available'])

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
    # If caller passes item/combo ids, treat that as an explicit selection set; otherwise use the whole cart
    selection_mode = (selected_item_ids is not None) or (selected_combo_ids is not None)
    item_id_set = set(selected_item_ids or []) if selection_mode else set()
    combo_id_set = set(selected_combo_ids or []) if selection_mode else set()

    items_qs = cart.items.select_related("menu_item").prefetch_related("selected_options")
    if selection_mode:
        items_qs = items_qs.filter(id__in=item_id_set)

    items_qs = list(items_qs)
    combos_qs = cart.combos.select_related("combo").prefetch_related(
        "combo__items__menu_item",
        "combo__items__selected_options"
    )
    if selection_mode:
        combos_qs = combos_qs.filter(id__in=combo_id_set)
    combos_qs = list(combos_qs)

    if not items_qs and not combos_qs:
        raise ValueError("Không có sản phẩm nào được chọn để đặt hàng.")

    menu_item_quantities = Counter()
    for cart_item in items_qs:
        if cart_item.menu_item_id:
            menu_item_quantities[cart_item.menu_item_id] += cart_item.quantity

    # Collect all menu items needed, including those from combos
    final_menu_item_quantities = Counter(menu_item_quantities)
    
    # Calculate required menu items from combos
    # Calculate required menu items from combos
    for cart_combo in combos_qs:
        combo = cart_combo.combo
        combo_qty = cart_combo.quantity
        # Use prefetched items if available, otherwise query
        # Note: prefetch_related on 'combo__items__menu_item' populates combo.items.all()
        for c_item in combo.items.all():
            final_menu_item_quantities[c_item.menu_item_id] += c_item.quantity * combo_qty

    menu_items_to_update = []
    if final_menu_item_quantities:
        locked_items = {
            item.id: item
            for item in MenuItem.objects.select_for_update().filter(id__in=final_menu_item_quantities.keys())
        }
        missing_items = set(final_menu_item_quantities.keys()) - set(locked_items.keys())
        if missing_items:
            raise ValueError("Một số món ăn không còn tồn tại. Vui lòng làm mới giỏ hàng.")
            
        for menu_item_id, required_qty in final_menu_item_quantities.items():
            menu_item = locked_items[menu_item_id]
            available_stock = menu_item.stock or 0
            
            if not menu_item.is_available or available_stock <= 0:
                raise ValueError(f"{menu_item.name} đã hết hàng.")
            
            if required_qty > available_stock:
                raise ValueError(f"{menu_item.name} chỉ còn {available_stock} phần (bao gồm cả trong combo).")
                
            menu_item.stock = max(available_stock - required_qty, 0)
            if menu_item.stock == 0:
                menu_item.is_available = False
            menu_items_to_update.append(menu_item)

    # Combos don't have stock anymore, so we don't lock or update them for stock
    # We just verify they exist and are available (based on their calculated stock which relies on menu items)
    # But since we already checked menu item stock above, that implicitly checks combo availability.
    # However, we should still check if the combo itself is marked as available (e.g. manually disabled)
    if combos_qs:
        # Just check existence and is_available flag, not stock
        combo_ids = [c.combo_id for c in combos_qs]
        checked_combos = Combo.objects.filter(id__in=combo_ids, is_available=False)
        if checked_combos.exists():
             raise ValueError(f"Combo {checked_combos.first().name} hiện đang tạm ngưng phục vụ.")

    for cart_item in items_qs:
        base_price = cart_item.menu_item.price
        options_price = Decimal("0.00")
        selected_options_names = []
        
        if cart_item.selected_options.exists():
            for option in cart_item.selected_options.all():
                options_price += option.price_delta
                selected_options_names.append(f"{option.name} ({option.price_delta:,.0f}đ)")
        
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
                opts = [f"{opt.name} ({opt.price_delta:,.0f}đ)" for opt in combo_item.selected_options.all()]
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
        # Update affected combos - auto disable if out of stock
        update_affected_combos(list(final_menu_item_quantities.keys()))

    # Dọn giỏ hàng theo cấu hình
    if selection_mode:
        if item_id_set:
            cart.items.filter(id__in=item_id_set).delete()
        if combo_id_set:
            cart.combos.filter(id__in=combo_id_set).delete()
    elif clear_cart:
        cart.items.all().delete()
        cart.combos.all().delete()
    
    return order


@transaction.atomic
def restock_order_inventory(order):
    """Hoàn lại tồn kho cho các món/combo thuộc đơn hàng đã hủy."""
    order_items = list(
        order.items.select_related("menu_item", "combo").only(
            "menu_item_id", "combo_id", "quantity"
        )
    )
    if not order_items:
        return

    menu_item_quantities = Counter()
    combo_quantities = Counter()

    for order_item in order_items:
        if order_item.menu_item_id:
            menu_item_quantities[order_item.menu_item_id] += order_item.quantity
        elif order_item.combo_id:
            combo_quantities[order_item.combo_id] += order_item.quantity

    # Calculate total menu items to return
    final_menu_item_quantities = Counter(menu_item_quantities)
    
    # Add items from combos
    for combo_id, combo_qty in combo_quantities.items():
        combo_items = ComboItem.objects.filter(combo_id=combo_id).select_related('menu_item')
        for c_item in combo_items:
            final_menu_item_quantities[c_item.menu_item_id] += c_item.quantity * combo_qty

    menu_items_to_update = []
    if final_menu_item_quantities:
        locked_items = {
            item.id: item
            for item in MenuItem.objects.select_for_update().filter(
                id__in=final_menu_item_quantities.keys()
            )
        }
        for menu_item_id, qty in final_menu_item_quantities.items():
            menu_item = locked_items.get(menu_item_id)
            if not menu_item:
                continue
            current_stock = menu_item.stock or 0
            menu_item.stock = current_stock + qty
            if menu_item.stock > 0:
                menu_item.is_available = True
            menu_items_to_update.append(menu_item)
        if menu_items_to_update:
            MenuItem.objects.bulk_update(menu_items_to_update, ["stock", "is_available"])


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
