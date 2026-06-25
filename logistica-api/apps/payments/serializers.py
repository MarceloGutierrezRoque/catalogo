from rest_framework import serializers
from apps.payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'stripe_session_id', 'stripe_payment_intent_id',
                            'amount', 'currency', 'status', 'created_at', 'updated_at']


class LineItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class CreateCheckoutSessionSerializer(serializers.Serializer):
    items = LineItemSerializer(many=True, min_length=1)
    success_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)
    customer_email = serializers.EmailField(required=False, allow_blank=True)


class CheckoutSessionResponseSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    session_url = serializers.URLField()
