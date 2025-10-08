# cart/admin.py
from django.contrib import admin
from .models import Cart, CartItem, CartCombo

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ('menu_item', 'quantity', 'note')

class CartComboInline(admin.TabularInline):
    model = CartCombo
    extra = 0
    fields = ('combo', 'quantity', 'note')
    readonly_fields = ('added_at',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "items_count", "combos_count", "created_at")
    search_fields = ("user__username",)
    inlines = [CartItemInline, CartComboInline]
    
    @admin.display(description="Số món đơn")
    def items_count(self, obj):
        return obj.items.count()
    
    @admin.display(description="Số combo")
    def combos_count(self, obj):
        return obj.combos.count()

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "menu_item", "quantity", "note")
    search_fields = ("menu_item__name",)

@admin.register(CartCombo)
class CartComboAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "combo", "quantity", "total_price", "added_at")
    search_fields = ("combo__name",)
    list_filter = ("added_at",)
    
    @admin.display(description="Tổng giá")
    def total_price(self, obj):
        return f"{obj.get_total_price():,.0f}đ"