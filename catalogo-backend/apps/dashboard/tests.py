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
        # active  = is_active=True,  is_deleted=False → A, B          (2)
        # inactive= is_active=False, is_deleted=False → C              (1)
        # total   = is_deleted=False → A, B, C                         (3)
        self.assertEqual(response.data['plushies']['active'], 2)
        self.assertEqual(response.data['plushies']['inactive'], 1)
        self.assertEqual(response.data['plushies']['total'], 3)
