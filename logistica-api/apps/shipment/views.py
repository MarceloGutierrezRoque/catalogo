from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from apps.shipment.models import Shipment, ShipmentItem
from apps.shipment.serializers import ShipmentSerializer, ShipmentItemSerializer


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse'
    ).prefetch_related('items__product').all()
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class ShipmentItemViewSet(viewsets.ModelViewSet):
    queryset = ShipmentItem.objects.select_related('shipment', 'product').all()
    serializer_class = ShipmentItemSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
