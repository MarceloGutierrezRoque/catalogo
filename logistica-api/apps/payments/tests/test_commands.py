from unittest.mock import patch, MagicMock
from io import StringIO
from django.test import TestCase
from django.core.management import call_command

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


def _make_mock_product(product_id='prod_mock', price_id='price_mock'):
    """Helper to create a properly configured MagicMock for Stripe Product.create return value."""
    mock = MagicMock()
    mock.id = product_id
    return mock


def _make_mock_price(price_id='price_mock'):
    """Helper to create a properly configured MagicMock for Stripe Price.create return value."""
    mock = MagicMock()
    mock.id = price_id
    return mock


class SyncProductsToStripeCommandTests(TestCase):
    """Tests for sync_products_to_stripe management command."""

    def setUp(self):
        self.supplier = Supplier.objects.create(name='Existing Supplier')
        self.warehouse = Warehouse.objects.create(name='Existing Warehouse', code='EX-001')
        self.product = Product.objects.create(
            name='Existing Product',
            sku='EXIST-001',
            unit_price=99.99,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    @patch('stripe.Product.create')
    @patch('stripe.Price.create')
    def test_sync_creates_mock_products(self, mock_price_create, mock_product_create):
        """Less than 5 products creates 5 mock products."""
        mock_product_create.return_value = _make_mock_product('prod_mock_new')
        mock_price_create.return_value = _make_mock_price('price_mock_new')

        out = StringIO()
        call_command('sync_products_to_stripe', stdout=out)

        # 1 existing + 5 mock = 6 total
        self.assertEqual(Product.objects.filter(is_active=True).count(), 6)

        # Verify mock products were created
        self.assertTrue(Product.objects.filter(sku='LAP-PRO-15').exists())
        self.assertTrue(Product.objects.filter(sku='MON-4K-27').exists())
        self.assertTrue(Product.objects.filter(sku='TEC-MEC-RGB').exists())
        self.assertTrue(Product.objects.filter(sku='MOUSE-MX-WL').exists())
        self.assertTrue(Product.objects.filter(sku='HUB-USBC-7').exists())

    @patch('stripe.Product.create')
    @patch('stripe.Price.create')
    def test_sync_creates_stripe_products(self, mock_price_create, mock_product_create):
        """Products get stripe_product_id and stripe_price_id saved."""
        mock_product_create.return_value = _make_mock_product('prod_stripe_001')
        mock_price_create.return_value = _make_mock_price('price_stripe_001')

        call_command('sync_products_to_stripe')

        self.product.refresh_from_db()
        self.assertEqual(self.product.stripe_product_id, 'prod_stripe_001')
        self.assertEqual(self.product.stripe_price_id, 'price_stripe_001')

    @patch('stripe.Product.modify')
    @patch('stripe.Product.create')
    @patch('stripe.Price.create')
    def test_sync_idempotent(self, mock_price_create, mock_product_create, mock_product_modify):
        """Running twice does not duplicate products or Stripe objects."""
        mock_product_create.return_value = _make_mock_product('prod_idempotent')
        mock_price_create.return_value = _make_mock_price('price_idempotent')

        # First run: creates 5 mock + syncs 1 existing = 6 products
        call_command('sync_products_to_stripe')
        self.assertEqual(Product.objects.filter(is_active=True).count(), 6)

        # Verify all products have stripe IDs after first run
        for p in Product.objects.filter(is_active=True):
            self.assertIsNotNone(p.stripe_product_id)

        # Reset mocks for second run
        mock_product_create.reset_mock()
        mock_product_modify.reset_mock()
        mock_price_create.reset_mock()

        # Second run: should modify existing products, not create new ones
        call_command('sync_products_to_stripe')
        self.assertEqual(Product.objects.filter(is_active=True).count(), 6)

        # Second run should call modify for each product (not create)
        self.assertEqual(mock_product_create.call_count, 0)
        self.assertGreater(mock_product_modify.call_count, 0)

    @patch('stripe.Product.modify')
    @patch('stripe.Product.create')
    @patch('stripe.Price.create')
    def test_sync_existing_stripe_product_modifies(
        self, mock_price_create, mock_product_create, mock_product_modify
    ):
        """Product with stripe_product_id uses modify instead of create."""
        self.product.stripe_product_id = 'prod_existing'
        self.product.save()

        mock_product_create.return_value = _make_mock_product('prod_mock_for_new')
        mock_price_create.return_value = _make_mock_price('price_existing_new')

        call_command('sync_products_to_stripe')

        # The existing product should have been modified
        mock_product_modify.assert_called_once_with(
            'prod_existing',
            name=self.product.name,
            description=self.product.description or '',
        )

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    @patch('stripe.Product.create')
    @patch('stripe.Price.create')
    def test_sync_inactive_products_skipped(self, mock_price_create, mock_product_create):
        """Inactive products are skipped and only mock products get synced."""
        self.product.is_active = False
        self.product.save()

        mock_product_create.return_value = _make_mock_product('prod_inactive')
        mock_price_create.return_value = _make_mock_price('price_inactive')

        out = StringIO()
        call_command('sync_products_to_stripe', stdout=out)

        # Only mock products exist (5) — inactive product is skipped
        self.assertEqual(Product.objects.filter(is_active=True).count(), 5)

        # stripe.Product.create should be called for each mock product (5 times)
        self.assertEqual(mock_product_create.call_count, 5)
