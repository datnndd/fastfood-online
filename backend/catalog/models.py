# catalog/models.py
from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    def save(self,*a,**kw):
        if not self.slug: self.slug = slugify(self.name)
        return super().save(*a,**kw)
    def __str__(self): return self.name

class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")
    image_url = models.URLField(blank=True)
    def save(self,*a,**kw):
        if not self.slug: self.slug = slugify(self.name)
        return super().save(*a,**kw)
    def __str__(self): return self.name

class OptionGroup(models.Model):
    name = models.CharField(max_length=120)
    required = models.BooleanField(default=False)
    min_select = models.PositiveIntegerField(default=0)
    max_select = models.PositiveIntegerField(default=1)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="option_groups")

class Option(models.Model):
    group = models.ForeignKey(OptionGroup, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=120)
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)

class Inventory(models.Model):
    item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name="inventory")
    stock = models.PositiveIntegerField(default=9999)  # single-store: đơn giản
