# catalog/models.py
from django.db import models
from django.utils.text import slugify
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    image_url = models.URLField(blank=True)
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
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")
    image_url = models.URLField(blank=True)

    def _sync_availability_with_stock(self):
        if self.stock is None:
            self.stock = 0
        if self.stock <= 0:
            self.stock = 0
            self.is_available = False

    def save(self,*a,**kw):
        if not self.slug:
            self.slug = slugify(self.name)
        self._sync_availability_with_stock()
        return super().save(*a,**kw)

    def __str__(self): return self.name

class OptionGroup(models.Model):
    name = models.CharField(max_length=120)
    required = models.BooleanField(default=False)
    min_select = models.PositiveIntegerField(default=0)
    max_select = models.PositiveIntegerField(default=1)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="option_groups")
    def __str__(self):
        return f"{self.name} ({self.menu_item.name})"

class Option(models.Model):
    group = models.ForeignKey(OptionGroup, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=120)
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)

class Combo(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Phần trăm giảm giá (0-100)"
    )
    is_available = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="combos"
    )
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def _sync_availability_with_stock(self):
        if self.stock is None:
            self.stock = 0
        if self.stock <= 0:
            self.stock = 0
            self.is_available = False

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        self._sync_availability_with_stock()
        super().save(*args, **kwargs)
    
    def calculate_original_price(self):
        total = Decimal('0.00')
        for item in self.items.all():
            total += item.get_item_price()
        return total
    
    def calculate_final_price(self):
        original = self.calculate_original_price()
        discount = original * (self.discount_percentage / Decimal('100'))
        return original - discount
    
    def __str__(self):
        return self.name

class ComboItem(models.Model):
    combo = models.ForeignKey(Combo, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    selected_options = models.ManyToManyField(Option, blank=True)
    
    class Meta:
        unique_together = ['combo', 'menu_item']
    
    def get_item_price(self):
        price = self.menu_item.price
        for option in self.selected_options.all():
            price += option.price_delta
        return price * self.quantity
    
    def __str__(self):
        return f"{self.menu_item.name} x{self.quantity} in {self.combo.name}"
