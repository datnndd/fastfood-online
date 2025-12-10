# accounts/serializers.py
from datetime import date
import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import serializers

from .models import User, Province, Ward, DeliveryAddress

PHONE_REGEX = re.compile(r"^\d{10}$")


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
        ]
        extra_kwargs = {
            "role": {"read_only": True},
            "email": {"required": True},
            "phone": {"required": True, "allow_blank": False},
            "full_name": {"required": False, "allow_blank": True},
            "gender": {"required": False, "allow_blank": True},
            "date_of_birth": {"required": False, "allow_null": True},
        }

    def create(self, validated):
        pwd = validated.pop("password", None)
        supabase_id = validated.pop("supabase_id", None)
        user_defaults = validated.copy()
        if supabase_id:
            user_defaults["supabase_id"] = supabase_id

        full_name = (user_defaults.get("full_name") or "").strip()
        user_defaults["full_name"] = full_name

        address_line = (user_defaults.get("address_line") or "").strip()
        user_defaults["address_line"] = address_line

        phone_value = (user_defaults.get("phone") or "").strip()
        user_defaults["phone"] = phone_value

        gender = user_defaults.get("gender") or User.Gender.UNSPECIFIED
        user_defaults["gender"] = gender

        with transaction.atomic():
            username = user_defaults.get("username")
            user = None

            if supabase_id:
                user = User.objects.filter(supabase_id=supabase_id).first()

            if user is None and username:
                user = User.objects.filter(username=username).first()

            is_new_user = user is None

            if is_new_user:
                user = User(**user_defaults)
            else:
                for field, value in user_defaults.items():
                    setattr(user, field, value)

            if pwd:
                validate_password(pwd, user)
                user.set_password(pwd)
            elif is_new_user:
                user.set_unusable_password()

            try:
                user.save()
                user.refresh_from_db(fields=["full_name", "phone", "address_line", "province", "ward"])
            except ValidationError as e:
                raise serializers.ValidationError(e.message_dict)

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

        if ward and province is None:
            attrs["province"] = ward.province
            province = ward.province

        if ward and province and ward.province_id != province.id:
            raise serializers.ValidationError("Phường/Xã không thuộc tỉnh/thành phố đã chọn")

        return attrs

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def validate_phone(self, value):
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Số điện thoại là bắt buộc và phải gồm 10 chữ số")
        if not PHONE_REGEX.match(cleaned):
            raise serializers.ValidationError("Số điện thoại phải gồm 10 chữ số")
        return cleaned

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
            "has_usable_password",
        ]
        read_only_fields = fields

    def get_has_saved_card(self, obj):
        return bool(obj.stripe_customer_id and obj.stripe_payment_method_id)
      
    def get_has_usable_password(self, obj):
        return obj.has_usable_password()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp"})
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source="province",
        queryset=Province.objects.only("id"),
        allow_null=True,
        required=False,
    )
    ward_id = serializers.PrimaryKeyRelatedField(
        source="ward",
        queryset=Ward.objects.select_related("province").only("id", "province_id"),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "full_name",
            "gender",
            "date_of_birth",
            "phone",
            "address_line",
            "province_id",
            "ward_id",
        ]
        extra_kwargs = {
            "username": {"required": False},
            "full_name": {"required": False, "allow_blank": True},
            "gender": {"required": False, "allow_blank": True},
            "date_of_birth": {"required": False, "allow_null": True},
            "phone": {"required": False, "allow_blank": True},
            "address_line": {"required": False, "allow_blank": True},
        }

    def validate_full_name(self, value):
        return value.strip() if value else ""

    def validate_phone(self, value):
        cleaned = (value or "").strip()
        if not cleaned:
            return ""
        if not PHONE_REGEX.match(cleaned):
            raise serializers.ValidationError("Số điện thoại phải gồm 10 chữ số")
        return cleaned

    def validate_gender(self, value):
        return value or User.Gender.UNSPECIFIED

    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Ngày sinh không được ở tương lai")
        return value

    def validate(self, attrs):
        province = attrs.get("province")
        ward = attrs.get("ward")

        if ward and province is None:
            attrs["province"] = ward.province
            province = ward.province

        if ward and province and ward.province_id != province.id:
            raise serializers.ValidationError("Phường/Xã không thuộc tỉnh/thành phố đã chọn")

        return attrs


class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    supabase_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role", "supabase_id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        supabase_id = validated_data.pop("supabase_id", None)
        
        user = User(**validated_data)
        user.set_password(password)
        if supabase_id:
            user.supabase_id = supabase_id
        user.save()
        return user



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


