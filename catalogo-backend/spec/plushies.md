# Spec: plushies

## Descripción

Entidad principal del catálogo. Modelo `Plushie` con imagen, precio, stock y flags de visibilidad (activo/eliminado).

Dos vistas:
- **Pública** (AllowAny): solo plushies activos y no eliminados.
- **Admin** (IsAuthenticated): CRUD completo sobre todos los plushies.

---

## Modelo — `plushies_plushie`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `name` | CharField(200) | NOT NULL | Nombre del peluche |
| `description` | TextField | NULL | Descripción |
| `price` | DecimalField(10,2) | NOT NULL | Precio actual |
| `image` | ImageField | NULL | Ruta de imagen |
| `stock` | IntegerField | NOT NULL, default=0 | Stock disponible |
| `is_active` | BooleanField | NOT NULL, default=True | False = oculto en catálogo público |
| `is_deleted` | BooleanField | NOT NULL, default=False | True = oculto en panel admin |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

---

## Endpoints

### Públicos (AllowAny)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/plushies/` | Lista plushies activos (is_active=True, is_deleted=False) |
| GET | `/api/plushies/{id}/` | Detalle de plushie activo |

### Admin (JWT required)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/plushies/` | Lista todos (incluye inactivos/eliminados) |
| POST | `/api/admin/plushies/` | Crear plushie |
| GET | `/api/admin/plushies/{id}/` | Detalle |
| PUT | `/api/admin/plushies/{id}/` | Actualizar completo |
| PATCH | `/api/admin/plushies/{id}/` | Actualizar parcial |
| DELETE | `/api/admin/plushies/{id}/` | Soft-delete (is_deleted=True) |
| PATCH | `/api/admin/plushies/{id}/activate/` | Activar (is_active=True) |
| PATCH | `/api/admin/plushies/{id}/deactivate/` | Desactivar (is_active=False) |

---

## Archivos a implementar

### `apps/plushies/models.py`

```python
from django.db import models

class Plushie(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='plushies/', blank=True, null=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
```

### `apps/plushies/serializers.py`

Dos serializers:

```python
from rest_framework import serializers
from apps.plushies.models import Plushie

class PlushiePublicSerializer(serializers.ModelSerializer):
    """Serializer público — solo lectura."""
    class Meta:
        model = Plushie
        fields = ['id', 'name', 'description', 'price', 'image', 'stock', 'created_at']
        read_only_fields = fields

class PlushieAdminSerializer(serializers.ModelSerializer):
    """Serializer admin — lectura/escritura completa."""
    class Meta:
        model = Plushie
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### `apps/plushies/views.py`

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.plushies.models import Plushie
from apps.plushies.serializers import PlushiePublicSerializer, PlushieAdminSerializer

class PlushiePublicViewSet(viewsets.ReadOnlyModelViewSet):
    """Vista pública — solo plushies activos y no eliminados."""
    queryset = Plushie.objects.filter(is_active=True, is_deleted=False)
    serializer_class = PlushiePublicSerializer
    permission_classes = [AllowAny]

class PlushieAdminViewSet(viewsets.ModelViewSet):
    """Vista admin — CRUD completo, incluye inactivos/eliminados."""
    queryset = Plushie.objects.all()
    serializer_class = PlushieAdminSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        """Soft-delete: marca is_deleted=True."""
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])

    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        plushie = self.get_object()
        plushie.is_active = True
        plushie.save(update_fields=['is_active'])
        return Response({'status': 'activated'})

    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        plushie = self.get_object()
        plushie.is_active = False
        plushie.save(update_fields=['is_active'])
        return Response({'status': 'deactivated'})
```

### `apps/plushies/urls.py`

```python
from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.plushies.views import PlushiePublicViewSet, PlushieAdminViewSet

public_router = DefaultRouter()
public_router.register(r'plushies', PlushiePublicViewSet, basename='plushie-public')

admin_router = DefaultRouter()
admin_router.register(r'admin/plushies', PlushieAdminViewSet, basename='plushie-admin')

urlpatterns = public_router.urls + admin_router.urls
```

### `config/urls.py`

Agregar:

```python
path('api/', include('apps.plushies.urls')),
```

### `apps/plushies/admin.py`

```python
from django.contrib import admin
from apps.plushies.models import Plushie

@admin.register(Plushie)
class PlushieAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'is_active', 'is_deleted', 'created_at']
    list_filter = ['is_active', 'is_deleted']
```

### `apps/plushies/tests.py`

Pruebas:

**Público:**
- GET `/api/plushies/` sin token → 200 (AllowAny)
- Solo devuelve is_active=True, is_deleted=False
- GET `/api/plushies/{id}/` → 200 si activo, 404 si inactivo/eliminado

**Admin:**
- GET `/api/admin/plushies/` sin token → 401
- GET `/api/admin/plushies/` con token → 200 (incluye inactivos/eliminados)
- POST `/api/admin/plushies/` con token → 201
- DELETE → soft-delete (is_deleted=True)
- PATCH activate/deactivate → cambia flag

---

## Configuración de media

En `config/urls.py`, agregar para servir imágenes en dev:

```python
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## Criterios de aceptación

1. Endpoints públicos funcionan sin autenticación.
2. Endpoints admin requieren JWT.
3. Catálogo público solo muestra `is_active=True` y `is_deleted=False`.
4. DELETE admin marca `is_deleted=True` (no borra físicamente).
5. Actions `activate`/`deactivate` cambian `is_active`.
6. Todos los tests pasan.
