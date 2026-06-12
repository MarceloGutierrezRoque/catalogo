from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.warehouse.models import Warehouse


class WarehouseViewSetTests(APITestCase):
    """Tests for the WarehouseViewSet CRUD endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='testuser', password='testpass123'
        )
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser', 'password': 'testpass123'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.warehouse = Warehouse.objects.create(
            name='Bodega Principal',
            code='BP-001',
            address='Av. Principal 100',
            city='Santiago',
            country='Chile',
            capacity=500,
        )
        self.valid_payload = {
            'name': 'Bodega Secundaria',
            'code': 'BS-002',
            'address': 'Calle Secundaria 200',
            'city': 'Valparaíso',
            'country': 'Chile',
            'capacity': 300,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/warehouses/ returns 200 with list."""
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Bodega Principal')

    def test_create_happy_path(self):
        """POST /api/warehouses/ with valid data returns 201."""
        response = self.client.post('/api/warehouses/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Bodega Secundaria')
        self.assertEqual(response.data['code'], 'BS-002')
        self.assertTrue(Warehouse.objects.filter(code='BS-002').exists())

    def test_retrieve_happy_path(self):
        """GET /api/warehouses/{id}/ returns 200."""
        response = self.client.get(f'/api/warehouses/{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Bodega Principal')

    def test_update_happy_path(self):
        """PUT /api/warehouses/{id}/ with full data returns 200."""
        payload = {
            'name': 'Bodega Principal Actualizada',
            'code': 'BP-001',
            'address': 'Av. Actualizada 999',
            'city': 'Santiago',
            'country': 'Chile',
            'capacity': 600,
        }
        response = self.client.put(
            f'/api/warehouses/{self.warehouse.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Bodega Principal Actualizada')
        self.assertEqual(self.warehouse.capacity, 600)

    def test_partial_update_happy_path(self):
        """PATCH /api/warehouses/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/warehouses/{self.warehouse.pk}/',
            {'name': 'Bodega Renombrada'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Bodega Renombrada')

    def test_delete_soft_delete(self):
        """DELETE /api/warehouses/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/warehouses/{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()  # Remove auth header
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/warehouses/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/warehouses/', {'name': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_code(self):
        """POST with existing code returns 400."""
        payload = self.valid_payload.copy()
        payload['code'] = self.warehouse.code  # Duplicate code
        response = self.client.post('/api/warehouses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with invalid data returns 400."""
        response = self.client.put(
            f'/api/warehouses/{self.warehouse.pk}/',
            {'name': '', 'code': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/warehouses/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/warehouses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_empty_after_delete(self):
        """After soft-delete, list does NOT include it by default."""
        self.client.delete(f'/api/warehouses/{self.warehouse.pk}/')
        response = self.client.get('/api/warehouses/')
        self.assertEqual(len(response.data), 0)

    def test_create_and_retrieve_after_delete(self):
        """Create a new warehouse after soft-deleting one."""
        self.client.delete(f'/api/warehouses/{self.warehouse.pk}/')
        response = self.client.post('/api/warehouses/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Only the active one is counted by default
        self.assertEqual(Warehouse.objects.count(), 1)
        # Both exist in DB (including soft-deleted)
        self.assertEqual(Warehouse.all_objects.count(), 2)
