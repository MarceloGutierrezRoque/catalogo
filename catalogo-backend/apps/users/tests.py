from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class UserCRUDTests(TestCase):
    """Test CRUD operations on /api/users/."""

    def setUp(self):
        self.client = APIClient()
        # Create admin user for authentication
        self.admin_password = 'admin_pass_123'
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password=self.admin_password,
            is_staff=True,
        )
        # Obtain JWT token
        res = self.client.post('/api/token/', {
            'username': 'admin',
            'password': self.admin_password,
        })
        self.token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.list_url = '/api/users/'

    def _detail_url(self, user_id):
        return f'/api/users/{user_id}/'

    def test_list_users_unauthenticated(self):
        """GET /api/users/ without token → 401."""
        self.client.credentials()  # remove token
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_users_authenticated(self):
        """GET /api/users/ with token → 200."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # only admin

    def test_create_user(self):
        """POST /api/users/ with valid data → 201."""
        data = {
            'username': 'new_admin',
            'email': 'new@example.com',
            'password': 'secure_pass_456',
            'first_name': 'New',
            'last_name': 'Admin',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'new_admin')
        self.assertNotIn('password', response.data)  # write-only

        # Verify password is hashed
        user = User.objects.get(username='new_admin')
        self.assertTrue(user.check_password('secure_pass_456'))

    def test_create_user_without_password(self):
        """POST /api/users/ without password → 400."""
        data = {
            'username': 'no_pass',
            'email': 'no@example.com',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_user(self):
        """GET /api/users/{id}/ → 200 + detail."""
        url = self._detail_url(self.admin.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin')

    def test_update_user(self):
        """PATCH /api/users/{id}/ → 200 + updated fields."""
        url = self._detail_url(self.admin.id)
        response = self.client.patch(url, {'first_name': 'Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')

    def test_update_user_password(self):
        """PATCH /api/users/{id}/ with new password → password hashed."""
        url = self._detail_url(self.admin.id)
        response = self.client.patch(url, {'password': 'new_pass_789'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('password', response.data)

        # Verify new password works
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('new_pass_789'))

    def test_delete_user_soft_delete(self):
        """DELETE /api/users/{id}/ → 204 + is_active=False."""
        # Create a user to delete
        user = User.objects.create_user(
            username='to_delete',
            email='delete@example.com',
            password='delete_pass',
        )
        url = self._detail_url(user.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # User still exists but is inactive
        user.refresh_from_db()
        self.assertFalse(user.is_active)
