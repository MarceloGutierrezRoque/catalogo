from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.customer.models import Customer


class CustomerViewSetTests(APITestCase):
    """Tests for the CustomerViewSet CRUD endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        response = self.client.post('/api/token/', {
            'username': 'testuser', 'password': 'testpass123'
        }, format='json')
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.customer = Customer.objects.create(
            name='Cliente Principal Ltda.',
            customer_type='company',
            email='cliente@principal.com',
            phone='+56 9 7777 8888',
            city='Santiago',
            country='Chile',
        )
        self.valid_payload = {
            'name': 'Cliente Secundario SpA',
            'customer_type': 'company',
            'email': 'secundario@correo.com',
            'phone': '+56 9 5555 6666',
            'city': 'Valparaíso',
            'country': 'Chile',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/customers/ returns 200 with list."""
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Cliente Principal Ltda.')

    def test_create_happy_path(self):
        """POST /api/customers/ with valid data returns 201."""
        response = self.client.post('/api/customers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Cliente Secundario SpA')

    def test_retrieve_happy_path(self):
        """GET /api/customers/{id}/ returns 200."""
        response = self.client.get(f'/api/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Cliente Principal Ltda.')

    def test_update_happy_path(self):
        """PUT /api/customers/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['name'] = 'Cliente Actualizado Ltda.'
        response = self.client.put(
            f'/api/customers/{self.customer.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Cliente Actualizado Ltda.')

    def test_partial_update_happy_path(self):
        """PATCH /api/customers/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/customers/{self.customer.pk}/',
            {'phone': '+56 9 0000 1111'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.phone, '+56 9 0000 1111')

    def test_delete_soft_delete(self):
        """DELETE /api/customers/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/customers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/customers/', {'name': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_customer_type(self):
        """POST without customer_type returns 400."""
        response = self.client.post(
            '/api/customers/',
            {'name': 'No Type Customer'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty name returns 400."""
        response = self.client.put(
            f'/api/customers/{self.customer.pk}/',
            {'name': '', 'customer_type': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/customers/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_person_type(self):
        """Create a customer of type 'person'."""
        payload = {
            'name': 'Juan Pérez',
            'customer_type': 'person',
            'email': 'juan@perez.com',
        }
        response = self.client.post('/api/customers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'person')
