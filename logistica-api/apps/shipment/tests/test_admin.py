from django.test import TestCase
from django.contrib.admin import site
from apps.shipment.models import Shipment, ShipmentItem
from apps.shipment.admin import ShipmentAdmin, ShipmentItemAdmin
from apps.customer.models import Customer
from apps.warehouse.models import Warehouse


class ShipmentAdminTests(TestCase):
    """Tests for the Shipment admin configuration."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Admin Customer',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Admin WH',
            code='ADM-WH',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-ADM-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Admin Addr',
            destination_city='Admin City',
            destination_country='Admin Country',
        )

    def test_admin_registered(self):
        """Shipment model is registered with the admin site."""
        self.assertIn(Shipment, site._registry)

    def test_admin_model_admin_class(self):
        """Shipment uses ShipmentAdmin."""
        model_admin = site._registry[Shipment]
        self.assertIsInstance(model_admin, ShipmentAdmin)

    def test_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[Shipment]
        expected = ['tracking_number', 'customer', 'status', 'shipping_date', 'estimated_delivery_date', 'is_active']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[Shipment]
        expected = ['tracking_number', 'customer__name']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[Shipment]
        expected = ['status', 'is_active', 'shipping_date']
        self.assertEqual(list(model_admin.list_filter), expected)


class ShipmentItemAdminTests(TestCase):
    """Tests for the ShipmentItem admin configuration."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Admin Item Customer',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Admin Item WH',
            code='ADM-ITM',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-ADM-ITM',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Addr',
            destination_city='City',
            destination_country='Country',
        )
        # Note: ShipmentItem requires a product but for admin registration test,
        # we just need the model to exist in registry — the item itself isn't
        # strictly needed for admin config tests

    def test_item_admin_registered(self):
        """ShipmentItem model is registered with the admin site."""
        self.assertIn(ShipmentItem, site._registry)

    def test_item_admin_model_admin_class(self):
        """ShipmentItem uses ShipmentItemAdmin."""
        model_admin = site._registry[ShipmentItem]
        self.assertIsInstance(model_admin, ShipmentItemAdmin)

    def test_item_admin_list_display(self):
        """list_display contains expected fields."""
        model_admin = site._registry[ShipmentItem]
        expected = ['shipment', 'product', 'quantity', 'unit_price_at_shipping']
        self.assertEqual(list(model_admin.list_display), expected)

    def test_item_admin_search_fields(self):
        """search_fields contains expected fields."""
        model_admin = site._registry[ShipmentItem]
        expected = ['shipment__tracking_number', 'product__name']
        self.assertEqual(list(model_admin.search_fields), expected)

    def test_item_admin_list_filter(self):
        """list_filter contains expected fields."""
        model_admin = site._registry[ShipmentItem]
        expected = ['shipment__status']
        self.assertEqual(list(model_admin.list_filter), expected)
