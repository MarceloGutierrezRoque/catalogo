from django.test import TestCase
from apps.shipment.models import Shipment, ShipmentItem
from apps.shipment.serializers import ShipmentSerializer, ShipmentItemSerializer
from apps.customer.models import Customer
from apps.warehouse.models import Warehouse
from apps.products.models import Product
from apps.suppliers.models import Supplier


class ShipmentItemSerializerTests(TestCase):
    """Tests for the ShipmentItemSerializer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Serializer',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Serializer',
            code='SER-002',
        )
        self.supplier = Supplier.objects.create(name='Supplier Ser')
        self.product = Product.objects.create(
            name='Product Serializer',
            sku='PRD-SER-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-SER-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Addr',
            destination_city='City',
            destination_country='Country',
        )
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=5,
            unit_price_at_shipping=200.00,
        )
        self.valid_data = {
            'shipment': self.shipment.pk,
            'product': self.product.pk,
            'quantity': 3,
            'unit_price_at_shipping': 99.99,
        }

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = ShipmentItemSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a ShipmentItem instance."""
        serializer = ShipmentItemSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, ShipmentItem)
        self.assertEqual(instance.quantity, 3)

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = ShipmentItemSerializer(instance=self.item)
        data = serializer.data
        self.assertEqual(data['quantity'], 5)
        self.assertEqual(float(data['unit_price_at_shipping']), 200.00)
        self.assertEqual(data['product'], self.product.pk)
        self.assertIn('id', data)

    def test_serializer_missing_required_shipment(self):
        """Missing 'shipment' returns validation error."""
        data = self.valid_data.copy()
        data.pop('shipment')
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('shipment', serializer.errors)

    def test_serializer_missing_required_product(self):
        """Missing 'product' returns validation error."""
        data = self.valid_data.copy()
        data.pop('product')
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_serializer_missing_required_quantity(self):
        """Missing 'quantity' returns validation error."""
        data = self.valid_data.copy()
        data.pop('quantity')
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_serializer_missing_required_unit_price(self):
        """Missing 'unit_price_at_shipping' returns validation error."""
        data = self.valid_data.copy()
        data.pop('unit_price_at_shipping')
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price_at_shipping', serializer.errors)

    def test_serializer_read_only_id(self):
        """id is read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = ShipmentItemSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)


class ShipmentSerializerTests(TestCase):
    """Tests for the ShipmentSerializer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Cliente Ship Ser',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Ship Ser',
            code='SER-003',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-SHPSER-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Destino 123',
            destination_city='Ciudad',
            destination_country='País',
            status='pending',
        )
        self.valid_data = {
            'tracking_number': 'TRK-NEW-SER-001',
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Nueva Dirección',
            'destination_city': 'Nueva Ciudad',
            'destination_country': 'Nuevo País',
        }

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = ShipmentSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Shipment instance."""
        serializer = ShipmentSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Shipment)
        self.assertEqual(instance.tracking_number, 'TRK-NEW-SER-001')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly with nested items."""
        serializer = ShipmentSerializer(instance=self.shipment)
        data = serializer.data
        self.assertEqual(data['tracking_number'], 'TRK-SHPSER-001')
        self.assertEqual(data['customer'], self.customer.pk)
        self.assertEqual(data['origin_warehouse'], self.warehouse.pk)
        self.assertIn('items', data)
        self.assertEqual(data['items'], [])
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_serializer_missing_required_tracking(self):
        """Missing 'tracking_number' returns validation error."""
        data = self.valid_data.copy()
        data.pop('tracking_number')
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tracking_number', serializer.errors)

    def test_serializer_invalid_unique_tracking(self):
        """Duplicate tracking_number returns validation error."""
        data = self.valid_data.copy()
        data['tracking_number'] = self.shipment.tracking_number
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tracking_number', serializer.errors)

    def test_serializer_invalid_status_choice(self):
        """Invalid status value fails validation."""
        data = self.valid_data.copy()
        data['status'] = 'invalid_status'
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = ShipmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_items_read_only(self):
        """items field is read-only in ShipmentSerializer."""
        data = self.valid_data.copy()
        data['items'] = [{'product': 1, 'quantity': 1, 'unit_price_at_shipping': 10}]
        serializer = ShipmentSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertEqual(instance.items.count(), 0)

    def test_serializer_empty_tracking(self):
        """Empty string for tracking_number fails validation."""
        data = self.valid_data.copy()
        data['tracking_number'] = ''
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tracking_number', serializer.errors)
