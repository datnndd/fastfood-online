# accounts/urls.py
from django.urls import path
from .views import RegisterView, MeView, CreateStaffView, UpdateUserRoleView
urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("me/", MeView.as_view()),
    path("staff/create/", CreateStaffView.as_view()),
    path("users/<int:pk>/role/", UpdateUserRoleView.as_view()),
]
