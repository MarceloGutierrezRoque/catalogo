# Spec: dashboard

## Descripción

Resumen estadístico para el panel de administración. Endpoint único de solo lectura que devuelve conteos agregados de pedidos (por estado) y peluches (activos/inactivos).

**No crea modelos propios.** Ejecuta consultas agregadas (`Count` con `Q` filters) sobre las tablas existentes:
- `plushies_plushie`
- `orders_order`

**Dependencias:** `plushies` y `orders` ya implementados con sus modelos completos.

---

## Endpoint

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/dashboard/` | JWT required | Estadísticas agregadas de pedidos y peluches |

### Response (200 OK)

```json
{
  "orders": {
    "pending": 5,
    "contacted": 3,
    "closed": 12,
    "cancelled": 1,
    "total": 21
  },
  "plushies": {
    "active": 15,
    "inactive": 2,
    "total": 17
  }
}
```

### Response (401 Unauthorized)

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Modelos

Ninguno. El dashboard no tiene tablas propias.

`apps/dashboard/models.py` se deja **vacío** (o con un comentario indicando que no hay modelos).

---

## Serializer — `apps/dashboard/serializers.py`

Se usan tres `Serializer` (no `ModelSerializer`) para representar la estructura de respuesta. Todos los campos son `read_only`.

```python
from rest_framework import serializers


class DashboardOrderStatsSerializer(serializers.Serializer):
    pending = serializers.IntegerField(read_only=True)
    contacted = serializers.IntegerField(read_only=True)
    closed = serializers.IntegerField(read_only=True)
    cancelled = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)


class DashboardPlushieStatsSerializer(serializers.Serializer):
    active = serializers.IntegerField(read_only=True)
    inactive = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)


class DashboardSerializer(serializers.Serializer):
    orders = DashboardOrderStatsSerializer(read_only=True)
    plushies = DashboardPlushieStatsSerializer(read_only=True)
```

**Notas:**
- Son `Serializer` (no `ModelSerializer`) porque no hay modelo asociado.
- Todos los campos son `read_only=True` — el endpoint es de solo consulta.

---

## View — `apps/dashboard/views.py`

`APIView` con método `GET` que ejecuta dos consultas agregadas sobre `Order` y `Plushie`.

```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from apps.plushies.models import Plushie
from apps.orders.models import Order, OrderStatus
from apps.dashboard.serializers import DashboardSerializer


class DashboardView(APIView):
    """Resumen estadístico para panel admin."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1) Conteo de pedidos agrupados por estado
        orders_stats = Order.objects.aggregate(
            pending=Count('id', filter=Q(status=OrderStatus.PENDING)),
            contacted=Count('id', filter=Q(status=OrderStatus.CONTACTED)),
            closed=Count('id', filter=Q(status=OrderStatus.CLOSED)),
            cancelled=Count('id', filter=Q(status=OrderStatus.CANCELLED)),
            total=Count('id'),
        )

        # 2) Conteo de peluches activos / inactivos
        #    active   = is_active=True AND is_deleted=False (visible en catálogo público)
        #    inactive = complemento (is_active=False OR is_deleted=True)
        #    total    = todos los peluches
        plushies_stats = Plushie.objects.aggregate(
            active=Count('id', filter=Q(is_active=True, is_deleted=False)),
            inactive=Count(
                'id',
                filter=~Q(is_active=True, is_deleted=False)
            ),
            total=Count('id'),
        )

        data = {
            'orders': orders_stats,
            'plushies': plushies_stats,
        }
        serializer = DashboardSerializer(data)
        return Response(serializer.data)
```

**Notas de implementación:**
- `permission_classes = [IsAuthenticated]` garantiza que solo admins con JWT accedan.
- Se usa `django.db.models.Count` con el argumento `filter=` (Django 6 compatible).
- `~Q(is_active=True, is_deleted=False)` es la negación lógica: todo lo que NO sea un peluche activo y no eliminado. Esto asegura que `active + inactive = total` siempre.
- Dos queries únicamente (ningún JOIN innecesario). La query de orders recorre `orders_order`, la de plushies recorre `plushies_plushie`.

---

## URL — `apps/dashboard/urls.py`

```python
from django.urls import path
from apps.dashboard.views import DashboardView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
```

---

## `config/urls.py` — Agregar include

Insertar la línea para incluir las URLs del dashboard:

```python
path('api/', include('apps.dashboard.urls')),
```

Debe quedar así (nueva línea al final del bloque de includes):

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.plushies.urls')),
    path('api/', include('apps.orders.urls')),
    path('api/', include('apps.dashboard.urls')),   # <— agregar esta línea
]
```

---

## Admin — `apps/dashboard/admin.py`

Se deja **vacío**. El dashboard no tiene modelos que registrar en el admin de Django.

Puede contener solo un comentario:

```python
# Dashboard no tiene modelos propios — no se registra nada en admin.
```

---

## Tests — `apps/dashboard/tests.py`

Casos de prueba clave:

| # | Escenario | Expected |
|---|-----------|----------|
| 1 | GET sin token → 401 | `401 Unauthorized` |
| 2 | GET con token válido → 200 + estructura JSON correcta | `200 OK` con `orders` y `plushies` en response |
| 3 | Verificar que los conteos sean correctos con datos seed | `pending=2, contacted=1, closed=3, etc.` |
| 4 | Dashboard sin datos en DB → totales en 0 | `pending=0, contacted=0, active=0, total=0` |

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from apps.plushies.models import Plushie
from apps.orders.models import Order, OrderStatus


def get_jwt_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class DashboardAuthTests(TestCase):
    """Pruebas de autenticación para GET /api/dashboard/."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/dashboard/'

    def test_dashboard_without_token_returns_401(self):
        """GET /api/dashboard/ sin token → 401."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_with_token_returns_200(self):
        """GET /api/dashboard/ con token válido → 200."""
        admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='test1234'
        )
        token = get_jwt_token(admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class DashboardResponseStructureTests(TestCase):
    """Pruebas de estructura y conteos del response."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/dashboard/'
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='test1234'
        )
        self.token = get_jwt_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_response_has_expected_keys(self):
        """Response debe contener 'orders' y 'plushies'."""
        response = self.client.get(self.url)
        self.assertIn('orders', response.data)
        self.assertIn('plushies', response.data)

    def test_orders_stats_has_expected_keys(self):
        """orders debe tener: pending, contacted, closed, cancelled, total."""
        response = self.client.get(self.url)
        orders = response.data['orders']
        expected_keys = {'pending', 'contacted', 'closed', 'cancelled', 'total'}
        self.assertEqual(set(orders.keys()), expected_keys)

    def test_plushies_stats_has_expected_keys(self):
        """plushies debe tener: active, inactive, total."""
        response = self.client.get(self.url)
        plushies = response.data['plushies']
        expected_keys = {'active', 'inactive', 'total'}
        self.assertEqual(set(plushies.keys()), expected_keys)

    def test_all_counts_are_integers(self):
        """Todos los valores deben ser enteros."""
        response = self.client.get(self.url)
        for value in response.data['orders'].values():
            self.assertIsInstance(value, int)
        for value in response.data['plushies'].values():
            self.assertIsInstance(value, int)

    def test_plushies_active_plus_inactive_equals_total(self):
        """active + inactive debe ser igual a total."""
        response = self.client.get(self.url)
        p = response.data['plushies']
        self.assertEqual(p['active'] + p['inactive'], p['total'])

    def test_empty_database_returns_zeros(self):
        """Sin datos en DB, todos los conteos deben ser 0."""
        response = self.client.get(self.url)
        for value in response.data['orders'].values():
            self.assertEqual(value, 0)
        for value in response.data['plushies'].values():
            self.assertEqual(value, 0)

    def test_counts_are_accurate_with_seed_data(self):
        """Verificar que los conteos reflejan los datos insertados."""
        # Crear peluches
        Plushie.objects.create(name='A', price=10, stock=5,
                               is_active=True, is_deleted=False)
        Plushie.objects.create(name='B', price=10, stock=5,
                               is_active=True, is_deleted=False)
        Plushie.objects.create(name='C', price=10, stock=5,
                               is_active=False, is_deleted=False)
        Plushie.objects.create(name='D', price=10, stock=5,
                               is_active=True, is_deleted=True)

        # Crear pedidos
        Order.objects.create(customer_name='C1', customer_email='c1@t.com',
                             customer_phone='555', status=OrderStatus.PENDING)
        Order.objects.create(customer_name='C2', customer_email='c2@t.com',
                             customer_phone='555', status=OrderStatus.PENDING)
        Order.objects.create(customer_name='C3', customer_email='c3@t.com',
                             customer_phone='555', status=OrderStatus.CONTACTED)
        Order.objects.create(customer_name='C4', customer_email='c4@t.com',
                             customer_phone='555', status=OrderStatus.CLOSED)
        Order.objects.create(customer_name='C5', customer_email='c5@t.com',
                             customer_phone='555', status=OrderStatus.CLOSED)
        Order.objects.create(customer_name='C6', customer_email='c6@t.com',
                             customer_phone='555', status=OrderStatus.CLOSED)
        Order.objects.create(customer_name='C7', customer_email='c7@t.com',
                             customer_phone='555', status=OrderStatus.CANCELLED)

        response = self.client.get(self.url)

        # Verificar conteos de pedidos
        self.assertEqual(response.data['orders']['pending'], 2)
        self.assertEqual(response.data['orders']['contacted'], 1)
        self.assertEqual(response.data['orders']['closed'], 3)
        self.assertEqual(response.data['orders']['cancelled'], 1)
        self.assertEqual(response.data['orders']['total'], 7)

        # Verificar conteos de peluches
        # active = is_active=True, is_deleted=False → A, B (2)
        # inactive = not(active) → C (is_active=False), D (is_deleted=True) (2)
        # total = 4
        self.assertEqual(response.data['plushies']['active'], 2)
        self.assertEqual(response.data['plushies']['inactive'], 2)
        self.assertEqual(response.data['plushies']['total'], 4)
```

---

## Resumen de tareas de implementación

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/dashboard/models.py` | Dejar vacío (sin modelos) |
| 2 | `apps/dashboard/serializers.py` | Crear `DashboardOrderStatsSerializer`, `DashboardPlushieStatsSerializer`, `DashboardSerializer` |
| 3 | `apps/dashboard/views.py` | Crear `DashboardView` con `get()` y dos aggregates |
| 4 | `apps/dashboard/urls.py` | Crear ruta `dashboard/` apuntando a `DashboardView` |
| 5 | `config/urls.py` | Agregar `path('api/', include('apps.dashboard.urls'))` |
| 6 | `apps/dashboard/admin.py` | Dejar vacío (o con comentario) |
| 7 | `apps/dashboard/tests.py` | Tests de autenticación, estructura y precisión de conteos |

---

## Criterios de aceptación

1. `GET /api/dashboard/` sin token → `401 Unauthorized`.
2. `GET /api/dashboard/` con token válido → `200 OK` con JSON de la forma especificada.
3. `orders.pending + orders.contacted + orders.closed + orders.cancelled = orders.total`.
4. `plushies.active + plushies.inactive = plushies.total`.
5. Los conteos reflejan fielmente los datos en DB.
6. Base de datos vacía → todos los conteos en `0`.
7. No se crean tablas nuevas (0 migraciones generadas — el dashboard no tiene modelos).
8. Todos los tests pasan.
