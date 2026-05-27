from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.transport.views import TransportViewSet

router = DefaultRouter()
router.register(r'transports', TransportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
