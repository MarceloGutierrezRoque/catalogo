from django.test import TestCase
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class ProductSerializerTests(TestCase):
    """Tests for the ProductSerializer."""

    def setUp(self):
        self.supplier = Supplier.objects.create(name='Proveedor Test')
        self.warehouse = Warehouse.objects.create(name='Bodega Test', code='BT-001')
        self.product = Product.objects.create(
            name='Teclado Mecánico',
            sku='TEC-001',
            category='Periféricos',
            brand='TechKeys',
            unit_price=89.99,
            stock_quantity=200,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.valid_data = {
            'name': 'Monitor 27" 4K',
            'sku': 'MON-4K-001',
            'category': 'Monitores',
            'brand': 'PixelView',
            'unit_price': 450.00,
            'weight': 5.000,
            'dimensions': '62x40x20',
            'stock_quantity': 30,
            'min_stock_level': 5,
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = ProductSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Product instance."""
        serializer = ProductSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Product)
        self.assertEqual(instance.name, 'Monitor 27" 4K')
        self.assertEqual(instance.sku, 'MON-4K-001')
        self.assertEqual(instance.supplier, self.supplier)
        self.assertEqual(instance.warehouse, self.warehouse)

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = ProductSerializer(instance=self.product)
        data = serializer.data
        self.assertEqual(data['name'], 'Teclado Mecánico')
        self.assertEqual(data['sku'], 'TEC-001')
        self.assertEqual(data['supplier'], self.supplier.pk)
        self.assertEqual(data['warehouse'], self.warehouse.pk)
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_missing_required_name(self):
        """Missing 'name' returns validation error."""
        data = self.valid_data.copy()
        data.pop('name')
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_missing_required_sku(self):
        """Missing 'sku' returns validation error."""
        data = self.valid_data.copy()
        data.pop('sku')
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_serializer_missing_required_supplier(self):
        """Missing 'supplier' returns validation error."""
        data = self.valid_data.copy()
        data.pop('supplier')
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_serializer_missing_required_warehouse(self):
        """Missing 'warehouse' returns validation error."""
        data = self.valid_data.copy()
        data.pop('warehouse')
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    def test_serializer_invalid_unique_sku(self):
        """Duplicate sku returns validation error."""
        data = self.valid_data.copy()
        data['sku'] = self.product.sku
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_serializer_invalid_price_type(self):
        """unit_price as string instead of decimal returns validation error."""
        data = self.valid_data.copy()
        data['unit_price'] = 'not-a-price'
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_serializer_non_existent_supplier(self):
        """Non-existent supplier pk returns validation error."""
        data = self.valid_data.copy()
        data['supplier'] = 99999
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_serializer_non_existent_warehouse(self):
        """Non-existent warehouse pk returns validation error."""
        data = self.valid_data.copy()
        data['warehouse'] = 99999
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_sku(self):
        """Empty string for sku fails validation."""
        data = self.valid_data.copy()
        data['sku'] = ''
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_serializer_default_stock_values(self):
        """stock_quantity and min_stock_level default to 0."""
        data = {
            'name': 'Default Stock',
            'sku': 'DEF-001',
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
        }
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertEqual(instance.stock_quantity, 0)
        self.assertEqual(instance.min_stock_level, 0)
