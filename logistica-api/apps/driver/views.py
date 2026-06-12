from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from apps.driver.models import Driver
from apps.driver.serializers import DriverSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
