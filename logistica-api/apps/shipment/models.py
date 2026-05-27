from django.db import models
from apps.base.models import BaseModel


class Shipment(BaseModel):
    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(
        'customer.Customer',
        on_delete=models.PROTECT,
    )
    origin_warehouse = models.ForeignKey(
        'warehouse.Warehouse',
        on_delete=models.PROTECT,
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('picked_up', 'Picked Up'),
            ('in_transit', 'In Transit'),
            ('delivered', 'Delivered'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending',
    )
    shipping_date = models.DateField(blank=True, null=True)
    estimated_delivery_date = models.DateField(blank=True, null=True)
    actual_delivery_date = models.DateField(blank=True, null=True)
    route = models.ForeignKey(
        'route.Route',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    observations = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'shipment_shipments'
        verbose_name = 'Shipment'
        verbose_name_plural = 'Shipments'
        ordering = ['-created_at']

    def __str__(self):
        return self.tracking_number


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
    )
    quantity = models.IntegerField()
    unit_price_at_shipping = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'shipment_items'
        verbose_name = 'Shipment Item'
        verbose_name_plural = 'Shipment Items'

    def __str__(self):
        return f'{self.shipment.tracking_number} - {self.product.name} x{self.quantity}'
