from django.test import TestCase
from django.db import IntegrityError
from apps.customer.models import Customer


class CustomerModelTests(TestCase):
    """Tests for the Customer model."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='TechStore Chile SpA',
            customer_type='company',
            document_type='rut',
            document_number='76.123.456-7',
            email='contacto@techstore.cl',
            phone='+56 2 2765 4321',
            address='Av. Providencia 2000',
            city='Santiago',
            country='Chile',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation returns the name."""
        self.assertEqual(str(self.customer), 'TechStore Chile SpA')

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        customer = Customer.objects.get(pk=self.customer.pk)
        self.assertEqual(customer.name, 'TechStore Chile SpA')
        self.assertEqual(customer.customer_type, 'company')
        self.assertEqual(customer.document_number, '76.123.456-7')
        self.assertEqual(customer.email, 'contacto@techstore.cl')

    def test_create_minimal_instance(self):
        """Creation with only required fields (name, customer_type) succeeds."""
        customer = Customer.objects.create(
            name='Cliente Mínimo',
            customer_type='person',
        )
        self.assertIsNotNone(customer.pk)
        self.assertIsNone(customer.document_type)
        self.assertIsNone(customer.document_number)
        self.assertIsNone(customer.email)
        self.assertIsNone(customer.phone)
        self.assertIsNone(customer.address)
        self.assertIsNone(customer.city)
        self.assertIsNone(customer.country)

    def test_default_values(self):
        """Defaults: is_active=True."""
        self.assertTrue(self.customer.is_active)

    def test_ordering_by_name(self):
        """Default ordering is by name ascending."""
        Customer.objects.create(name='Zeta Cliente', customer_type='person')
        Customer.objects.create(name='Alpha Cliente', customer_type='company')
        customers = list(Customer.objects.all())
        self.assertEqual(customers[0].name, 'Alpha Cliente')
        self.assertEqual(customers[1].name, 'TechStore Chile SpA')
        self.assertEqual(customers[2].name, 'Zeta Cliente')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_name_required(self):
        """Setting name=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(name=None, customer_type='person')

    def test_customer_type_required(self):
        """Setting customer_type=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(name='No Type', customer_type=None)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        customer = Customer.objects.create(
            name='Null Fields Customer',
            customer_type='person',
            document_type=None,
            document_number=None,
            email=None,
            phone=None,
            address=None,
            city=None,
            country=None,
        )
        self.assertIsNone(customer.document_type)
        self.assertIsNone(customer.document_number)
        self.assertIsNone(customer.email)
        self.assertIsNone(customer.phone)
        self.assertIsNone(customer.address)
        self.assertIsNone(customer.city)
        self.assertIsNone(customer.country)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        customer_id = self.customer.pk
        self.customer.is_active = False
        self.customer.save()
        self.assertIsNotNone(Customer.all_objects.get(pk=customer_id))
        self.assertFalse(Customer.all_objects.get(pk=customer_id).is_active)

    def test_invalid_email_format(self):
        """Invalid email string IS stored (no model-level validation)."""
        customer = Customer.objects.create(
            name='Bad Email Customer',
            customer_type='person',
            email='not-a-valid-email',
        )
        self.assertEqual(customer.email, 'not-a-valid-email')

    def test_very_long_name(self):
        """Long name (255 chars) is accepted."""
        long_name = 'A' * 255
        customer = Customer.objects.create(name=long_name, customer_type='person')
        self.assertEqual(len(customer.name), 255)
