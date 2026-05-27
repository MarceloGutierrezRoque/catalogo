from django.contrib import admin
from apps.customer.models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'document_number', 'email', 'phone', 'city', 'country', 'is_active']
    search_fields = ['name', 'document_number', 'email']
    list_filter = ['customer_type', 'is_active', 'country']
