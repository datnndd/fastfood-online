# orders/serializers.py
from rest_framework import serializers

from accounts.serializers import DeliveryAddressSerializer

from .models import Order, OrderItem, Notification


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.SerializerMethodField()
    is_combo = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item_name",
            "quantity",
            "unit_price",
            "options_text",
            "is_combo",
            "image_url",
        ]

    def get_menu_item_name(self, obj):
        if obj.menu_item_id:
            return obj.menu_item.name
        if obj.combo_id:
            return obj.combo.name
        return ""

    def get_is_combo(self, obj):
        return bool(obj.combo_id)

    def get_image_url(self, obj):
        # Prefer the specific item image; fall back to combo image if provided
        try:
            if obj.menu_item_id and getattr(obj.menu_item, "image_url", ""):
                return obj.menu_item.image_url
            if obj.combo_id and getattr(obj.combo, "image_url", ""):
                return obj.combo.image_url
        except Exception:
            # Avoid serializer errors if related objects are not prefetched
            pass
        return ""


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


class NotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "is_read",
            "created_at",
            "order_id",
        ]
        read_only_fields = ["id", "created_at"]
