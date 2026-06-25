# Spec: orders (+ order_items)

## Descripción

Unidad central de negocio. Clientes llenan formulario público → crean pedido con peluches seleccionados → admin gestiona estado.

Este spec cubre **dos apps acopladas** (tal como indica la arquitectura Phase 3):
- **`order_items`** — modelo `OrderItem` con precio congelado, debe implementarse primero.
- **`orders`** — modelo `Order`, serializer con items anidados, vista pública de creación + vista admin de gestión.

**Dependencia:** `plushies` ya implementado (modelo `Plushie` con `price`, `stock`, `is_active`, `is_deleted`).

---

## Modelo 1 — `order_items_orderitem`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `order` | ForeignKey → `orders_order` | NOT NULL, CASCADE | Pedido padre. CASCADE: si se elimina pedido, se eliminan items |
| `plushie` | ForeignKey → `plushies_plushie` | NOT NULL, PROTECT | Peluche seleccionado. PROTECT: no eliminar peluche con pedidos |
| `quantity` | PositiveIntegerField | NOT NULL | Cantidad solicitada (mínimo 1) |
| `unit_price` | DecimalField(10,2) | NOT NULL | Precio del peluche congelado al crear el pedido |

**Meta:** `verbose_name_plural = "order items"`

---

## Modelo 2 — `orders_order`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `customer_name` | CharField(200) | NOT NULL | Nombre del cliente |
| `customer_email` | EmailField | NOT NULL | Correo de contacto |
| `customer_phone` | CharField(20) | NOT NULL | Teléfono de contacto |
| `observations` | TextField | NULL, blank=True | Notas adicionales del cliente |
| `status` | CharField(20) | NOT NULL, default='pending' | `pending` / `contacted` / `closed` / `cancelled` |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

**Choices de status:**
```python
class OrderStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    CONTACTED = 'contacted', 'Contacted'
    CLOSED = 'closed', 'Closed'
    CANCELLED = 'cancelled', 'Cancelled'
```

**Transiciones válidas:**
```
pending → contacted
contacted → closed
contacted → cancelled
```
Cualquier otra transición (ej: pending → closed, closed → pending) debe ser rechazada con error de validación.

**Meta:** `ordering = ['-created_at']`, `verbose_name_plural = "orders"`

---

## Endpoints

### Público (AllowAny)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/orders/` | Crear pedido + items anidados |

### Admin (JWT required)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/orders/` | Lista todos los pedidos |
| GET | `/api/admin/orders/{id}/` | Detalle del pedido + items |
| PATCH | `/api/admin/orders/{id}/` | Actualizar estado (status) del pedido |

---

## Validaciones de negocio

1. **Stock suficiente:** Cada `OrderItem.quantity` debe ser <= `Plushie.stock` al momento de crear el pedido.
2. **Plushie activo:** Cada `plushie_id` debe pertenecer a un plushie con `is_active=True` y `is_deleted=False`.
3. **Precio congelado:** `OrderItem.unit_price` = `Plushie.price` en el momento de creación. No se actualiza si el precio del plushie cambia después.
4. **Transiciones de estado:** Solo las rutas definidas arriba son válidas. Rechazar con `400 Bad Request` y mensaje claro.
5. **Items requeridos:** La orden debe contener al menos 1 item (`len(items) >= 1`).
6. **Cantidad positiva:** `quantity` debe ser >= 1.

---

## Archivos a implementar

### `apps/order_items/models.py`

```python
from django.db import models


class OrderItem(models.Model):
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='items'
    )
    plushie = models.ForeignKey(
        'plushies.Plushie',
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = 'order items'

    def __str__(self):
        return f'{self.quantity}x {self.plushie.name} @ {self.unit_price}'
```

**Notas:**
- `related_name='items'` en `order` permite acceder desde Order como `order.items.all()`.
- `related_name='order_items'` en `plushie` permite acceder desde Plushie como `plushie.order_items.all()`.
- `PROTECT` evita eliminar un peluche que tenga pedidos asociados.

---

### `apps/orders/models.py`

```python
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    CONTACTED = 'contacted', 'Contacted'
    CLOSED = 'closed', 'Closed'
    CANCELLED = 'cancelled', 'Cancelled'


class Order(models.Model):
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    observations = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'orders'

    def __str__(self):
        return f'Order #{self.id} — {self.customer_name} ({self.status})'

    def can_transition_to(self, new_status: str) -> bool:
        """Valida transiciones de estado permitidas."""
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.CONTACTED],
            OrderStatus.CONTACTED: [OrderStatus.CLOSED, OrderStatus.CANCELLED],
            OrderStatus.CLOSED: [],     # Terminal
            OrderStatus.CANCELLED: [],  # Terminal
        }
        return new_status in valid_transitions.get(self.status, [])
```

---

### `apps/order_items/serializers.py`

```python
from rest_framework import serializers
from apps.order_items.models import OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    plushie_id = serializers.IntegerField(write_only=True)
    plushie_name = serializers.CharField(source='plushie.name', read_only=True)
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'plushie_id', 'plushie_name',
            'quantity', 'unit_price'
        ]
```

**Notas:**
- `plushie_id` es write-only (se recibe del cliente).
- `plushie_name` y `unit_price` son read-only (se devuelven en respuesta).
- `unit_price` se escribe manualmente en la creación de Order (no lo envía el cliente).

---

### `apps/orders/serializers.py`

```python
from rest_framework import serializers
from apps.orders.models import Order, OrderStatus
from apps.order_items.models import OrderItem
from apps.order_items.serializers import OrderItemSerializer
from apps.plushies.models import Plushie


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer público — solo creación de orden con items anidados."""
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_items(self, items_data):
        """Valida stock, plushie activo, y cantidad mínima."""
        if not items_data:
            raise serializers.ValidationError(
                'Debe incluir al menos un item en el pedido.'
            )

        for item in items_data:
            plushie_id = item.get('plushie_id')
            quantity = item.get('quantity', 0)

            try:
                plushie = Plushie.objects.get(
                    id=plushie_id, is_active=True, is_deleted=False
                )
            except Plushie.DoesNotExist:
                raise serializers.ValidationError(
                    f'Plushie con id {plushie_id} no existe o no está disponible.'
                )

            if quantity < 1:
                raise serializers.ValidationError(
                    f'La cantidad para plushie {plushie_id} debe ser al menos 1.'
                )

            if quantity > plushie.stock:
                raise serializers.ValidationError(
                    f'Stock insuficiente para "{plushie.name}". '
                    f'Disponible: {plushie.stock}, solicitado: {quantity}.'
                )

        return items_data

    def create(self, validated_data):
        """Crea Order + OrderItems con precio congelado."""
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            plushie = Plushie.objects.get(
                id=item_data['plushie_id'],
                is_active=True,
                is_deleted=False
            )
            OrderItem.objects.create(
                order=order,
                plushie=plushie,
                quantity=item_data['quantity'],
                unit_price=plushie.price  # Congelado
            )

        return order


class OrderAdminListSerializer(serializers.ModelSerializer):
    """Serializer admin — lista de pedidos (sin items anidados)."""
    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'created_at', 'updated_at'
        ]


class OrderAdminDetailSerializer(serializers.ModelSerializer):
    """Serializer admin — detalle de pedido con items anidados."""
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'items', 'created_at', 'updated_at'
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer admin — solo actualización de status."""
    class Meta:
        model = Order
        fields = ['status']

    def validate_status(self, value):
        order = self.instance
        if order and not order.can_transition_to(value):
            raise serializers.ValidationError(
                f'Transición inválida: de "{order.status}" a "{value}". '
                f'Transiciones permitidas: '
                f'{self._valid_transitions_desc(order.status)}'
            )
        return value

    @staticmethod
    def _valid_transitions_desc(current_status):
        transitions = {
            OrderStatus.PENDING: ['contacted'],
            OrderStatus.CONTACTED: ['closed', 'cancelled'],
            OrderStatus.CLOSED: ['(ninguna — terminal)'],
            OrderStatus.CANCELLED: ['(ninguna — terminal)'],
        }
        allowed = transitions.get(current_status, [])
        return ', '.join(allowed) if allowed else 'ninguna'
```

---

### `apps/orders/views.py`

```python
from rest_framework import generics, viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Order
from apps.orders.serializers import (
    OrderCreateSerializer,
    OrderAdminListSerializer,
    OrderAdminDetailSerializer,
    OrderStatusUpdateSerializer,
)


class OrderCreateView(generics.CreateAPIView):
    """Público — POST /api/orders/ — crea pedido + items anidados."""
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]


class OrderAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin — GET/PATCH /api/admin/orders/."""
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderAdminDetailSerializer
        if self.action == 'partial_update':
            return OrderStatusUpdateSerializer
        return OrderAdminListSerializer

    def partial_update(self, request, *args, **kwargs):
        """PATCH — solo actualiza status, valida transición."""
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderAdminDetailSerializer(instance).data)
```

**Notas:**
- `OrderCreateView` es `CreateAPIView` porque el público solo crea, no lista/edita.
- `OrderAdminViewSet` hereda de `ReadOnlyModelViewSet` pero agregamos `partial_update` manual.
- `partial_update` devuelve el detalle completo del pedido después de actualizar status.

---

### `apps/order_items/urls.py`

```python
# Este archivo puede permanecer vacío.
# order_items no tiene endpoints propios — se accede anidado desde orders.
```

---

### `apps/orders/urls.py`

```python
from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.orders.views import OrderCreateView, OrderAdminViewSet

urlpatterns = [
    path('orders/', OrderCreateView.as_view(), name='order-create'),
]

admin_router = DefaultRouter()
admin_router.register(
    r'admin/orders', OrderAdminViewSet, basename='order-admin'
)

urlpatterns += admin_router.urls
```

---

### `config/urls.py`

Agregar la línea para incluir `orders.urls`:

```python
# Después de las otras includes:
path('api/', include('apps.orders.urls')),
```

---

### `apps/order_items/admin.py`

```python
from django.contrib import admin
from apps.order_items.models import OrderItem


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'plushie', 'quantity', 'unit_price']
    list_filter = ['order__status']
```

---

### `apps/orders/admin.py`

```python
from django.contrib import admin
from apps.orders.models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'customer_name', 'customer_email',
        'customer_phone', 'status', 'created_at'
    ]
    list_filter = ['status']
    search_fields = ['customer_name', 'customer_email', 'customer_phone']
    readonly_fields = ['created_at', 'updated_at']
```

---

### `apps/orders/tests.py`

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.plushies.models import Plushie
from apps.orders.models import Order, OrderStatus


def get_jwt_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class OrderPublicTests(TestCase):
    """Pruebas para POST /api/orders/ (público, AllowAny)."""

    def setUp(self):
        self.client = APIClient()
        self.plushie = Plushie.objects.create(
            name='Osito', price=25.00, stock=10,
            is_active=True, is_deleted=False
        )
        self.valid_payload = {
            'customer_name': 'Juan Pérez',
            'customer_email': 'juan@example.com',
            'customer_phone': '555-0100',
            'observations': 'Entregar antes de Navidad',
            'items': [
                {'plushie_id': self.plushie.id, 'quantity': 2}
            ]
        }

    def test_create_order_without_token(self):
        """POST /api/orders/ sin token → 201 (AllowAny)."""
        response = self.client.post('/api/orders/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

    def test_create_order_returns_items_with_frozen_price(self):
        """Verifica que unit_price sea el precio del plushie al crearse."""
        response = self.client.post('/api/orders/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.first()
        item = order.items.first()
        self.assertEqual(item.unit_price, 25.00)
        self.assertEqual(item.quantity, 2)

    def test_create_order_with_inactive_plushie_fails(self):
        """Plushie inactivo debe ser rechazado."""
        self.plushie.is_active = False
        self.plushie.save()
        response = self.client.post('/api/orders/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_with_insufficient_stock_fails(self):
        """Stock insuficiente debe ser rechazado."""
        payload = self.valid_payload.copy()
        payload['items'] = [{'plushie_id': self.plushie.id, 'quantity': 999}]
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_without_items_fails(self):
        """Pedido sin items debe ser rechazado."""
        payload = self.valid_payload.copy()
        payload['items'] = []
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_default_status_is_pending(self):
        """Nuevo pedido debe tener status 'pending'."""
        response = self.client.post('/api/orders/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')


class OrderAdminTests(TestCase):
    """Pruebas para /api/admin/orders/ (JWT required)."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='test1234'
        )
        self.token = get_jwt_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.plushie = Plushie.objects.create(
            name='Osito', price=25.00, stock=10,
            is_active=True, is_deleted=False
        )
        self.order = Order.objects.create(
            customer_name='Juan', customer_email='j@t.com',
            customer_phone='555', status=OrderStatus.PENDING
        )

    def test_admin_list_orders_without_token_fails(self):
        """GET /api/admin/orders/ sin token → 401."""
        self.client.credentials()
        response = self.client.get('/api/admin/orders/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_list_orders_with_token_succeeds(self):
        """GET /api/admin/orders/ con token → 200."""
        response = self.client.get('/api/admin/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_detail_orders_with_items(self):
        """GET /api/admin/orders/{id}/ → incluye items."""
        from apps.order_items.models import OrderItem
        OrderItem.objects.create(
            order=self.order, plushie=self.plushie,
            quantity=2, unit_price=25.00
        )
        response = self.client.get(f'/api/admin/orders/{self.order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)
        self.assertEqual(len(response.data['items']), 1)

    def test_valid_status_transition_pending_to_contacted(self):
        """PATCH status: pending → contacted → 200."""
        response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'status': 'contacted'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatus.CONTACTED)

    def test_invalid_status_transition_pending_to_closed(self):
        """PATCH status: pending → closed → 400."""
        response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'status': 'closed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_status_transition_closed_to_pending(self):
        """PATCH status: closed → pending → 400 (terminal)."""
        self.order.status = OrderStatus.CLOSED
        self.order.save()
        response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'status': 'pending'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OrderFreezePriceTests(TestCase):
    """El precio congelado no cambia aunque el plushie cambie de precio."""

    def test_frozen_price_does_not_update(self):
        client = APIClient()
        plushie = Plushie.objects.create(
            name='Test', price=10.00, stock=5,
            is_active=True, is_deleted=False
        )
        payload = {
            'customer_name': 'Test',
            'customer_email': 't@t.com',
            'customer_phone': '555',
            'items': [{'plushie_id': plushie.id, 'quantity': 1}]
        }
        response = client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Cambiar precio del plushie
        plushie.price = 99.99
        plushie.save()

        # Verificar que el item conserva el precio original
        order = Order.objects.first()
        item = order.items.first()
        self.assertEqual(item.unit_price, 10.00)
        self.assertNotEqual(item.unit_price, plushie.price)
```

---

## Resumen de tareas de implementación

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/order_items/models.py` | Crear modelo `OrderItem` con FK a Order y Plushie |
| 2 | `apps/orders/models.py` | Crear modelo `Order` con `OrderStatus` enum y método `can_transition_to()` |
| 3 | `apps/order_items/serializers.py` | Crear `OrderItemSerializer` con `plushie_id` write-only |
| 4 | `apps/orders/serializers.py` | Crear 4 serializers: `OrderCreateSerializer`, `OrderAdminListSerializer`, `OrderAdminDetailSerializer`, `OrderStatusUpdateSerializer` |
| 5 | `apps/orders/views.py` | Crear `OrderCreateView` (CreateAPIView) y `OrderAdminViewSet` (ReadOnlyModelViewSet + partial_update) |
| 6 | `apps/order_items/urls.py` | Dejar vacío (sin endpoints propios) |
| 7 | `apps/orders/urls.py` | Router admin + path público |
| 8 | `config/urls.py` | Agregar `path('api/', include('apps.orders.urls'))` |
| 9 | `apps/order_items/admin.py` | Registrar `OrderItem` en admin |
| 10 | `apps/orders/admin.py` | Registrar `Order` en admin con list_display, list_filter, search |
| 11 | `apps/orders/tests.py` | Pruebas: público (AllowAny), admin (JWT), status transitions, frozen price |

---

## Criterios de aceptación

1. `POST /api/orders/` funciona sin autenticación y crea pedido + items anidados.
2. Cada item congela `unit_price` = `Plushie.price` al momento de creación.
3. Rechaza plushie inactivo, stock insuficiente, items vacíos.
4. `GET /api/admin/orders/` requiere JWT y lista pedidos.
5. `GET /api/admin/orders/{id}/` incluye items anidados.
6. `PATCH /api/admin/orders/{id}/` solo permite transiciones válidas (`pending→contacted→closed|cancelled`).
7. Estados terminales (`closed`, `cancelled`) no permiten transiciones.
8. `OrderItem.plushie` usa `PROTECT` — no permite eliminar peluche con pedidos.
9. `OrderItem.order` usa `CASCADE` — si se elimina pedido, se eliminan sus items.
10. Todos los tests pasan.

---

## Notas sobre order_items

- `order_items` **no tiene endpoints propios**. Solo existe como modelo + serializer para ser anidado en orders.
- El modelo `OrderItem` debe existir antes o al mismo tiempo que `Order` (la migración de Order no depende de OrderItem, pero OrderItem sí depende de Order).
- Orden de implementación sugerido:
  1. `order_items/models.py` (depende de Order, pero puede definirse con string `'orders.Order'`)
  2. `orders/models.py`
  3. Migraciones de ambas apps
  4. El resto en cualquier orden
