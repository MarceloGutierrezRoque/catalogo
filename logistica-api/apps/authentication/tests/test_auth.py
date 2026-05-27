from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import jwt
from django.conf import settings


class AuthTests(APITestCase):
    """Tests for JWT authentication endpoints (/api/token/ and /api/token/refresh/)."""

    def setUp(self):
        self.client = APIClient()
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            username='testuser',
            password=self.password,
            email='test@example.com',
            is_active=True,
        )
        self.inactive_user = User.objects.create_user(
            username='inactiveuser',
            password=self.password,
            is_active=False,
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_login_success(self):
        """Valid credentials return 200 with access and refresh tokens."""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': self.password,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertIsInstance(response.data['refresh'], str)

    def test_refresh_token_success(self):
        """Valid refresh token returns 200 with new access token."""
        login_resp = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': self.password,
        }, format='json')
        refresh_token = login_resp.data['refresh']

        response = self.client.post('/api/token/refresh/', {
            'refresh': refresh_token,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        # New access token should be a different string
        self.assertNotEqual(response.data['access'], login_resp.data['access'])

    def test_access_protected_endpoint_with_valid_token(self):
        """Valid Bearer token grants access to a protected endpoint."""
        login_resp = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': self.password,
        }, format='json')
        access_token = login_resp.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        # Hit a known protected endpoint (warehouse list)
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_login_invalid_credentials(self):
        """Wrong password returns 401."""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'wrongpassword',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_inactive_user(self):
        """Inactive user cannot obtain tokens — returns 401."""
        response = self.client.post('/api/token/', {
            'username': 'inactiveuser',
            'password': self.password,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Non-existent username returns 401."""
        response = self.client.post('/api/token/', {
            'username': 'ghost',
            'password': 'anything',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_invalid(self):
        """Malformed refresh token returns 401."""
        response = self.client.post('/api/token/refresh/', {
            'refresh': 'not-a-valid-token',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_expired(self):
        """Expired refresh token returns 401."""
        # Create an expired refresh token manually
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        # Manually set exp to 1 second ago
        refresh.set_exp(lifetime=timedelta(seconds=-1))

        response = self.client.post('/api/token/refresh/', {
            'refresh': str(refresh),
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_without_token(self):
        """Request without Authorization header returns 401."""
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_with_invalid_token(self):
        """Malformed Bearer token returns 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid-token-here')
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_login_missing_fields(self):
        """Missing username or password returns 400."""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post('/api/token/', {
            'password': self.password,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post('/api/token/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_missing_field(self):
        """Missing refresh field returns 400."""
        response = self.client.post('/api/token/refresh/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_access_with_expired_token(self):
        """Expired access token returns 401."""
        from rest_framework_simplejwt.tokens import AccessToken
        access = AccessToken.for_user(self.user)
        access.set_exp(lifetime=timedelta(seconds=-1))

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')
        response = self.client.get('/api/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_extra_fields(self):
        """Extra fields in login payload are ignored (still succeeds)."""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': self.password,
            'extra_field': 'should_be_ignored',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
