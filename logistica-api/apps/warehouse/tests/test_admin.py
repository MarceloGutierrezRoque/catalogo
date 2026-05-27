from django.test import TestCase
from django.contrib.admin import site
from apps.warehouse.models import Warehouse
from apps.warehouse.admin import WarehouseAdmin


class WarehouseAdminTests(TestCase):
    """Tests for the Warehouse admin configuration."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Bodega Admin Test',
            code='BAT-001',
        )

    def test_admin_registered(self):
        """Warehouse model is registered with the admin site."""
        self.assertIn(Warehouse, site._registry)

    def test_admin_model_admin_class(self):
        """Warehouse uses WarehouseAdmin."""
        model_admin = site._registry[Warehouse]
        self.assertIsInstance(model_admin, WarehouseAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Warehouse]
        expected = ['name', 'code', 'city', 'country', 'capacity', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Warehouse]
        expected = ['name', 'code', 'city']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Warehouse]
        expected = ['is_active', 'country']
        self.assertEqual(list(model_admin.list_filter), expected)
