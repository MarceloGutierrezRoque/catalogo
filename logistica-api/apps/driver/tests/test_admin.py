from django.test import TestCase
from django.contrib.admin import site
from django.contrib.auth.models import User
from apps.driver.models import Driver
from apps.driver.admin import DriverAdmin


class DriverAdminTests(TestCase):
    """Tests for the Driver admin configuration."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='admin.test.driver',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-ADM-001',
        )

    def test_admin_registered(self):
        """Driver model is registered with the admin site."""
        self.assertIn(Driver, site._registry)

    def test_admin_model_admin_class(self):
        """Driver uses DriverAdmin."""
        model_admin = site._registry[Driver]
        self.assertIsInstance(model_admin, DriverAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Driver]
        expected = ['user', 'license_number', 'phone', 'email', 'hire_date', 'is_available', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Driver]
        expected = ['user__username', 'license_number', 'email']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Driver]
        expected = ['is_available', 'is_active']
        self.assertEqual(list(model_admin.list_filter), expected)
