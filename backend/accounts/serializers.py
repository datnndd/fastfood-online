# accounts/serializers.py
from datetime import date

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, Province, Ward, DeliveryAddress


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ["id", "name", "code"]


class WardSerializer(serializers.ModelSerializer):
    province_id = serializers.IntegerField(source="province.id", read_only=True)

    class Meta:
        model = Ward
        fields = ["id", "name", "code", "province_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    supabase_id = serializers.UUIDField(required=False, allow_null=True)
    set_default_address = serializers.BooleanField(default=False, write_only=True)
    province_id = serializers.PrimaryKeyRelatedField(
        source="province",
        queryset=Province.objects.only("id").all(),
        required=False,
        allow_null=True,
    )
    ward_id = serializers.PrimaryKeyRelatedField(
        source="ward",
        queryset=Ward.objects.select_related("province").only("id", "province_id"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "email",
            "full_name",
            "phone",
            "gender",
            "date_of_birth",
            "address_line",
            "province_id",
            "ward_id",
            "role",
            "supabase_id",
            "set_default_address",
        ]
        extra_kwargs = {
            "role": {"read_only": True},
            "email": {"required": True},
            "full_name": {"required": False, "allow_blank": True},
            "gender": {"required": False, "allow_blank": True},
            "date_of_birth": {"required": False, "allow_null": True},
        }

    def create(self, validated):
        pwd = validated.pop("password", None)
        supabase_id = validated.pop("supabase_id", None)
        set_default_address = validated.pop("set_default_address", False)

        user_defaults = validated.copy()
        if supabase_id:
            user_defaults["supabase_id"] = supabase_id

        full_name = user_defaults.get("full_name")
        if full_name:
            user_defaults["full_name"] = full_name.strip()
        else:
            user_defaults["full_name"] = ""

        gender = user_defaults.get("gender") or User.Gender.UNSPECIFIED
        user_defaults["gender"] = gender

        username = user_defaults.get("username")
        user, created = User.objects.get_or_create(
            username=username,
            defaults=user_defaults,
        )

        if not created:
            for field, value in user_defaults.items():
                setattr(user, field, value)

        if pwd:
            validate_password(pwd, user)
            user.set_password(pwd)
        elif created:
            user.set_unusable_password()

        user.save()

        if set_default_address:
            DeliveryAddress.objects.update_or_create(
                user=user,
                label="Địa chỉ mặc định",
                defaults={
                    "contact_name": user.full_name or user.username,
                    "contact_phone": user.phone or "",
                    "street_address": user.address_line,
                    "additional_info": "",
                    "province": user.province,
                    "ward": user.ward,
                    "is_default": True,
                },
            )

        return user

    def validate(self, attrs):
        full_name = attrs.get("full_name")
        if full_name:
            attrs["full_name"] = full_name.strip()

        gender = attrs.get("gender")
        if not gender:
            attrs["gender"] = User.Gender.UNSPECIFIED

        province = attrs.get("province")
        ward = attrs.get("ward")
        set_default = attrs.get("set_default_address")

        if ward and province is None:
            attrs["province"] = ward.province
            province = ward.province

        if ward and province and ward.province_id != province.id:
            raise serializers.ValidationError("Phường/Xã không thuộc tỉnh/thành phố đã chọn")

        if set_default:
            missing = []
            if not attrs.get("address_line"):
                missing.append("address_line")
            if not attrs.get("phone"):
                missing.append("phone")
            if province is None:
                missing.append("province_id")
            if ward is None:
                missing.append("ward_id")
            if missing:
                raise serializers.ValidationError({
                    "set_default_address": "Cần nhập đầy đủ thông tin để tạo địa chỉ giao hàng mặc định",
                    "missing_fields": missing,
                })

        return attrs

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value


    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Ngày sinh không được ở tương lai")
        return value


class ProfileSerializer(serializers.ModelSerializer):
    province = ProvinceSerializer(read_only=True)
    ward = WardSerializer(read_only=True)
    has_saved_card = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "supabase_id",
            "username",
            "email",
            "email_verified",
            "full_name",
            "gender",
            "date_of_birth",
            "phone",
            "phone_verified",
            "auth_provider",
            "role",
            "address_line",
            "province",
            "ward",
            "has_saved_card",
        ]
        read_only_fields = fields
    
    def get_has_saved_card(self, obj):
        return bool(obj.stripe_customer_id and obj.stripe_payment_method_id)


class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]


class ManageUserListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "role_display",
            "phone",
            "gender",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = fields


class UpdateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["role"]


class DeliveryAddressSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source="province",
        queryset=Province.objects.only("id").all(),
        required=False,
        allow_null=True,
    )
    ward_id = serializers.PrimaryKeyRelatedField(
        source="ward",
        queryset=Ward.objects.select_related("province").only("id", "province_id"),
    )
    province_name = serializers.CharField(source="province.name", read_only=True)
    ward_name = serializers.CharField(source="ward.name", read_only=True)

    class Meta:
        model = DeliveryAddress
        fields = [
            "id",
            "label",
            "contact_name",
            "contact_phone",
            "street_address",
            "additional_info",
            "province_id",
            "ward_id",
            "province_name",
            "ward_name",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "province_name", "ward_name"]

    def validate(self, attrs):
        province = attrs.get("province") or getattr(self.instance, "province", None)
        ward = attrs.get("ward") or getattr(self.instance, "ward", None)

        if ward:
            if province is None:
                attrs["province"] = ward.province
                province = ward.province
            elif ward.province_id != province.id:
                raise serializers.ValidationError({
                    "ward_id": "Phường/Xã không thuộc tỉnh/thành phố đã chọn",
                })

        if not province:
            raise serializers.ValidationError({
                "province_id": "Vui lòng chọn tỉnh/thành phố",
            })

        if not ward:
            raise serializers.ValidationError({
                "ward_id": "Vui lòng chọn phường/xã",
            })

        return attrs
