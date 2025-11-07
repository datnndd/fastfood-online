# orders/serializers.py
from rest_framework import serializers

from accounts.serializers import DeliveryAddressSerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.SerializerMethodField()
    is_combo = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item_name",
            "quantity",
            "unit_price",
            "options_text",
            "is_combo",
        ]

    def get_menu_item_name(self, obj):
        if obj.menu_item_id:
            return obj.menu_item.name
        if obj.combo_id:
            return obj.combo.name
        return ""

    def get_is_combo(self, obj):
        return bool(obj.combo_id)


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
            "payment_status",
            "payment_completed_at",
            "note",
            "created_at",
            "delivery_address",
            "items",
        ]
