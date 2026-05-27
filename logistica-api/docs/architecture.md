# Arquitectura de Desarrollo - logistica-api (MVP)

## 1. Estructura de Apps

```
logistica-api/
├── config/           # Configuración del proyecto Django
├── apps/
│   ├── __init__.py
│   ├── products/     # → products_products
│   ├── customer/     # → customer_customers
│   ├── shipment/     # → shipment_shipments, shipment_items
│   ├── warehouse/    # → warehouse_warehouses
│   ├── suppliers/    # → suppliers_suppliers
│   ├── transport/    # → transport_transports
│   ├── driver/       # → driver_drivers
│   └── route/        # → route_routes, route_stops
├── db-schema.md
├── manage.py
└── db.sqlite3
```

## 2. Estándar por App

Cada app sigue este patrón:

```
<app>/
├── models.py         # Modelos (herencia de models.Model)
├── serializers.py   # Serializers (ModelSerializer)
├── views.py          # Views (ModelViewSet o APIView)
├── urls.py           # URL routing interno
├── admin.py          # Configuración admin
├── apps.py           # Configuración app
└── tests/            # Tests unitarios
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    └── test_views.py
```

## 3. Base Model Común

```python
class BaseModel(models.Model):
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

## 4. Orden de Desarrollo

### Fase 1 - Fundamentos
1. **warehouse** - Punto de partida y almacenamiento
2. **suppliers** - Empresas que nos venden productos
3. **products** - Productos de tecnología

### Fase 2 - Clientes y Envíos
4. **customer** - Cliente (empresa o persona) que genera envíos
5. **shipment** - Unidad central de negocio

### Fase 3 - Logística
6. **driver** - Persona asignada al transporte
7. **transport** - Medio de entrega al cliente
8. **route** - Secuencia de paradas del transporte

## 5. Configuración DRF

En `config/settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'apps.products',
    'apps.warehouse',
    # etc.
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

## 6. Conventions de Código

| Aspecto | Convention |
|---------|------------|
| Modelos | `class Customer(models.Model):` |
| Tablas DB | `class Meta: db_table = 'customer_customers'` |
| Serializers | `class CustomerSerializer(serializers.ModelSerializer):` |
| Views | `class CustomerViewSet(ModelViewSet):` |
| URLs | Plural: `/api/customers/`, `/api/customers/{id}/` |
| Nombres código | snake_case |

## 7. Auth

- **SimpleJWT** para autenticación JWT
- Endpoints: `/api/token/`, `/api/token/refresh/`