# orders/models.py
from django.db import models
from django.conf import settings
from catalog.models import MenuItem, Option
from decimal import Decimal

class Order(models.Model):
    class Status(models.TextChoices):
        PREPARING   = "PREPARING", "Preparing"
        READY       = "READY", "Ready"
        DELIVERING  = "DELIVERING", "Delivering"
        COMPLETED   = "COMPLETED", "Completed"
        CANCELLED   = "CANCELLED", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    delivery_address = models.ForeignKey(
        "accounts.DeliveryAddress",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PREPARING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.0"))
    payment_method = models.CharField(max_length=20, default="cash")  # temporary cash
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    options_text = models.CharField(max_length=255, blank=True)
