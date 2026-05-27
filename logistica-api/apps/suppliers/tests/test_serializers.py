from django.test import TestCase
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierSerializer


class SupplierSerializerTests(TestCase):
    """Tests for the SupplierSerializer."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Distribuidora Tecnológica Ltda.',
            contact_name='María López',
            email='maria@distec.cl',
            phone='+56 2 2345 6789',
            address='Calle Comercio 300',
            city='Valparaíso',
            country='Chile',
        )
        self.valid_data = {
            'name': 'Nuevo Proveedor S.R.L.',
            'contact_name': 'Juan Pérez',
            'email': 'juan@nuevoprov.com',
            'phone': '+51 1 9876 5432',
            'address': 'Av. Principal 800',
            'city': 'Lima',
            'country': 'Perú',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = SupplierSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Supplier instance."""
        serializer = SupplierSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Supplier)
        self.assertEqual(instance.name, 'Nuevo Proveedor S.R.L.')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = SupplierSerializer(instance=self.supplier)
        data = serializer.data
        self.assertEqual(data['name'], 'Distribuidora Tecnológica Ltda.')
        self.assertEqual(data['contact_name'], 'María López')
        self.assertEqual(data['email'], 'maria@distec.cl')
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
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_invalid_email(self):
        """Invalid email format returns validation error."""
        data = self.valid_data.copy()
        data['email'] = 'not-an-email'
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_serializer_read_only_fields(self):
        """id, created_at, updated_at are read-only and ignored on create."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2025-01-01T00:00:00Z'
        data['updated_at'] = '2025-01-01T00:00:00Z'
        serializer = SupplierSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_name(self):
        """Empty string for name fails validation."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_partial_data_accepted(self):
        """Only name required — optional fields omitted."""
        data = {'name': 'Proveedor Simple'}
        serializer = SupplierSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNone(instance.contact_name)
        self.assertIsNone(instance.email)
        self.assertIsNone(instance.phone)
        self.assertIsNone(instance.address)
        self.assertIsNone(instance.city)
        self.assertIsNone(instance.country)
