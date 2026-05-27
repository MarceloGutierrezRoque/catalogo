from django.test import TestCase
from django.contrib.admin import site
from apps.transport.models import Transport
from apps.transport.admin import TransportAdmin


class TransportAdminTests(TestCase):
    """Tests for the Transport admin configuration."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='ADM-001')

    def test_admin_registered(self):
        """Transport model is registered with the admin site."""
        self.assertIn(Transport, site._registry)

    def test_admin_model_admin_class(self):
        """Transport uses TransportAdmin."""
        model_admin = site._registry[Transport]
        self.assertIsInstance(model_admin, TransportAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Transport]
        expected = ['plate', 'vehicle_type', 'brand', 'model', 'year', 'capacity_kg', 'is_available', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Transport]
        expected = ['plate', 'brand', 'model']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Transport]
        expected = ['vehicle_type', 'is_available', 'is_active']
        self.assertEqual(list(model_admin.list_filter), expected)
