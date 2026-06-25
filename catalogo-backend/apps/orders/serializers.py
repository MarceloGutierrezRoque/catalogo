from rest_framework import serializers
from apps.orders.models import Order
from apps.order_items.models import OrderItem
from apps.order_items.serializers import OrderItemSerializer
from apps.plushies.models import Plushie


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer público — solo creación de orden con items anidados."""
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'items', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_items(self, items_data):
        """Valida stock, plushie activo, y cantidad mínima."""
        if not items_data:
            raise serializers.ValidationError(
                'Debe incluir al menos un item en el pedido.'
            )

        for item in items_data:
            plushie_id = item.get('plushie_id')
            quantity = item.get('quantity', 0)

            try:
                plushie = Plushie.objects.get(
                    id=plushie_id, is_active=True, is_deleted=False
                )
            except Plushie.DoesNotExist:
                raise serializers.ValidationError(
                    f'Plushie con id {plushie_id} no existe o no está disponible.'
                )

            if quantity < 1:
                raise serializers.ValidationError(
                    f'La cantidad para plushie {plushie_id} debe ser al menos 1.'
                )

            if quantity > plushie.stock:
                raise serializers.ValidationError(
                    f'Stock insuficiente para "{plushie.name}". '
                    f'Disponible: {plushie.stock}, solicitado: {quantity}.'
                )

        return items_data

    def create(self, validated_data):
        """Crea Order + OrderItems con precio congelado."""
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            plushie = Plushie.objects.get(
                id=item_data['plushie_id'],
                is_active=True,
                is_deleted=False
            )
            OrderItem.objects.create(
                order=order,
                plushie=plushie,
                quantity=item_data['quantity'],
                unit_price=plushie.price  # Congelado
            )

        return order


class OrderAdminListSerializer(serializers.ModelSerializer):
    """Serializer admin — lista de pedidos (sin items anidados)."""
    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'is_deleted', 'created_at', 'updated_at'
        ]


class OrderAdminDetailSerializer(serializers.ModelSerializer):
    """Serializer admin — detalle de pedido con items anidados."""
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'status', 'is_deleted', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_name', 'customer_email', 'customer_phone',
            'observations', 'is_deleted', 'items', 'created_at', 'updated_at'
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer admin — solo actualización de status.
    Cualquier transición de estado está permitida."""
    class Meta:
        model = Order
        fields = ['status']
