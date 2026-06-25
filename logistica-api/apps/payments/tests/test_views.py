from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User

from apps.payments.models import Payment
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class PaymentViewSetTests(APITestCase):
    """Tests for PaymentViewSet (list/retrieve only)."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = User.objects.create_superuser(
            username='testuser', password='testpass123'
        )
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser', 'password': 'testpass123'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.supplier = Supplier.objects.create(name='Test Supplier')
        self.warehouse = Warehouse.objects.create(name='Test Warehouse', code='TW-001')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TST-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.payment = Payment.objects.create(
            product=self.product,
            stripe_session_id='cs_test_123',
            amount=1999,
            currency='usd',
            status=Payment.Status.PENDING,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_authenticated(self):
        """GET /api/payments/ returns 200 with list."""
        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['stripe_session_id'], 'cs_test_123')

    def test_retrieve_authenticated(self):
        """GET /api/payments/{id}/ returns 200."""
        response = self.client.get(f'/api/payments/{self.payment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stripe_session_id'], 'cs_test_123')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/payments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CreateCheckoutSessionViewTests(APITestCase):
    """Tests for CreateCheckoutSessionView."""

    def setUp(self):
        self.client = APIClient()
        self.supplier = Supplier.objects.create(name='Test Supplier')
        self.warehouse = Warehouse.objects.create(name='Test Warehouse', code='TW-002')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TST-002',
            unit_price=29.99,
            supplier=self.supplier,
            warehouse=self.warehouse,
            stripe_price_id='price_test_123',
        )
        self.product2 = Product.objects.create(
            name='Second Product',
            sku='TST-003',
            unit_price=49.99,
            supplier=self.supplier,
            warehouse=self.warehouse,
            stripe_price_id='price_test_456',
        )
        self.valid_payload = {
            'items': [{'product_id': self.product.pk, 'quantity': 1}],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    @patch('stripe.checkout.Session.create')
    def test_create_session_success_single_item(self, mock_session_create):
        """POST with single product creates Stripe session and returns 201."""
        mock_session = MagicMock()
        mock_session.id = 'cs_test_new_456'
        mock_session.url = 'https://checkout.stripe.com/cs_test_new_456'
        mock_session.amount_total = 2999
        mock_session.currency = 'usd'
        mock_session_create.return_value = mock_session

        response = self.client.post(
            '/api/payments/create-checkout-session/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['session_id'], 'cs_test_new_456')
        self.assertIn('session_url', response.data)

        # Verify one Payment was created locally
        payments = Payment.objects.filter(stripe_session_id='cs_test_new_456')
        self.assertEqual(payments.count(), 1)

    @patch('stripe.checkout.Session.create')
    def test_create_session_multiple_items(self, mock_session_create):
        """POST with multiple products creates one Payment per item."""
        mock_session = MagicMock()
        mock_session.id = 'cs_test_multi'
        mock_session.url = 'https://checkout.stripe.com/cs_test_multi'
        mock_session.amount_total = 7998
        mock_session.currency = 'usd'
        mock_session_create.return_value = mock_session

        payload = {
            'items': [
                {'product_id': self.product.pk, 'quantity': 2},
                {'product_id': self.product2.pk, 'quantity': 1},
            ],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }

        response = self.client.post(
            '/api/payments/create-checkout-session/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify two Payments created, one per product
        payments = Payment.objects.filter(stripe_session_id='cs_test_multi')
        self.assertEqual(payments.count(), 2)

        # Verify line_items passed to Stripe
        call_kwargs = mock_session_create.call_args[1]
        self.assertEqual(len(call_kwargs['line_items']), 2)

    @patch('stripe.checkout.Session.create')
    def test_create_session_with_email(self, mock_session_create):
        """POST with customer_email passes it to Stripe."""
        mock_session = MagicMock()
        mock_session.id = 'cs_test_email_789'
        mock_session.url = 'https://checkout.stripe.com/cs_test_email_789'
        mock_session.amount_total = 2999
        mock_session.currency = 'usd'
        mock_session_create.return_value = mock_session

        payload = {**self.valid_payload, 'customer_email': 'buyer@example.com'}

        response = self.client.post(
            '/api/payments/create-checkout-session/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        payment = Payment.objects.filter(stripe_session_id='cs_test_email_789').first()
        self.assertEqual(payment.customer_email, 'buyer@example.com')

        call_kwargs = mock_session_create.call_args[1]
        self.assertEqual(call_kwargs['customer_email'], 'buyer@example.com')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_create_session_product_not_found(self):
        """Non-existent product returns 404."""
        payload = {
            **self.valid_payload,
            'items': [{'product_id': 99999, 'quantity': 1}],
        }
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_session_partial_not_found(self):
        """If one of multiple items not found, returns 404."""
        payload = {
            'items': [
                {'product_id': self.product.pk, 'quantity': 1},
                {'product_id': 99999, 'quantity': 1},
            ],
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_session_product_inactive(self):
        """Inactive product returns 404."""
        self.product.is_active = False
        self.product.save()
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_session_product_not_synced(self):
        """Product without stripe_price_id returns 400."""
        self.product.stripe_price_id = None
        self.product.save()
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not synced', response.data['error'].lower())

    def test_create_session_empty_items(self):
        """Empty items list returns 400."""
        payload = {
            **self.valid_payload,
            'items': [],
        }
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_session_invalid_data(self):
        """Invalid payload returns 400."""
        response = self.client.post(
            '/api/payments/create-checkout-session/',
            {'items': 'invalid'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
