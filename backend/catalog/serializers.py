# catalog/serializers.py
from rest_framework import serializers
from .models import Category, MenuItem, OptionGroup, Option, Inventory

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ["id","name","price_delta"]

class OptionGroupSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    class Meta:
        model = OptionGroup
        fields = ["id","name","required","min_select","max_select","options"]

class MenuItemSerializer(serializers.ModelSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    category = serializers.StringRelatedField()
    class Meta:
        model = MenuItem
        fields = ["id","name","slug","description","price","is_available","category","image_url","option_groups"]

class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ["id","name","slug","items"]