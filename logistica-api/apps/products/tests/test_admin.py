from django.test import TestCase
from django.contrib.admin import site
from apps.products.models import Product
from apps.products.admin import ProductAdmin
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class ProductAdminTests(TestCase):
    """Tests for the Product admin configuration."""

    def setUp(self):
        self.supplier = Supplier.objects.create(name='Admin Supplier')
        self.warehouse = Warehouse.objects.create(name='Admin Warehouse', code='AW-001')
        self.product = Product.objects.create(
            name='Admin Product',
            sku='ADM-PRO-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )

    def test_admin_registered(self):
        """Product model is registered with the admin site."""
        self.assertIn(Product, site._registry)

    def test_admin_model_admin_class(self):
        """Product uses ProductAdmin."""
        model_admin = site._registry[Product]
        self.assertIsInstance(model_admin, ProductAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Product]
        expected = ['name', 'sku', 'category', 'brand', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Product]
        expected = ['name', 'sku', 'brand']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Product]
        expected = ['category', 'brand', 'is_active', 'supplier', 'warehouse']
        self.assertEqual(list(model_admin.list_filter), expected)
