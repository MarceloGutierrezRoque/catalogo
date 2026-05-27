from django.test import TestCase
from django.contrib.admin import site
from django.contrib.auth.models import User
from apps.route.models import Route, Stop
from apps.route.admin import RouteAdmin, StopAdmin
from apps.transport.models import Transport
from apps.driver.models import Driver
from apps.warehouse.models import Warehouse


class RouteAdminTests(TestCase):
    """Tests for the Route admin configuration."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='ADM-RTE')
        self.user = User.objects.create_user(username='adm.route.driver')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-ADM-RTE',
        )
        self.route = Route.objects.create(
            name='Admin Route',
            transport=self.transport,
            driver=self.driver,
        )

    def test_admin_registered(self):
        """Route model is registered with the admin site."""
        self.assertIn(Route, site._registry)

    def test_admin_model_admin_class(self):
        """Route uses RouteAdmin."""
        model_admin = site._registry[Route]
        self.assertIsInstance(model_admin, RouteAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Route]
        expected = ['name', 'transport', 'driver', 'start_date', 'end_date', 'status', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Route]
        expected = ['name', 'transport__plate', 'driver__license_number']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Route]
        expected = ['status', 'is_active']
        self.assertEqual(list(model_admin.list_filter), expected)


class StopAdminTests(TestCase):
    """Tests for the Stop admin configuration."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='ADM-STP')
        self.user = User.objects.create_user(username='adm.stop.driver')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-ADM-STP',
        )
        self.route = Route.objects.create(
            name='Admin Stop Route',
            transport=self.transport,
            driver=self.driver,
        )
        self.warehouse = Warehouse.objects.create(
            name='Admin Stop WH',
            code='ADM-STP',
        )
        self.stop = Stop.objects.create(
            route=self.route,
            order=1,
            warehouse=self.warehouse,
        )

    def test_stop_admin_registered(self):
        """Stop model is registered with the admin site."""
        self.assertIn(Stop, site._registry)

    def test_stop_admin_model_admin_class(self):
        """Stop uses StopAdmin."""
        model_admin = site._registry[Stop]
        self.assertIsInstance(model_admin, StopAdmin)

    def test_stop_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Stop]
        expected = ['route', 'order', 'warehouse', 'arrival_time', 'departure_time', 'status']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_stop_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Stop]
        expected = ['route__name', 'warehouse__name']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_stop_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Stop]
        expected = ['status']
        self.assertEqual(list(model_admin.list_filter), expected)
