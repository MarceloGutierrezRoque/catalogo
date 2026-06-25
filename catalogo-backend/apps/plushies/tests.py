from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.plushies.models import Plushie

User = get_user_model()


class PlushieModelTests(TestCase):
    """Tests for the Plushie model."""

    def setUp(self):
        self.plushie = Plushie.objects.create(
            name='Osito',
            price=29.99,
            stock=10,
        )

    def test_str_returns_name(self):
        """__str__() debe devolver el nombre del plushie."""
        self.assertEqual(str(self.plushie), 'Osito')


class PlushiePublicTests(TestCase):
    """Tests for public plushie endpoints (allow any)."""

    def setUp(self):
        self.client = APIClient()
        self.list_url = '/api/plushies/'

        # Active, not deleted — should appear in public
        self.active_plushie = Plushie.objects.create(
            name='Active Bear',
            price=29.99,
            stock=10,
            is_active=True,
            is_deleted=False,
        )
        # Inactive — should NOT appear
        self.inactive_plushie = Plushie.objects.create(
            name='Inactive Bear',
            price=19.99,
            stock=5,
            is_active=False,
            is_deleted=False,
        )
        # Deleted — should NOT appear
        self.deleted_plushie = Plushie.objects.create(
            name='Deleted Bear',
            price=9.99,
            stock=0,
            is_active=True,
            is_deleted=True,
        )

    def test_list_public_no_auth(self):
        """GET /api/plushies/ without token → 200."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_public_only_active_not_deleted(self):
        """Only is_active=True and is_deleted=False appear."""
        response = self.client.get(self.list_url)
        results = response.data['results']
        ids = [p['id'] for p in results]
        self.assertIn(self.active_plushie.id, ids)
        self.assertNotIn(self.inactive_plushie.id, ids)
        self.assertNotIn(self.deleted_plushie.id, ids)

    def test_detail_public_active(self):
        """GET /api/plushies/{id}/ for active → 200."""
        url = f'/api/plushies/{self.active_plushie.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Active Bear')

    def test_detail_public_inactive(self):
        """GET /api/plushies/{id}/ for inactive → 404."""
        url = f'/api/plushies/{self.inactive_plushie.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PlushieAdminTests(TestCase):
    """Tests for admin plushie endpoints (JWT required)."""

    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin = User.objects.create_user(
            username='admin', password='admin123', is_staff=True,
        )
        # Obtain JWT
        res = self.client.post('/api/token/', {
            'username': 'admin', 'password': 'admin123',
        })
        self.token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.list_url = '/api/admin/plushies/'

        self.plushie = Plushie.objects.create(
            name='Test Plushie',
            description='A test plushie',
            price=15.50,
            stock=3,
        )

    def test_list_admin_requires_auth(self):
        """GET /api/admin/plushies/ without token → 401."""
        self.client.credentials()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_admin_includes_all(self):
        """GET /api/admin/plushies/ includes inactive and deleted."""
        Plushie.objects.create(name='Inactive', price=1, is_active=False)
        Plushie.objects.create(name='Deleted', price=1, is_deleted=True)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_create_plushie_admin(self):
        """POST /api/admin/plushies/ → 201."""
        data = {
            'name': 'New Plushie',
            'price': '25.00',
            'stock': 5,
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Plushie')

    def test_delete_plushie_hard_delete(self):
        """DELETE → 204 + objeto eliminado de la BD."""
        url = f'/api/admin/plushies/{self.plushie.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Plushie.objects.filter(id=self.plushie.id).exists())

    def test_activate_plushie(self):
        """PATCH activate/ → is_active=True."""
        self.plushie.is_active = False
        self.plushie.save()
        url = f'/api/admin/plushies/{self.plushie.id}/activate/'
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plushie.refresh_from_db()
        self.assertTrue(self.plushie.is_active)

    def test_deactivate_plushie(self):
        """PATCH deactivate/ → is_active=False."""
        url = f'/api/admin/plushies/{self.plushie.id}/deactivate/'
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plushie.refresh_from_db()
        self.assertFalse(self.plushie.is_active)

    def test_retrieve_admin_plushie(self):
        """GET /api/admin/plushies/{id}/ → 200 + detail."""
        url = f'/api/admin/plushies/{self.plushie.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Plushie')

    def test_retrieve_admin_deleted_plushie(self):
        """GET /api/admin/plushies/{id}/ for deleted → 200 (admin sees all)."""
        self.plushie.is_deleted = True
        self.plushie.save()
        url = f'/api/admin/plushies/{self.plushie.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_admin_nonexistent_returns_404(self):
        """GET /api/admin/plushies/{id}/ for non-existent → 404."""
        url = '/api/admin/plushies/99999/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_plushie_patch(self):
        """PATCH /api/admin/plushies/{id}/ → 200 + updated fields."""
        url = f'/api/admin/plushies/{self.plushie.id}/'
        response = self.client.patch(url, {'name': 'Updated Name'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')

    def test_update_plushie_put(self):
        """PUT /api/admin/plushies/{id}/ → 200 + updated fields."""
        url = f'/api/admin/plushies/{self.plushie.id}/'
        data = {
            'name': 'Full Update',
            'price': '99.99',
            'stock': 1,
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Full Update')
        self.assertEqual(response.data['price'], '99.99')

    def test_create_plushie_without_name_returns_400(self):
        """POST /api/admin/plushies/ without name → 400."""
        data = {'price': '25.00', 'stock': 5}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
