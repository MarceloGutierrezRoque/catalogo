from django.test import TestCase
from django.db import IntegrityError
from apps.suppliers.models import Supplier


class SupplierModelTests(TestCase):
    """Tests for the Supplier model."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Tecnologías Globales S.A.',
            contact_name='Carlos García',
            email='carlos@tecnoglobal.com',
            phone='+56 9 1234 5678',
            address='Av. Innovación 500',
            city='Santiago',
            country='Chile',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation returns the name."""
        self.assertEqual(str(self.supplier), 'Tecnologías Globales S.A.')

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        supplier = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(supplier.name, 'Tecnologías Globales S.A.')
        self.assertEqual(supplier.contact_name, 'Carlos García')
        self.assertEqual(supplier.email, 'carlos@tecnoglobal.com')

    def test_create_minimal_instance(self):
        """Creation with only required fields succeeds."""
        supplier = Supplier.objects.create(name='Proveedor Mínimo')
        self.assertIsNotNone(supplier.pk)
        self.assertIsNone(supplier.contact_name)
        self.assertIsNone(supplier.email)
        self.assertIsNone(supplier.phone)
        self.assertIsNone(supplier.address)
        self.assertIsNone(supplier.city)
        self.assertIsNone(supplier.country)

    def test_default_values(self):
        """Defaults: is_active=True."""
        self.assertTrue(self.supplier.is_active)

    def test_ordering_by_name(self):
        """Default ordering is by name ascending."""
        Supplier.objects.create(name='Zeta Proveedores')
        Supplier.objects.create(name='Alpha Proveedores')
        suppliers = list(Supplier.objects.all())
        self.assertEqual(suppliers[0].name, 'Alpha Proveedores')
        self.assertEqual(suppliers[1].name, 'Tecnologías Globales S.A.')
        self.assertEqual(suppliers[2].name, 'Zeta Proveedores')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_name_required(self):
        """Setting name=None raises IntegrityError (NOT NULL constraint)."""
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(name=None)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        supplier = Supplier.objects.create(
            name='Minimal Supplier',
            contact_name=None,
            email=None,
            phone=None,
            address=None,
            city=None,
            country=None,
        )
        self.assertIsNone(supplier.contact_name)
        self.assertIsNone(supplier.email)
        self.assertIsNone(supplier.phone)
        self.assertIsNone(supplier.address)
        self.assertIsNone(supplier.city)
        self.assertIsNone(supplier.country)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        supplier_id = self.supplier.pk
        self.supplier.is_active = False
        self.supplier.save()
        self.assertIsNotNone(Supplier.all_objects.get(pk=supplier_id))
        self.assertFalse(Supplier.all_objects.get(pk=supplier_id).is_active)

    def test_blank_email_field(self):
        """Empty string for email is accepted (blank=True)."""
        supplier = Supplier.objects.create(
            name='No Email Supplier',
            email='',
        )
        self.assertEqual(supplier.email, '')

    def test_very_long_name(self):
        """Long name (255 chars) is accepted."""
        long_name = 'A' * 255
        supplier = Supplier.objects.create(name=long_name)
        self.assertEqual(len(supplier.name), 255)
