from rest_framework.permissions import BasePermission


class IsSuperUser(BasePermission):
    """Permite acceso solo a superusuarios (is_superuser=True)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)
