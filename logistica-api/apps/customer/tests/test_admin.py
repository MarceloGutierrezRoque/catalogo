from django.test import TestCase
from django.contrib.admin import site
from apps.customer.models import Customer
from apps.customer.admin import CustomerAdmin


class CustomerAdminTests(TestCase):
    """Tests for the Customer admin configuration."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Admin Test Customer',
            customer_type='company',
        )

    def test_admin_registered(self):
        """Customer model is registered with the admin site."""
        self.assertIn(Customer, site._registry)

    def test_admin_model_admin_class(self):
        """Customer uses CustomerAdmin."""
        model_admin = site._registry[Customer]
        self.assertIsInstance(model_admin, CustomerAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Customer]
        expected = ['name', 'customer_type', 'document_number', 'email', 'phone', 'city', 'country', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Customer]
        expected = ['name', 'document_number', 'email']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Customer]
        expected = ['customer_type', 'is_active', 'country']
        self.assertEqual(list(model_admin.list_filter), expected)
