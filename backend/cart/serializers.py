# cart/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem, CartCombo
from catalog.serializers import MenuItemSerializer, OptionSerializer, ComboDetailSerializer

class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    selected_options = OptionSerializer(many=True, read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    option_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id","menu_item","quantity","selected_options","menu_item_id","option_ids","note","item_total"]

    def get_item_total(self, obj):
        price = obj.menu_item.price
        for opt in obj.selected_options.all():
            price += opt.price_delta
        return str(price * obj.quantity)

    def create(self, validated):
        cart = self.context["cart"]
        menu_item_id = validated.pop("menu_item_id")
        option_ids = validated.pop("option_ids", [])
        item = CartItem.objects.create(cart=cart, menu_item_id=menu_item_id, **validated)
        if option_ids: item.selected_options.set(option_ids)
        return item

class CartComboSerializer(serializers.ModelSerializer):
    combo = ComboDetailSerializer(read_only=True)
    combo_id = serializers.IntegerField(write_only=True)
    combo_total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartCombo
        fields = ["id", "combo", "combo_id", "quantity", "note", "combo_total", "added_at"]
    
    def get_combo_total(self, obj):
        return str(obj.get_total_price())
    
    def create(self, validated):
        cart = self.context["cart"]
        combo_id = validated.pop("combo_id")
        cart_combo = CartCombo.objects.create(cart=cart, combo_id=combo_id, **validated)
        return cart_combo

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    combos = CartComboSerializer(many=True, read_only=True)
    cart_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ["id", "items", "combos", "cart_total"]
    
    def get_cart_total(self, obj):
        from decimal import Decimal
        total = Decimal('0.00')
        
        for item in obj.items.all():
            price = item.menu_item.price
            for opt in item.selected_options.all():
                price += opt.price_delta
            total += price * item.quantity
        
        for combo_item in obj.combos.all():
            total += combo_item.get_total_price()
        
        return str(total)