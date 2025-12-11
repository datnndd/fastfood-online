# cart/models.py
from django.db import models
from django.conf import settings
from catalog.models import MenuItem, Option, Combo
from decimal import Decimal

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items", db_index=True)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    selected_options = models.ManyToManyField(Option, blank=True)
    note = models.TextField(blank=True, max_length=500)
    item_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def calculate_total(self):
        """Calculate the total price for this cart item including options"""
        price = self.menu_item.price
        if self.pk:
            for option in self.selected_options.all():
                price += option.price_delta
        return price * self.quantity
    
    def save(self, *args, **kwargs):
        # Auto-update item_total before saving
        self.item_total = self.calculate_total()
        super().save(*args, **kwargs)

class CartCombo(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="combos", db_index=True)
    combo = models.ForeignKey(Combo, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True, max_length=500)
    added_at = models.DateTimeField(auto_now_add=True)
    combo_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def calculate_total(self):
        """Calculate the total price for this combo"""
        return self.combo.final_price * self.quantity
    
    def get_total_price(self):
        """Deprecated: Use combo_total field or calculate_total() method"""
        return self.calculate_total()
    
    def save(self, *args, **kwargs):
        # Auto-update combo_total before saving
        self.combo_total = self.calculate_total()
        super().save(*args, **kwargs)