from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.suppliers.models import Supplier


class SupplierViewSetTests(APITestCase):
    """Tests for the SupplierViewSet CRUD endpoints."""

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

        self.supplier = Supplier.objects.create(
            name='Proveedor Principal S.A.',
            contact_name='Ana Torres',
            email='ana@principal.com',
            phone='+56 9 8888 7777',
            address='Av. Central 400',
            city='Santiago',
            country='Chile',
        )
        self.valid_payload = {
            'name': 'Proveedor Secundario Ltda.',
            'contact_name': 'Pedro Rojas',
            'email': 'pedro@secundario.com',
            'phone': '+56 9 6666 5555',
            'address': 'Calle Sur 200',
            'city': 'Concepción',
            'country': 'Chile',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/suppliers/ returns 200 with list."""
        response = self.client.get('/api/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Proveedor Principal S.A.')

    def test_create_happy_path(self):
        """POST /api/suppliers/ with valid data returns 201."""
        response = self.client.post('/api/suppliers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Proveedor Secundario Ltda.')
        self.assertTrue(Supplier.objects.filter(name='Proveedor Secundario Ltda.').exists())

    def test_retrieve_happy_path(self):
        """GET /api/suppliers/{id}/ returns 200."""
        response = self.client.get(f'/api/suppliers/{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Proveedor Principal S.A.')

    def test_update_happy_path(self):
        """PUT /api/suppliers/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['name'] = 'Proveedor Actualizado S.A.'
        response = self.client.put(
            f'/api/suppliers/{self.supplier.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Proveedor Actualizado S.A.')

    def test_partial_update_happy_path(self):
        """PATCH /api/suppliers/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/suppliers/{self.supplier.pk}/',
            {'contact_name': 'Nuevo Contacto'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.contact_name, 'Nuevo Contacto')

    def test_delete_soft_delete(self):
        """DELETE /api/suppliers/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/suppliers/{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/suppliers/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/suppliers/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty name returns 400."""
        response = self.client.put(
            f'/api/suppliers/{self.supplier.pk}/',
            {'name': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/suppliers/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/suppliers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_empty_strings_for_optionals(self):
        """Optional fields can be sent as empty strings."""
        payload = {
            'name': 'Supplier With Empty Optionals',
            'contact_name': '',
            'email': '',
            'phone': '',
            'address': '',
            'city': '',
            'country': '',
        }
        response = self.client.post('/api/suppliers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
