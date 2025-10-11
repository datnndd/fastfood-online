# orders/views.py
from rest_framework import generics, permissions, viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import DeliveryAddress
from .models import Order
from .serializers import OrderSerializer
from .permissions import IsStaffOrManager
from .services import create_order_from_cart

class OrdersPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100

class MyOrdersView(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OrdersPagination
    
    def get_queryset(self):
        queryset = (
            Order.objects.filter(user=self.request.user)
            .select_related(
                "delivery_address__province",
                "delivery_address__district",
                "delivery_address__ward",
            )
            .prefetch_related("items__menu_item")
        )
        
        # Lọc theo status nếu có
        status_param = self.request.query_params.get('status')
        if status_param and status_param in ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']:
            queryset = queryset.filter(status=status_param)
        
        return queryset.order_by("-created_at")
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """Hủy đơn hàng (chỉ trong vòng 60 giây và trạng thái PREPARING)"""
        order = self.get_object()
        
        if order.user != request.user:
            return Response({'error': 'Bạn không có quyền hủy đơn hàng này'}, status=403)
        
        if order.status != 'PREPARING':
            return Response({'error': 'Chỉ có thể hủy đơn hàng đang chờ xác nhận'}, status=400)
        
        # Kiểm tra thời gian (60 giây)
        time_diff = timezone.now() - order.created_at
        if time_diff.total_seconds() > 60:
            return Response({'error': 'Đã hết thời gian hủy đơn hàng (60 giây)'}, status=400)
        
        # Cập nhật trạng thái
        order.status = 'CANCELLED'
        order.save()
        
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
                "delivery_address__district",
                "delivery_address__ward",
            )
            .prefetch_related("items__menu_item")
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
        new_status = request.data.get('status')
        
        if new_status not in ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']:
            return Response({'error': 'Trạng thái không hợp lệ'}, status=400)
        
        time_diff = timezone.now() - order.created_at
        if time_diff.total_seconds() <= 60:
            return Response({'error': 'Đơn hàng chưa đủ thời gian xử lý (cần chờ 60 giây)'}, status=400)
        
        order.status = new_status
        order.save()
        
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
                "delivery_address__district",
                "delivery_address__ward",
            )
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

class CheckoutView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    
    def create(self, request, *args, **kwargs):
        delivery_address = None
        address_id = request.data.get("delivery_address_id")

        if address_id:
            try:
                delivery_address = DeliveryAddress.objects.select_related(
                    "province", "district", "ward"
                ).get(pk=address_id, user=request.user)
            except DeliveryAddress.DoesNotExist:
                return Response({"detail": "Địa chỉ giao hàng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            delivery_address = (
                request.user.delivery_addresses.select_related(
                    "province", "district", "ward"
                ).filter(is_default=True).first()
            )
            if delivery_address is None:
                return Response({"detail": "Vui lòng chọn địa chỉ giao hàng"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = create_order_from_cart(
                request.user,
                request.data.get("payment_method", "cash"),
                request.data.get("note", ""),
                delivery_address=delivery_address,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
