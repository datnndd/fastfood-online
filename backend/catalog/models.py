# catalog/models.py
from django.db import models
from django.utils.text import slugify
from decimal import Decimal


def generate_unique_slug(instance, value, fallback):
    base_slug = slugify(value) or fallback
    slug_candidate = base_slug
    counter = 2
    qs = instance.__class__.objects.all()
    if instance.pk:
        qs = qs.exclude(pk=instance.pk)
    while qs.filter(slug=slug_candidate).exists():
        slug_candidate = f"{base_slug}-{counter}"
        counter += 1
    return slug_candidate

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ["name", "id"]

    def save(self,*a,**kw):
        self.slug = generate_unique_slug(self, self.name, "category")
        return super().save(*a,**kw)
    def __str__(self): return self.name

class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, related_name="items", null=True, blank=True)
    image_url = models.URLField(blank=True)

    def _sync_availability_with_stock(self):
        if self.stock is None:
            self.stock = 0
        if self.stock <= 0:
            self.stock = 0
            self.is_available = False

    def save(self,*a,**kw):
        self.slug = generate_unique_slug(self, self.name, "menu-item")
        self._sync_availability_with_stock()
        if kw.get("update_fields") is not None:
            update_fields = set(kw["update_fields"])
            update_fields.add("is_available")
            kw["update_fields"] = list(update_fields)
        return super().save(*a,**kw)

    def __str__(self): return self.name

    class Meta:
        ordering = ["name", "id"]

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
    original_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name="combos",
        null=True,
        blank=True
    )
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_stock(self):
        # Calculate stock based on the minimum stock of items in the combo
        min_stock = float('inf')
        combo_items = self.items.all()
        if not combo_items:
            return 0
            
        for item in combo_items:
            if item.quantity > 0:
                # Calculate how many sets of this item we can make
                item_stock = item.menu_item.stock // item.quantity
                if item_stock < min_stock:
                    min_stock = item_stock
            else:
                continue
                
        return min_stock if min_stock != float('inf') else 0

    def _sync_availability_with_stock(self):
        if self.stock <= 0:
            self.is_available = False

    def save(self, *args, **kwargs):
        self.slug = generate_unique_slug(self, self.name, "combo")
        self._sync_availability_with_stock()
        if kwargs.get("update_fields") is not None:
            update_fields = set(kwargs["update_fields"])
            update_fields.add("is_available")
            kwargs["update_fields"] = list(update_fields)
        # Note: We cannot calculate stock/price here if items are not yet saved (e.g. on create)
        # So we expect a separate update call or signal to update these fields after items are added.
        # However, for updates, we can try to recalculate if items exist.
        if self.pk:
            # This might be expensive on every save, but ensures consistency.
            # Ideally, we should only do this when items change.
            # For now, we rely on the fact that we will have a management command to sync.
            # And in the serializer, we should handle the sync.
            pass
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
    
    def update_calculated_fields(self):
        """Helper to update stock and prices"""
        self.stock = self.calculate_stock()
        self.original_price = self.calculate_original_price()
        self.final_price = self.calculate_final_price()
        self._sync_availability_with_stock()
        self.save(update_fields=['stock', 'original_price', 'final_price', 'is_available'])

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
