# catalog/admin.py
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Category,
    MenuItem,
    OptionGroup,
    Option,
    Combo,
    ComboItem,
)

# ---------- Inlines ----------
class OptionInline(admin.TabularInline):
    model = Option
    extra = 1
    fields = ("name", "price_delta")


class OptionGroupInline(admin.TabularInline):
    model = OptionGroup
    extra = 1
    fields = ("name", "required", "min_select", "max_select")
    show_change_link = True


class ComboItemInline(admin.TabularInline):
    model = ComboItem
    extra = 1
    fields = ("menu_item", "quantity", "selected_options")
    filter_horizontal = ("selected_options",)


# ---------- Admins ----------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "image_thumb")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Ảnh")
    def image_thumb(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" style="height:40px;border-radius:6px;" />', obj.image_url)
        return "—"


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "is_available", "slug", "image_thumb")
    list_filter = ("category", "is_available")
    search_fields = ("name", "description", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [OptionGroupInline]

    @admin.display(description="Ảnh")
    def image_thumb(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" style="height:40px;border-radius:6px;" />', obj.image_url)
        return "—"


@admin.register(OptionGroup)
class OptionGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "menu_item", "required", "min_select", "max_select")
    list_filter = ("required",)
    search_fields = ("name", "menu_item__name")
    inlines = [OptionInline]


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "group", "price_delta")
    list_filter = ("group",)
    search_fields = ("name", "group__name", "group__menu_item__name")


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
        "image_thumb",
        "slug",
    )
    list_filter = ("category", "is_available", "created_at")
    search_fields = ("name", "description", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ComboItemInline]
    readonly_fields = ("created_at", "updated_at",)

    @admin.display(description="Giá gốc")
    def original_price_display(self, obj):
        try:
            return f"{obj.calculate_original_price():,.0f}đ"
        except Exception:
            return "—"

    @admin.display(description="Giá sau giảm")
    def final_price_display(self, obj):
        try:
            return f"{obj.calculate_final_price():,.0f}đ"
        except Exception:
            return "—"

    @admin.display(description="Ảnh")
    def image_thumb(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" style="height:40px;border-radius:6px;" />', obj.image_url)
        return "—"


@admin.register(ComboItem)
class ComboItemAdmin(admin.ModelAdmin):
    list_display = ("id", "combo", "menu_item", "quantity", "item_price_display")
    list_filter = ("combo", "menu_item__category")
    search_fields = ("combo__name", "menu_item__name")
    filter_horizontal = ("selected_options",)

    @admin.display(description="Giá item")
    def item_price_display(self, obj):
        try:
            return f"{obj.get_item_price():,.0f}đ"
        except Exception:
            return "—"
