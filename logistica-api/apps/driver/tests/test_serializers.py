from django.test import TestCase
from django.contrib.auth.models import User
from apps.driver.models import Driver
from apps.driver.serializers import DriverSerializer


class DriverSerializerTests(TestCase):
    """Tests for the DriverSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='maria.rozas',
            first_name='María',
            last_name='Rozas',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-67890',
            phone='+56 9 3333 4444',
            email='maria@transportes.cl',
            hire_date='2024-01-10',
        )
        self.new_user = User.objects.create_user(
            username='nuevo.conductor',
        )
        self.valid_data = {
            'user': self.new_user.pk,
            'license_number': 'LIC-NEW-001',
            'phone': '+56 9 5555 6666',
            'email': 'nuevo@transportes.cl',
            'hire_date': '2025-03-20',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = DriverSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Driver instance."""
        serializer = DriverSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Driver)
        self.assertEqual(instance.license_number, 'LIC-NEW-001')
        self.assertEqual(instance.user.pk, self.new_user.pk)

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = DriverSerializer(instance=self.driver)
        data = serializer.data
        self.assertEqual(data['license_number'], 'LIC-67890')
        self.assertEqual(data['user'], self.user.pk)
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_missing_required_license(self):
        """Missing 'license_number' returns validation error."""
        data = self.valid_data.copy()
        data.pop('license_number')
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_serializer_missing_required_user(self):
        """Missing 'user' returns validation error."""
        data = self.valid_data.copy()
        data.pop('user')
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)

    def test_serializer_invalid_unique_license(self):
        """Duplicate license_number returns validation error."""
        data = self.valid_data.copy()
        data['license_number'] = self.driver.license_number
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_serializer_non_existent_user(self):
        """Non-existent user pk returns validation error."""
        data = self.valid_data.copy()
        data['user'] = 99999
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('user', serializer.errors)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_license(self):
        """Empty string for license_number fails validation."""
        data = self.valid_data.copy()
        data['license_number'] = ''
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_serializer_partial_data_accepted(self):
        """Only required fields (user, license_number) — optional fields omitted."""
        data = {
            'user': self.new_user.pk,
            'license_number': 'LIC-PARTIAL',
        }
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNone(instance.phone)
        self.assertIsNone(instance.email)
        self.assertIsNone(instance.hire_date)

    def test_serializer_is_available_default(self):
        """is_available defaults to True when not provided."""
        data = {
            'user': self.new_user.pk,
            'license_number': 'LIC-DEF',
        }
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertTrue(instance.is_available)
