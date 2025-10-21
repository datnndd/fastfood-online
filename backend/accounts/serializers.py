# accounts/serializers.py
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, Province, District, Ward, DeliveryAddress


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ["id", "name", "code"]


class DistrictSerializer(serializers.ModelSerializer):
    province_id = serializers.IntegerField(source="province.id", read_only=True)

    class Meta:
        model = District
        fields = ["id", "name", "code", "province_id"]


class WardSerializer(serializers.ModelSerializer):
    district_id = serializers.IntegerField(source="district.id", read_only=True)

    class Meta:
        model = Ward
        fields = ["id", "name", "code", "district_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    province_id = serializers.PrimaryKeyRelatedField(
        source="province",
        queryset=Province.objects.all(),
        required=False,
        allow_null=True,
    )
    district_id = serializers.PrimaryKeyRelatedField(
        source="district",
        queryset=District.objects.select_related("province"),
        required=False,
        allow_null=True,
    )
    ward_id = serializers.PrimaryKeyRelatedField(
        source="ward",
        queryset=Ward.objects.select_related("district__province"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "email",
            "phone",
            "address_line",
            "province_id",
            "district_id",
            "ward_id",
            "role",
        ]
        extra_kwargs = {"role": {"read_only": True}}

    def create(self, validated):
        pwd = validated.pop("password")
        user = User(**validated)
        validate_password(pwd, user)
        user.set_password(pwd)
        user.save()
        return user

    def validate(self, attrs):
        province = attrs.get("province")
        district = attrs.get("district")
        ward = attrs.get("ward")

        if district and province is None:
            attrs["province"] = district.province
            province = district.province

        if ward and district is None:
            attrs["district"] = ward.district
            district = ward.district

        if district and province and district.province_id != province.id:
            raise serializers.ValidationError("Quận/Huyện không thuộc tỉnh đã chọn")

        if ward and district and ward.district_id != district.id:
            raise serializers.ValidationError("Phường/Xã không thuộc quận/huyện đã chọn")

        return attrs

    def validate_password(self, value):
        validate_password(value)
        return value


class ProfileSerializer(serializers.ModelSerializer):
    province = ProvinceSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    ward = WardSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "role",
            "address_line",
            "province",
            "district",
            "ward",
        ]


class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]
        extra_kwargs = {"role": {"default": "staff"}}

    def create(self, data):
        pwd = data.pop("password")
        user = User(**data)
        validate_password(pwd, user)
        user.set_password(pwd)
        user.save()
        return user


class UpdateRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["role"]


class DeliveryAddressSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source="province",
        queryset=Province.objects.all(),
    )
    district_id = serializers.PrimaryKeyRelatedField(
        source="district",
        queryset=District.objects.select_related("province"),
    )
    ward_id = serializers.PrimaryKeyRelatedField(
        source="ward",
        queryset=Ward.objects.select_related("district__province"),
    )
    province_name = serializers.CharField(source="province.name", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
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
            "district_id",
            "ward_id",
            "province_name",
            "district_name",
            "ward_name",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "province_name", "district_name", "ward_name"]

    def validate(self, attrs):
        province = attrs.get("province") or getattr(self.instance, "province", None)
        district = attrs.get("district") or getattr(self.instance, "district", None)
        ward = attrs.get("ward") or getattr(self.instance, "ward", None)

        if district and province is None:
            attrs["province"] = district.province
            province = district.province

        if ward and district is None:
            attrs["district"] = ward.district
            district = ward.district

        if district and province and district.province_id != province.id:
            raise serializers.ValidationError({
                "district_id": "Quận/Huyện không thuộc tỉnh đã chọn",
            })

        if ward and district and ward.district_id != district.id:
            raise serializers.ValidationError({
                "ward_id": "Phường/Xã không thuộc quận/huyện đã chọn",
            })

        return attrs