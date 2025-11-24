# content/serializers.py
from rest_framework import serializers
from .models import Page, ContentItem, Store


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page model"""
    class Meta:
        model = Page
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContentItemSerializer(serializers.ModelSerializer):
    """Serializer for ContentItem model"""
    page_name = serializers.CharField(source='page.name', read_only=True)
    page_slug = serializers.CharField(source='page.slug', read_only=True)
    
    class Meta:
        model = ContentItem
        fields = [
            'id', 'page', 'page_name', 'page_slug', 'type', 'title', 
            'description', 'eyebrow', 'tag', 'image_url', 'order', 
            'is_active', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContentItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating ContentItem"""
    class Meta:
        model = ContentItem
        fields = [
            'id', 'page', 'type', 'title', 'description', 'eyebrow', 
            'tag', 'image_url', 'order', 'is_active', 'metadata'
        ]
        read_only_fields = ['id']


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for Store model"""
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'address', 'hours', 'hotline', 'map_query',
            'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StoreCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Store"""
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'address', 'hours', 'hotline', 'map_query',
            'order', 'is_active'
        ]
        read_only_fields = ['id']


class PageWithContentSerializer(serializers.ModelSerializer):
    """Page serializer with nested content items"""
    content_items = ContentItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Page
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'content_items']
        read_only_fields = ['id']
