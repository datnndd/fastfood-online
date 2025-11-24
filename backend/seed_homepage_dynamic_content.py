#!/usr/bin/env python3
"""
Seed script for HomePage dynamic content (Banners and Cards)
"""
import os
import django
import shutil

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Page, ContentItem
from django.conf import settings

def seed_dynamic_content():
    """Create banners and feature cards for HomePage"""
    
    # Get the Home page
    try:
        home_page = Page.objects.get(slug='home')
    except Page.DoesNotExist:
        print("Error: Home page not found. Run seed_pages.py first.")
        return

    # Ensure media directory exists
    media_root = settings.MEDIA_ROOT
    content_media_dir = os.path.join(media_root, 'content')
    os.makedirs(content_media_dir, exist_ok=True)

    # Define Banners (Slides)
    banners = [
        {
            'title': 'Combo Urban Bánh Mì',
            'description': '-30% thành viên',
            'eyebrow': 'Đơn hàng gần nhất',
            'type': 'slide',
            'order': 10,
            'metadata': {'section': 'hero_banner'},
            'image_url': '' 
        }
    ]

    # Define Feature Cards (Highlight Stats)
    cards = [
        {
            'title': '50+',
            'eyebrow': 'MÓN SIGNATURE',
            'description': 'Luôn sẵn sàng cho mọi khẩu vị',
            'type': 'card',
            'order': 20,
            'metadata': {'icon': '🍔', 'section': 'highlight_stats'}
        },
        {
            'title': '4.9/5',
            'eyebrow': 'ĐÁNH GIÁ TRUNG BÌNH',
            'description': 'Hơn 12K lượt khen ngợi',
            'type': 'card',
            'order': 21,
            'metadata': {'icon': '⭐', 'section': 'highlight_stats'}
        },
        {
            'title': '15 phút',
            'eyebrow': 'TỐC ĐỘ GIAO',
            'description': 'Trung bình tại nội thành',
            'type': 'card',
            'order': 22,
            'metadata': {'icon': '🚀', 'section': 'highlight_stats'}
        },
        {
            'title': '24/7',
            'eyebrow': 'HỖ TRỢ TẬN TÂM',
            'description': 'Chat trực tuyến mọi lúc',
            'type': 'card',
            'order': 23,
            'metadata': {'icon': '💬', 'section': 'highlight_stats'}
        }
    ]

    # Clear existing slides and cards to avoid duplicates (optional, but good for reset)
    # ContentItem.objects.filter(page=home_page, type__in=['slide', 'card']).delete()
    # Actually, let's update_or_create based on title to be safe
    
    created_count = 0
    updated_count = 0

    all_items = banners + cards

    for item_data in all_items:
        defaults = {
            'description': item_data.get('description', ''),
            'eyebrow': item_data.get('eyebrow', ''),
            'order': item_data.get('order', 0),
            'metadata': item_data.get('metadata', {}),
            'is_active': True
        }
        if item_data.get('image_url'):
            defaults['image_url'] = item_data['image_url']

        obj, created = ContentItem.objects.update_or_create(
            page=home_page,
            type=item_data['type'],
            title=item_data['title'],
            defaults=defaults
        )
        
        if created:
            created_count += 1
        else:
            updated_count += 1

    print(f"✅ Dynamic content seeded successfully!")
    print(f"   Created: {created_count}")
    print(f"   Updated: {updated_count}")

if __name__ == '__main__':
    seed_dynamic_content()
