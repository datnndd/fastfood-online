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
    payment_method = models.CharField(max_length=20, default="cash")  # temporary cash
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

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


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER_PLACED = "ORDER_PLACED", "Đơn hàng đã đặt"
        ORDER_CONFIRMED = "ORDER_CONFIRMED", "Đơn hàng đã xác nhận"
        ORDER_READY = "ORDER_READY", "Đơn hàng sẵn sàng giao"
        ORDER_DELIVERING = "ORDER_DELIVERING", "Đơn hàng đang giao"
        ORDER_COMPLETED = "ORDER_COMPLETED", "Đơn hàng đã hoàn thành"
        ORDER_CANCELLED = "ORDER_CANCELLED", "Đơn hàng đã hủy"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"
