from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.viewsets import ModelViewSet
from apps.users.serializers import UserSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar administradores",
        tags=["Usuarios (Admin)"],
    ),
    create=extend_schema(
        summary="Crear administrador",
        description="Crea un nuevo usuario administrador. El password se hashea automáticamente.",
        tags=["Usuarios (Admin)"],
    ),
    retrieve=extend_schema(
        summary="Detalle de administrador",
        tags=["Usuarios (Admin)"],
    ),
    update=extend_schema(
        summary="Actualizar administrador completo",
        tags=["Usuarios (Admin)"],
    ),
    partial_update=extend_schema(
        summary="Actualizar administrador parcialmente",
        tags=["Usuarios (Admin)"],
    ),
    destroy=extend_schema(
        summary="Desactivar administrador",
        description="Soft-delete: marca is_active=False en lugar de eliminar.",
        tags=["Usuarios (Admin)"],
    ),
)
class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])
