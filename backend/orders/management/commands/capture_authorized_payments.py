# orders/management/commands/capture_authorized_payments.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import stripe
from django.conf import settings
from orders.models import Order

class Command(BaseCommand):
    help = 'Tự động capture các PaymentIntent đã được authorize quá 60 giây'

    def handle(self, *args, **options):
        if not settings.STRIPE_SECRET_KEY:
            self.stdout.write(self.style.ERROR('Stripe chưa được cấu hình'))
            return
        
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Tìm các order có PaymentIntent ở trạng thái requires_capture và đã quá 60 giây
        cutoff_time = timezone.now() - timedelta(seconds=60)
        
        # Tìm TẤT CẢ PaymentIntent có status requires_capture từ Stripe
        # Sau đó match với orders trong database
        try:
            all_uncaptured_pis = stripe.PaymentIntent.list(
                limit=100,
                expand=['data.payment_method']
            )
            
            # Lọc các PaymentIntent có status requires_capture
            requires_capture_pis = [
                pi for pi in all_uncaptured_pis.data 
                if pi.status == 'requires_capture'
            ]
            
            self.stdout.write(f'Tìm thấy {len(requires_capture_pis)} PaymentIntent requires_capture trên Stripe')
            
            # Match với orders trong database
            orders_to_capture = []
            for pi in requires_capture_pis:
                order_id = pi.metadata.get('order_id')
                if order_id:
                    try:
                        order = Order.objects.get(id=order_id)
                        if order.payment_method == 'card' and order.status in ['PREPARING', 'READY', 'DELIVERING']:
                            # Cập nhật order với PaymentIntent ID nếu chưa có
                            if not order.stripe_payment_intent_id:
                                order.stripe_payment_intent_id = pi.id
                            if order.stripe_payment_status != 'requires_capture':
                                order.stripe_payment_status = 'requires_capture'
                            if not order.authorized_at:
                                # Dùng thời gian tạo PaymentIntent từ Stripe
                                from datetime import datetime as dt
                                authorized_time = dt.fromtimestamp(pi.created, tz=timezone.get_current_timezone())
                                order.authorized_at = authorized_time
                            order.save()
                            orders_to_capture.append(order)
                    except Order.DoesNotExist:
                        self.stdout.write(f'Không tìm thấy order #{order_id} cho PaymentIntent {pi.id}')
                        continue
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Lỗi khi lấy PaymentIntent từ Stripe: {e}'))
            # Fallback: dùng cách cũ
            orders_to_capture = Order.objects.filter(
                payment_method='card',
                stripe_payment_intent_id__isnull=False,
                status__in=['PREPARING', 'READY', 'DELIVERING']
            ).exclude(
                stripe_payment_status='paid'
            ).exclude(
                stripe_payment_status='canceled'
            )
        
        captured_count = 0
        error_count = 0
        skipped_count = 0
        
        self.stdout.write(f'Tìm thấy {len(orders_to_capture)} order cần kiểm tra')
        
        for order in orders_to_capture:
            try:
                # Kiểm tra lại status của PaymentIntent trên Stripe
                payment_intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
                
                # Cập nhật payment_status từ Stripe nếu chưa có
                if not order.stripe_payment_status or order.stripe_payment_status != payment_intent.status:
                    order.stripe_payment_status = payment_intent.status
                    if payment_intent.status == 'requires_capture' and not order.authorized_at:
                        order.authorized_at = timezone.now()
                    order.save()
                
                self.stdout.write(f'Order #{order.id}: PaymentIntent status = {payment_intent.status}, authorized_at = {order.authorized_at}, created_at = {order.created_at}')
                
                # Kiểm tra xem có nên capture không
                should_capture = False
                if payment_intent.status == 'requires_capture':
                    if order.authorized_at:
                        time_diff = timezone.now() - order.authorized_at
                        if time_diff.total_seconds() >= 60:
                            should_capture = True
                    else:
                        # Nếu không có authorized_at, dùng created_at
                        time_diff = timezone.now() - order.created_at
                        if time_diff.total_seconds() >= 60:
                            should_capture = True
                            # Lưu authorized_at để lần sau dùng
                            order.authorized_at = order.created_at
                            order.save()
                
                if should_capture and payment_intent.status == 'requires_capture':
                    # Capture PaymentIntent
                    self.stdout.write(f'Đang capture PaymentIntent {order.stripe_payment_intent_id} cho order #{order.id}...')
                    captured_pi = stripe.PaymentIntent.capture(order.stripe_payment_intent_id)
                    
                    if captured_pi.status == 'succeeded':
                        order.stripe_payment_status = 'paid'
                        order.payment_completed_at = timezone.now()
                        order.save()
                        captured_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Đã capture PaymentIntent cho đơn hàng #{order.id}'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Capture không thành công cho đơn hàng #{order.id}. Status: {captured_pi.status}'
                            )
                        )
                        error_count += 1
                elif payment_intent.status == 'succeeded':
                    # Đã được capture rồi (có thể từ nơi khác)
                    order.stripe_payment_status = 'paid'
                    order.payment_completed_at = timezone.now()
                    order.save()
                    self.stdout.write(
                        self.style.WARNING(
                            f'PaymentIntent cho đơn hàng #{order.id} đã được capture trước đó'
                        )
                    )
                elif payment_intent.status == 'canceled':
                    # Đã bị cancel
                    order.stripe_payment_status = 'canceled'
                    order.save()
                    self.stdout.write(
                        self.style.WARNING(
                            f'PaymentIntent cho đơn hàng #{order.id} đã bị cancel'
                        )
                    )
                elif payment_intent.status == 'requires_capture':
                    # Chưa đủ 60 giây, skip
                    skipped_count += 1
                    if order.authorized_at:
                        time_diff = timezone.now() - order.authorized_at
                        remaining = 60 - time_diff.total_seconds()
                        self.stdout.write(
                            self.style.WARNING(
                                f'Order #{order.id}: Chưa đủ 60 giây, còn {remaining:.0f} giây'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Order #{order.id}: Chưa có authorized_at, dùng created_at'
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'PaymentIntent cho đơn hàng #{order.id} có status không mong đợi: {payment_intent.status}'
                        )
                    )
                    
            except stripe.error.StripeError as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'Lỗi khi capture PaymentIntent cho đơn hàng #{order.id}: {str(e)}'
                    )
                )
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'Lỗi không xác định khi xử lý đơn hàng #{order.id}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nHoàn thành: Đã capture {captured_count} PaymentIntent, {skipped_count} skipped, {error_count} lỗi'
            )
        )

