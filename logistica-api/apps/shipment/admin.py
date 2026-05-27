from django.contrib import admin
from apps.shipment.models import Shipment, ShipmentItem


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'shipping_date', 'estimated_delivery_date', 'is_active']
    search_fields = ['tracking_number', 'customer__name']
    list_filter = ['status', 'is_active', 'shipping_date']


@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'product', 'quantity', 'unit_price_at_shipping']
    search_fields = ['shipment__tracking_number', 'product__name']
    list_filter = ['shipment__status']
