# cart/urls.py
from django.urls import path
from .views import CartView, AddItemView, UpdateItemView
urlpatterns = [
    path("", CartView.as_view()),
    path("items/", AddItemView.as_view()),
    path("items/<int:pk>/", UpdateItemView.as_view()),
]
