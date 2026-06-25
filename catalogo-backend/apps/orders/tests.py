from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.plushies.models import Plushie
from apps.orders.models import Order, OrderStatus


ALL_STATUSES = [OrderStatus.PENDING, OrderStatus.CONTACTED,
                OrderStatus.CLOSED, OrderStatus.CANCELLED]


def get_jwt_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class OrderModelTests(TestCase):
    """Tests for Order model."""

    def setUp(self):
        self.order = Order.objects.create(
            customer_name='Juan', customer_email='j@t.com',
            customer_phone='555',
        )

    def test_str_returns_description(self):
        """__str__() debe incluir id, nombre y status."""
        result = str(self.order)
        self.assertIn('Juan', result)
        self.assertIn('pending', result)
        self.assertIn(str(self.order.id), result)




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

    def test_create_order_with_quantity_zero_fails(self):
        """Cantidad = 0 debe ser rechazado."""
        payload = self.valid_payload.copy()
        payload['items'] = [{'plushie_id': self.plushie.id, 'quantity': 0}]
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_with_deleted_plushie_fails(self):
        """Plushie eliminado (is_deleted=True) debe ser rechazado."""
        self.plushie.is_deleted = True
        self.plushie.save()
        response = self.client.post('/api/orders/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_with_nonexistent_plushie_fails(self):
        """plushie_id inexistente debe ser rechazado."""
        payload = self.valid_payload.copy()
        payload['items'] = [{'plushie_id': 99999, 'quantity': 1}]
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_without_customer_name_fails(self):
        """Missing customer_name → 400."""
        payload = self.valid_payload.copy()
        del payload['customer_name']
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_without_customer_email_fails(self):
        """Missing customer_email → 400."""
        payload = self.valid_payload.copy()
        del payload['customer_email']
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_with_multiple_items(self):
        """Creación con múltiples items debe funcionar."""
        plushie2 = Plushie.objects.create(
            name='Oso Polar', price=35.00, stock=5,
            is_active=True, is_deleted=False,
        )
        payload = self.valid_payload.copy()
        payload['items'] = [
            {'plushie_id': self.plushie.id, 'quantity': 1},
            {'plushie_id': plushie2.id, 'quantity': 3},
        ]
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 2)


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

    def test_all_patch_status_transitions_succeed(self):
        """PATCH acepta cualquier transición entre todos los estados (12 combinaciones)."""
        for from_status in ALL_STATUSES:
            for to_status in ALL_STATUSES:
                if from_status == to_status:
                    continue
                self.order.status = from_status
                self.order.save()
                response = self.client.patch(
                    f'/api/admin/orders/{self.order.id}/',
                    {'status': to_status},
                    format='json'
                )
                self.assertEqual(
                    response.status_code, status.HTTP_200_OK,
                    f'{from_status} → {to_status} debería ser 200'
                )
                self.order.refresh_from_db()
                self.assertEqual(self.order.status, to_status)

    def test_admin_detail_nonexistent_returns_404(self):
        """GET /api/admin/orders/{id}/ no existente → 404."""
        response = self.client.get('/api/admin/orders/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_update_invalid_status_value_returns_400(self):
        """PATCH con status inválido → 400."""
        response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'status': 'invalid_status'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_status_transition_contacted_to_cancelled(self):
        """PATCH status: contacted → cancelled → 200."""
        self.order.status = OrderStatus.CONTACTED
        self.order.save()
        response = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'status': 'cancelled'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatus.CANCELLED)

    def test_admin_delete_order_soft_delete(self):
        """DELETE /api/admin/orders/{id}/ → 204 + is_deleted=True."""
        response = self.client.delete(
            f'/api/admin/orders/{self.order.id}/',
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.order.refresh_from_db()
        self.assertTrue(self.order.is_deleted)

    def test_admin_delete_nonexistent_returns_404(self):
        """DELETE /api/admin/orders/99999/ → 404."""
        response = self.client.delete('/api/admin/orders/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_delete_requires_auth(self):
        """DELETE sin token → 401."""
        self.client.credentials()
        response = self.client.delete(
            f'/api/admin/orders/{self.order.id}/',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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
