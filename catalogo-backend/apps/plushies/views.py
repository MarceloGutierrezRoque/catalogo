from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.plushies.models import Plushie
from apps.plushies.serializers import (
    PlushiePublicSerializer,
    PlushieAdminSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary="Listar peluches activos",
        description="Devuelve solo peluches con is_active=True y is_deleted=False.",
        tags=["Catálogo (Público)"],
    ),
    retrieve=extend_schema(
        summary="Detalle de peluche",
        description="Obtiene un peluche individual por ID.",
        tags=["Catálogo (Público)"],
    ),
)
class PlushiePublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plushie.objects.filter(is_active=True, is_deleted=False)
    serializer_class = PlushiePublicSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    list=extend_schema(
        summary="Listar todos los peluches",
        description="Incluye inactivos y eliminados. Solo admin.",
        tags=["Plushies (Admin)"],
    ),
    retrieve=extend_schema(
        summary="Detalle de peluche (admin)",
        tags=["Plushies (Admin)"],
    ),
    create=extend_schema(
        summary="Crear peluche",
        tags=["Plushies (Admin)"],
    ),
    update=extend_schema(
        summary="Actualizar peluche completo",
        tags=["Plushies (Admin)"],
    ),
    partial_update=extend_schema(
        summary="Actualizar peluche parcialmente",
        tags=["Plushies (Admin)"],
    ),
    destroy=extend_schema(
        summary="Eliminar peluche",
        description="Borra físicamente el registro de la base de datos.",
        tags=["Plushies (Admin)"],
    ),
)
class PlushieAdminViewSet(viewsets.ModelViewSet):
    queryset = Plushie.objects.all()
    serializer_class = PlushieAdminSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Activar peluche",
        description="Cambia is_active a True. El peluche vuelve al catálogo público.",
        tags=["Plushies (Admin)"],
        request=None,
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}},
    )
    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        plushie = self.get_object()
        plushie.is_active = True
        plushie.save(update_fields=['is_active'])
        return Response({'status': 'activated'})

    @extend_schema(
        summary="Desactivar peluche",
        description="Cambia is_active a False. El peluche se oculta del catálogo público.",
        tags=["Plushies (Admin)"],
        request=None,
        responses={200: {"type": "object", "properties": {"status": {"type": "string"}}}},
    )
    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        plushie = self.get_object()
        plushie.is_active = False
        plushie.save(update_fields=['is_active'])
        return Response({'status': 'deactivated'})
