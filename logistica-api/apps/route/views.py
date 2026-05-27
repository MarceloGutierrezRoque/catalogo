from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.route.models import Route, Stop
from apps.route.serializers import RouteSerializer, StopSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related(
        'transport', 'driver'
    ).prefetch_related('stops__warehouse').all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class StopViewSet(viewsets.ModelViewSet):
    queryset = Stop.objects.select_related('route', 'warehouse').all()
    serializer_class = StopSerializer
    permission_classes = [IsAuthenticated]
