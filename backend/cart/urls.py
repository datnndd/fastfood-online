# cart/urls.py
from django.urls import path
from .views import (
    CartView, AddItemView, UpdateItemView,
    AddComboView, UpdateComboView, ClearCartView
)

urlpatterns = [
    path("", CartView.as_view(), name="cart"),
    path("items/", AddItemView.as_view(), name="add-item"),
    path("items/<int:pk>/", UpdateItemView.as_view(), name="update-item"),
    path("combos/", AddComboView.as_view(), name="add-combo"),
    path("combos/<int:pk>/", UpdateComboView.as_view(), name="update-combo"),
    path("clear/", ClearCartView.as_view(), name="clear-cart"),
]