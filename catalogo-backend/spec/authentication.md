# Spec: authentication

## Descripción

Módulo de control de acceso. Provee autenticación mediante JWT (SimpleJWT) sobre `auth_user`. Solo administradores autenticados acceden al sistema.

No crea modelos propios — reutiliza `auth_user` de Django + `rest_framework_simplejwt`.

---

## Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/token/` | AllowAny | Obtener par access + refresh token |
| POST | `/api/token/refresh/` | AllowAny | Refrescar access token |

---

## Archivos a implementar

### `apps/authentication/urls.py`

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

- Usa las vistas de SimpleJWT directamente (no requiere views personalizadas).
- Namespace: ninguno (se registrarán en `config/urls.py` con prefijo `api/`).

### `apps/authentication/views.py`

- No requiere vistas personalizadas. SimpleJWT provee `TokenObtainPairView` y `TokenRefreshView`.

### `apps/authentication/serializers.py`

- No requiere serializers personalizados. SimpleJWT maneja la validación internamente.

### `apps/authentication/permissions.py` (opcional, por ahora vacío)

- No necesario. La configuración global `DEFAULT_PERMISSION_CLASSES: IsAuthenticated` ya está en `settings.py`.
- Para los endpoints públicos (`token/`, `token/refresh/`), SimpleJWT internamente usa `AllowAny`.

### `apps/authentication/admin.py`

- Vacío (no hay modelos propios que registrar).

### `apps/authentication/models.py`

- Vacío (sin modelos propios).

### `apps/authentication/tests.py`

- Pruebas básicas:
  - Obtener token con credenciales válidas → 200 + access + refresh
  - Obtener token con credenciales inválidas → 401
  - Refrescar token con refresh válido → 200 + nuevo access
  - Refrescar token con refresh inválido → 401

---

## Configuración en `config/urls.py`

Agregar al archivo existente:

```python
from django.urls import include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
]
```

---

## Permisos

- `AllowAny` para los endpoints de token (SimpleJWT lo maneja internamente).
- `IsAuthenticated` por defecto para todos los demás endpoints (ya configurado en `settings.py`).

---

## Dependencias

- `rest_framework_simplejwt` (ya instalado y configurado).

---

## Criterios de aceptación

1. `POST /api/token/` con usuario/admin válido → 200 + `access` + `refresh`
2. `POST /api/token/` con credenciales incorrectas → 401
3. `POST /api/token/refresh/` con refresh válido → 200 + nuevo `access`
4. `POST /api/token/refresh/` con refresh inválido → 401
5. Los tests pasan con `python manage.py test apps.authentication`
