from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, mixins, viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Order
from apps.orders.serializers import (
    OrderCreateSerializer,
    OrderAdminListSerializer,
    OrderAdminDetailSerializer,
    OrderStatusUpdateSerializer,
)


class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Crear pedido (público)",
        description=(
            "Crea un nuevo pedido con items anidados. "
            "El precio de cada item se congela al valor actual del peluche. "
            "No requiere autenticación. Valida stock disponible y que el peluche esté activo."
        ),
        tags=["Órdenes (Público)"],
        request=OrderCreateSerializer,
        responses={201: OrderCreateSerializer},
    )
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        summary="Listar pedidos (admin)",
        description="Devuelve todos los pedidos sin items anidados.",
        tags=["Órdenes (Admin)"],
    ),
    retrieve=extend_schema(
        summary="Detalle de pedido con items",
        description="Devuelve el pedido completo con sus items anidados.",
        tags=["Órdenes (Admin)"],
    ),
    destroy=extend_schema(
        summary="Eliminar pedido (soft-delete)",
        description="Marca is_deleted=True. No elimina físicamente.",
        tags=["Órdenes (Admin)"],
    ),
)
class OrderAdminViewSet(mixins.DestroyModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrderAdminDetailSerializer
        if self.action == 'partial_update':
            return OrderStatusUpdateSerializer
        return OrderAdminListSerializer

    @extend_schema(
        summary="Actualizar estado del pedido",
        description=(
            "Actualiza solo el estado del pedido. "
            "Todas las transiciones de estado están permitidas "
            "sin restricciones (any → any)."
        ),
        tags=["Órdenes (Admin)"],
        request=OrderStatusUpdateSerializer,
        responses={200: OrderAdminDetailSerializer},
    )
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderAdminDetailSerializer(instance).data)
