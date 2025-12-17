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
    option_groups = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    option_groups_display = OptionGroupSerializer(
        source='option_groups',
        many=True,
        read_only=True
    )
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "is_available",
            "stock",
            "category",
            "category_id",
            "category_name",
            "image_url",
            "option_groups",
            "option_groups_display",
        ]
    
    def to_representation(self, instance):
        """Customize output to use option_groups instead of option_groups_display"""
        ret = super().to_representation(instance)
        # Move option_groups_display to option_groups for frontend
        if 'option_groups_display' in ret:
            ret['option_groups'] = ret.pop('option_groups_display')
        return ret
    
    def create(self, validated_data):
        option_groups_data = validated_data.pop('option_groups', [])
        menu_item = MenuItem.objects.create(**validated_data)
        
        self._create_option_groups(menu_item, option_groups_data)
        
        return menu_item
    
    def update(self, instance, validated_data):
        option_groups_data = validated_data.pop('option_groups', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update option groups if provided
        if option_groups_data is not None:
            # Delete existing option groups (cascade will delete options)
            instance.option_groups.all().delete()
            
            # Create new option groups
            self._create_option_groups(instance, option_groups_data)
        
        return instance
    
    def _create_option_groups(self, menu_item, option_groups_data):
        """Helper method to create option groups and their options"""
        for group_data in option_groups_data:
            options_data = group_data.pop('options', [])
            
            option_group = OptionGroup.objects.create(
                menu_item=menu_item,
                name=group_data.get('name', ''),
                required=group_data.get('required', False),
                min_select=group_data.get('min_select', 0),
                max_select=group_data.get('max_select', 1)
            )
            
            for option_data in options_data:
                Option.objects.create(
                    group=option_group,
                    name=option_data.get('name', ''),
                    price_delta=option_data.get('price_delta', 0)
                )

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
    category = serializers.StringRelatedField()
    category_id = serializers.IntegerField(source="category.id", read_only=True)
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
            "stock",
            "image_url",
            "original_price",
            "final_price",
            "category",
            "category_id",
            "category_slug",
        ]

class ComboDetailSerializer(serializers.ModelSerializer):
    items = ComboItemReadSerializer(many=True, read_only=True)
    savings = serializers.SerializerMethodField()
    category = serializers.StringRelatedField()
    category_id = serializers.IntegerField(source="category.id", read_only=True)
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
            "stock",
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

    def get_savings(self, obj):
        return str(obj.original_price - obj.final_price)

class ComboCreateUpdateSerializer(serializers.ModelSerializer):
    items = ComboItemWriteSerializer(many=True, write_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
    )
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Combo
        fields = [
            "id",
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
        combo.update_calculated_fields()
        return combo

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            self._sync_items(instance, items_data)
        instance.update_calculated_fields()
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
        fields = ["id", "name", "slug", "image_url", "items", "combos"]

class CategoryListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(read_only=True)
    combos_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image_url", "items_count", "combos_count"]

class MenuItemMinimalSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view - without option_groups for better performance"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "is_available",
            "stock",
            "category_id",
            "category_name",
            "category_slug",
            "image_url",
        ]


class MenuItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    option_groups_display = OptionGroupSerializer(
        source='option_groups',
        many=True,
        read_only=True
    )

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "is_available",
            "stock",
            "category_id",
            "category_name",
            "image_url",
            "option_groups_display",
        ]
    
    def to_representation(self, instance):
        """Customize output to use option_groups instead of option_groups_display"""
        ret = super().to_representation(instance)
        # Move option_groups_display to option_groups for frontend
        if 'option_groups_display' in ret:
            ret['option_groups'] = ret.pop('option_groups_display')
        return ret
