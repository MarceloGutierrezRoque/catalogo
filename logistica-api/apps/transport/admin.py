from django.contrib import admin
from apps.transport.models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['plate', 'vehicle_type', 'brand', 'model', 'year', 'capacity_kg', 'is_available', 'is_active']
    search_fields = ['plate', 'brand', 'model']
    list_filter = ['vehicle_type', 'is_available', 'is_active']
