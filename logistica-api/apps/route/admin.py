from django.contrib import admin
from apps.route.models import Route, Stop


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'transport', 'driver', 'start_date', 'end_date', 'status', 'is_active']
    search_fields = ['name', 'transport__plate', 'driver__license_number']
    list_filter = ['status', 'is_active']


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ['route', 'order', 'warehouse', 'arrival_time', 'departure_time', 'status']
    search_fields = ['route__name', 'warehouse__name']
    list_filter = ['status']
