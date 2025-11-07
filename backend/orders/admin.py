# orders/admin.py
from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "total_amount",
        "payment_method",
        "delivery_address",
        "created_at",
    )
    list_filter  = ("status", "payment_method", "created_at", "delivery_address__province")
    search_fields = ("user__username", "user__email")
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "menu_item", "combo", "quantity", "unit_price")
    search_fields = ("order__id", "menu_item__name", "combo__name")
