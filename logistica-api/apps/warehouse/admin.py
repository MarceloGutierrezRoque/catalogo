from django.contrib import admin
from apps.warehouse.models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'city', 'country', 'capacity', 'is_active']
    search_fields = ['name', 'code', 'city']
    list_filter = ['is_active', 'country']
