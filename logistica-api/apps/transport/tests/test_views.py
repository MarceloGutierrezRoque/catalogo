from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.transport.models import Transport


class TransportViewSetTests(APITestCase):
    """Tests for the TransportViewSet CRUD endpoints."""

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

        self.transport = Transport.objects.create(
            plate='TRK-001',
            vehicle_type='truck',
            brand='Scania',
            model='R500',
            year=2024,
            capacity_kg=25000.00,
            capacity_volume=90.00,
        )
        self.valid_payload = {
            'plate': 'VAN-002',
            'vehicle_type': 'van',
            'brand': 'Ford',
            'model': 'Transit',
            'year': 2023,
            'capacity_kg': 1200.00,
            'capacity_volume': 10.00,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/transports/ returns 200 with list."""
        response = self.client.get('/api/transports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['plate'], 'TRK-001')

    def test_create_happy_path(self):
        """POST /api/transports/ with valid data returns 201."""
        response = self.client.post('/api/transports/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['plate'], 'VAN-002')
        self.assertTrue(Transport.objects.filter(plate='VAN-002').exists())

    def test_retrieve_happy_path(self):
        """GET /api/transports/{id}/ returns 200."""
        response = self.client.get(f'/api/transports/{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plate'], 'TRK-001')

    def test_update_happy_path(self):
        """PUT /api/transports/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['plate'] = 'TRK-001'
        payload['brand'] = 'Scania Actualizada'
        response = self.client.put(
            f'/api/transports/{self.transport.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.brand, 'Scania Actualizada')

    def test_partial_update_happy_path(self):
        """PATCH /api/transports/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/transports/{self.transport.pk}/',
            {'year': 2025},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.year, 2025)

    def test_delete_soft_delete(self):
        """DELETE /api/transports/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/transports/{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.transport.refresh_from_db()
        self.assertFalse(self.transport.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/transports/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/transports/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/transports/', {'brand': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_plate(self):
        """POST with existing plate returns 400."""
        payload = self.valid_payload.copy()
        payload['plate'] = self.transport.plate
        response = self.client.post('/api/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty plate returns 400."""
        response = self.client.put(
            f'/api/transports/{self.transport.pk}/',
            {'plate': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/transports/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_without_optionals(self):
        """Create transport with only plate and is_available."""
        payload = {'plate': 'MIN-003', 'is_available': True}
        response = self.client.post('/api/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('brand'))
