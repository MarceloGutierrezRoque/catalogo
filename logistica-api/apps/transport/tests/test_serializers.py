from django.test import TestCase
from apps.transport.models import Transport
from apps.transport.serializers import TransportSerializer


class TransportSerializerTests(TestCase):
    """Tests for the TransportSerializer."""

    def setUp(self):
        self.transport = Transport.objects.create(
            plate='XYZ-789',
            vehicle_type='van',
            brand='Mercedes-Benz',
            model='Sprinter',
            year=2024,
            capacity_kg=1500.00,
            capacity_volume=12.00,
        )
        self.valid_data = {
            'plate': 'NEW-001',
            'vehicle_type': 'car',
            'brand': 'Toyota',
            'model': 'Hilux',
            'year': 2025,
            'capacity_kg': 1000.00,
            'capacity_volume': 5.00,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = TransportSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Transport instance."""
        serializer = TransportSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Transport)
        self.assertEqual(instance.plate, 'NEW-001')
        self.assertEqual(instance.brand, 'Toyota')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = TransportSerializer(instance=self.transport)
        data = serializer.data
        self.assertEqual(data['plate'], 'XYZ-789')
        self.assertEqual(data['vehicle_type'], 'van')
        self.assertEqual(data['brand'], 'Mercedes-Benz')
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_missing_required_plate(self):
        """Missing 'plate' returns validation error."""
        data = self.valid_data.copy()
        data.pop('plate')
        serializer = TransportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate', serializer.errors)

    def test_serializer_invalid_unique_plate(self):
        """Duplicate plate returns validation error."""
        data = self.valid_data.copy()
        data['plate'] = self.transport.plate  # Existing plate
        serializer = TransportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate', serializer.errors)

    def test_serializer_invalid_wrong_type_year(self):
        """Year as string instead of integer returns validation error."""
        data = self.valid_data.copy()
        data['year'] = 'not-a-year'
        serializer = TransportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('year', serializer.errors)

    def test_serializer_invalid_decimal_field(self):
        """capacity_kg with non-numeric value returns validation error."""
        data = self.valid_data.copy()
        data['capacity_kg'] = 'not-a-number'
        serializer = TransportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = TransportSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_plate(self):
        """Empty string for plate fails validation."""
        data = self.valid_data.copy()
        data['plate'] = ''
        serializer = TransportSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate', serializer.errors)

    def test_serializer_partial_data_accepted(self):
        """Only plate required — optional fields omitted."""
        data = {'plate': 'MIN-002'}
        serializer = TransportSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNone(instance.vehicle_type)
        self.assertIsNone(instance.brand)
        self.assertIsNone(instance.model)
        self.assertIsNone(instance.year)
        self.assertIsNone(instance.capacity_kg)
        self.assertIsNone(instance.capacity_volume)

    def test_serializer_is_available_default(self):
        """is_available defaults to True when not provided."""
        data = {'plate': 'DEF-001'}
        serializer = TransportSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertTrue(instance.is_available)
