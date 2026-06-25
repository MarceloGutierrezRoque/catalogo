from django.test import TestCase
from apps.payments.serializers import CreateCheckoutSessionSerializer


class CreateCheckoutSessionSerializerTests(TestCase):
    """Tests for CreateCheckoutSessionSerializer."""

    def setUp(self):
        self.valid_data = {
            'items': [{'product_id': 1, 'quantity': 2}],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_valida_datos_correctos(self):
        """Valid single item passes validation."""
        serializer = CreateCheckoutSessionSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())

    def test_valida_multiple_items(self):
        """Multiple items in the list pass validation."""
        data = {
            'items': [
                {'product_id': 1, 'quantity': 2},
                {'product_id': 3, 'quantity': 5},
            ],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(len(serializer.validated_data['items']), 2)

    def test_valida_con_email_opcional(self):
        """Valid data with optional customer_email passes validation."""
        data = {**self.valid_data, 'customer_email': 'test@example.com'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_valida_con_email_vacio(self):
        """customer_email with blank string is valid."""
        data = {**self.valid_data, 'customer_email': ''}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_quantity_default_one(self):
        """Default quantity is 1 when not provided."""
        data = {
            'items': [{'product_id': 1}],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['items'][0]['quantity'], 1
        )

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_rechaza_items_vacio(self):
        """Empty items list is rejected."""
        data = {**self.valid_data, 'items': []}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_rechaza_cantidad_cero(self):
        """Quantity less than 1 is rejected."""
        data = {
            **self.valid_data,
            'items': [{'product_id': 1, 'quantity': 0}],
        }
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_rechaza_cantidad_negativa(self):
        """Negative quantity is rejected."""
        data = {
            **self.valid_data,
            'items': [{'product_id': 1, 'quantity': -1}],
        }
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_rechaza_product_id_faltante(self):
        """Missing product_id in item is rejected."""
        data = {
            **self.valid_data,
            'items': [{'quantity': 2}],
        }
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_rechaza_url_invalida(self):
        """Invalid success_url is rejected."""
        data = {**self.valid_data, 'success_url': 'not-a-url'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('success_url', serializer.errors)

    def test_valida_sin_success_url(self):
        """Missing success_url is valid (uses env default)."""
        data = {k: v for k, v in self.valid_data.items() if k != 'success_url'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_valida_sin_cancel_url(self):
        """Missing cancel_url is valid (uses env default)."""
        data = {k: v for k, v in self.valid_data.items() if k != 'cancel_url'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_rechaza_email_invalido(self):
        """Invalid customer_email is rejected."""
        data = {**self.valid_data, 'customer_email': 'not-an-email'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_email', serializer.errors)

    def test_rechaza_items_no_lista(self):
        """Items must be a list."""
        data = {**self.valid_data, 'items': 'not-a-list'}
        serializer = CreateCheckoutSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)
