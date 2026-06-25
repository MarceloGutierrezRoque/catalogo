from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    CONTACTED = 'contacted', 'Contacted'
    CLOSED = 'closed', 'Closed'
    CANCELLED = 'cancelled', 'Cancelled'


class Order(models.Model):
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    observations = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'orders'

    def __str__(self):
        return f'Order #{self.id} — {self.customer_name} ({self.status})'
