# orders/models.py
from django.db import models
from django.conf import settings
from catalog.models import MenuItem, Option, Combo
from decimal import Decimal
from django.core.exceptions import ValidationError

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
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.0"))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.0"))
    payment_method = models.CharField(max_length=20, default="cash")  # cash, card
    payment_status = models.CharField(max_length=50, default="pending")  # pending, paid, failed
    note = models.CharField(max_length=255, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_status = models.CharField(max_length=50, blank=True, null=True)
    payment_completed_at = models.DateTimeField(null=True, blank=True)  # Thời gian thanh toán hoàn tất (capture)
    authorized_at = models.DateTimeField(null=True, blank=True)  # Thời gian authorization (status requires_capture)
    authorization_expires_at = models.DateTimeField(null=True, blank=True)  # Thời gian hết hạn authorization (60s sau authorized_at)
    captured_at = models.DateTimeField(null=True, blank=True)  # Thời gian capture thành công
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT, null=True, blank=True)
    combo = models.ForeignKey(Combo, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    options_text = models.CharField(max_length=255, blank=True)

    def clean(self):
        if self.menu_item and self.combo:
            raise ValidationError("OrderItem phải gắn với món hoặc combo, không thể cả hai.")
        if not self.menu_item and not self.combo:
            raise ValidationError("OrderItem phải gắn với một món hoặc một combo.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
