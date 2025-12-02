# cart/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem, CartCombo
from catalog.models import MenuItem, Combo
from catalog.serializers import OptionSerializer, ComboDetailSerializer

class MenuItemInCartSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source="category.id", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "price",
            "is_available",
            "stock",
            "image_url",
            "category_id",
            "category_name",
        ]

class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemInCartSerializer(read_only=True)
    selected_options = OptionSerializer(many=True, read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    option_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id","menu_item","quantity","selected_options","menu_item_id","option_ids","note","item_total"]

    def get_item_total(self, obj):
        # Use cached item_total field instead of recalculating
        return str(obj.item_total)

    def validate(self, attrs):
        quantity = attrs.get("quantity")
        if quantity is None:
            quantity = self.instance.quantity if self.instance else 1
        if quantity < 1:
            raise serializers.ValidationError({"quantity": "Số lượng tối thiểu là 1"})

        menu_item = None
        menu_item_id = attrs.get("menu_item_id")
        if menu_item_id is not None:
            try:
                menu_item = MenuItem.objects.get(pk=menu_item_id)
            except MenuItem.DoesNotExist:
                raise serializers.ValidationError({"menu_item_id": "Món ăn không tồn tại"})
        elif self.instance:
            menu_item = self.instance.menu_item

        if menu_item:
            if menu_item.stock < quantity:
                raise serializers.ValidationError({"quantity": f"{menu_item.name} chỉ còn {menu_item.stock} phần trong kho"})
            if not menu_item.is_available or menu_item.stock <= 0:
                raise serializers.ValidationError({"menu_item_id": f"{menu_item.name} tạm thời hết hàng"})

        attrs["menu_item_obj"] = menu_item
        return attrs

    def create(self, validated):
        cart = self.context["cart"]
        menu_item = validated.pop("menu_item_obj", None)
        menu_item_id = validated.pop("menu_item_id")
        option_ids = validated.pop("option_ids", [])
        create_kwargs = {"cart": cart, **validated}
        if menu_item:
            create_kwargs["menu_item"] = menu_item
        else:
            create_kwargs["menu_item_id"] = menu_item_id
        item = CartItem.objects.create(**create_kwargs)
        if option_ids: item.selected_options.set(option_ids)
        return item

    def update(self, instance, validated_data):
        validated_data.pop("menu_item_obj", None)
        return super().update(instance, validated_data)

class CartComboSerializer(serializers.ModelSerializer):
    combo = ComboDetailSerializer(read_only=True)
    combo_id = serializers.IntegerField(write_only=True)
    combo_total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartCombo
        fields = ["id", "combo", "combo_id", "quantity", "note", "combo_total", "added_at"]
    
    def get_combo_total(self, obj):
        # Use cached combo_total field instead of recalculating
        return str(obj.combo_total)

    def validate(self, attrs):
        quantity = attrs.get("quantity")
        if quantity is None:
            quantity = self.instance.quantity if self.instance else 1
        if quantity < 1:
            raise serializers.ValidationError({"quantity": "Số lượng tối thiểu là 1"})

        combo = None
        combo_id = attrs.get("combo_id")
        if combo_id is not None:
            try:
                combo = Combo.objects.get(pk=combo_id)
            except Combo.DoesNotExist:
                raise serializers.ValidationError({"combo_id": "Combo không tồn tại"})
        elif self.instance:
            combo = self.instance.combo

        if combo:
            if combo.stock < quantity:
                raise serializers.ValidationError({"quantity": f"{combo.name} chỉ còn {combo.stock} suất trong kho"})
            if not combo.is_available or combo.stock <= 0:
                raise serializers.ValidationError({"combo_id": f"{combo.name} tạm thời hết hàng"})

        attrs["combo_obj"] = combo
        return attrs
    
    def create(self, validated):
        cart = self.context["cart"]
        combo = validated.pop("combo_obj", None)
        combo_id = validated.pop("combo_id")
        create_kwargs = {"cart": cart, **validated}
        if combo:
            create_kwargs["combo"] = combo
        else:
            create_kwargs["combo_id"] = combo_id
        cart_combo = CartCombo.objects.create(**create_kwargs)
        return cart_combo

    def update(self, instance, validated_data):
        validated_data.pop("combo_obj", None)
        return super().update(instance, validated_data)

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
        
        # Sum cached item_total values instead of recalculating
        for item in obj.items.all():
            total += item.item_total
        
        # Sum cached combo_total values instead of recalculating
        for combo_item in obj.combos.all():
            total += combo_item.combo_total
        
        return str(total)
