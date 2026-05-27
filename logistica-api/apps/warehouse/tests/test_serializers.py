from django.test import TestCase
from rest_framework import serializers
from apps.warehouse.models import Warehouse
from apps.warehouse.serializers import WarehouseSerializer


class WarehouseSerializerTests(TestCase):
    """Tests for the WarehouseSerializer."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Bodega Test',
            code='BT-001',
            address='Calle Falsa 123',
            city='Lima',
            country='Perú',
            capacity=500,
        )
        self.valid_data = {
            'name': 'Bodega Nueva',
            'code': 'BN-002',
            'address': 'Av. Nueva 456',
            'city': 'Bogotá',
            'country': 'Colombia',
            'capacity': 2000,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = WarehouseSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Warehouse instance."""
        serializer = WarehouseSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Warehouse)
        self.assertEqual(instance.name, 'Bodega Nueva')
        self.assertEqual(instance.code, 'BN-002')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = WarehouseSerializer(instance=self.warehouse)
        data = serializer.data
        self.assertEqual(data['name'], 'Bodega Test')
        self.assertEqual(data['code'], 'BT-001')
        self.assertEqual(data['capacity'], 500)
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_missing_required_name(self):
        """Missing 'name' field returns validation error."""
        data = self.valid_data.copy()
        data.pop('name')
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_missing_required_code(self):
        """Missing 'code' field returns validation error."""
        data = self.valid_data.copy()
        data.pop('code')
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_serializer_invalid_wrong_type(self):
        """capacity as string instead of integer returns validation error."""
        data = self.valid_data.copy()
        data['capacity'] = 'not-a-number'
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity', serializer.errors)

    def test_serializer_invalid_unique_code(self):
        """Duplicate code returns validation error."""
        data = self.valid_data.copy()
        data['code'] = self.warehouse.code  # Existing code
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = WarehouseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_name(self):
        """Empty string for name fails validation."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_partial_data_accepted(self):
        """Only required fields (name, code) — optional fields omitted."""
        data = {'name': 'Mini Bodega', 'code': 'MB-003'}
        serializer = WarehouseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNone(instance.address)
        self.assertIsNone(instance.city)
        self.assertIsNone(instance.country)
        self.assertIsNone(instance.capacity)
