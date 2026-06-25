from django.contrib import admin
from apps.order_items.models import OrderItem


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'plushie', 'quantity', 'unit_price']
    list_filter = ['order__status']
