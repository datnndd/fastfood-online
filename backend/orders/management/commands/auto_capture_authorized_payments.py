# orders/management/commands/auto_capture_authorized_payments.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from orders.models import Order
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class Command(BaseCommand):
    help = 'Tự động capture các PaymentIntent đã hết hạn authorization (60s)'

    def handle(self, *args, **options):
        # Tìm các order có status 'authorized' và đã hết hạn authorization
        now = timezone.now()
        orders_to_capture = Order.objects.filter(
            stripe_payment_status='authorized',
            authorization_expires_at__lte=now,
            stripe_payment_intent_id__isnull=False
        )
        
        captured_count = 0
        failed_count = 0
        
        for order in orders_to_capture:
            try:
                # Capture PaymentIntent
                payment_intent = stripe.PaymentIntent.capture(order.stripe_payment_intent_id)
                
                if payment_intent.status == 'succeeded':
                    order.stripe_payment_status = 'paid'
                    order.payment_completed_at = timezone.now()
                    order.captured_at = timezone.now()
                    order.save()
                    captured_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Đã capture order #{order.id}')
                    )
                else:
                    failed_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Capture không thành công cho order #{order.id}: {payment_intent.status}')
                    )
            except stripe.error.StripeError as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Lỗi capture order #{order.id}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Hoàn thành: {captured_count} order đã được capture, {failed_count} order thất bại'
            )
        )


