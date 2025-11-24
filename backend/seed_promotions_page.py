import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Page, ContentItem

def seed_promotions_page():
    print("Seeding Promotions page content...")
    
    # Create or get Promotions page
    page, created = Page.objects.get_or_create(
        slug='promotions',
        defaults={'name': 'Promotions', 'is_active': True}
    )
    
    if created:
        print(f"Created page: {page.name}")
    else:
        print(f"Found page: {page.name}")

    # Hero Metrics
    metrics_data = [
        {
            "label": "Banner mới mỗi tuần",
            "value": "03 thiết kế",
            "detail": "Ra mắt vào sáng thứ Sáu",
            "order": 1
        },
        {
            "label": "Cửa hàng tham gia",
            "value": "7 chi nhánh",
            "detail": "Trải khắp nội thành Hà Nội",
            "order": 2
        },
        {
            "label": "Suất quà mỗi ngày",
            "value": "100+ phần",
            "detail": "Chia theo từng khung giờ cao điểm",
            "order": 3
        },
    ]

    # Clear existing hero metrics to avoid duplicates during development
    # In production, you might want to update instead of delete
    ContentItem.objects.filter(
        page=page, 
        type='card', 
        metadata__section='hero_metrics'
    ).delete()

    for item in metrics_data:
        ContentItem.objects.create(
            page=page,
            type='card',
            title=item['label'],
            description=item['detail'],
            order=item['order'],
            is_active=True,
            metadata={
                'section': 'hero_metrics',
                'value': item['value']
            }
        )
        print(f"Created metric: {item['label']}")

    # In-Store Billboards
    billboards_data = [
        {
            "eyebrow": "Ưu đãi tại quầy",
            "title": "Grand Counter Celebration",
            "description": "Thanh toán hóa đơn từ 400K tại quầy để nhận voucher 100K và bộ sticker McDono phiên bản 2025.",
            "note": "Chỉ áp dụng khi thanh toán trực tiếp.",
            "image_url": "http://localhost:8000/media/hero-about.png",
            "order": 1
        },
        {
            "eyebrow": "Check-in nhận quà",
            "title": "Photo Booth Day",
            "description": "Chụp ảnh và quét mã QR tại khu booth để đổi ly giữ nhiệt cùng postcard sưu tập.",
            "note": "Áp dụng tại tất cả cửa hàng McDono Hà Nội.",
            "image_url": "http://localhost:8000/media/location.jpg",
            "order": 2
        },
        {
            "eyebrow": "Khung giờ 21h - 23h",
            "title": "Night Light Session",
            "description": "Đến quầy sau 21h để được tặng phiếu đồ uống đêm và huy hiệu phát sáng giới hạn.",
            "note": "Ưu đãi lớn chỉ khả dụng khi thanh toán tại quầy.",
            "image_url": "http://localhost:8000/media/online.jpg",
            "order": 3
        },
    ]

    # Clear existing billboards to avoid duplicates
    ContentItem.objects.filter(
        page=page,
        type__in=['slide', 'banner']
    ).delete()

    for item in billboards_data:
        ContentItem.objects.create(
            page=page,
            type='slide',
            title=item['title'],
            description=item['description'],
            eyebrow=item['eyebrow'],
            image_url=item['image_url'],
            order=item['order'],
            is_active=True,
            metadata={
                'note': item['note']
            }
        )
        print(f"Created billboard: {item['title']}")

    print("Promotions page seeding completed!")

if __name__ == '__main__':
    seed_promotions_page()
