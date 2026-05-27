from django.test import TestCase
from django.contrib.admin import site
from apps.suppliers.models import Supplier
from apps.suppliers.admin import SupplierAdmin


class SupplierAdminTests(TestCase):
    """Tests for the Supplier admin configuration."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Admin Test Supplier',
        )

    def test_admin_registered(self):
        """Supplier model is registered with the admin site."""
        self.assertIn(Supplier, site._registry)

    def test_admin_model_admin_class(self):
        """Supplier uses SupplierAdmin."""
        model_admin = site._registry[Supplier]
        self.assertIsInstance(model_admin, SupplierAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Supplier]
        expected = ['name', 'contact_name', 'email', 'phone', 'city', 'country', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Supplier]
        expected = ['name', 'contact_name', 'email']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Supplier]
        expected = ['is_active', 'country']
        self.assertEqual(list(model_admin.list_filter), expected)
