from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class AuthenticationTests(TestCase):
    """Test JWT authentication endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.password = 'test_pass_123'
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password=self.password,
            is_staff=True,
        )
        self.token_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')

    def test_obtain_token_valid_credentials(self):
        """Valid credentials → 200 + access + refresh tokens."""
        response = self.client.post(self.token_url, {
            'username': 'admin',
            'password': self.password,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_invalid_credentials(self):
        """Invalid credentials → 401."""
        response = self.client.post(self.token_url, {
            'username': 'admin',
            'password': 'wrong_password',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_missing_fields(self):
        """Missing fields → 400."""
        response = self.client.post(self.token_url, {
            'username': 'admin',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_token_valid(self):
        """Valid refresh token → 200 + new access token."""
        # First obtain tokens
        res = self.client.post(self.token_url, {
            'username': 'admin',
            'password': self.password,
        })
        refresh_token = res.data['refresh']

        # Refresh
        response = self.client.post(self.refresh_url, {
            'refresh': refresh_token,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_token_invalid(self):
        """Invalid refresh token → 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': 'invalid_token_here',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
