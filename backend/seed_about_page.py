#!/usr/bin/env python3
"""
Seed script for About Page dynamic content (Story Moments)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Page, ContentItem

def seed_about_content():
    """Create story moments for About Page"""
    
    # Get the About page
    try:
        about_page = Page.objects.get(slug='about')
    except Page.DoesNotExist:
        print("Error: About page not found. Creating it...")
        about_page = Page.objects.create(title='About Us', slug='about', is_published=True)

    # Define Story Moments
    stories = [
        {
            'tag': "Midnight Lab",
            'title': "Burger Giờ Chạng Vạng ra đời",
            'description': "Ba anh em sáng lập thử 12 phiên bản sốt trên chiếc bếp từ trong căn hộ Cầu Giấy, ghi chú bằng bút dạ và mời hàng xóm nếm thử đến 2h sáng.",
            'stat': "120 phần bán hết sau 02 giờ mở bán",
            'order': 1,
            'image_url': '' # User can upload
        },
        {
            'tag': "Pop-up Tour",
            'title': "Xe bếp đỏ rực chạy khắp 5 quận",
            'description': "Thay vì chờ khách, McDono dựng quầy lưu động tại các sự kiện đêm. Khói BBQ, playlist hiphop và tiếng reo khi 200 đơn đầu tiên chốt trong 45 phút.",
            'stat': "5 quận • 1.400 phần ăn mỗi đêm",
            'order': 2,
            'image_url': ''
        },
        {
            'tag': "Delivery Live",
            'title': "Tiệc 8 phút ở chung cư mới",
            'description': "Đội giao nhận kết hợp livestream hành trình đơn hàng khiến khách thấy burger vẫn bốc khói ngay trước cửa, tạo nên hàng dài feedback 5 ⭐.",
            'stat': "8 phút/giao • 98% đánh giá 5⭐",
            'order': 3,
            'image_url': ''
        },
    ]

    created_count = 0
    updated_count = 0

    for story in stories:
        defaults = {
            'description': story['description'],
            'eyebrow': story['tag'], # Map tag to eyebrow
            'order': story['order'],
            'metadata': {'stat': story['stat']}, # Keep stat in metadata
            'is_active': True
        }
        if story.get('image_url'):
            defaults['image_url'] = story['image_url']

        obj, created = ContentItem.objects.update_or_create(
            page=about_page,
            type='story', # Use story type
            title=story['title'],
            defaults=defaults
        )
        
        if created:
            created_count += 1
        else:
            updated_count += 1

    print(f"✅ About page content seeded successfully!")
    print(f"   Created: {created_count}")
    print(f"   Updated: {updated_count}")

if __name__ == '__main__':
    seed_about_content()
