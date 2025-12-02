# cart/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartView.as_view(), name='cart-detail'),
    path('count/', views.CartCountView.as_view(), name='cart-count'),
    path('items/', views.AddItemView.as_view(), name='add-item'),
    path('items/<int:pk>/', views.UpdateItemView.as_view(), name='update-item'),
    path('combos/', views.AddComboView.as_view(), name='add-combo'),
    path('combos/<int:pk>/', views.UpdateComboView.as_view(), name='update-combo'),
    path('clear/', views.ClearCartView.as_view(), name='clear-cart'),
]