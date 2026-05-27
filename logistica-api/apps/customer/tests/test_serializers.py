from django.test import TestCase
from apps.customer.models import Customer
from apps.customer.serializers import CustomerSerializer


class CustomerSerializerTests(TestCase):
    """Tests for the CustomerSerializer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Distribuidora Norte S.A.',
            customer_type='company',
            document_type='rut',
            document_number='77.888.999-0',
            email='ventas@distnorte.cl',
            phone='+56 9 1234 1111',
            address='Av. Norte 500',
            city='Antofagasta',
            country='Chile',
        )
        self.valid_data = {
            'name': 'Cliente Nuevo S.R.L.',
            'customer_type': 'company',
            'document_type': 'nit',
            'document_number': '900.123.456-7',
            'email': 'info@nuevocliente.com',
            'phone': '+57 1 222 3344',
            'address': 'Carrera 7 # 80-50',
            'city': 'Bogotá',
            'country': 'Colombia',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_serializer_valid(self):
        """Valid data passes validation."""
        serializer = CustomerSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_creates_instance(self):
        """Valid data creates a Customer instance."""
        serializer = CustomerSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsInstance(instance, Customer)
        self.assertEqual(instance.name, 'Cliente Nuevo S.R.L.')
        self.assertEqual(instance.customer_type, 'company')

    def test_serializer_serializes_instance(self):
        """Existing instance serializes correctly."""
        serializer = CustomerSerializer(instance=self.customer)
        data = serializer.data
        self.assertEqual(data['name'], 'Distribuidora Norte S.A.')
        self.assertEqual(data['customer_type'], 'company')
        self.assertEqual(data['email'], 'ventas@distnorte.cl')
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
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_missing_required_customer_type(self):
        """Missing 'customer_type' returns validation error."""
        data = self.valid_data.copy()
        data.pop('customer_type')
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_serializer_invalid_email(self):
        """Invalid email format returns validation error."""
        data = self.valid_data.copy()
        data['email'] = 'not-an-email'
        serializer = CustomerSerializer(data=data)
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
        serializer = CustomerSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertNotEqual(instance.pk, 9999)

    def test_serializer_empty_name(self):
        """Empty string for name fails validation."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_serializer_partial_data_accepted(self):
        """Only required fields (name, customer_type) — optional fields omitted."""
        data = {'name': 'Cliente Simple', 'customer_type': 'person'}
        serializer = CustomerSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertIsNone(instance.document_type)
        self.assertIsNone(instance.document_number)
        self.assertIsNone(instance.email)
        self.assertIsNone(instance.phone)
        self.assertIsNone(instance.address)
        self.assertIsNone(instance.city)
        self.assertIsNone(instance.country)
