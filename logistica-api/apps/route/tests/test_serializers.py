from django.test import TestCase
from django.contrib.auth.models import User
from apps.route.models import Route, Stop
from apps.route.serializers import RouteSerializer, StopSerializer
from apps.transport.models import Transport
from apps.driver.models import Driver
from apps.warehouse.models import Warehouse


class StopSerializerTests(TestCase):
    """Tests for the StopSerializer."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='SER-STP')
        self.user = User.objects.create_user(username='ser.stop.driver')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-SER-STP',
        )
        self.route = Route.objects.create(
            name='Ruta Stop Serializer',
            transport=self.transport,
            driver=self.driver,
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Serializer',
            code='SER-001',
        )
        self.stop = Stop.objects.create(
            route=self.route,
            order=1,
            warehouse=self.warehouse,
        )
        self.valid_data = {
            'route': self.route.pk,
            'order': 2,
            'warehouse': self.warehouse.pk,
        }

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = StopSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Stop instance."""
        serializer = StopSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Stop)
        self.assertEqual(instance.order, 2)

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = StopSerializer(instance=self.stop)
        data = serializer.data
        self.assertEqual(data['order'], 1)
        self.assertEqual(data['route'], self.route.pk)
        self.assertEqual(data['warehouse'], self.warehouse.pk)
        self.assertIn('id', data)

    def test_serializer_missing_required_route(self):
        """Missing 'route' returns validation error."""
        data = self.valid_data.copy()
        data.pop('route')
        serializer = StopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('route', serializer.errors)

    def test_serializer_missing_required_order(self):
        """Missing 'order' returns validation error."""
        data = self.valid_data.copy()
        data.pop('order')
        serializer = StopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('order', serializer.errors)

    def test_serializer_missing_required_warehouse(self):
        """Missing 'warehouse' returns validation error."""
        data = self.valid_data.copy()
        data.pop('warehouse')
        serializer = StopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    def test_serializer_read_only_id(self):
        """id is read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = StopSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)


class RouteSerializerTests(TestCase):
    """Tests for the RouteSerializer."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='SER-RTE')
        self.user = User.objects.create_user(username='ser.rte.driver')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-SER-RTE',
        )
        self.route = Route.objects.create(
            name='Ruta Route Serializer',
            transport=self.transport,
            driver=self.driver,
            status='planned',
        )
        self.valid_data = {
            'name': 'Ruta Nueva',
            'transport': self.transport.pk,
            'driver': self.driver.pk,
        }

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = RouteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Route instance."""
        serializer = RouteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Route)
        self.assertEqual(instance.name, 'Ruta Nueva')
        self.assertEqual(instance.status, 'planned')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly with nested stops."""
        serializer = RouteSerializer(instance=self.route)
        data = serializer.data
        self.assertEqual(data['name'], 'Ruta Route Serializer')
        self.assertEqual(data['transport'], self.transport.pk)
        self.assertEqual(data['driver'], self.driver.pk)
        self.assertIn('stops', data)
        self.assertEqual(data['stops'], [])
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_serializer_missing_required_name(self):
        """Missing 'name' returns validation error."""
        data = self.valid_data.copy()
        data.pop('name')
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_missing_required_transport(self):
        """Missing 'transport' returns validation error."""
        data = self.valid_data.copy()
        data.pop('transport')
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('transport', serializer.errors)

    def test_serializer_missing_required_driver(self):
        """Missing 'driver' returns validation error."""
        data = self.valid_data.copy()
        data.pop('driver')
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('driver', serializer.errors)

    def test_serializer_stops_read_only(self):
        """stops field is read-only in RouteSerializer."""
        data = self.valid_data.copy()
        data['stops'] = [{'order': 1, 'warehouse': 999}]
        serializer = RouteSerializer(data=data)
        # stops is read-only, should be ignored, validation should pass
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertEqual(instance.stops.count(), 0)

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = RouteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_name(self):
        """Empty string for name fails validation."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_invalid_status_choice(self):
        """Invalid status value fails validation."""
        data = self.valid_data.copy()
        data['status'] = 'invalid_status'
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)
