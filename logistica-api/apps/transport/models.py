from django.db import models
from apps.base.models import BaseModel


class Transport(BaseModel):
    plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    capacity_volume = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'transport_transports'
        verbose_name = 'Transport'
        verbose_name_plural = 'Transports'
        ordering = ['plate']

    def __str__(self):
        return f'{self.plate} - {self.brand} {self.model}'
