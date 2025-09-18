# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    # Thêm các field tùy chỉnh vào form admin
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Role & Profile", {"fields": ("role", "phone")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (None, {"fields": ("role", "phone")}),
    )
    list_display = ("username", "email", "role", "is_staff", "is_superuser")
    list_filter  = ("role", "is_staff", "is_superuser")
