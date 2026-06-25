from django.contrib import admin
from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'amount', 'currency', 'status', 'customer_email', 'created_at', 'is_active']
    search_fields = ['stripe_session_id', 'stripe_payment_intent_id', 'customer_email', 'product__name']
    list_filter = ['status', 'currency', 'is_active', 'created_at']
    readonly_fields = ['stripe_session_id', 'stripe_payment_intent_id', 'amount', 'currency', 'created_at', 'updated_at']
