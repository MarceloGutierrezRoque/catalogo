from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from apps.shipment.models import Shipment, ShipmentItem
from apps.customer.models import Customer
from apps.warehouse.models import Warehouse
from apps.products.models import Product
from apps.suppliers.models import Supplier


class ShipmentViewSetTests(APITestCase):
    """Tests for the ShipmentViewSet CRUD endpoints."""

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

        self.customer = Customer.objects.create(
            name='Cliente Ship View',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Ship View',
            code='VW-001',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-VIEW-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Av. Vista 789',
            destination_city='Santiago',
            destination_country='Chile',
            status='pending',
        )
        self.valid_payload = {
            'tracking_number': 'TRK-VIEW-002',
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Otra Dirección 456',
            'destination_city': 'Valparaíso',
            'destination_country': 'Chile',
        }

    # ──────────────────────────────────────────────
    # HAPPY PATH — Shipments
    # ──────────────────────────────────────────────

    def test_list_happy_path(self):
        """GET /api/shipments/ returns 200 with list."""
        response = self.client.get('/api/shipments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['tracking_number'], 'TRK-VIEW-001')

    def test_create_happy_path(self):
        """POST /api/shipments/ with valid data returns 201."""
        response = self.client.post('/api/shipments/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tracking_number'], 'TRK-VIEW-002')
        self.assertTrue(Shipment.objects.filter(tracking_number='TRK-VIEW-002').exists())

    def test_retrieve_happy_path(self):
        """GET /api/shipments/{id}/ returns 200."""
        response = self.client.get(f'/api/shipments/{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tracking_number'], 'TRK-VIEW-001')
        self.assertIn('items', response.data)

    def test_update_happy_path(self):
        """PUT /api/shipments/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['tracking_number'] = 'TRK-VIEW-001'
        payload['destination_city'] = 'Viña del Mar'
        response = self.client.put(
            f'/api/shipments/{self.shipment.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.destination_city, 'Viña del Mar')

    def test_partial_update_happy_path(self):
        """PATCH /api/shipments/{id}/ with partial data returns 200."""
        response = self.client.patch(
            f'/api/shipments/{self.shipment.pk}/',
            {'status': 'in_transit'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'in_transit')

    def test_delete_soft_delete(self):
        """DELETE /api/shipments/{id}/ returns 204 and sets is_active=False."""
        response = self.client.delete(f'/api/shipments/{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.shipment.refresh_from_db()
        self.assertFalse(self.shipment.is_active)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH — Shipments
    # ──────────────────────────────────────────────

    def test_list_unauthenticated(self):
        """GET without token returns 401."""
        self.client.credentials()
        response = self.client.get('/api/shipments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/shipments/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invalid_data(self):
        """POST with missing required fields returns 400."""
        response = self.client.post('/api/shipments/', {'tracking_number': 'incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_tracking(self):
        """POST with existing tracking_number returns 400."""
        payload = self.valid_payload.copy()
        payload['tracking_number'] = self.shipment.tracking_number
        response = self.client.post('/api/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_data(self):
        """PUT with empty tracking_number returns 400."""
        response = self.client.put(
            f'/api/shipments/{self.shipment.pk}/',
            {
                'tracking_number': '',
                'customer': self.customer.pk,
                'origin_warehouse': self.warehouse.pk,
                'destination_address': 'Addr',
                'destination_city': 'City',
                'destination_country': 'Country',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_not_found(self):
        """PUT with non-existent id returns 404."""
        response = self.client.put(
            '/api/shipments/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_not_found(self):
        """DELETE with non-existent id returns 404."""
        response = self.client.delete('/api/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ShipmentItemViewSetTests(APITestCase):
    """Tests for the ShipmentItemViewSet CRUD endpoints."""

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

        self.customer = Customer.objects.create(
            name='Cliente Item View',
            customer_type='company',
        )
        self.warehouse = Warehouse.objects.create(
            name='Bodega Item View',
            code='VW-002',
        )
        self.supplier = Supplier.objects.create(name='Supplier Items')
        self.product = Product.objects.create(
            name='Producto Item View',
            sku='PRD-VIEW-001',
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-ITEM-VIEW',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Addr Item',
            destination_city='City Item',
            destination_country='Country Item',
        )
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=10,
            unit_price_at_shipping=50.00,
        )
        self.valid_payload = {
            'shipment': self.shipment.pk,
            'product': self.product.pk,
            'quantity': 5,
            'unit_price_at_shipping': 75.00,
        }

    def test_list_items_happy_path(self):
        """GET /api/shipment-items/ returns 200 with list."""
        response = self.client.get('/api/shipment-items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['quantity'], 10)

    def test_create_item_happy_path(self):
        """POST /api/shipment-items/ with valid data returns 201."""
        response = self.client.post('/api/shipment-items/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 5)

    def test_retrieve_item_happy_path(self):
        """GET /api/shipment-items/{id}/ returns 200."""
        response = self.client.get(f'/api/shipment-items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 10)

    def test_update_item_happy_path(self):
        """PUT /api/shipment-items/{id}/ with full data returns 200."""
        payload = self.valid_payload.copy()
        payload['quantity'] = 20
        response = self.client.put(
            f'/api/shipment-items/{self.item.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 20)

    def test_delete_item_happy_path(self):
        """DELETE /api/shipment-items/{id}/ returns 204."""
        response = self.client.delete(f'/api/shipment-items/{self.item.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ShipmentItem.objects.filter(pk=self.item.pk).exists())

    def test_create_item_invalid_data(self):
        """POST /api/shipment-items/ with missing fields returns 400."""
        response = self.client.post('/api/shipment-items/', {'quantity': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_unauthenticated(self):
        """POST without token returns 401."""
        self.client.credentials()
        response = self.client.post('/api/shipment-items/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_item_not_found(self):
        """GET with non-existent id returns 404."""
        response = self.client.get('/api/shipment-items/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
