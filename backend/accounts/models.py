# accounts/models.py
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


class District(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20)

    class Meta:
        ordering = ["name"]
        unique_together = ("province", "code")

    def __str__(self) -> str:
        return f"{self.name}, {self.province.name}"


class Ward(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="wards")
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20)

    class Meta:
        ordering = ["name"]
        unique_together = ("district", "code")

    def __str__(self) -> str:
        return f"{self.name}, {self.district.name}"


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        STAFF = "staff", "Staff"
        MANAGER = "manager", "Manager"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=20, blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    province = models.ForeignKey(Province, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")
    district = models.ForeignKey(District, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")
    ward = models.ForeignKey(Ward, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")

    def is_staff_like(self) -> bool:
        return self.role in {self.Role.STAFF, self.Role.MANAGER}

    def clean(self):
        super().clean()

        if self.district and self.province and self.district.province_id != self.province_id:
            raise ValidationError({
                "district": "Quận/Huyện không thuộc tỉnh đã chọn",
                "province": "Vui lòng chọn tỉnh phù hợp với quận/huyện",
            })

        if self.ward and self.district and self.ward.district_id != self.district_id:
            raise ValidationError({
                "ward": "Phường/Xã không thuộc quận/huyện đã chọn",
                "district": "Vui lòng chọn quận/huyện phù hợp với phường/xã",
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
    province = models.ForeignKey(Province, on_delete=models.PROTECT, related_name="delivery_addresses")
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="delivery_addresses")
    ward = models.ForeignKey(Ward, on_delete=models.PROTECT, related_name="delivery_addresses")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]

    def __str__(self) -> str:
        return f"{self.contact_name} - {self.street_address}"

    def clean(self):
        if self.district and self.province and self.district.province_id != self.province_id:
            raise ValidationError({
                "district": "Quận/Huyện không thuộc tỉnh đã chọn",
                "province": "Vui lòng chọn tỉnh phù hợp với quận/huyện",
            })

        if self.ward and self.district and self.ward.district_id != self.district_id:
            raise ValidationError({
                "ward": "Phường/Xã không thuộc quận/huyện đã chọn",
                "district": "Vui lòng chọn quận/huyện phù hợp với phường/xã",
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        saved = super().save(*args, **kwargs)
        if self.is_default:
            self.user.delivery_addresses.exclude(pk=self.pk).update(is_default=False)
        return saved
