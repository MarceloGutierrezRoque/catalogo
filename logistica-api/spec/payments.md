# Spec: payments

## Resumen

Módulo de pagos vía Stripe Checkout. Permite crear sesiones de pago para productos desde la API y recibir notificaciones webhook de Stripe para actualizar el estado de los pagos.

**App:** `apps.payments`
**Tabla:** `payments_payments`

---

## 1. Modelo

### 1.1 Payment

Hereda de `BaseModel` (`is_active`, `created_at`, `updated_at`).

| Campo                  | Tipo            | Constraints                              |
|------------------------|-----------------|------------------------------------------|
| id                     | INTEGER PK      | Auto                                     |
| product                | FK → Product    | NOT NULL, on_delete=PROTECT              |
| stripe_session_id      | VARCHAR(255)    | NOT NULL, unique                         |
| stripe_payment_intent_id | VARCHAR(255)  | NULL                                     |
| amount                 | INTEGER         | NOT NULL (centavos, ej: 1299 → $12.99)   |
| currency               | VARCHAR(3)      | NOT NULL, default='usd'                  |
| status                 | VARCHAR(20)     | NOT NULL, choices: pending / completed / failed / refunded, default='pending' |
| customer_email         | VARCHAR(254)    | NULL                                     |
| is_active              | BOOLEAN         | default=True                             |
| created_at             | DATETIME        | auto_now_add=True                        |
| updated_at             | DATETIME        | auto_now=True                            |

```python
# apps/payments/models.py

from django.db import models
from apps.base.models import BaseModel


class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='payments',
    )
    stripe_session_id = models.CharField(max_length=255, unique=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    amount = models.IntegerField(help_text='Amount in cents (e.g., 1299 = $12.99)')
    currency = models.CharField(max_length=3, default='usd')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    customer_email = models.EmailField(max_length=254, blank=True, null=True)

    class Meta:
        db_table = 'payments_payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.stripe_session_id} — {self.status} ({self.amount} {self.currency})'
```

### 1.2 Modificación a `Product` (apps.products.models)

Agregar dos campos a `Product`:

| Campo              | Tipo          | Constraints              |
|--------------------|---------------|--------------------------|
| stripe_product_id  | VARCHAR(255)  | NULL, blank=True          |
| stripe_price_id    | VARCHAR(255)  | NULL, blank=True          |

```python
# En apps/products/models.py, agregar dentro de Product:

stripe_product_id = models.CharField(max_length=255, blank=True, null=True)
stripe_price_id = models.CharField(max_length=255, blank=True, null=True)
```

Estos campos son nullable porque se llenan bajo demanda (vía management command o al sincronizar con Stripe).

---

## 2. Serializers

### 2.1 PaymentSerializer (ModelSerializer)

```python
# apps/payments/serializers.py

from rest_framework import serializers
from apps.payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'stripe_session_id', 'stripe_payment_intent_id',
                            'amount', 'currency', 'status', 'created_at', 'updated_at']
```

### 2.2 CreateCheckoutSessionSerializer (input validation)

```python
class CreateCheckoutSessionSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()
    customer_email = serializers.EmailField(required=False, allow_blank=True)
```

### 2.3 CheckoutSessionResponseSerializer (output)

```python
class CheckoutSessionResponseSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    session_url = serializers.URLField()
```

---

## 3. Vistas

### 3.1 PaymentViewSet (CRUD)

Acceso solo autenticado (staff). Solo lectura para listar/detallar pagos; la creación de pagos ocurre vía webhook.

```python
# apps/payments/views.py

from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer


class PaymentViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    List / Retrieve payments. Read-only for authenticated users.
    """
    queryset = Payment.objects.select_related('product').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
```

### 3.2 CreateCheckoutSessionView

APIView sin autenticación. POST pública para crear una Checkout Session de Stripe.

```python
# apps/payments/views.py (continuación)

import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from apps.payments.serializers import (
    CreateCheckoutSessionSerializer,
    CheckoutSessionResponseSerializer,
)
from apps.products.models import Product


class CreateCheckoutSessionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        success_url = serializer.validated_data['success_url']
        cancel_url = serializer.validated_data['cancel_url']
        customer_email = serializer.validated_data.get('customer_email', '')

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found or inactive'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validar que el producto tenga stripe_price_id
        if not product.stripe_price_id:
            return Response(
                {'error': 'Product not synced to Stripe. Run sync_products_to_stripe first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        session_params = {
            'line_items': [{
                'price': product.stripe_price_id,
                'quantity': quantity,
            }],
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
        }

        if customer_email:
            session_params['customer_email'] = customer_email

        # NOTA: No incluir payment_method_types — dynamic payment methods (Stripe best practice)
        session = stripe.checkout.Session.create(**session_params)

        # Crear Payment local (pendiente)
        Payment.objects.create(
            product=product,
            stripe_session_id=session.id,
            amount=session.amount_total or 0,
            currency=session.currency or 'usd',
            customer_email=customer_email or None,
            status=Payment.Status.PENDING,
        )

        output = CheckoutSessionResponseSerializer({
            'session_id': session.id,
            'session_url': session.url,
        })
        return Response(output.data, status=status.HTTP_201_CREATED)
```

### 3.3 StripeWebhookView

CSRF exempt. Verifica firma del webhook, maneja `checkout.session.completed`.

```python
# apps/payments/views.py (continuación)

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']

            try:
                payment = Payment.objects.get(stripe_session_id=session['id'])
            except Payment.DoesNotExist:
                return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

            payment.status = Payment.Status.COMPLETED
            payment.stripe_payment_intent_id = session.get('payment_intent')
            payment.amount = session.get('amount_total', payment.amount)
            payment.currency = session.get('currency', payment.currency)
            payment.customer_email = session.get('customer_details', {}).get('email', payment.customer_email)
            payment.save()

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
```

---

## 4. URLs

```python
# apps/payments/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.payments.views import PaymentViewSet, CreateCheckoutSessionView, StripeWebhookView

router = DefaultRouter()
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('payments/create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('payments/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('', include(router.urls)),
]
```

En `config/urls.py` agregar:

```python
path('api/', include('apps.payments.urls')),
```

**Endpoints finales:**

| Método | URL                                          | Acción                | Auth     |
|--------|----------------------------------------------|-----------------------|----------|
| GET    | `/api/payments/`                             | Listar pagos          | JWT      |
| GET    | `/api/payments/{id}/`                        | Detalle pago          | JWT      |
| POST   | `/api/payments/create-checkout-session/`     | Crear sesión checkout | Público  |
| POST   | `/api/payments/webhook/`                     | Webhook Stripe        | Público* |

\* El webhook validará la firma criptográfica, no necesita auth por token.

---

## 5. Admin

```python
# apps/payments/admin.py

from django.contrib import admin
from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'amount', 'currency', 'status', 'customer_email', 'created_at', 'is_active']
    search_fields = ['stripe_session_id', 'stripe_payment_intent_id', 'customer_email', 'product__name']
    list_filter = ['status', 'currency', 'is_active', 'created_at']
    readonly_fields = ['stripe_session_id', 'stripe_payment_intent_id', 'amount', 'currency', 'created_at', 'updated_at']
```

---

## 6. Configuración

### 6.1 apps.py

```python
# apps/payments/apps.py

from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    name = 'apps.payments'
    verbose_name = 'Payments'
```

### 6.2 Modificaciones a `config/settings.py`

```python
# 1. Agregar a INSTALLED_APPS:
INSTALLED_APPS = [
    # ...existing apps...
    'apps.payments',
]

# 2. Stripe settings (al final del archivo, antes de las configs de storage):
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
```

### 6.3 Variables de entorno (.env)

Agregar al archivo `.env` (no commiteado, o al `.env.example`):

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Nunca incluir valores reales en código fuente.**

---

## 7. Management Command: `sync_products_to_stripe`

### 7.1 Estructura

```
apps/payments/management/
├── __init__.py
└── commands/
    ├── __init__.py
    └── sync_products_to_stripe.py
```

### 7.2 Comportamiento

1. Obtener todos los productos activos (`Product.objects.filter(is_active=True)`)
2. Si hay menos de 5 productos, crear productos mock realistas en la BD:
   - Los mock products necesitan un `supplier` y `warehouse` existentes. Si no hay ninguno, se crean:
     - Supplier: "Stripe Mock Supplier"
     - Warehouse: "Stripe Mock Warehouse" con código "MOCK-001"
   - Productos mock a crear:

     | Name                    | SKU              | Unit Price | Description                                      |
     |-------------------------|------------------|------------|--------------------------------------------------|
     | Laptop ProBook 15"      | LAP-PRO-15       | 1299.99    | Laptop profesional 15.6" FHD, 16GB RAM, 512GB SSD |
     | Monitor 27" 4K UHD      | MON-4K-27        | 449.99     | Monitor IPS 27" 4K UHD, HDR10, USB-C              |
     | Teclado Mecánico RGB    | TEC-MEC-RGB      | 89.99      | Teclado mecánico hot-swap, RGB per-key, switches Cherry MX |
     | Mouse Inalámbrico MX    | MOUSE-MX-WL      | 59.99      | Mouse inalámbrico ergonómico, sensor 4000 DPI      |
     | Hub USB-C 7-en-1        | HUB-USBC-7       | 34.99      | Hub USB-C con HDMI 4K, 2xUSB-A, SD, PD 100W       |

3. Para cada producto (existentes + nuevos):
   - Si `stripe_product_id` existe, llamar `stripe.Product.modify()` para actualizar nombre/descripción
   - Si no existe, llamar `stripe.Product.create(name=..., description=...)`
   - Crear un `stripe.Price.create(product=stripe_product_id, unit_amount=<cents>, currency='usd')`
   - Si `stripe_price_id` existe, crear un nuevo Price (Stripe no permite modificar precios; se archivan automáticamente)
   - Guardar `stripe_product_id` y `stripe_price_id` en el modelo Product
4. Output: reportar cuántos productos se crearon en BD y cuántos se sincronizaron a Stripe

### 7.3 Código esquemático

```python
# apps/payments/management/commands/sync_products_to_stripe.py

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
```

---

## 8. Tests

### 8.1 Estructura

```
apps/payments/tests/
├── __init__.py
├── test_serializers.py
├── test_views.py
├── test_webhook.py
└── test_commands.py
```

### 8.2 Patrón de tests

Seguir el patrón de `apps.products.tests.test_views.py`:

- `APITestCase` con `APIClient`
- Crear usuario de autenticación y token vía `/api/auth/login/`
- Happy path, unhappy path, edge cases
- Para el webhook, mockear `stripe.Webhook.construct_event`
- Para el checkout, mockear `stripe.checkout.Session.create`
- Para el comando, mockear `stripe.Product.create` y `stripe.Price.create`

### 8.3 Test checklist

**test_serializers.py:**
- `CreateCheckoutSessionSerializer.valida_datos_correctos`
- `CreateCheckoutSessionSerializer.rechaza_cantidad_cero`
- `CreateCheckoutSessionSerializer.rechaza_url_invalida`
- `CreateCheckoutSessionSerializer.rechaza_product_id_faltante`

**test_views.py (PaymentViewSet):**
- `test_list_authenticated` — 200
- `test_list_unauthenticated` — 401
- `test_retrieve_authenticated` — 200
- `test_retrieve_not_found` — 404

**test_checkout.py (CreateCheckoutSessionView):**
- `test_create_session_success` — mock `stripe.checkout.Session.create`, verifica 201 + session_id
- `test_create_session_product_not_found` — 404
- `test_create_session_product_not_synced` — 400 (sin stripe_price_id)
- `test_create_session_with_email` — verifica que pasa customer_email

**test_webhook.py:**
- `test_webhook_completed` — mock `construct_event` con evento `checkout.session.completed`, verifica status=COMPLETED
- `test_webhook_invalid_payload` — ValueError → 400
- `test_webhook_invalid_signature` — SignatureVerificationError → 400
- `test_webhook_session_not_found` — session id no existe en BD → 404

**test_commands.py:**
- `test_sync_creates_mock_products` — menos de 5 productos, verifica que se crean 5 mock
- `test_sync_creates_stripe_products` — mock `stripe.Product.create`, verifica que se guarda stripe_product_id
- `test_sync_idempotent` — ejecutar dos veces, no duplica productos ni Stripe objects

---

## 9. Instalación y Setup

### 9.1 Nuevas dependencias

Agregar a `requirements.txt`:

```
stripe>=9.0.0,<10.0.0
```

### 9.2 Pasos de setup

1. `source .venv/bin/activate && pip install -r requirements.txt`
2. Agregar variables `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` al `.env`
3. Agregar `'apps.payments'` a `INSTALLED_APPS`
4. Agregar `path('api/', include('apps.payments.urls'))` a `config/urls.py`
5. Agregar campos `stripe_product_id` y `stripe_price_id` al modelo `Product`
6. `python manage.py makemigrations payments products`
7. `python manage.py migrate`
8. `python manage.py sync_products_to_stripe`
9. Ejecutar tests: `python manage.py test apps.payments`

### 9.3 Stripe CLI (desarrollo local)

Para probar webhooks localmente:

```bash
stripe listen --forward-to localhost:8000/api/payments/webhook/
```

Esto genera un `STRIPE_WEBHOOK_SECRET` (whsec_...) que se coloca en `.env`.

---

## 10. Checklist de Seguridad

Basado en `stripe-best-practices` skill:

| # | Requisito | Estado |
|---|-----------|--------|
| 1 | **Claves en .env, no en código** — `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` vía `decouple.config()` | ✅ |
| 2 | **No loguear claves** — nunca imprimir las claves en logs o responses de error | ✅ |
| 3 | **Webhook signature verification** — `stripe.Webhook.construct_event()` con `STRIPE_WEBHOOK_SECRET` | ✅ |
| 4 | **No incluir `payment_method_types`** — Checkout Session sin `payment_method_types` para dynamic payment methods | ✅ |
| 5 | **`on_delete=PROTECT`** — Payment FK a Product usa PROTECT, no CASCADE | ✅ |
| 6 | **Modo `payment`** — Checkout Session en mode='payment' (one-time), no subscription | ✅ |
| 7 | **Webhook csrf_exempt + AllowAny** — necesario porque Stripe no envía token CSRF ni JWT | ✅ |
| 8 | **Checkout público** — `AllowAny` en CreateCheckoutSessionView (no requiere autenticación) | ✅ |
| 9 | **Montos en cents** — `amount` almacenado como IntegerField en cents, consistente con Stripe | ✅ |
| 10 | **Idempotencia webhook** — si Stripe reenvía el mismo evento, buscar Payment por `stripe_session_id` y actualizar en lugar de duplicar | ✅ (get + save en lugar de create) |
| 11 | **Metadata opcional** — Stripe Product incluye `metadata` con `product_id` y `sku` para trazabilidad | ✅ |
| 12 | **Validación de entrada** — `CreateCheckoutSessionSerializer` valida tipos, rangos y formatos | ✅ |

---

## 11. Orden de Implementación

1. Crear app `apps/payments` con `python manage.py startapp payments apps/payments`
2. Definir modelo `Payment` en `models.py`
3. Agregar campos `stripe_product_id` y `stripe_price_id` a `apps/products/models.py`
4. Crear serializers en `serializers.py`
5. Crear vistas en `views.py` (PaymentViewSet, CreateCheckoutSessionView, StripeWebhookView)
6. Crear `urls.py` y registrar en `config/urls.py`
7. Configurar `apps.py` y registrar en `INSTALLED_APPS`
8. Configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en `settings.py`
9. Agregar `stripe` a `requirements.txt`
10. Crear management command `sync_products_to_stripe`
11. Crear archivos de test
12. Ejecutar `makemigrations` y `migrate`
13. Ejecutar `sync_products_to_stripe`
14. Ejecutar suite de tests
