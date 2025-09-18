# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyOrdersView, CheckoutView, OrdersWorkViewSet

router = DefaultRouter()
router.register("my", MyOrdersView, basename="my-orders")
router.register("work", OrdersWorkViewSet, basename="work-orders")

urlpatterns = [
    path("checkout/", CheckoutView.as_view()),
    path("", include(router.urls)),
]
