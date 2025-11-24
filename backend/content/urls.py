# content/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pages', views.PageViewSet, basename='page')
router.register(r'items', views.ContentItemViewSet, basename='contentitem')
router.register(r'stores', views.StoreViewSet, basename='store')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-image/', views.upload_image, name='upload-image'),
]
