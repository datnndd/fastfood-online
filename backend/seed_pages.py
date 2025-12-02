# Helper script to create initial pages
from content.models import Page

pages_data = [
    {'name': 'Home', 'slug': 'home', 'description': 'Home page content'},
    {'name': 'About', 'slug': 'about', 'description': 'About page content'},
    {'name': 'Promotions', 'slug': 'promotions', 'description': 'Promotions page content'},
    {'name': 'Contact', 'slug': 'contact', 'description': 'Contact page content'},
    {'name': 'Global Settings', 'slug': 'global', 'description': 'Global site settings'},
]

for page_data in pages_data:
    Page.objects.get_or_create(
        slug=page_data['slug'],
        defaults=page_data
    )

print("Created pages successfully!")
