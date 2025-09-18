# accounts/serializers.py
from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["username","password","email","phone","role"]
        extra_kwargs = {"role": {"read_only": True}}  # khách tự đăng ký luôn là customer

    def create(self, validated):
        pwd = validated.pop("password")
        user = User(**validated)
        validate_password(pwd, user)
        user.set_password(pwd)
        user.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id","username","email","phone","role"]

class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ["username","email","password","role"]
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