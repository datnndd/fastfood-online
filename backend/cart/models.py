# cart/models.py
from django.db import models
from django.conf import settings
from catalog.models import MenuItem, Option, Combo

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    selected_options = models.ManyToManyField(Option, blank=True)
    note = models.TextField(blank=True, max_length=500)

class CartCombo(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="combos")
    combo = models.ForeignKey(Combo, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True, max_length=500)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def get_total_price(self):
        return self.combo.calculate_final_price() * self.quantity