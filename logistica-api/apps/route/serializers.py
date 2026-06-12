from rest_framework import serializers
from apps.route.models import Route, Stop


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
