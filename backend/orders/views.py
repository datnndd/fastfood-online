# orders/views.py
from rest_framework import generics, permissions, viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer
from .permissions import IsStaffOrManager
from .services import create_order_from_cart

class MyOrdersView(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")

class OrdersWorkViewSet(viewsets.ModelViewSet):
    """
    Staff/Manager: xem tất cả đơn, cập nhật status.
    """
    queryset = Order.objects.select_related("user").prefetch_related("items").order_by("-created_at")
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrManager]

class CheckoutView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    def create(self, request, *args, **kwargs):
        order = create_order_from_cart(request.user, request.data.get("payment_method","cash"), request.data.get("note",""))
        return Response(OrderSerializer(order).data, status=201)

class OrdersAdminViewSet(viewsets.ModelViewSet):
    """Dành cho Staff/Manager: xem & cập nhật trạng thái đơn."""
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer
    permission_classes = [IsStaffOrManager]

    @action(detail=False, methods=["get"])
    def today(self, request):
        from django.utils.timezone import now
        start = now().date()
        qs = self.get_queryset().filter(created_at__date=start)
        return Response(self.get_serializer(qs, many=True).data)
