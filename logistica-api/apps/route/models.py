from django.db import models
from apps.base.models import BaseModel


class Route(BaseModel):
    name = models.CharField(max_length=255)
    transport = models.ForeignKey(
        'transport.Transport',
        on_delete=models.PROTECT,
    )
    driver = models.ForeignKey(
        'driver.Driver',
        on_delete=models.PROTECT,
    )
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('planned', 'Planned'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='planned',
    )

    class Meta:
        db_table = 'route_routes'
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'
        ordering = ['name']

    def __str__(self):
        return self.name


class Stop(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops',
    )
    order = models.IntegerField()
    warehouse = models.ForeignKey(
        'warehouse.Warehouse',
        on_delete=models.PROTECT,
    )
    arrival_time = models.DateTimeField(blank=True, null=True)
    departure_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('arrived', 'Arrived'),
            ('completed', 'Completed'),
        ],
        default='pending',
    )

    class Meta:
        db_table = 'route_stops'
        verbose_name = 'Stop'
        verbose_name_plural = 'Stops'
        ordering = ['route', 'order']

    def __str__(self):
        return f'{self.route.name} - Stop #{self.order}'
