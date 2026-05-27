from django.contrib import admin
from apps.products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'brand', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'is_active']
    search_fields = ['name', 'sku', 'brand']
    list_filter = ['category', 'brand', 'is_active', 'supplier', 'warehouse']
