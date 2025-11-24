# content/admin.py
from django.contrib import admin
from .models import Page, ContentItem, Store


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'page', 'type', 'order', 'is_active', 'created_at']
    list_filter = ['page', 'type', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'eyebrow', 'tag']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('page', 'type', 'title', 'description')
        }),
        ('Display Options', {
            'fields': ('eyebrow', 'tag', 'image_url', 'order', 'is_active')
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'hotline', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'address', 'hotline']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Store Information', {
            'fields': ('name', 'address', 'hours', 'hotline')
        }),
        ('Map & Display', {
            'fields': ('map_query', 'order', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
