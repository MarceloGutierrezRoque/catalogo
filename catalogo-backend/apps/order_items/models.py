from django.db import models


class OrderItem(models.Model):
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='items'
    )
    plushie = models.ForeignKey(
        'plushies.Plushie',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = 'order items'

    def __str__(self):
        return f'{self.quantity}x {self.plushie.name} @ {self.unit_price}'
