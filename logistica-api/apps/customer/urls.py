from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.customer.views import CustomerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
