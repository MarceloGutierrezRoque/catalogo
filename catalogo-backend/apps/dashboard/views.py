from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from apps.plushies.models import Plushie
from apps.orders.models import Order, OrderStatus
from apps.dashboard.serializers import DashboardSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Dashboard — estadísticas",
        description=(
            "Resumen de pedidos agrupados por estado y conteo de peluches activos/inactivos. "
            "Solo accesible por administradores autenticados."
        ),
        tags=["Dashboard (Admin)"],
        responses={200: DashboardSerializer},
    )
    def get(self, request):
        orders_stats = Order.objects.aggregate(
            pending=Count('id', filter=Q(status=OrderStatus.PENDING)),
            contacted=Count('id', filter=Q(status=OrderStatus.CONTACTED)),
            closed=Count('id', filter=Q(status=OrderStatus.CLOSED)),
            cancelled=Count('id', filter=Q(status=OrderStatus.CANCELLED)),
            total=Count('id'),
        )

        plushies_stats = Plushie.objects.aggregate(
            active=Count('id', filter=Q(is_active=True, is_deleted=False)),
            inactive=Count('id', filter=Q(is_active=False, is_deleted=False)),
            total=Count('id', filter=Q(is_deleted=False)),
        )

        data = {
            'orders': orders_stats,
            'plushies': plushies_stats,
        }
        serializer = DashboardSerializer(data)
        return Response(serializer.data)
