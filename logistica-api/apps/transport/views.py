from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from apps.transport.models import Transport
from apps.transport.serializers import TransportSerializer


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.all()
    serializer_class = TransportSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
