from django.contrib import admin
from apps.driver.models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'phone', 'email', 'hire_date', 'is_available', 'is_active']
    search_fields = ['user__username', 'license_number', 'email']
    list_filter = ['is_available', 'is_active']
