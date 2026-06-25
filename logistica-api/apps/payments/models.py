from django.db import models
from apps.base.models import BaseModel


class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='payments',
    )
    stripe_session_id = models.CharField(max_length=255, db_index=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    amount = models.IntegerField(help_text='Amount in cents (e.g., 1299 = $12.99)')
    currency = models.CharField(max_length=3, default='usd')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    customer_email = models.EmailField(max_length=254, blank=True, null=True)

    class Meta:
        db_table = 'payments_payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment {self.stripe_session_id} — {self.status} ({self.amount} {self.currency})'
