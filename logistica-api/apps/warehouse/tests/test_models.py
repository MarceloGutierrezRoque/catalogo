from django.test import TestCase
from django.db import IntegrityError
from apps.warehouse.models import Warehouse


class WarehouseModelTests(TestCase):
    """Tests for the Warehouse model."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Bodega Central',
            code='BC-001',
            address='Av. Siempre Viva 123',
            city='Santiago',
            country='Chile',
            capacity=1000,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation shows name and code."""
        expected = 'Bodega Central (BC-001)'
        self.assertEqual(str(self.warehouse), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        warehouse = Warehouse.objects.get(code='BC-001')
        self.assertEqual(warehouse.name, 'Bodega Central')
        self.assertEqual(warehouse.address, 'Av. Siempre Viva 123')
        self.assertEqual(warehouse.city, 'Santiago')
        self.assertEqual(warehouse.country, 'Chile')
        self.assertEqual(warehouse.capacity, 1000)

    def test_create_minimal_instance(self):
        """Creation with only required fields succeeds."""
        warehouse = Warehouse.objects.create(
            name='Bodega Norte',
            code='BN-002',
        )
        self.assertIsNotNone(warehouse.pk)
        self.assertIsNone(warehouse.address)
        self.assertIsNone(warehouse.city)
        self.assertIsNone(warehouse.country)
        self.assertIsNone(warehouse.capacity)

    def test_default_values(self):
        """Defaults: is_active=True."""
        self.assertTrue(self.warehouse.is_active)

    def test_ordering_by_name(self):
        """Default ordering is by name ascending."""
        Warehouse.objects.create(name='Bodega Z', code='BZ-003')
        Warehouse.objects.create(name='Bodega A', code='BA-004')
        warehouses = list(Warehouse.objects.all())
        self.assertEqual(warehouses[0].name, 'Bodega A')
        self.assertEqual(warehouses[1].name, 'Bodega Central')
        self.assertEqual(warehouses[2].name, 'Bodega Z')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_unique_code_constraint(self):
        """Duplicate code raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(
                name='Bodega Duplicada',
                code='BC-001',  # Same code as setUp
            )

    def test_name_required(self):
        """Setting name=None raises IntegrityError (NOT NULL constraint)."""
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(name=None, code='NO-NAME')

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        warehouse = Warehouse.objects.create(
            name='Minimal',
            code='MIN-001',
            address=None,
            city=None,
            country=None,
            capacity=None,
        )
        self.assertIsNone(warehouse.address)
        self.assertIsNone(warehouse.city)
        self.assertIsNone(warehouse.country)
        self.assertIsNone(warehouse.capacity)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        warehouse_id = self.warehouse.pk
        self.warehouse.is_active = False
        self.warehouse.save()
        self.assertIsNotNone(Warehouse.all_objects.get(pk=warehouse_id))
        self.assertFalse(Warehouse.all_objects.get(pk=warehouse_id).is_active)

    def test_capacity_zero(self):
        """capacity=0 is valid."""
        warehouse = Warehouse.objects.create(
            name='Zero Capacity',
            code='ZERO-001',
            capacity=0,
        )
        self.assertEqual(warehouse.capacity, 0)

    def test_very_long_name(self):
        """Long name (255 chars) is accepted."""
        long_name = 'A' * 255
        warehouse = Warehouse.objects.create(
            name=long_name,
            code='LONG-001',
        )
        self.assertEqual(len(warehouse.name), 255)
