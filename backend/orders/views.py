# orders/views.py
from rest_framework import generics, permissions, viewsets, status, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import stripe

from accounts.models import DeliveryAddress
from cart.models import Cart
from .models import Order, Notification
from .serializers import OrderSerializer, NotificationSerializer
from .permissions import IsStaffOrManager
from .services import (
    create_order_from_cart,
    calculate_cart_total,
    restock_order_inventory,
)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_order_notification(order, notification_type):
    """Helper function để tạo notification cho order status changes"""
    user = order.user
    user_name = user.full_name or user.username or "Bạn"
    
    notification_messages = {
        Notification.Type.ORDER_PLACED: {
            "title": f"Đơn hàng #{order.id} đã được đặt thành công!",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đã được đặt thành công với tổng tiền {order.total_amount:,.0f}₫. Chúng tôi đang xử lý đơn hàng của bạn!"
        },
        Notification.Type.ORDER_CONFIRMED: {
            "title": f"Đơn hàng #{order.id} đã được xác nhận!",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đã được xác nhận và đang được chuẩn bị. Cảm ơn bạn đã đặt hàng!"
        },
        Notification.Type.ORDER_READY: {
            "title": f"Đơn hàng #{order.id} sẵn sàng giao hàng!",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đã sẵn sàng! Chúng tôi sẽ giao hàng đến bạn trong thời gian sớm nhất."
        },
        Notification.Type.ORDER_DELIVERING: {
            "title": f"Đơn hàng #{order.id} đang được giao!",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đang trên đường đến bạn! Vui lòng chuẩn bị nhận hàng."
        },
        Notification.Type.ORDER_COMPLETED: {
            "title": f"Đơn hàng #{order.id} đã được giao thành công!",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đã được giao thành công! Cảm ơn bạn đã mua sắm tại McDono. Chúc bạn ngon miệng!"
        },
        Notification.Type.ORDER_CANCELLED: {
            "title": f"Đơn hàng #{order.id} đã bị hủy",
            "message": f"{user_name} ơi, đơn hàng #{order.id} của bạn đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi."
        }
    }
    
    msg_data = notification_messages.get(notification_type, {
        "title": f"Cập nhật đơn hàng #{order.id}",
        "message": f"Đơn hàng #{order.id} của bạn đã được cập nhật."
    })
    
    Notification.objects.create(
        user=user,
        order=order,
        type=notification_type,
        title=msg_data["title"],
        message=msg_data["message"]
    )

class OrdersPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100

class MyOrdersView(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OrdersPagination
    
    def get_queryset(self):
        queryset = (
            Order.objects.filter(user=self.request.user)
            .select_related(
                "delivery_address__province",
                "delivery_address__ward",
            )
            .prefetch_related("items__menu_item", "items__combo")
        )
        
        # Lọc theo status nếu có
        status_param = self.request.query_params.get('status')
        if status_param and status_param in ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']:
            queryset = queryset.filter(status=status_param)
        
        return queryset.order_by("-created_at")
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Hủy đơn hàng (chỉ trong vòng 60 giây sau khi thanh toán và trạng thái PREPARING)"""
        order = self.get_object()
        
        if order.user != request.user:
            return Response({'error': 'Bạn không có quyền hủy đơn hàng này'}, status=403)
        
        if order.status != 'PREPARING':
            return Response({'error': 'Chỉ có thể hủy đơn hàng đang chờ xác nhận'}, status=400)
        
        # Kiểm tra thời gian từ khi thanh toán hoàn tất (60 giây)
        if not order.payment_completed_at:
            # Nếu chưa thanh toán (tiền mặt/chuyển khoản), kiểm tra từ lúc tạo đơn
            time_diff = timezone.now() - order.created_at
            if time_diff.total_seconds() > 60:
                return Response({'error': 'Đã hết thời gian hủy đơn hàng (60 giây)'}, status=400)
        else:
            # Nếu đã thanh toán bằng thẻ, kiểm tra từ lúc thanh toán hoàn tất
            time_diff = timezone.now() - order.payment_completed_at
            if time_diff.total_seconds() > 60:
                return Response({'error': 'Đã hết thời gian hủy đơn hàng (60 giây sau khi thanh toán)'}, status=400)
            
            # Nếu thanh toán bằng thẻ, tự động hoàn tiền
            if order.payment_method == 'card' and order.stripe_payment_intent_id:
                try:
                    # Tạo refund tự động
                    refund = stripe.Refund.create(
                        payment_intent=order.stripe_payment_intent_id,
                        reason='requested_by_customer'
                    )
                    order.stripe_payment_status = 'refunded'
                except stripe.error.StripeError as e:
                    # Log error nhưng vẫn cho phép hủy đơn
                    print(f"Error creating refund: {e}")
                    return Response({
                        'error': f'Không thể hoàn tiền tự động. Vui lòng liên hệ hỗ trợ. Lỗi: {str(e)}'
                    }, status=500)
        
        # Hoàn lại tồn kho trước khi chuyển sang trạng thái hủy
        restock_order_inventory(order)

        # Cập nhật trạng thái
        order.status = 'CANCELLED'
        order.save()
        
        # Tạo notification (bỏ qua lỗi nếu có)
        try:
            create_order_notification(order, Notification.Type.ORDER_CANCELLED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification for order {order.id}: {str(e)}")
        
        return Response(OrderSerializer(order).data)

class OrdersWorkViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrManager]
    pagination_class = OrdersPagination

    def get_queryset(self):
        queryset = (
            Order.objects.select_related(
                "user",
                "delivery_address__province",
                "delivery_address__ward",
            )
            .prefetch_related("items__menu_item", "items__combo")
        )
        
        cutoff_time = timezone.now() - timedelta(seconds=60)
        queryset = queryset.filter(created_at__lte=cutoff_time)
        
        status_param = self.request.query_params.get('status')
        if status_param and status_param in ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED']:
            queryset = queryset.filter(status=status_param)
        
        # Lọc theo ngày (từ 23:30 đêm hôm trước đến 23:29 hôm sau)
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                
                start_time = timezone.make_aware(
                    datetime.combine(selected_date - timedelta(days=1), datetime.min.time().replace(hour=23, minute=30))
                )
                
                end_time = timezone.make_aware(
                    datetime.combine(selected_date + timedelta(days=1), datetime.min.time().replace(hour=23, minute=29, second=59))
                )
                
                queryset = queryset.filter(created_at__range=(start_time, end_time))
            except ValueError:
                pass
        
        ordering_param = self.request.query_params.get('ordering', '-created_at')
        if ordering_param in ['created_at', '-created_at']:
            queryset = queryset.order_by(ordering_param)
        else:
            queryset = queryset.order_by("-created_at")
            
        return queryset

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """API endpoint riêng để cập nhật status của đơn hàng"""
        order = self.get_object()
        old_status = order.status
        new_status = request.data.get('status')
        
        if new_status not in ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']:
            return Response({'error': 'Trạng thái không hợp lệ'}, status=400)
        
        time_diff = timezone.now() - order.created_at
        if time_diff.total_seconds() <= 60:
            return Response({'error': 'Đơn hàng chưa đủ thời gian xử lý (cần chờ 60 giây)'}, status=400)
        
        if new_status == 'CANCELLED' and old_status != 'CANCELLED':
            restock_order_inventory(order)

        order.status = new_status
        order.save()
        
        # Tạo notification khi status thay đổi (bỏ qua lỗi nếu có)
        if old_status != new_status:
            try:
                status_to_notification = {
                    'PREPARING': Notification.Type.ORDER_PLACED,
                    'READY': Notification.Type.ORDER_READY,
                    'DELIVERING': Notification.Type.ORDER_DELIVERING,
                    'COMPLETED': Notification.Type.ORDER_COMPLETED,
                    'CANCELLED': Notification.Type.ORDER_CANCELLED,
                }
                # Chỉ tạo notification cho các status quan trọng (không tạo cho PREPARING vì đã tạo khi checkout)
                if new_status in ['READY', 'DELIVERING', 'COMPLETED']:
                    notification_type = status_to_notification.get(new_status)
                    if notification_type:
                        create_order_notification(order, notification_type)
                # Tạo notification cho CONFIRMED khi chuyển từ PREPARING sang READY (sau 60s)
                if old_status == 'PREPARING' and new_status == 'READY':
                    create_order_notification(order, Notification.Type.ORDER_CONFIRMED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to create notification for order {order.id}: {str(e)}")
        
        return Response(OrderSerializer(order).data)

class OrdersAdminViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsStaffOrManager]
    pagination_class = OrdersPagination

    def get_queryset(self):
        cutoff_time = timezone.now() - timedelta(seconds=60)
        return (
            Order.objects.select_related(
                "delivery_address__province",
                "delivery_address__ward",
            )
            .prefetch_related("items__menu_item", "items__combo")
            .filter(created_at__lte=cutoff_time)
            .order_by("-created_at")
        )

    @action(detail=False, methods=["get"])
    def today(self, request):
        today = timezone.now().date()
        start_time = timezone.make_aware(
            datetime.combine(today - timedelta(days=1), datetime.min.time().replace(hour=23, minute=30))
        )
        end_time = timezone.make_aware(
            datetime.combine(today + timedelta(days=1), datetime.min.time().replace(hour=23, minute=29, second=59))
        )
        
        cutoff_time = timezone.now() - timedelta(seconds=60)
        qs = self.get_queryset().filter(
            created_at__range=(start_time, end_time),
            created_at__lte=cutoff_time
        )
        
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        date_param = request.query_params.get('date')
        if date_param:
            try:
                selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                selected_date = timezone.now().date()
        else:
            selected_date = timezone.now().date()
            
        start_time = timezone.make_aware(
            datetime.combine(selected_date - timedelta(days=1), datetime.min.time().replace(hour=23, minute=30))
        )
        end_time = timezone.make_aware(
            datetime.combine(selected_date + timedelta(days=1), datetime.min.time().replace(hour=23, minute=29, second=59))
        )
        
        cutoff_time = timezone.now() - timedelta(seconds=60)
        base_qs = Order.objects.filter(
            created_at__range=(start_time, end_time),
            created_at__lte=cutoff_time
        )
        
        stats = {
            'PREPARING': base_qs.filter(status='PREPARING').count(),
            'READY': base_qs.filter(status='READY').count(),
            'DELIVERING': base_qs.filter(status='DELIVERING').count(),
            'COMPLETED': base_qs.filter(status='COMPLETED').count(),
            'total': base_qs.count(),
            'date': selected_date.isoformat()
        }
        
        return Response(stats)

def create_stripe_checkout_session(request):
    """Helper function để tạo Stripe checkout session"""
    delivery_address = None
    address_id = request.data.get("delivery_address_id")

    if address_id:
        try:
            delivery_address = DeliveryAddress.objects.select_related(
                "province", "ward"
            ).get(pk=address_id, user=request.user)
        except DeliveryAddress.DoesNotExist:
            return Response({"detail": "Địa chỉ giao hàng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        delivery_address = (
            request.user.delivery_addresses.select_related(
                "province", "ward"
            ).filter(is_default=True).first()
        )
        if delivery_address is None:
            return Response({"detail": "Vui lòng chọn địa chỉ giao hàng"}, status=status.HTTP_400_BAD_REQUEST)

    # Kiểm tra giỏ hàng
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({"detail": "Giỏ hàng không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

    if not cart.items.exists() and not cart.combos.exists():
        return Response({"detail": "Giỏ hàng trống"}, status=status.HTTP_400_BAD_REQUEST)

    # Tính tổng tiền
    total_amount = calculate_cart_total(cart)
    
    if total_amount <= 0:
        return Response({"detail": "Tổng tiền không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

    # Tạo đơn hàng tạm (chưa thanh toán, chưa xóa giỏ hàng)
    try:
        order = create_order_from_cart(
            request.user,
            payment_method="card",
            note=request.data.get("note", ""),
            delivery_address=delivery_address,
            clear_cart=False,  # Chưa xóa giỏ hàng cho đến khi thanh toán thành công
        )
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # Kiểm tra Stripe configuration
    if not settings.STRIPE_SECRET_KEY:
        order.delete()
        return Response({"detail": "Stripe chưa được cấu hình. Vui lòng liên hệ quản trị viên."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Tạo Stripe Checkout Session
    try:
        frontend_url = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        success_url = f"{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/payment/cancel?order_id={order.id}"

        # Nếu user đã có Stripe customer, sử dụng customer đó
        checkout_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price_data': {
                    'currency': 'vnd',
                    'product_data': {
                        'name': f'Đơn hàng #{order.id}',
                        'description': f'Đơn hàng từ FastFood Online',
                    },
                    'unit_amount': int(total_amount.quantize(Decimal('1'), rounding=ROUND_HALF_UP)),  # VND không có đơn vị phụ
                },
                'quantity': 1,
            }],
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'client_reference_id': str(order.id),
            'payment_intent_data': {
                'capture_method': 'manual',  # Chỉ authorize, không capture ngay
            },
            'metadata': {
                'order_id': str(order.id),
                'user_id': str(request.user.id),
            }
        }
        
        # Nếu user đã có Stripe customer, attach vào checkout session để lưu payment method
        if request.user.stripe_customer_id:
            checkout_params['customer'] = request.user.stripe_customer_id
        
        checkout_session = stripe.checkout.Session.create(**checkout_params)

        # Lưu checkout session ID vào order
        order.stripe_checkout_session_id = checkout_session.id
        order.save()

        # Xóa giỏ hàng sau khi tạo checkout session thành công
        try:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
            cart.combos.all().delete()
        except Cart.DoesNotExist:
            pass

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'order_id': order.id
        }, status=status.HTTP_201_CREATED)

    except stripe.error.StripeError as e:
        # Nếu tạo checkout session thất bại, xóa order (giỏ hàng vẫn còn)
        order.delete()
        return Response({"detail": f"Lỗi tạo phiên thanh toán: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        # Nếu có lỗi khác, xóa order (giỏ hàng vẫn còn)
        order.delete()
        return Response({"detail": f"Lỗi không xác định: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateStripeCheckoutView(generics.CreateAPIView):
    """Tạo Stripe Checkout Session cho đơn hàng"""
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        return create_stripe_checkout_session(request)


class CheckoutView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    
    def create(self, request, *args, **kwargs):
        payment_method = request.data.get("payment_method", "cash")
        use_saved_card = request.data.get("use_saved_card", False)
        
        # Nếu thanh toán bằng thẻ đã lưu, dùng Payment Intent
        if payment_method == "card" and use_saved_card:
            return create_payment_intent_with_saved_card(request)
        
        # Nếu thanh toán bằng thẻ mới, redirect đến Stripe checkout
        if payment_method == "card":
            return create_stripe_checkout_session(request)
        
        # Thanh toán tiền mặt hoặc chuyển khoản - xử lý như cũ
        delivery_address = None
        address_id = request.data.get("delivery_address_id")

        if address_id:
            try:
                delivery_address = DeliveryAddress.objects.select_related(
                    "province", "ward"
                ).get(pk=address_id, user=request.user)
            except DeliveryAddress.DoesNotExist:
                return Response({"detail": "Địa chỉ giao hàng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            delivery_address = (
                request.user.delivery_addresses.select_related(
                    "province", "ward"
                ).filter(is_default=True).first()
            )
            if delivery_address is None:
                return Response({"detail": "Vui lòng chọn địa chỉ giao hàng"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = create_order_from_cart(
                request.user,
                payment_method=payment_method,
                note=request.data.get("note", ""),
                delivery_address=delivery_address,
                selected_item_ids=request.data.get("item_ids", []),
                selected_combo_ids=request.data.get("combo_ids", []),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo notification khi đơn hàng được đặt (bỏ qua lỗi nếu có)
        try:
            create_order_notification(order, Notification.Type.ORDER_PLACED)
        except Exception as e:
            # Log lỗi nhưng không làm gián đoạn quá trình đặt hàng
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification for order {order.id}: {str(e)}")
        
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


def create_payment_intent_with_saved_card(request):
    """Tạo Payment Intent với thẻ đã lưu (chỉ cần CVV)"""
    # Kiểm tra user có thẻ đã lưu không
    if not request.user.stripe_customer_id or not request.user.stripe_payment_method_id:
        return Response({
            "detail": "Bạn chưa có thẻ đã lưu. Vui lòng thanh toán bằng thẻ mới."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    delivery_address = None
    address_id = request.data.get("delivery_address_id")

    if address_id:
        try:
            delivery_address = DeliveryAddress.objects.select_related(
                "province", "ward"
            ).get(pk=address_id, user=request.user)
        except DeliveryAddress.DoesNotExist:
            return Response({"detail": "Địa chỉ giao hàng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        delivery_address = (
            request.user.delivery_addresses.select_related(
                "province", "ward"
            ).filter(is_default=True).first()
        )
        if delivery_address is None:
            return Response({"detail": "Vui lòng chọn địa chỉ giao hàng"}, status=status.HTTP_400_BAD_REQUEST)

    # Kiểm tra giỏ hàng
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({"detail": "Giỏ hàng không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

    if not cart.items.exists() and not cart.combos.exists():
        return Response({"detail": "Giỏ hàng trống"}, status=status.HTTP_400_BAD_REQUEST)

    # Tính tổng tiền
    total_amount = calculate_cart_total(cart)
    
    if total_amount <= 0:
        return Response({"detail": "Tổng tiền không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

    # Tạo đơn hàng tạm
    try:
        order = create_order_from_cart(
            request.user,
            payment_method="card",
            note=request.data.get("note", ""),
            delivery_address=delivery_address,
            clear_cart=False,
        )
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # Kiểm tra Stripe configuration
    if not settings.STRIPE_SECRET_KEY:
        order.delete()
        return Response({"detail": "Stripe chưa được cấu hình. Vui lòng liên hệ quản trị viên."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Tạo Payment Intent với thẻ đã lưu
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(total_amount.quantize(Decimal('1'), rounding=ROUND_HALF_UP)),
            currency='vnd',
            customer=request.user.stripe_customer_id,
            payment_method=request.user.stripe_payment_method_id,
            confirmation_method='manual',
            confirm=False,
            metadata={
                'order_id': str(order.id),
                'user_id': str(request.user.id),
            }
        )
        
        # Lưu payment intent ID vào order
        order.stripe_payment_intent_id = payment_intent.id
        order.save()
        
        # Xóa giỏ hàng sau khi tạo payment intent thành công
        try:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
            cart.combos.all().delete()
        except Cart.DoesNotExist:
            pass

        return Response({
            'client_secret': payment_intent.client_secret,
            'payment_intent_id': payment_intent.id,
            'order_id': order.id,
            'requires_cvv': True  # Frontend cần collect CVV
        }, status=status.HTTP_201_CREATED)

    except stripe.error.StripeError as e:
        order.delete()
        return Response({"detail": f"Lỗi tạo phiên thanh toán: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        order.delete()
        return Response({"detail": f"Lỗi không xác định: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmSavedCardPaymentView(generics.CreateAPIView):
    """Xác nhận thanh toán với thẻ đã lưu (sau khi nhập CVV)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        payment_intent_id = request.data.get("payment_intent_id")
        cvv = request.data.get("cvv")  # CVV từ frontend (trong production nên dùng Stripe Elements)
        
        if not payment_intent_id:
            return Response({"detail": "payment_intent_id là bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Tìm order tương ứng
            try:
                order = Order.objects.get(
                    stripe_payment_intent_id=payment_intent_id,
                    user=request.user
                )
            except Order.DoesNotExist:
                return Response({"detail": "Không tìm thấy đơn hàng"}, status=status.HTTP_404_NOT_FOUND)
            
            # Retrieve payment intent để kiểm tra status
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Nếu payment intent đã succeeded (từ webhook), cập nhật order
            if payment_intent.status == 'succeeded':
                order.stripe_payment_status = 'paid'
                order.payment_completed_at = timezone.now()
                order.save()
                
                return Response({
                    'status': 'succeeded',
                    'order_id': order.id
                }, status=status.HTTP_200_OK)
            
            # Nếu chưa confirmed, confirm payment intent
            # Note: CVV should be handled via Stripe Elements on frontend for security
            # This is a simplified version
            try:
                payment_intent = stripe.PaymentIntent.confirm(
                    payment_intent_id,
                    payment_method=request.user.stripe_payment_method_id
                )
                
                if payment_intent.status == 'succeeded':
                    order.stripe_payment_status = 'paid'
                    order.payment_completed_at = timezone.now()
                    order.save()
                    
                    return Response({
                        'status': 'succeeded',
                        'order_id': order.id
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'status': payment_intent.status,
                        'detail': 'Thanh toán chưa hoàn tất. Vui lòng thử lại.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except stripe.error.CardError as e:
                # Card error (có thể do CVV sai)
                return Response({
                    "detail": f"Lỗi thẻ: {e.user_message or str(e)}"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except stripe.error.StripeError as e:
            return Response({"detail": f"Lỗi xác nhận thanh toán: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Xử lý webhook từ Stripe để cập nhật trạng thái thanh toán"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    # Xử lý sự kiện thanh toán thành công
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        try:
            order_id = session.get('client_reference_id')
            if order_id:
                order = Order.objects.get(id=order_id)
                payment_intent_id = session.get('payment_intent')
                order.stripe_payment_intent_id = payment_intent_id
                
                # Kiểm tra PaymentIntent status
                if payment_intent_id:
                    payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                    
                    # Đảm bảo metadata có order_id
                    if not payment_intent.metadata.get('order_id'):
                        stripe.PaymentIntent.modify(
                            payment_intent_id,
                            metadata={'order_id': str(order.id), 'user_id': str(order.user.id)}
                        )
                    
                    if payment_intent.status == 'requires_capture':
                        # Payment đã được authorize, chưa capture
                        order.stripe_payment_status = 'authorized'
                        order.authorized_at = timezone.now()
                        # Set thời gian hết hạn authorization (60 giây)
                        from datetime import timedelta
                        order.authorization_expires_at = order.authorized_at + timedelta(seconds=60)
                    elif payment_intent.status == 'succeeded':
                        # Payment đã được capture (có thể từ nơi khác)
                        order.stripe_payment_status = 'paid'
                        order.payment_completed_at = timezone.now()
                        order.captured_at = timezone.now()
                
                order.save()
                
                # Lưu thông tin thẻ và customer vào User để dùng cho lần sau
                try:
                    if payment_intent_id:
                        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                        payment_method_id = payment_intent.payment_method
                        
                        if payment_method_id:
                            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
                            
                            # Tạo hoặc lấy Stripe Customer
                            customer_id = order.user.stripe_customer_id
                            if not customer_id:
                                customer = stripe.Customer.create(
                                    email=order.user.email,
                                    name=order.user.full_name or order.user.username,
                                    metadata={'user_id': str(order.user.id)}
                                )
                                customer_id = customer.id
                                order.user.stripe_customer_id = customer_id
                            
                            # Lưu payment method vào customer
                            stripe.PaymentMethod.attach(
                                payment_method_id,
                                customer=customer_id
                            )
                            
                            # Đặt payment method làm mặc định cho customer
                            stripe.Customer.modify(
                                customer_id,
                                invoice_settings={'default_payment_method': payment_method_id}
                            )
                            
                            # Lưu payment method ID vào user
                            order.user.stripe_payment_method_id = payment_method_id
                            order.user.save()
                except Exception as e:
                    # Log error nhưng không fail webhook
                    print(f"Error saving payment method: {e}")
                
                # Đảm bảo giỏ hàng đã được xóa (trong trường hợp chưa xóa)
                try:
                    cart = Cart.objects.get(user=order.user)
                    cart.items.all().delete()
                    cart.combos.all().delete()
                except Cart.DoesNotExist:
                    pass
        except Order.DoesNotExist:
            pass
        except Exception as e:
            # Log error nhưng không fail webhook
            print(f"Error processing webhook: {e}")

    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # PaymentIntent đã được capture thành công
        try:
            order_id = payment_intent.metadata.get('order_id')
            if order_id:
                order = Order.objects.get(id=order_id)
                order.stripe_payment_status = 'paid'
                order.payment_completed_at = timezone.now()
                order.captured_at = timezone.now()
                order.save()
        except Order.DoesNotExist:
            pass
        except Exception as e:
            print(f"Error processing payment_intent.succeeded: {e}")
    
    elif event['type'] == 'payment_intent.canceled':
        payment_intent = event['data']['object']
        # PaymentIntent đã bị cancel (void authorization)
        try:
            order_id = payment_intent.metadata.get('order_id')
            if order_id:
                order = Order.objects.get(id=order_id)
                if order.status != Order.Status.CANCELLED:
                    restock_order_inventory(order)
                order.stripe_payment_status = 'canceled'
                order.status = Order.Status.CANCELLED
                order.save()
        except Order.DoesNotExist:
            pass
        except Exception as e:
            print(f"Error processing payment_intent.canceled: {e}")

    return HttpResponse(status=200)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_payment_authorization(request, order_id):
    """Hủy authorization (void) trong cửa sổ 60s"""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"detail": "Không tìm thấy đơn hàng"}, status=status.HTTP_404_NOT_FOUND)
    
    if not order.stripe_payment_intent_id:
        return Response({"detail": "Đơn hàng không có PaymentIntent"}, status=status.HTTP_400_BAD_REQUEST)
    
    if order.stripe_payment_status != 'authorized':
        return Response({"detail": "Đơn hàng không ở trạng thái authorized"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Kiểm tra xem còn trong cửa sổ 60s không
    if order.authorization_expires_at and timezone.now() > order.authorization_expires_at:
        return Response({"detail": "Đã quá thời gian hủy (60 giây)"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Cancel PaymentIntent để void authorization
        payment_intent = stripe.PaymentIntent.cancel(
            order.stripe_payment_intent_id,
            cancellation_reason='requested_by_customer'
        )
        
        # Cập nhật order status
        if order.status != Order.Status.CANCELLED:
            restock_order_inventory(order)
        order.stripe_payment_status = 'canceled'
        order.status = Order.Status.CANCELLED
        order.save()
        
        return Response({
            'status': 'canceled',
            'message': 'Đã hủy authorization thành công'
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        return Response({"detail": f"Lỗi hủy authorization: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def capture_payment(request, order_id):
    """Capture PaymentIntent sau 60s hoặc khi chuẩn bị hàng"""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"detail": "Không tìm thấy đơn hàng"}, status=status.HTTP_404_NOT_FOUND)
    
    if not order.stripe_payment_intent_id:
        return Response({"detail": "Đơn hàng không có PaymentIntent"}, status=status.HTTP_400_BAD_REQUEST)
    
    if order.stripe_payment_status != 'authorized':
        return Response({"detail": "Đơn hàng không ở trạng thái authorized"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Capture PaymentIntent
        payment_intent = stripe.PaymentIntent.capture(order.stripe_payment_intent_id)
        
        if payment_intent.status == 'succeeded':
            # Cập nhật order status
            order.stripe_payment_status = 'paid'
            order.payment_completed_at = timezone.now()
            order.captured_at = timezone.now()
            order.save()
            
            return Response({
                'status': 'captured',
                'message': 'Đã thu tiền thành công'
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": f"Capture không thành công. Status: {payment_intent.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
    except stripe.error.StripeError as e:
        return Response({"detail": f"Lỗi capture: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_authorization_status(request, order_id):
    """Kiểm tra trạng thái authorization và thời gian còn lại"""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"detail": "Không tìm thấy đơn hàng"}, status=status.HTTP_404_NOT_FOUND)
    
    if order.stripe_payment_status == 'authorized' and order.authorization_expires_at:
        remaining_seconds = max(0, int((order.authorization_expires_at - timezone.now()).total_seconds()))
        can_cancel = remaining_seconds > 0
        can_capture = True  # Có thể capture bất cứ lúc nào sau khi authorized
    else:
        remaining_seconds = 0
        can_cancel = False
        can_capture = False
    
    return Response({
        'payment_status': order.stripe_payment_status,
        'authorized_at': order.authorized_at,
        'authorization_expires_at': order.authorization_expires_at,
        'remaining_seconds': remaining_seconds,
        'can_cancel': can_cancel,
        'can_capture': can_capture,
    }, status=status.HTTP_200_OK)
class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OrdersPagination

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)

        # Lọc theo is_read nếu có
        is_read_param = self.request.query_params.get('is_read')
        if is_read_param is not None:
            is_read = is_read_param.lower() == 'true'
            queryset = queryset.filter(is_read=is_read)

        return queryset

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Lấy số lượng thông báo chưa đọc"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """Đánh dấu tất cả thông báo là đã đọc"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'Đã đánh dấu tất cả thông báo là đã đọc'})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Đánh dấu một thông báo là đã đọc"""
        notification = self.get_object()
        if notification.user != request.user:
            return Response({'error': 'Bạn không có quyền truy cập thông báo này'}, status=403)
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
