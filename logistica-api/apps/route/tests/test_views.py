from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.route.models import Route, Stop
from apps.transport.models import Transport
from apps.driver.models import Driver
from apps.warehouse.models import Warehouse


class RouteViewSetTests(APITestCase):
    """Tests for the RouteViewSet CRUD endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        response = self.client.post('/api/token/', {
            'username': 'testuser', 'password': 'testpass123'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.transport = Transport.objects.create(
            plate='VW-ROUTE',
            brand='Volkswagen',
            model='Delivery',
        )
        self.driver_user = User.objects.create_user(
            username='route.driver',
            first_name='Route',
            last_name='Driver',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-ROUTE-001',
        )
        self.route = Route.objects.create(
            name='Ruta Principal',
            transport=self.transport,
            driver=self.driver,
            status='planned',
        )
        self.valid_payload = {
            'name': 'Ruta Secundaria',
            'transport': self.transport.pk,
            'driver': self.driver.pk,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH — Routes
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/routes/ returns 200 with list."""
        response = self.client.get('/api/routes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Ruta Principal')

    def test_create_happy_path(self):
        """POST /api/routes/ with valid data returns 201."""
        response = self.client.post('/api/routes/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Ruta Secundaria')
        self.assertTrue(Route.objects.filter(name='Ruta Secundaria').exists())

    def test_retrieve_happy_path(self):
        """GET /api/routes/{id}/ returns 200."""
        response = self.client.get(f'/api/routes/{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Principal')
        self.assertIn('stops', response.data)

    def test_update_happy_path(self):
        """PUT /api/routes/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['name'] = 'Ruta Actualizada'
        response = self.client.put(
            f'/api/routes/{self.route.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Ruta Actualizada')

    def test_partial_update_happy_path(self):
        """PATCH /api/routes/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/routes/{self.route.pk}/',
            {'status': 'in_progress'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.status, 'in_progress')

    def test_delete_soft_delete(self):
        """DELETE /api/routes/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/routes/{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.route.refresh_from_db()
        self.assertFalse(self.route.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH — Routes
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/routes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/routes/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/routes/', {'name': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty name returns 400."""
        response = self.client.put(
            f'/api/routes/{self.route.pk}/',
            {
                'name': '',
                'transport': self.transport.pk,
                'driver': self.driver.pk,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/routes/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class StopViewSetTests(APITestCase):
    """Tests for the StopViewSet CRUD endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.auth_user = User.objects.create_user(
            username='testuser2', password='testpass123'
        )
        response = self.client.post('/api/token/', {
            'username': 'testuser2', 'password': 'testpass123'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.transport = Transport.objects.create(plate='STP-VW')
        self.driver_user = User.objects.create_user(username='stop.driver2')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-STOP-002',
        )
        self.route = Route.objects.create(
            name='Ruta con Stops',
            transport=self.transport,
            driver=self.driver,
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Ruta',
            code='BR-001',
        )
        self.stop = Stop.objects.create(
            route=self.route,
            order=1,
            warehouse=self.warehouse,
        )
        self.valid_payload = {
            'route': self.route.pk,
            'order': 2,
            'warehouse': self.warehouse.pk,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH — Stops
    # ──────────────────────────────────────────────

    def test_list_stops_happy_path(self):
        """GET /api/stops/ returns 200 with list."""
        response = self.client.get('/api/stops/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['order'], 1)

    def test_create_stop_happy_path(self):
        """POST /api/stops/ with valid data returns 201."""
        response = self.client.post('/api/stops/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['order'], 2)

    def test_retrieve_stop_happy_path(self):
        """GET /api/stops/{id}/ returns 200."""
        response = self.client.get(f'/api/stops/{self.stop.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order'], 1)

    def test_update_stop_happy_path(self):
        """PUT /api/stops/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['order'] = 3
        response = self.client.put(
            f'/api/stops/{self.stop.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.stop.refresh_from_db()
        self.assertEqual(self.stop.order, 3)

    def test_partial_update_stop_happy_path(self):
        """PATCH /api/stops/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/stops/{self.stop.pk}/',
            {'status': 'arrived'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.stop.refresh_from_db()
        self.assertEqual(self.stop.status, 'arrived')

    def test_delete_stop_happy_path(self):
        """DELETE /api/stops/{id}/ returns 204."""
        response = self.client.delete(f'/api/stops/{self.stop.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Stop.objects.filter(pk=self.stop.pk).exists())

    # ──────────────────────────────────────────────
    # UNHAPPY PATH — Stops
    # ──────────────────────────────────────────────

    def test_create_stop_invalid_data(self):
        """POST /api/stops/ with missing fields returns 400."""
        response = self.client.post('/api/stops/', {'order': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_unauthenticated(self):
        """POST /api/stops/ without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/stops/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_stop_not_found(self):
        """GET /api/stops/ with non-existent id returns 404."""
        response = self.client.get('/api/stops/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_stop_not_found(self):
        """DELETE /api/stops/ with non-existent id returns 404."""
        response = self.client.delete('/api/stops/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
