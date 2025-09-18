# cart/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem
from catalog.serializers import MenuItemSerializer, OptionSerializer

class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    selected_options = OptionSerializer(many=True, read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    option_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = CartItem
        fields = ["id","menu_item","quantity","selected_options","menu_item_id","option_ids"]

    def create(self, validated):
        cart = self.context["cart"]
        menu_item_id = validated.pop("menu_item_id")
        option_ids = validated.pop("option_ids", [])
        item = CartItem.objects.create(cart=cart, menu_item_id=menu_item_id, **validated)
        if option_ids: item.selected_options.set(option_ids)
        return item

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    class Meta:
        model = Cart
        fields = ["id","items"]
