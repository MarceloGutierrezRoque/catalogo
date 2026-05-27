# Spec: Base Project Setup

## Objetivo

Configurar infraestructura base del proyecto Django antes de empezar módulos de dominio.

## Tareas

### 1. Instalar djangorestframework-simplejwt

- `pip install djangorestframework-simplejwt`
- Agregar a `requirements.txt`

### 2. Configurar `config/settings.py`

Agregar a `INSTALLED_APPS`:
- `'rest_framework'`
- `'apps.base'`

Agregar configuración DRF con JWT:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 3. Crear `apps/` package

- Crear `apps/__init__.py` (vacío)
- Crear `apps/base/` con `__init__.py`
- Crear `apps/base/models.py` con `BaseModel`
- Crear `apps/base/apps.py` con `BaseConfig`

### 4. BaseModel

```python
class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

### 5. Configurar `config/urls.py`

Agregar endpoints JWT:
- `POST /api/token/` → `TokenObtainPairView`
- `POST /api/token/refresh/` → `TokenRefreshView`
