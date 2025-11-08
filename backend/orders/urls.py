# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MyOrdersView,
    CheckoutView,
    OrdersWorkViewSet,
    OrdersAdminViewSet,
    stripe_webhook,
    ConfirmSavedCardPaymentView,
    cancel_payment_authorization,
    capture_payment,
    check_authorization_status,
)
from . import statistics

router = DefaultRouter()
router.register("my", MyOrdersView, basename="my-orders")
router.register("work", OrdersWorkViewSet, basename="work-orders")
router.register("admin", OrdersAdminViewSet, basename="admin-orders")

urlpatterns = [
    path("checkout/", CheckoutView.as_view()),
    path("confirm-saved-card/", ConfirmSavedCardPaymentView.as_view(), name="confirm-saved-card"),
    path("stripe/webhook/", stripe_webhook, name="stripe-webhook"),
    path("my/<int:order_id>/cancel-authorization/", cancel_payment_authorization, name="cancel-authorization"),
    path("my/<int:order_id>/capture/", capture_payment, name="capture-payment"),
    path("my/<int:order_id>/authorization-status/", check_authorization_status, name="authorization-status"),
    path("", include(router.urls)),
    # Statistics endpoints
    path("stats/revenue/", statistics.revenue_statistics, name="stats-revenue"),
    path("stats/orders/", statistics.order_statistics, name="stats-orders"),
    path("stats/top-items/", statistics.top_items_statistics, name="stats-top-items"),
    path("stats/top-combos/", statistics.top_combos_statistics, name="stats-top-combos"),
    path("stats/export/<str:format>/", statistics.export_report, name="stats-export"),
]
