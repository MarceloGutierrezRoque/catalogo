from django.contrib import admin
from apps.suppliers.models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'email', 'phone', 'city', 'country', 'is_active']
    search_fields = ['name', 'contact_name', 'email']
    list_filter = ['is_active', 'country']
