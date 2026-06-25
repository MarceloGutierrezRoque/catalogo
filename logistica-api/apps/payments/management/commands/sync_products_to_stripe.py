import stripe
from django.conf import settings
from django.core.management.base import BaseCommand
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


MOCK_PRODUCTS = [
    {
        'name': 'Laptop ProBook 15"',
        'sku': 'LAP-PRO-15',
        'unit_price': 1299.99,
        'description': 'Laptop profesional 15.6" FHD, 16GB RAM, 512GB SSD',
        'category': 'Laptops',
        'brand': 'ProBook',
        'stock_quantity': 10,
    },
    {
        'name': 'Monitor 27" 4K UHD',
        'sku': 'MON-4K-27',
        'unit_price': 449.99,
        'description': 'Monitor IPS 27" 4K UHD, HDR10, USB-C',
        'category': 'Monitors',
        'brand': 'ViewPro',
        'stock_quantity': 15,
    },
    {
        'name': 'Teclado Mecánico RGB',
        'sku': 'TEC-MEC-RGB',
        'unit_price': 89.99,
        'description': 'Teclado mecánico hot-swap, RGB per-key, switches Cherry MX',
        'category': 'Peripherals',
        'brand': 'KeyTech',
        'stock_quantity': 30,
    },
    {
        'name': 'Mouse Inalámbrico MX',
        'sku': 'MOUSE-MX-WL',
        'unit_price': 59.99,
        'description': 'Mouse inalámbrico ergonómico, sensor 4000 DPI',
        'category': 'Peripherals',
        'brand': 'ClickPro',
        'stock_quantity': 25,
    },
    {
        'name': 'Hub USB-C 7-en-1',
        'sku': 'HUB-USBC-7',
        'unit_price': 34.99,
        'description': 'Hub USB-C con HDMI 4K, 2xUSB-A, SD, PD 100W',
        'category': 'Accessories',
        'brand': 'PortHub',
        'stock_quantity': 50,
    },
]


class Command(BaseCommand):
    help = 'Sync all active products to Stripe Catalog and create Prices'

    def handle(self, *args, **options):
        stripe.api_key = settings.STRIPE_SECRET_KEY

        existing_count = Product.objects.filter(is_active=True).count()

        if existing_count < 5:
            self.stdout.write(f'Only {existing_count} products found. Creating mock products...')
            self._create_mock_products()

        products = Product.objects.filter(is_active=True)
        synced = 0

        for product in products:
            self._sync_product_to_stripe(product)
            synced += 1

        self.stdout.write(self.style.SUCCESS(
            f'Successfully synced {synced} products to Stripe.'
        ))

    def _create_mock_products(self):
        supplier, _ = Supplier.objects.get_or_create(
            name='Stripe Mock Supplier',
            defaults={
                'contact_name': 'Mock Contact',
                'email': 'mock@supplier.local',
                'phone': '+0000000000',
            },
        )
        warehouse, _ = Warehouse.objects.get_or_create(
            code='MOCK-001',
            defaults={
                'name': 'Stripe Mock Warehouse',
                'city': 'Mock City',
                'country': 'Mock Country',
            },
        )

        for mock in MOCK_PRODUCTS:
            Product.objects.get_or_create(
                sku=mock['sku'],
                defaults={
                    'name': mock['name'],
                    'unit_price': mock['unit_price'],
                    'description': mock['description'],
                    'category': mock['category'],
                    'brand': mock['brand'],
                    'stock_quantity': mock['stock_quantity'],
                    'supplier': supplier,
                    'warehouse': warehouse,
                },
            )

    def _sync_product_to_stripe(self, product):
        stripe_product_id = product.stripe_product_id

        if stripe_product_id:
            stripe.Product.modify(
                stripe_product_id,
                name=product.name,
                description=product.description or '',
            )
        else:
            stripe_product = stripe.Product.create(
                name=product.name,
                description=product.description or '',
                metadata={
                    'product_id': str(product.id),
                    'sku': product.sku,
                },
            )
            stripe_product_id = stripe_product.id
            product.stripe_product_id = stripe_product_id

        unit_amount = int(product.unit_price * 100) if product.unit_price else 0

        price = stripe.Price.create(
            product=stripe_product_id,
            unit_amount=unit_amount,
            currency='usd',
        )
        product.stripe_price_id = price.id
        product.save(update_fields=['stripe_product_id', 'stripe_price_id'])
