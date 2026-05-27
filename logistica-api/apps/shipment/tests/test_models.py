from django.test import TestCase
from django.db import IntegrityError, connection
from django.contrib.auth.models import User
from apps.shipment.models import Shipment, ShipmentItem
from apps.customer.models import Customer
from apps.warehouse.models import Warehouse
from apps.products.models import Product
from apps.suppliers.models import Supplier


class ShipmentModelTests(TestCase):
    """Tests for the Shipment model."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Envío Test',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Origen',
            code='BO-001',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-001-ABC',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Av. Destino 500',
            destination_city='Concepción',
            destination_country='Chile',
            status='pending',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation returns the tracking number."""
        self.assertEqual(str(self.shipment), 'TRK-001-ABC')

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        shipment = Shipment.objects.get(tracking_number='TRK-001-ABC')
        self.assertEqual(shipment.customer, self.customer)
        self.assertEqual(shipment.origin_warehouse, self.warehouse)
        self.assertEqual(shipment.destination_city, 'Concepción')
        self.assertEqual(shipment.status, 'pending')

    def test_default_status(self):
        """Default status is 'pending'."""
        shipment = Shipment.objects.create(
            tracking_number='TRK-DEF-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Dirección Default',
            destination_city='Ciudad',
            destination_country='País',
        )
        self.assertEqual(shipment.status, 'pending')

    def test_ordering_by_created_at_desc(self):
        """Default ordering is by -created_at (newest first)."""
        import time
        time.sleep(0.01)  # Ensure different timestamps
        Shipment.objects.create(
            tracking_number='TRK-OLD-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Old',
            destination_city='City',
            destination_country='Country',
        )
        shipments = list(Shipment.objects.all())
        # Newest (last created) should be first
        self.assertEqual(shipments[0].tracking_number, 'TRK-OLD-001')
        self.assertEqual(shipments[1].tracking_number, 'TRK-001-ABC')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_tracking_number_required(self):
        """Setting tracking_number=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                tracking_number=None,
                customer=self.customer,
                origin_warehouse=self.warehouse,
                destination_address='Addr',
                destination_city='City',
                destination_country='Country',
            )

    def test_unique_tracking_number(self):
        """Duplicate tracking_number raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                tracking_number='TRK-001-ABC',
                customer=self.customer,
                origin_warehouse=self.warehouse,
                destination_address='Addr',
                destination_city='City',
                destination_country='Country',
            )

    def test_customer_required(self):
        """Setting customer=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                tracking_number='TRK-NOC-001',
                customer=None,
                origin_warehouse=self.warehouse,
                destination_address='Addr',
                destination_city='City',
                destination_country='Country',
            )

    def test_origin_warehouse_required(self):
        """Setting origin_warehouse=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                tracking_number='TRK-NOW-001',
                customer=self.customer,
                origin_warehouse=None,
                destination_address='Addr',
                destination_city='City',
                destination_country='Country',
            )

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        shipment_id = self.shipment.pk
        self.shipment.is_active = False
        self.shipment.save()
        self.assertIsNotNone(Shipment.objects.get(pk=shipment_id))
        self.assertFalse(Shipment.objects.get(pk=shipment_id).is_active)

    def test_status_choices_all_valid(self):
        """All status choices are accepted."""
        for status_val in ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled']:
            shipment = Shipment.objects.create(
                tracking_number=f'TRK-{status_val}-001',
                customer=self.customer,
                origin_warehouse=self.warehouse,
                destination_address='Addr',
                destination_city='City',
                destination_country='Country',
                status=status_val,
            )
            self.assertEqual(shipment.status, status_val)

    def test_nullable_dates_and_route(self):
        """Date fields and route can be null."""
        shipment = Shipment.objects.create(
            tracking_number='TRK-NUL-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Addr',
            destination_city='City',
            destination_country='Country',
            shipping_date=None,
            estimated_delivery_date=None,
            actual_delivery_date=None,
            route=None,
        )
        self.assertIsNone(shipment.shipping_date)
        self.assertIsNone(shipment.estimated_delivery_date)
        self.assertIsNone(shipment.actual_delivery_date)
        self.assertIsNone(shipment.route)

    def test_observations_blank(self):
        """observations can be blank."""
        self.shipment.observations = ''
        self.shipment.save()
        self.assertEqual(self.shipment.observations, '')

    def test_customer_on_delete_protect(self):
        """Deleting Customer with Shipment raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.customer.delete()

    def test_warehouse_on_delete_protect(self):
        """Deleting Warehouse with Shipment raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    def test_route_nullable_on_delete_set_null(self):
        """Deleting Route sets shipment.route to null."""
        from django.contrib.auth.models import User
        from apps.transport.models import Transport
        from apps.driver.models import Driver
        from apps.route.models import Route

        transport = Transport.objects.create(plate='SHIP-RTE')
        user = User.objects.create_user(username='ship.rte.driver')
        driver = Driver.objects.create(user=user, license_number='LIC-SHIP-RTE')
        route = Route.objects.create(
            name='Ship Route',
            transport=transport,
            driver=driver,
        )
        self.shipment.route = route
        self.shipment.save()
        route.delete()
        self.shipment.refresh_from_db()
        self.assertIsNone(self.shipment.route)


class ShipmentItemModelTests(TestCase):
    """Tests for the ShipmentItem model."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Items',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Items',
            code='BI-001',
        )
        self.supplier = Supplier.objects.create(name='Proveedor Items')
        self.product = Product.objects.create(
            name='Producto Test',
            sku='PRD-ITM-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-ITM-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Addr',
            destination_city='City',
            destination_country='Country',
        )
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=10,
            unit_price_at_shipping=150.00,
        )

    def test_str_representation(self):
        """String representation shows tracking, product and quantity."""
        expected = 'TRK-ITM-001 - Producto Test x10'
        self.assertEqual(str(self.item), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        item = ShipmentItem.objects.get(pk=self.item.pk)
        self.assertEqual(item.quantity, 10)
        self.assertEqual(float(item.unit_price_at_shipping), 150.00)
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.shipment, self.shipment)

    def test_shipment_cascade_delete(self):
        """Deleting Shipment cascades to delete its Items."""
        item_id = self.item.pk
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())

    def test_product_on_delete_protect(self):
        """Deleting Product with ShipmentItem raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.product.delete()

    def test_quantity_zero(self):
        """quantity=0 is accepted."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=0,
            unit_price_at_shipping=0,
        )
        self.assertEqual(item.quantity, 0)

    def test_quantity_negative(self):
        """Negative quantity is accepted (no model-level validation)."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=-1,
            unit_price_at_shipping=10.00,
        )
        self.assertEqual(item.quantity, -1)
