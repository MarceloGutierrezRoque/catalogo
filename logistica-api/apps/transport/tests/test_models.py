from django.test import TestCase
from django.db import IntegrityError
from apps.transport.models import Transport


class TransportModelTests(TestCase):
    """Tests for the Transport model."""

    def setUp(self):
        self.transport = Transport.objects.create(
            plate='ABC-123',
            vehicle_type='truck',
            brand='Volvo',
            model='FH460',
            year=2023,
            capacity_kg=20000.00,
            capacity_volume=80.00,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation shows plate, brand and model."""
        expected = 'ABC-123 - Volvo FH460'
        self.assertEqual(str(self.transport), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        transport = Transport.objects.get(plate='ABC-123')
        self.assertEqual(transport.brand, 'Volvo')
        self.assertEqual(transport.model, 'FH460')
        self.assertEqual(transport.year, 2023)
        self.assertEqual(float(transport.capacity_kg), 20000.00)

    def test_create_minimal_instance(self):
        """Creation with only plate succeeds."""
        transport = Transport.objects.create(plate='MIN-001')
        self.assertIsNotNone(transport.pk)
        self.assertIsNone(transport.vehicle_type)
        self.assertIsNone(transport.brand)
        self.assertIsNone(transport.model)
        self.assertIsNone(transport.year)
        self.assertIsNone(transport.capacity_kg)
        self.assertIsNone(transport.capacity_volume)

    def test_default_values(self):
        """Defaults: is_active=True, is_available=True."""
        self.assertTrue(self.transport.is_active)
        self.assertTrue(self.transport.is_available)

    def test_ordering_by_plate(self):
        """Default ordering is by plate ascending."""
        Transport.objects.create(plate='ZZZ-999')
        Transport.objects.create(plate='AAA-111')
        transports = list(Transport.objects.all())
        self.assertEqual(transports[0].plate, 'AAA-111')
        self.assertEqual(transports[1].plate, 'ABC-123')
        self.assertEqual(transports[2].plate, 'ZZZ-999')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_plate_required(self):
        """Setting plate=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Transport.objects.create(plate=None)

    def test_unique_plate(self):
        """Duplicate plate raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Transport.objects.create(plate='ABC-123')

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        transport = Transport.objects.create(
            plate='NUL-001',
            vehicle_type=None,
            brand=None,
            model=None,
            year=None,
            capacity_kg=None,
            capacity_volume=None,
        )
        self.assertIsNone(transport.vehicle_type)
        self.assertIsNone(transport.brand)
        self.assertIsNone(transport.model)
        self.assertIsNone(transport.year)
        self.assertIsNone(transport.capacity_kg)
        self.assertIsNone(transport.capacity_volume)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        transport_id = self.transport.pk
        self.transport.is_active = False
        self.transport.save()
        self.assertIsNotNone(Transport.objects.get(pk=transport_id))
        self.assertFalse(Transport.objects.get(pk=transport_id).is_active)

    def test_is_available_false(self):
        """is_available=False is accepted."""
        transport = Transport.objects.create(
            plate='BSY-001',
            is_available=False,
        )
        self.assertFalse(transport.is_available)

    def test_str_with_null_brand_model(self):
        """String representation handles None brand/model gracefully."""
        transport = Transport.objects.create(plate='NUL-002')
        expected = 'NUL-002 - None None'
        self.assertEqual(str(transport), expected)

    def test_capacity_zero(self):
        """Zero capacity values are valid."""
        transport = Transport.objects.create(
            plate='ZER-001',
            capacity_kg=0,
            capacity_volume=0,
        )
        self.assertEqual(float(transport.capacity_kg), 0)
        self.assertEqual(float(transport.capacity_volume), 0)
