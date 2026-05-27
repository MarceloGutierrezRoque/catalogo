from django.test import TestCase
from django.db import IntegrityError, connection
from django.contrib.auth.models import User
from apps.route.models import Route, Stop
from apps.transport.models import Transport
from apps.driver.models import Driver
from apps.warehouse.models import Warehouse


class RouteModelTests(TestCase):
    """Tests for the Route model."""

    def setUp(self):
        self.transport = Transport.objects.create(
            plate='RTE-001',
            brand='Mercedes',
            model='Actros',
        )
        self.user = User.objects.create_user(
            username='ruta.driver',
            first_name='Ruta',
            last_name='Driver',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-RTE-001',
        )
        self.route = Route.objects.create(
            name='Ruta Centro-Sur',
            transport=self.transport,
            driver=self.driver,
            status='planned',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation returns the route name."""
        self.assertEqual(str(self.route), 'Ruta Centro-Sur')

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        route = Route.objects.get(pk=self.route.pk)
        self.assertEqual(route.name, 'Ruta Centro-Sur')
        self.assertEqual(route.transport, self.transport)
        self.assertEqual(route.driver, self.driver)
        self.assertEqual(route.status, 'planned')

    def test_default_status(self):
        """Default status is 'planned'."""
        route = Route.objects.create(
            name='Ruta Default',
            transport=self.transport,
            driver=self.driver,
        )
        self.assertEqual(route.status, 'planned')

    def test_ordering_by_name(self):
        """Default ordering is by name ascending."""
        Route.objects.create(
            name='Ruta Z',
            transport=self.transport,
            driver=self.driver,
        )
        Route.objects.create(
            name='Ruta A',
            transport=self.transport,
            driver=self.driver,
        )
        routes = list(Route.objects.all())
        self.assertEqual(routes[0].name, 'Ruta A')
        self.assertEqual(routes[1].name, 'Ruta Centro-Sur')
        self.assertEqual(routes[2].name, 'Ruta Z')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_name_required(self):
        """Setting name=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name=None,
                transport=self.transport,
                driver=self.driver,
            )

    def test_transport_required(self):
        """Setting transport=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name='No Transport',
                transport=None,
                driver=self.driver,
            )

    def test_driver_required(self):
        """Setting driver=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name='No Driver',
                transport=self.transport,
                driver=None,
            )

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        route_id = self.route.pk
        self.route.is_active = False
        self.route.save()
        self.assertIsNotNone(Route.objects.get(pk=route_id))
        self.assertFalse(Route.objects.get(pk=route_id).is_active)

    def test_status_choices_all_valid(self):
        """All status choices are accepted."""
        for status_val in ['planned', 'in_progress', 'completed', 'cancelled']:
            route = Route.objects.create(
                name=f'Route {status_val}',
                transport=self.transport,
                driver=self.driver,
                status=status_val,
            )
            self.assertEqual(route.status, status_val)

    def test_nullable_dates(self):
        """start_date and end_date can be null."""
        route = Route.objects.create(
            name='Ruta Sin Fechas',
            transport=self.transport,
            driver=self.driver,
            start_date=None,
            end_date=None,
        )
        self.assertIsNone(route.start_date)
        self.assertIsNone(route.end_date)

    def test_transport_on_delete_protect(self):
        """Deleting Transport with Route raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.transport.delete()

    def test_driver_on_delete_protect(self):
        """Deleting Driver with Route raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.driver.delete()


class StopModelTests(TestCase):
    """Tests for the Stop model."""

    def setUp(self):
        self.transport = Transport.objects.create(plate='STP-001')
        self.user = User.objects.create_user(username='stop.driver')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-STP-001',
        )
        self.route = Route.objects.create(
            name='Ruta con Paradas',
            transport=self.transport,
            driver=self.driver,
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacén Norte',
            code='AN-001',
        )
        self.stop = Stop.objects.create(
            route=self.route,
            order=1,
            warehouse=self.warehouse,
            status='pending',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation shows route name and stop order."""
        expected = 'Ruta con Paradas - Stop #1'
        self.assertEqual(str(self.stop), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        stop = Stop.objects.get(pk=self.stop.pk)
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.order, 1)
        self.assertEqual(stop.warehouse, self.warehouse)
        self.assertEqual(stop.status, 'pending')

    def test_default_status(self):
        """Default status is 'pending'."""
        stop = Stop.objects.create(
            route=self.route,
            order=2,
            warehouse=self.warehouse,
        )
        self.assertEqual(stop.status, 'pending')

    def test_ordering_by_route_and_order(self):
        """Default ordering is by route and order."""
        Stop.objects.create(route=self.route, order=3, warehouse=self.warehouse)
        Stop.objects.create(route=self.route, order=2, warehouse=self.warehouse)
        stops = list(Stop.objects.all())
        self.assertEqual(stops[0].order, 1)
        self.assertEqual(stops[1].order, 2)
        self.assertEqual(stops[2].order, 3)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_route_required(self):
        """Setting route=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Stop.objects.create(
                route=None,
                order=1,
                warehouse=self.warehouse,
            )

    def test_order_required(self):
        """Setting order=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Stop.objects.create(
                route=self.route,
                order=None,
                warehouse=self.warehouse,
            )

    def test_warehouse_required(self):
        """Setting warehouse=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Stop.objects.create(
                route=self.route,
                order=1,
                warehouse=None,
            )

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_route_cascade_delete(self):
        """Deleting Route cascades to delete its Stops."""
        stop_id = self.stop.pk
        self.route.delete()
        self.assertFalse(Stop.objects.filter(pk=stop_id).exists())

    def test_status_choices_all_valid(self):
        """All status choices are accepted."""
        for status_val in ['pending', 'arrived', 'completed']:
            stop = Stop.objects.create(
                route=self.route,
                order=99,
                warehouse=self.warehouse,
                status=status_val,
            )
            self.assertEqual(stop.status, status_val)

    def test_nullable_times(self):
        """arrival_time and departure_time can be null."""
        stop = Stop.objects.create(
            route=self.route,
            order=5,
            warehouse=self.warehouse,
            arrival_time=None,
            departure_time=None,
        )
        self.assertIsNone(stop.arrival_time)
        self.assertIsNone(stop.departure_time)

    def test_warehouse_on_delete_protect(self):
        """Deleting Warehouse with Stop raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    def test_multiple_stops_same_order_on_different_routes(self):
        """Same order number allowed on different routes."""
        route2 = Route.objects.create(
            name='Ruta 2',
            transport=self.transport,
            driver=self.driver,
        )
        stop2 = Stop.objects.create(
            route=route2,
            order=1,
            warehouse=self.warehouse,
        )
        self.assertEqual(stop2.order, 1)
        self.assertNotEqual(stop2.route, self.stop.route)
