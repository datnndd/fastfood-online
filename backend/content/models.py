# content/models.py
from django.db import models
from django.utils.text import slugify


class Page(models.Model):
    """Represents a page in the application (Home, About, Promotions, Contact)"""
    PAGE_CHOICES = [
        ('home', 'Home'),
        ('about', 'About'),
        ('promotions', 'Promotions'),
        ('contact', 'Contact'),
        ('global', 'Global Settings'),
    ]
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['slug']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ContentItem(models.Model):
    """
    Dynamic content items for pages (Home, About, Promotions)
    """
    CONTENT_TYPE_CHOICES = [
        ('card', 'Card'),
        ('slide', 'Slide/Banner'),
        ('text_block', 'Text Block'),  # For editable static text
        ('story', 'Story Moment'),     # For About page timeline
        ('logo', 'Logo'),              # For site logo
    ]
    
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='content_items')
    type = models.CharField(max_length=50, choices=CONTENT_TYPE_CHOICES, default='card')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    eyebrow = models.CharField(max_length=100, blank=True, help_text="Small tag/label above title")
    tag = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers first)")
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional flexible data")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        
    def __str__(self):
        return f"{self.title} ({self.page.name})"


class Store(models.Model):
    """Store locations for Contact Page"""
    name = models.CharField(max_length=200, help_text="e.g., 'Hoàn Kiếm, Hà Nội'")
    address = models.CharField(max_length=300)
    hours = models.CharField(max_length=200, help_text="Operating hours")
    hotline = models.CharField(max_length=50)
    map_query = models.CharField(max_length=300, help_text="Query string for Google Maps embed")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name
