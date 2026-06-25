from rest_framework import serializers
from apps.order_items.models import OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    plushie_id = serializers.IntegerField(write_only=True)
    plushie_name = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    def get_plushie_name(self, obj):
        return obj.plushie.name if obj.plushie else "[Eliminado]"

    class Meta:
        model = OrderItem
        fields = [
            'id', 'plushie_id', 'plushie_name',
            'quantity', 'unit_price'
        ]
