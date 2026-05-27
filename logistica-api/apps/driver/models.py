from django.db import models
from apps.base.models import BaseModel


class Driver(BaseModel):
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.PROTECT,
    )
    license_number = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'driver_drivers'
        verbose_name = 'Driver'
        verbose_name_plural = 'Drivers'
        ordering = ['user__username']

    def __str__(self):
        return f'{self.user.get_full_name() or self.user.username} ({self.license_number})'
