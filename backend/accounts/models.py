# accounts/models.py
from datetime import date

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class Province(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Ward(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="wards")
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20)

    class Meta:
        ordering = ["name"]
        unique_together = ("province", "code")

    def __str__(self) -> str:
        return f"{self.name}, {self.province.name}"


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        STAFF = "staff", "Staff"
        MANAGER = "manager", "Manager"
    
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNSPECIFIED = "unspecified", "Không xác định"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    full_name = models.CharField(max_length=255, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.UNSPECIFIED, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    province = models.ForeignKey(Province, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")
    ward = models.ForeignKey(Ward, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")

    
    supabase_id = models.UUIDField(null=True, blank=True, unique=True, db_index=True)
    auth_provider = models.CharField(max_length=30, blank=True)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    def set_unusable_password_if_oauth(self):
        if self.auth_provider and self.auth_provider != "email":
            self.set_unusable_password()

    def is_staff_like(self) -> bool:
        return self.role in {self.Role.STAFF, self.Role.MANAGER}

    def clean(self):
        super().clean()
        if self.full_name:
            self.full_name = self.full_name.strip()
        if not self.gender:
            self.gender = self.Gender.UNSPECIFIED
        if self.date_of_birth and self.date_of_birth > date.today():
            raise ValidationError({"date_of_birth": "Ngày sinh không được ở tương lai"})
        if self.ward:
            if not self.province:
                self.province = self.ward.province
            elif self.ward.province_id != self.province_id:
                raise ValidationError({
                    "ward": "Phường/Xã không thuộc tỉnh/thành phố đã chọn",
                    "province": "Vui lòng chọn tỉnh/thành phố phù hợp với phường/xã",
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class DeliveryAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="delivery_addresses")
    label = models.CharField(max_length=120, blank=True)
    contact_name = models.CharField(max_length=150)
    contact_phone = models.CharField(max_length=20)
    street_address = models.CharField(max_length=255)
    additional_info = models.CharField(max_length=255, blank=True)
    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name="delivery_addresses",
        null=True,
        blank=True,
    )
    ward = models.ForeignKey(
        Ward,
        on_delete=models.PROTECT,
        related_name="delivery_addresses",
        null=True,
        blank=True,
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]

    def __str__(self) -> str:
        return f"{self.contact_name} - {self.street_address}"

    def clean(self):
        if self.ward:
            if not self.province:
                self.province = self.ward.province
            elif self.ward.province_id != self.province_id:
                raise ValidationError({
                    "ward": "Phường/Xã không thuộc tỉnh/thành phố đã chọn",
                    "province": "Vui lòng chọn tỉnh/thành phố phù hợp với phường/xã",
                })

        if not self.province:
            raise ValidationError({"province": "Vui lòng chọn tỉnh/thành phố"})
        if not self.ward:
            raise ValidationError({"ward": "Vui lòng chọn phường/xã"})

    def save(self, *args, **kwargs):
        self.full_clean()
        saved = super().save(*args, **kwargs)
        if self.is_default:
            self.user.delivery_addresses.exclude(pk=self.pk).update(is_default=False)
        return saved
