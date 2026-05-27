# Spec: transport

## Modelo

### Transport

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo           | Tipo           | Constraints                    |
|-----------------|----------------|--------------------------------|
| id              | INTEGER PK     | Auto                           |
| plate           | VARCHAR(20)    | NOT NULL, unique               |
| vehicle_type    | VARCHAR(50)    | NULL                           |
| brand           | VARCHAR(100)   | NULL                           |
| model           | VARCHAR(100)   | NULL                           |
| year            | INTEGER        | NULL                           |
| capacity_kg     | DECIMAL(10,2)  | NULL                           |
| capacity_volume | DECIMAL(10,2)  | NULL                           |
| is_available    | BOOLEAN        | default=True                   |
| is_active       | BOOLEAN        | default=True                   |
| created_at      | DATETIME       | auto_now_add=True              |
| updated_at      | DATETIME       | auto_now=True                  |

`db_table = 'transport_transports'`

## Serializer

- `TransportSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `TransportViewSet(ModelViewSet)`
- `queryset = Transport.objects.all()`
- `serializer_class = TransportSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `transports/`
- Prefijo: `/api/`

## Admin

- `TransportAdmin(ModelAdmin)`
- `list_display = ['plate', 'vehicle_type', 'brand', 'model', 'year', 'capacity_kg', 'is_available', 'is_active']`
- `search_fields = ['plate', 'brand', 'model']`
- `list_filter = ['vehicle_type', 'is_available', 'is_active']`

## Config

- `apps.py` → `name = 'apps.transport'`
- `INSTALLED_APPS` → `'apps.transport'`
- URLs incluidas en `config/urls.py`
