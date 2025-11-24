import os
import django
from decimal import Decimal

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from catalog.models import Category, MenuItem, Combo, ComboItem
from orders.services import create_order_from_cart, restock_order_inventory
from cart.models import Cart, CartCombo
from django.contrib.auth import get_user_model
from orders.models import Order

User = get_user_model()

def run_verification():
    print("Starting verification...")
    
    # Setup data
    user, created = User.objects.get_or_create(
        username="testuser", 
        defaults={"email": "test@example.com", "password": "testpassword123"}
    )
    if created:
        user.set_password("testpassword123")
        user.save()
    category, _ = Category.objects.get_or_create(name="Test Category")
    
    menu_item = MenuItem.objects.create(
        name="Test Item",
        price=Decimal("10000"),
        stock=10,
        category=category
    )
    
    combo = Combo.objects.create(
        name="Test Combo",
        discount_percentage=10,
        category=category,
        # stock is calculated
    )
    
    ComboItem.objects.create(combo=combo, menu_item=menu_item, quantity=2)
    
    # Verify initial stock
    print(f"Initial MenuItem stock: {menu_item.stock}")
    print(f"Initial Combo stock (calculated): {combo.stock}")
    
    assert menu_item.stock == 10
    assert combo.stock == 5  # 10 // 2
    
    # Create Cart and Order
    cart, _ = Cart.objects.get_or_create(user=user)
    CartCombo.objects.create(cart=cart, combo=combo, quantity=1)
    
    from accounts.models import DeliveryAddress, Province, Ward
    
    # Create location data
    province, _ = Province.objects.get_or_create(name="Test Province", code="TP")
    ward, _ = Ward.objects.get_or_create(name="Test Ward", code="TW", province=province)
    
    # Create Delivery Address
    delivery_address = DeliveryAddress.objects.create(
        user=user,
        contact_name="Test User",
        contact_phone="0123456789",
        street_address="123 Test St",
        province=province,
        ward=ward
    )
    
    print("Creating order...")
    order = create_order_from_cart(
        user=user,
        delivery_address=delivery_address,
        payment_method="cash"
    )
    
    # Refresh from db
    menu_item.refresh_from_db()
    
    print(f"Post-order MenuItem stock: {menu_item.stock}")
    print(f"Post-order Combo stock (calculated): {combo.stock}")
    
    assert menu_item.stock == 8  # 10 - 2*1
    assert combo.stock == 4      # 8 // 2
    
    # Test Restock
    print("Restocking order...")
    restock_order_inventory(order)
    
    menu_item.refresh_from_db()
    
    print(f"Restocked MenuItem stock: {menu_item.stock}")
    print(f"Restocked Combo stock (calculated): {combo.stock}")
    
    assert menu_item.stock == 10
    assert combo.stock == 5
    
    print("Verification SUCCESS!")

    # Cleanup
    order.delete()
    combo.delete()
    menu_item.delete()
    category.delete() # Might fail if used by others, but it's fine for test script

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"Verification FAILED: {e}")
        import traceback
        traceback.print_exc()
