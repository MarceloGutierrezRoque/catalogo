from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouse.models import Warehouse


class ProductViewSetTests(APITestCase):
    """Tests for the ProductViewSet CRUD endpoints."""

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

        self.supplier = Supplier.objects.create(
            name='Distribuidora Test',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Test',
            code='BT-002',
        )
        self.product = Product.objects.create(
            name='SSD 1TB NVMe',
            sku='SSD-1TB-001',
            brand='StoragePro',
            unit_price=129.99,
            stock_quantity=100,
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.valid_payload = {
            'name': 'Memoria RAM 32GB DDR5',
            'sku': 'RAM-32GB-001',
            'brand': 'MemoryX',
            'unit_price': 89.50,
            'stock_quantity': 200,
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/products/ returns 200 with list."""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['sku'], 'SSD-1TB-001')

    def test_create_happy_path(self):
        """POST /api/products/ with valid data returns 201."""
        response = self.client.post('/api/products/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sku'], 'RAM-32GB-001')
        self.assertTrue(Product.objects.filter(sku='RAM-32GB-001').exists())

    def test_retrieve_happy_path(self):
        """GET /api/products/{id}/ returns 200."""
        response = self.client.get(f'/api/products/{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], 'SSD-1TB-001')

    def test_update_happy_path(self):
        """PUT /api/products/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['sku'] = 'SSD-1TB-001'
        payload['name'] = 'SSD 2TB NVMe Pro'
        response = self.client.put(
            f'/api/products/{self.product.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'SSD 2TB NVMe Pro')

    def test_partial_update_happy_path(self):
        """PATCH /api/products/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/products/{self.product.pk}/',
            {'stock_quantity': 250},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 250)

    def test_delete_soft_delete(self):
        """DELETE /api/products/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/products/{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/products/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/products/', {'name': 'Incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_sku(self):
        """POST with existing sku returns 400."""
        payload = self.valid_payload.copy()
        payload['sku'] = self.product.sku
        response = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty sku returns 400."""
        response = self.client.put(
            f'/api/products/{self.product.pk}/',
            {
                'name': 'Test',
                'sku': '',
                'supplier': self.supplier.pk,
                'warehouse': self.warehouse.pk,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/products/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_non_existent_supplier(self):
        """POST with non-existent supplier returns 400."""
        payload = self.valid_payload.copy()
        payload['supplier'] = 99999
        response = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_create_with_extra_fields(self):
        """Extra fields in payload are ignored."""
        payload = self.valid_payload.copy()
        payload['extra_field'] = 'should_be_ignored'
        response = self.client.post('/api/products/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
