# orders/serializers.py
from rest_framework import serializers

from accounts.serializers import DeliveryAddressSerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item_name", "quantity", "unit_price", "options_text"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_address = DeliveryAddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "total_amount",
            "payment_method",
            "note",
            "created_at",
            "delivery_address",
            "items",
        ]
