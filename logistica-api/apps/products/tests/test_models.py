from django.test import TestCase
from django.db import IntegrityError
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class ProductModelTests(TestCase):
    """Tests for the Product model."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='TechSupplier S.A.',
            contact_name='Roberto Díaz',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Central',
            code='BC-001',
            city='Santiago',
        )
        self.product = Product.objects.create(
            name='Laptop Pro 15"',
            sku='LPT-PRO-001',
            description='Laptop de alta gama para profesionales',
            category='Laptops',
            brand='TechBrand',
            unit_price=1500.00,
            weight=2.500,
            dimensions='35x25x2',
            stock_quantity=50,
            min_stock_level=10,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation shows name and sku."""
        expected = 'Laptop Pro 15" (LPT-PRO-001)'
        self.assertEqual(str(self.product), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        product = Product.objects.get(sku='LPT-PRO-001')
        self.assertEqual(product.name, 'Laptop Pro 15"')
        self.assertEqual(product.category, 'Laptops')
        self.assertEqual(product.brand, 'TechBrand')
        self.assertEqual(float(product.unit_price), 1500.00)
        self.assertEqual(product.supplier, self.supplier)
        self.assertEqual(product.warehouse, self.warehouse)

    def test_create_minimal_instance(self):
        """Creation with only required fields succeeds."""
        product = Product.objects.create(
            name='Mouse USB',
            sku='MOU-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertIsNotNone(product.pk)
        self.assertIsNone(product.description)
        self.assertIsNone(product.category)
        self.assertIsNone(product.brand)
        self.assertIsNone(product.unit_price)
        self.assertIsNone(product.weight)
        self.assertIsNone(product.dimensions)
        self.assertEqual(product.stock_quantity, 0)
        self.assertEqual(product.min_stock_level, 0)

    def test_default_values(self):
        """Defaults: is_active=True, stock_quantity=0, min_stock_level=0."""
        self.assertTrue(self.product.is_active)
        self.assertEqual(self.product.stock_quantity, 50)
        self.assertEqual(self.product.min_stock_level, 10)

    def test_ordering_by_name(self):
        """Default ordering is by name ascending."""
        Product.objects.create(
            name='Zebra Scanner',
            sku='ZBR-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        Product.objects.create(
            name='Auriculares Bluetooth',
            sku='AUR-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        products = list(Product.objects.all())
        self.assertEqual(products[0].name, 'Auriculares Bluetooth')
        self.assertEqual(products[1].name, 'Laptop Pro 15"')
        self.assertEqual(products[2].name, 'Zebra Scanner')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_sku_required(self):
        """Setting sku=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='No SKU',
                sku=None,
                supplier=self.supplier,
                warehouse=self.warehouse,
            )

    def test_unique_sku(self):
        """Duplicate sku raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='Otra Laptop',
                sku='LPT-PRO-001',
                supplier=self.supplier,
                warehouse=self.warehouse,
            )

    def test_name_required(self):
        """Setting name=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name=None,
                sku='NO-NAME',
                supplier=self.supplier,
                warehouse=self.warehouse,
            )

    def test_supplier_required(self):
        """Setting supplier=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='No Supplier',
                sku='NOSUP-001',
                supplier=None,
                warehouse=self.warehouse,
            )

    def test_warehouse_required(self):
        """Setting warehouse=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='No Warehouse',
                sku='NOWH-001',
                supplier=self.supplier,
                warehouse=None,
            )

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        product = Product.objects.create(
            name='Minimal Product',
            sku='MIN-002',
            description=None,
            category=None,
            brand=None,
            unit_price=None,
            weight=None,
            dimensions=None,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertIsNone(product.description)
        self.assertIsNone(product.category)
        self.assertIsNone(product.brand)
        self.assertIsNone(product.unit_price)
        self.assertIsNone(product.weight)
        self.assertIsNone(product.dimensions)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        product_id = self.product.pk
        self.product.is_active = False
        self.product.save()
        self.assertIsNotNone(Product.objects.get(pk=product_id))
        self.assertFalse(Product.objects.get(pk=product_id).is_active)

    def test_supplier_on_delete_protect(self):
        """Deleting a Supplier with Product raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.supplier.delete()

    def test_warehouse_on_delete_protect(self):
        """Deleting a Warehouse with Product raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    def test_zero_stock(self):
        """stock_quantity=0 is valid."""
        product = Product.objects.create(
            name='Zero Stock Item',
            sku='ZST-001',
            stock_quantity=0,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_negative_stock(self):
        """Negative stock_quantity is accepted (no validation at model level)."""
        product = Product.objects.create(
            name='Negative Stock Item',
            sku='NST-001',
            stock_quantity=-5,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertEqual(product.stock_quantity, -5)

    def test_price_zero(self):
        """unit_price=0 is valid."""
        product = Product.objects.create(
            name='Free Item',
            sku='FRE-001',
            unit_price=0,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertEqual(float(product.unit_price), 0)
