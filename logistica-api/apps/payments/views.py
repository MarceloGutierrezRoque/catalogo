import stripe
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiExample
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import Payment
from apps.payments.serializers import (
    PaymentSerializer,
    CreateCheckoutSessionSerializer,
    CheckoutSessionResponseSerializer,
)
from apps.products.models import Product


@extend_schema_view(
    list=extend_schema(tags=['payments']),
    retrieve=extend_schema(tags=['payments']),
)
class PaymentViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    List / Retrieve payments. Read-only for authenticated users.
    """
    queryset = Payment.objects.select_related('product').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(
    tags=['payments'],
    request=CreateCheckoutSessionSerializer,
    responses={
        201: CheckoutSessionResponseSerializer,
        400: OpenApiResponse(description='Invalid input or product not synced'),
        404: OpenApiResponse(description='Product not found or inactive'),
    },
    examples=[
        OpenApiExample(
            'Minimal request — URLs from env defaults',
            value={
                'items': [{'product_id': 1, 'quantity': 2}],
            },
            request_only=True,
        ),
        OpenApiExample(
            'Full request — single product with email',
            value={
                'items': [{'product_id': 1, 'quantity': 2}],
                'success_url': 'https://example.com/success',
                'cancel_url': 'https://example.com/cancel',
                'customer_email': 'buyer@example.com',
            },
            request_only=True,
        ),
        OpenApiExample(
            'Full request — multiple products',
            value={
                'items': [
                    {'product_id': 1, 'quantity': 1},
                    {'product_id': 2, 'quantity': 3},
                ],
                'success_url': 'https://example.com/success',
                'cancel_url': 'https://example.com/cancel',
            },
            request_only=True,
        ),
        OpenApiExample(
            'Valid response',
            value={
                'session_id': 'cs_test_a1b2c3d4',
                'session_url': 'https://checkout.stripe.com/cs_test_a1b2c3d4',
            },
            response_only=True,
        ),
    ],
)
class CreateCheckoutSessionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data['items']
        success_url = serializer.validated_data.get('success_url') or settings.PAYMENT_SUCCESS_URL
        cancel_url = serializer.validated_data.get('cancel_url') or settings.PAYMENT_CANCEL_URL
        customer_email = serializer.validated_data.get('customer_email', '')

        product_ids = [item['product_id'] for item in items]
        products = {
            p.id: p
            for p in Product.objects.filter(id__in=product_ids, is_active=True)
        }

        for item in items:
            product = products.get(item['product_id'])
            if not product:
                return Response(
                    {'error': f'Product {item["product_id"]} not found or inactive'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if not product.stripe_price_id:
                return Response(
                    {'error': f'Product {product.name} not synced to Stripe. Run sync_products_to_stripe first.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = [
            {
                'price': products[item['product_id']].stripe_price_id,
                'quantity': item['quantity'],
            }
            for item in items
        ]

        session_params = {
            'line_items': line_items,
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
        }

        if customer_email:
            session_params['customer_email'] = customer_email

        # NOTE: payment_method_types intentionally omitted — Stripe dynamic payment methods
        session = stripe.checkout.Session.create(**session_params)

        # Create one Payment per product line item
        for item in items:
            product = products[item['product_id']]
            unit_amount = int(product.unit_price * 100) if product.unit_price else 0
            Payment.objects.create(
                product=product,
                stripe_session_id=session.id,
                amount=unit_amount * item['quantity'],
                currency='usd',
                customer_email=customer_email or None,
                status=Payment.Status.PENDING,
            )

        output = CheckoutSessionResponseSerializer({
            'session_id': session.id,
            'session_url': session.url,
        })
        return Response(output.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['payments'],
    request=None,
    responses={
        200: OpenApiResponse(description='Webhook processed successfully'),
        400: OpenApiResponse(description='Invalid payload or signature'),
        404: OpenApiResponse(description='Payment session not found'),
    },
    examples=[
        OpenApiExample(
            'Stripe webhook payload',
            value={
                'id': 'evt_test_webhook',
                'type': 'checkout.session.completed',
                'data': {
                    'object': {
                        'id': 'cs_test_session',
                        'payment_intent': 'pi_test_123',
                        'amount_total': 12999,
                        'currency': 'usd',
                        'customer_details': {'email': 'customer@example.com'},
                    },
                },
            },
            request_only=True,
        ),
    ],
    description=(
        'Handles Stripe webhook events. '
        'Requires a valid Stripe signature in the `Stripe-Signature` header. '
        'Currently handles: `checkout.session.completed`.'
    ),
)
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']

            payments = Payment.objects.filter(stripe_session_id=session['id'])
            if not payments.exists():
                return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

            payment_intent = session.get('payment_intent')
            amount_total = session.get('amount_total')
            currency = session.get('currency')
            customer_email = session.get('customer_details', {}).get('email')

            updated = payments.update(
                status=Payment.Status.COMPLETED,
                stripe_payment_intent_id=payment_intent,
                customer_email=customer_email or None,
            )
            if amount_total:
                payments.update(amount=amount_total)
            if currency:
                payments.update(currency=currency)

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
