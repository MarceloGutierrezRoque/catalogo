from rest_framework import serializers


class DashboardOrderStatsSerializer(serializers.Serializer):
    pending = serializers.IntegerField(read_only=True)
    contacted = serializers.IntegerField(read_only=True)
    closed = serializers.IntegerField(read_only=True)
    cancelled = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)


class DashboardPlushieStatsSerializer(serializers.Serializer):
    active = serializers.IntegerField(read_only=True)
    inactive = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)


class DashboardSerializer(serializers.Serializer):
    orders = DashboardOrderStatsSerializer(read_only=True)
    plushies = DashboardPlushieStatsSerializer(read_only=True)
