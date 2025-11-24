#!/usr/bin/env python3
"""
Seed script for HomePage text blocks
Creates editable text content for static parts of the HomePage
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Page, ContentItem

def seed_homepage_texts():
    """Create text block content items for HomePage"""
    
    # Get the Home page
    try:
        home_page = Page.objects.get(slug='home')
    except Page.DoesNotExist:
        print("Error: Home page not found. Run seed_pages.py first.")
        return
    
    # Define text blocks
    text_blocks = [
        {
            'title': 'hero_title',
            'metadata': {
                'text': 'McDono • Trải nghiệm fast-food phiên bản hiện đại',
                'section': 'hero'
            },
            'order': 1
        },
        {
            'title': 'hero_subtitle',
            'metadata': {
                'text': 'Menu fusion của McDono lấy cảm hứng từ đường phố châu Á, kết hợp dịch vụ giao siêu tốc và hệ thống phần thưởng realtime.',
                'section': 'hero'
            },
            'order': 2
        },
        {
            'title': 'stat_1',
            'metadata': {
                'text': '120K+\nĐơn hoàn tất',
                'section': 'stats'
            },
            'order': 3
        },
        {
            'title': 'stat_2',
            'metadata': {
                'text': '50+\nMón signature\nLuôn sẵn sàng cho mọi khẩu vị',
                'section': 'stats'
            },
            'order': 4
        },
    ]
    
    # Create or update text blocks
    created_count = 0
    updated_count = 0
    
    # List of valid titles to keep
    valid_titles = [block['title'] for block in text_blocks]
    
    # Delete obsolete text blocks
    deleted_count, _ = ContentItem.objects.filter(
        page=home_page, 
        type='text_block'
    ).exclude(title__in=valid_titles).delete()
    
    for block_data in text_blocks:
        obj, created = ContentItem.objects.update_or_create(
            page=home_page,
            type='text_block',
            title=block_data['title'],
            defaults={
                'metadata': block_data['metadata'],
                'order': block_data['order'],
                'is_active': True,
                'description': '',  # Not used for text blocks
                'eyebrow': '',
                'tag': '',
                'image_url': ''
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
    
    print(f"✅ Text blocks seeded successfully!")
    print(f"   Created: {created_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Deleted (obsolete): {deleted_count}")

if __name__ == '__main__':
    seed_homepage_texts()
