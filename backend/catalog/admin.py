# catalog/admin.py
from django.contrib import admin
from .models import Category, MenuItem, OptionGroup, Option, Combo, ComboItem

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

class ComboItemInline(admin.TabularInline):
    model = ComboItem
    extra = 1
    fields = ('menu_item', 'quantity', 'selected_options')
    filter_horizontal = ('selected_options',)

@admin.register(Combo)
class ComboAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "discount_percentage",
        "is_available",
        "original_price_display",
        "final_price_display",
        "created_at",
    )
    list_filter = ("category", "is_available", "created_at")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ComboItemInline]
    
    @admin.display(description="Giá gốc")
    def original_price_display(self, obj):
        return f"{obj.calculate_original_price():,.0f}đ"
    
    @admin.display(description="Giá sau giảm")
    def final_price_display(self, obj):
        return f"{obj.calculate_final_price():,.0f}đ"

@admin.register(ComboItem)
class ComboItemAdmin(admin.ModelAdmin):
    list_display = ("id", "combo", "menu_item", "quantity", "item_price_display")
    list_filter = ("combo",)
    search_fields = ("combo__name", "menu_item__name")
    filter_horizontal = ('selected_options',)
    
    @admin.display(description="Giá item")
    def item_price_display(self, obj):
        return f"{obj.get_item_price():,.0f}đ"