# accounts/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin
from django.contrib.auth.models import Permission, Group

from .models import Province, Ward, DeliveryAddress

User = get_user_model()

# --------- Đăng ký Permission để dùng autocomplete trong user_permissions ---------
@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("name", "codename", "content_type")
    search_fields = (
        "name",
        "codename",
        "content_type__app_label",
        "content_type__model",
    )
    ordering = ("content_type__app_label", "codename")

# (Tùy chọn) đảm bảo Group có search_fields; mặc định GroupAdmin đã có,
# nhưng ta unregister/register lại cho chắc chắn khi customize site khác.
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass
admin.site.register(Group, GroupAdmin)

# --------- Danh mục: Province / Ward ---------
@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")
    ordering = ("name",)

@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "province")
    list_filter = ("province",)
    search_fields = ("name", "code", "province__name")
    list_select_related = ("province",)
    ordering = ("province__name", "name")

# --------- DeliveryAddress ---------
@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "contact_name",
        "contact_phone",
        "province",
        "ward",
        "is_default",
        "updated_at",
    )
    list_filter = ("is_default", "province")
    search_fields = (
        "contact_name",
        "contact_phone",
        "street_address",
        "additional_info",
        "user__username",
        "user__email",
        "user__full_name",
        "user__phone",
    )
    list_select_related = ("province", "ward", "user")
    autocomplete_fields = ("user", "province", "ward")
    ordering = ("-is_default", "-updated_at")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("province", "ward", "user").only(
            "id",
            "contact_name",
            "contact_phone",
            "street_address",
            "additional_info",
            "is_default",
            "updated_at",
            "province_id",
            "ward_id",
            "user_id",
            "user__username",
            "user__email",
            "user__full_name",
        )

# --------- User (tối ưu nặng tay) ---------
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

@admin.register(User)
class LightweightUserAdmin(BaseUserAdmin):
    """
    UserAdmin nhẹ:
      - Không có Inline nặng
      - autocomplete cho province, ward, groups, user_permissions
      - only/select_related giảm query & dữ liệu dư
      - tắt full COUNT(*)
    """
    inlines = []

    # Quan trọng: giờ đã có PermissionAdmin nên autocomplete user_permissions OK
    autocomplete_fields = ("province", "ward", "groups", "user_permissions")
    filter_horizontal = ()  # không cần khi đã autocomplete
    show_full_result_count = False

    list_display = (
        "username",
        "email",
        "full_name",
        "phone",
        "role",
        "is_active",
        "is_staff",
        "last_login",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "role")
    ordering = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined")

    search_fields = (
        "username",
        "email",
        "full_name",
        "phone",
        "first_name",
        "last_name",
        "supabase_id",
    )

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Thông tin cá nhân",
            {
                "fields": (
                    "full_name",
                    "email",
                    "phone",
                    "gender",
                    "date_of_birth",
                    "address_line",
                    "province",
                    "ward",
                )
            },
        ),
        (
            "Phân quyền",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dấu vết hệ thống", {"fields": ("last_login", "date_joined")}),
        (
            "Đồng bộ Supabase",
            {"fields": ("supabase_id", "auth_provider", "email_verified", "phone_verified")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "email",
                    "full_name",
                    "phone",
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return (
            qs.select_related("province", "ward")
            .only(
                "id",
                "username",
                "email",
                "full_name",
                "phone",
                "role",
                "is_active",
                "is_staff",
                "is_superuser",
                "last_login",
                "date_joined",
                "province_id",
                "ward_id",
            )
        )
