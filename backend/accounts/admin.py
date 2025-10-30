# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Province, Ward, DeliveryAddress

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Supabase", {
            "fields": ("supabase_id", "auth_provider", "email_verified", "phone_verified"),
        }),
        ("Profile", {
            "fields": ("role", "full_name", "gender", "date_of_birth", "phone", "address_line", "province", "ward"),
        }),
    )
    readonly_fields = ("supabase_id", "auth_provider", "email_verified", "phone_verified")
    list_display = ("username", "email", "full_name", "role", "auth_provider", "email_verified", "is_active", "is_staff")
    list_filter = ("role", "auth_provider", "email_verified", "is_active", "is_staff")
    search_fields = ("username", "email", "full_name")

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    search_fields = ("name", "code")

@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_filter = ("province",)
    search_fields = ("name", "code")

@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "contact_name", "province", "ward", "is_default", "updated_at")
    list_filter = ("is_default", "province")
    search_fields = ("contact_name", "contact_phone", "street_address")
