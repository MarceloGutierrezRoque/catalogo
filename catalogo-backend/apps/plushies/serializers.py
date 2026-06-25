from rest_framework import serializers
from apps.plushies.models import Plushie


class PlushiePublicSerializer(serializers.ModelSerializer):
    """Serializer público — solo lectura."""

    class Meta:
        model = Plushie
        fields = ['id', 'name', 'description', 'price', 'image', 'stock', 'created_at']
        read_only_fields = fields


class PlushieAdminSerializer(serializers.ModelSerializer):
    """Serializer admin — lectura/escritura completa."""

    class Meta:
        model = Plushie
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
