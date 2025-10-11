# catalog/serializers.py
from rest_framework import serializers
from .models import Category, MenuItem, OptionGroup, Option, Combo, ComboItem

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id", "name", "price_delta"]

class OptionGroupSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = OptionGroup
        fields = ["id", "name", "required", "min_select", "max_select", "options"]

class MenuItemSerializer(serializers.ModelSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    category = serializers.StringRelatedField()
    category_id = serializers.IntegerField(source="category_id", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "is_available",
            "category",
            "category_id",
            "image_url",
            "option_groups",
        ]

class ComboItemReadSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    selected_options = OptionSerializer(many=True, read_only=True)
    item_price = serializers.SerializerMethodField()

    class Meta:
        model = ComboItem
        fields = ["id", "menu_item", "quantity", "selected_options", "item_price"]

    def get_item_price(self, obj):
        return str(obj.get_item_price())

class ComboItemWriteSerializer(serializers.ModelSerializer):
    menu_item_id = serializers.IntegerField(write_only=True)
    option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = ComboItem
        fields = ["menu_item_id", "quantity", "option_ids"]

    def validate_menu_item_id(self, value):
        if not MenuItem.objects.filter(id=value).exists():
            raise serializers.ValidationError("Menu item không tồn tại")
        return value

    def validate_option_ids(self, value):
        if value:
            existing = Option.objects.filter(id__in=value).count()
            if existing != len(value):
                raise serializers.ValidationError("Một số option không tồn tại")
        return value


class ComboListSerializer(serializers.ModelSerializer):
    original_price = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    category = serializers.StringRelatedField()
    category_id = serializers.IntegerField(source="category_id", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Combo
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "discount_percentage",
            "is_available",
            "image_url",
            "original_price",
            "final_price",
            "category",
            "category_id",
            "category_slug",
        ]

    def get_original_price(self, obj):
        return str(obj.calculate_original_price())

    def get_final_price(self, obj):
        return str(obj.calculate_final_price())

class ComboDetailSerializer(serializers.ModelSerializer):
    items = ComboItemReadSerializer(many=True, read_only=True)
    original_price = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    savings = serializers.SerializerMethodField()
    category = serializers.StringRelatedField()
    category_id = serializers.IntegerField(source="category_id", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Combo
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "discount_percentage",
            "is_available",
            "image_url",
            "category",
            "category_id",
            "category_slug",
            "items",
            "original_price",
            "final_price",
            "savings",
            "created_at",
            "updated_at",
        ]

    def get_original_price(self, obj):
        return str(obj.calculate_original_price())

    def get_final_price(self, obj):
        return str(obj.calculate_final_price())

    def get_savings(self, obj):
        original = obj.calculate_original_price()
        final = obj.calculate_final_price()
        return str(original - final)


class ComboCreateUpdateSerializer(serializers.ModelSerializer):
    items = ComboItemWriteSerializer(many=True, write_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
    )

    class Meta:
        model = Combo
        fields = [
            "name",
            "description",
            "discount_percentage",
            "is_available",
            "image_url",
            "category_id",
            "items",
        ]

    def validate_discount_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Discount phải từ 0 đến 100")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Combo phải có ít nhất 1 món")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        combo = Combo.objects.create(**validated_data)

        self._sync_items(combo, items_data)
        return combo

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            self._sync_items(instance, items_data)

        return instance

    def _sync_items(self, combo, items_data):
        for item_data in items_data:
            menu_item_id = item_data.pop("menu_item_id")
            option_ids = item_data.pop("option_ids", [])

            combo_item = ComboItem.objects.create(
                combo=combo,
                menu_item_id=menu_item_id,
                **item_data,
            )

            if option_ids:
                combo_item.selected_options.set(option_ids)


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    combos = ComboListSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "items", "combos"]
