from django.contrib import admin
from apps.plushies.models import Plushie


@admin.register(Plushie)
class PlushieAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'is_active', 'is_deleted', 'created_at']
    list_filter = ['is_active', 'is_deleted']
    search_fields = ['name']
