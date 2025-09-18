# orders/services.py
from decimal import Decimal
from cart.models import Cart
from catalog.models import Option
from .models import Order, OrderItem

def create_order_from_cart(user, payment_method="cash", note=""):
    cart = Cart.objects.get(user=user)
    order = Order.objects.create(user=user, payment_method=payment_method, note=note)
    total = Decimal("0.00")
    for ci in cart.items.select_related("menu_item").prefetch_related("selected_options"):
        base = ci.menu_item.price
        delta = sum([opt.price_delta for opt in ci.selected_options.all()]) if ci.selected_options.exists() else Decimal("0")
        price = base + delta
        OrderItem.objects.create(
            order=order,
            menu_item=ci.menu_item,
            quantity=ci.quantity,
            unit_price=price,
            options_text=", ".join([o.name for o in ci.selected_options.all()]) if ci.selected_options.exists() else "",
        )
        total += price * ci.quantity
    order.total_amount = total
    order.save()
    cart.items.all().delete()  # clear cart sau khi đặt hàng
    return order
