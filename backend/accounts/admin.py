# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    User,
    Province,
    District,
    Ward,
    DeliveryAddress,
)

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = list(DjangoUserAdmin.fieldsets) + [
        (
            "Role & Profile",
            {"fields": ("role", "phone", "address_line", "province", "district", "ward")},
        ),
    ]
    add_fieldsets = list(DjangoUserAdmin.add_fieldsets) + [
        (None, {"fields": ("role", "phone", "address_line", "province", "district", "ward")}),
    ]
    list_display = (
        "username",
        "email",
        "role",
        "province",
        "district",
        "ward",
        "is_staff",
        "is_superuser",
    )
    list_filter = ("role", "is_staff", "is_superuser", "province")


@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code")
    search_fields = ("name", "code")


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "province")
    search_fields = ("name", "code")
    list_filter = ("province",)


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "district", "province")
    search_fields = ("name", "code")
    list_filter = ("district__province", "district")

    @admin.display(description="Province")
    def province(self, obj):
        return obj.district.province

@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "contact_name",
        "contact_phone",
        "province",
        "district",
        "ward",
        "is_default",
        "updated_at",
    )
    list_filter = ("is_default", "province")
    search_fields = ("user__username", "contact_name", "street_address")
