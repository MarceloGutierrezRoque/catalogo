from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.orders.views import OrderCreateView, OrderAdminViewSet

urlpatterns = [
    path('orders/', OrderCreateView.as_view(), name='order-create'),
]

admin_router = DefaultRouter()
admin_router.register(
    r'admin/orders', OrderAdminViewSet, basename='order-admin'
)

urlpatterns += admin_router.urls
