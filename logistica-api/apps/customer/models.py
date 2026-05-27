from django.db import models
from apps.base.models import BaseModel


class Customer(BaseModel):
    name = models.CharField(max_length=255)
    customer_type = models.CharField(max_length=20)
    document_type = models.CharField(max_length=20, blank=True, null=True)
    document_number = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'customer_customers'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['name']

    def __str__(self):
        return self.name
