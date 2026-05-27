from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.driver.models import Driver


class DriverViewSetTests(APITestCase):
    """Tests for the DriverViewSet CRUD endpoints."""

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

        self.driver_user = User.objects.create_user(
            username='juan.reyes',
            first_name='Juan',
            last_name='Reyes',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-ABC-001',
            phone='+56 9 7777 0000',
            email='juan@flota.cl',
            hire_date='2024-03-01',
        )

        self.new_user = User.objects.create_user(
            username='nuevo.driver',
            first_name='Nuevo',
            last_name='Driver',
        )
        self.valid_payload = {
            'user': self.new_user.pk,
            'license_number': 'LIC-NEW-002',
            'phone': '+56 9 8888 9999',
            'email': 'nuevo@flota.cl',
            'hire_date': '2025-05-10',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/drivers/ returns 200 with list."""
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['license_number'], 'LIC-ABC-001')

    def test_create_happy_path(self):
        """POST /api/drivers/ with valid data returns 201."""
        response = self.client.post('/api/drivers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['license_number'], 'LIC-NEW-002')
        self.assertTrue(Driver.objects.filter(license_number='LIC-NEW-002').exists())

    def test_retrieve_happy_path(self):
        """GET /api/drivers/{id}/ returns 200."""
        response = self.client.get(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC-ABC-001')

    def test_update_happy_path(self):
        """PUT /api/drivers/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['license_number'] = 'LIC-ABC-001'
        payload['phone'] = '+56 9 0000 1111'
        response = self.client.put(
            f'/api/drivers/{self.driver.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '+56 9 0000 1111')

    def test_partial_update_happy_path(self):
        """PATCH /api/drivers/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/drivers/{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_available)

    def test_delete_soft_delete(self):
        """DELETE /api/drivers/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/drivers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/drivers/', {'phone': '123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_license(self):
        """POST with existing license_number returns 400."""
        payload = self.valid_payload.copy()
        payload['license_number'] = self.driver.license_number
        response = self.client.post('/api/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty license_number returns 400."""
        response = self.client.put(
            f'/api/drivers/{self.driver.pk}/',
            {'user': self.driver.user.pk, 'license_number': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/drivers/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_minimal_driver(self):
        """Create driver with only user and license_number."""
        minimal_user = User.objects.create_user(username='minimal.driver')
        payload = {
            'user': minimal_user.pk,
            'license_number': 'LIC-MIN-001',
        }
        response = self.client.post('/api/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('phone'))
