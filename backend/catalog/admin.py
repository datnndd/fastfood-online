# catalog/admin.py
from django.contrib import admin
from .models import Category, MenuItem, OptionGroup, Option, Inventory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug")
    search_fields = ("name",)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "is_available")
    list_filter  = ("category", "is_available")
    search_fields = ("name", "description")

@admin.register(OptionGroup)
class OptionGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "menu_item", "required", "min_select", "max_select")
    list_filter  = ("required",)

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "group", "price_delta")
    list_filter  = ("group",)

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("id", "item", "stock")
    search_fields = ("item__name",)