# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyOrdersView, CheckoutView, OrdersWorkViewSet, OrdersAdminViewSet, NotificationViewSet

router = DefaultRouter()
router.register("my", MyOrdersView, basename="my-orders")
router.register("work", OrdersWorkViewSet, basename="work-orders")
router.register("admin", OrdersAdminViewSet, basename="admin-orders")
router.register("notifications", NotificationViewSet, basename="notifications")

urlpatterns = [
    path("checkout/", CheckoutView.as_view()),
    path("", include(router.urls)),
]