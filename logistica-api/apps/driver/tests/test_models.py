from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.models import User
from apps.driver.models import Driver


class DriverModelTests(TestCase):
    """Tests for the Driver model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='carlos.lopez',
            first_name='Carlos',
            last_name='López',
            email='carlos@transportes.cl',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-12345',
            phone='+56 9 1111 2222',
            email='carlos@transportes.cl',
            hire_date='2024-06-15',
        )

    # ──────────────────────────────────────────────
    # HAPPY PATH
    # ──────────────────────────────────────────────

    def test_str_representation(self):
        """String representation shows full name and license number."""
        expected = 'Carlos López (LIC-12345)'
        self.assertEqual(str(self.driver), expected)

    def test_str_without_full_name(self):
        """String uses username when full name is empty."""
        user_no_name = User.objects.create_user(username='jdoe')
        driver = Driver.objects.create(
            user=user_no_name,
            license_number='LIC-99999',
        )
        expected = 'jdoe (LIC-99999)'
        self.assertEqual(str(driver), expected)

    def test_create_valid_instance(self):
        """Creation with all fields succeeds."""
        driver = Driver.objects.get(pk=self.driver.pk)
        self.assertEqual(driver.license_number, 'LIC-12345')
        self.assertEqual(driver.user.username, 'carlos.lopez')
        self.assertEqual(driver.email, 'carlos@transportes.cl')
        self.assertEqual(driver.phone, '+56 9 1111 2222')

    def test_create_minimal_instance(self):
        """Creation with only required fields (user, license_number) succeeds."""
        user = User.objects.create_user(username='minimal.user')
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-MIN',
        )
        self.assertIsNotNone(driver.pk)
        self.assertIsNone(driver.phone)
        self.assertIsNone(driver.email)
        self.assertIsNone(driver.hire_date)

    def test_default_values(self):
        """Defaults: is_active=True, is_available=True."""
        self.assertTrue(self.driver.is_active)
        self.assertTrue(self.driver.is_available)

    # ──────────────────────────────────────────────
    # UNHAPPY PATH
    # ──────────────────────────────────────────────

    def test_license_number_required(self):
        """Setting license_number=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user,
                license_number=None,
            )

    def test_unique_license_number(self):
        """Duplicate license_number raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=User.objects.create_user(username='otro.user'),
                license_number='LIC-12345',
            )

    def test_user_required(self):
        """Setting user=None raises IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=None,
                license_number='LIC-NOUSER',
            )

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────

    def test_nullable_fields_can_be_null(self):
        """Fields with null=True accept None."""
        user = User.objects.create_user(username='null.driver')
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-NULL',
            phone=None,
            email=None,
            hire_date=None,
        )
        self.assertIsNone(driver.phone)
        self.assertIsNone(driver.email)
        self.assertIsNone(driver.hire_date)

    def test_soft_delete(self):
        """is_active=False: record still exists in DB."""
        driver_id = self.driver.pk
        self.driver.is_active = False
        self.driver.save()
        self.assertIsNotNone(Driver.all_objects.get(pk=driver_id))
        self.assertFalse(Driver.all_objects.get(pk=driver_id).is_active)

    def test_user_on_delete_protect(self):
        """Deleting a User with Driver raises ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.user.delete()

    def test_is_available_false(self):
        """is_available=False is accepted."""
        user = User.objects.create_user(username='busy.driver')
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-BUSY',
            is_available=False,
        )
        self.assertFalse(driver.is_available)
