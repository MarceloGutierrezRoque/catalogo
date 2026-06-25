# Spec: users

## Descripción

CRUD de administradores del sistema. Opera directamente sobre el modelo `auth_user` de Django. No crea modelos propios ni perfiles separados.

Solo accesible para usuarios autenticados (JWT).

---

## Endpoints (admin — JWT required)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users/` | Listar admins |
| POST | `/api/users/` | Crear admin |
| GET | `/api/users/{id}/` | Detalle de admin |
| PUT | `/api/users/{id}/` | Actualizar admin (completo) |
| PATCH | `/api/users/{id}/` | Actualizar admin (parcial) |
| DELETE | `/api/users/{id}/` | Eliminar admin (desactivar `is_active=False`) |

---

## Archivos a implementar

### `apps/users/views.py`

```python
from django.contrib.auth import get_user_model
from rest_framework.viewsets import ModelViewSet
from apps.users.serializers import UserSerializer

User = get_user_model()

class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
```

- `ModelViewSet` estándar para CRUD completo.
- Se recomienda **paginación por defecto** (ya configurada globalmente: 100/page).

### `apps/users/serializers.py`

```python
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'is_active',
            'is_staff', 'is_superuser', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
```

- `password` write-only: nunca se devuelve en respuestas.
- `create()` usa `set_password()` para hashear la contraseña.
- `update()` permite cambio opcional de contraseña.

### `apps/users/urls.py`

```python
from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = router.urls
```

### `config/urls.py`

Agregar al `urlpatterns` existente:

```python
path('api/', include('apps.users.urls')),
```

**Nota:** Como los módulos `authentication` y `users` comparten el prefijo `api/`, se debe registrar ambos includes en `config/urls.py`:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.users.urls')),
]
```

Django permite múltiples `include()` con el mismo prefijo, los combina correctamente.

### `apps/users/admin.py`

Vacío (no es necesario registrar `auth_user` en admin ya que Django lo tiene por defecto).

### `apps/users/models.py`

Vacío (sin modelos propios).

### `apps/users/tests.py`

Pruebas mínimas:
- GET `/api/users/` sin token → 401
- GET `/api/users/` con token → 200 + lista
- POST `/api/users/` con token → 201 + usuario creado
- GET `/api/users/{id}/` con token → 200 + detalle
- PATCH `/api/users/{id}/` con token → 200 + actualizado
- DELETE `/api/users/{id}/` con token → 204 + usuario desactivado
- POST `/api/users/` sin password → 400

---

## Permisos

- `IsAuthenticated` (global, ya configurado en `settings.py`).
- Todos los endpoints requieren JWT.

---

## Criterios de aceptación

1. CRUD completo sobre `auth_user`.
2. Password hasheado al crear/actualizar, nunca devuelto en respuestas.
3. DELETE no borra físicamente, sino que marca `is_active=False`.
4. Todos los tests pasan con `python manage.py test apps.users`.
