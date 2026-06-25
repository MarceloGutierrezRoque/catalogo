from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.payments.models import Payment
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class StripeWebhookViewTests(APITestCase):
    """Tests for StripeWebhookView."""

    def setUp(self):
        self.client = APIClient()
        self.supplier = Supplier.objects.create(name='Test Supplier')
        self.warehouse = Warehouse.objects.create(name='Test Warehouse', code='TW-003')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TST-003',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.payment = Payment.objects.create(
            product=self.product,
            stripe_session_id='cs_webhook_test',
            amount=1999,
            currency='usd',
            status=Payment.Status.PENDING,
        )
        self.url = '/api/payments/webhook/'

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    @patch('stripe.Webhook.construct_event')
    def test_webhook_completed(self, mock_construct_event):
        """checkout.session.completed updates payment to COMPLETED."""
        mock_event = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_webhook_test',
                    'payment_intent': 'pi_test_123',
                    'amount_total': 1999,
                    'currency': 'usd',
                    'customer_details': {
                        'email': 'customer@example.com',
                    },
                },
            },
        }
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.Status.COMPLETED)
        self.assertEqual(self.payment.stripe_payment_intent_id, 'pi_test_123')
        self.assertEqual(self.payment.customer_email, 'customer@example.com')

    @patch('stripe.Webhook.construct_event')
    def test_webhook_unknown_event_type(self, mock_construct_event):
        """Unknown event types are accepted (no-op) and return 200."""
        mock_event = {
            'type': 'unknown.event.type',
            'data': {'object': {'id': 'cs_unknown'}},
        }
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    @patch('stripe.Webhook.construct_event')
    def test_webhook_multiple_payments_updated(self, mock_construct_event):
        """Multiple payments with same session_id all get updated."""
        Payment.objects.create(
            product=self.product,
            stripe_session_id='cs_webhook_test',
            amount=2999,
            currency='usd',
            status=Payment.Status.PENDING,
        )

        mock_event = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_webhook_test',
                    'payment_intent': 'pi_multi',
                    'amount_total': 4998,
                    'currency': 'usd',
                    'customer_details': {'email': 'multi@example.com'},
                },
            },
        }
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        all_completed = Payment.objects.filter(
            stripe_session_id='cs_webhook_test', status=Payment.Status.COMPLETED
        )
        self.assertEqual(all_completed.count(), 2)

    @patch('stripe.Webhook.construct_event')
    def test_webhook_session_not_found(self, mock_construct_event):
        """Session id not in DB returns 404."""
        mock_event = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_nonexistent',
                    'payment_intent': 'pi_test_999',
                    'amount_total': 5000,
                    'currency': 'usd',
                    'customer_details': {'email': None},
                },
            },
        }
        mock_construct_event.return_value = mock_event

        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Payment not found', response.data['error'])

    @patch('stripe.Webhook.construct_event')
    def test_webhook_invalid_payload(self, mock_construct_event):
        """ValueError from construct_event returns 400."""
        mock_construct_event.side_effect = ValueError('Invalid payload')

        response = self.client.post(
            self.url,
            data='invalid-json',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid payload', response.data['error'])

    @patch('stripe.Webhook.construct_event')
    def test_webhook_invalid_signature(self, mock_construct_event):
        """SignatureVerificationError returns 400."""
        import stripe
        mock_construct_event.side_effect = stripe.error.SignatureVerificationError(
            'Invalid signature', 'test_sig'
        )

        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='bad_sig',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid signature', response.data['error'])

    def test_webhook_no_signature_header(self):
        """Missing Stripe signature header returns 400."""
        response = self.client.post(
            self.url,
            data='{}',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
