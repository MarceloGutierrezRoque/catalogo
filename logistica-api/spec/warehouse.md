# Spec: warehouse

## Modelo

### Warehouse

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo     | Tipo         | Constraints        |
|-----------|--------------|--------------------|
| id        | INTEGER PK   | Auto               |
| name      | VARCHAR(255) | NOT NULL           |
| code      | VARCHAR(50)  | NOT NULL, unique   |
| address   | TEXT         | NULL               |
| city      | VARCHAR(100) | NULL               |
| country   | VARCHAR(100) | NULL               |
| capacity  | INTEGER      | NULL               |
| is_active | BOOLEAN      | default=True       |
| created_at| DATETIME     | auto_now_add=True  |
| updated_at| DATETIME     | auto_now=True      |

`db_table = 'warehouse_warehouses'`

## Serializer

- `WarehouseSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `WarehouseViewSet(ModelViewSet)`
- `queryset = Warehouse.objects.all()`
- `serializer_class = WarehouseSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `warehouses/`
- Prefijo: `/api/`

## Admin

- `WarehouseAdmin(ModelAdmin)`
- `list_display = ['name', 'code', 'city', 'country', 'capacity', 'is_active']`
- `search_fields = ['name', 'code', 'city']`
- `list_filter = ['is_active', 'country']`

## Config

- `apps.py` → `name = 'apps.warehouse'`
- `INSTALLED_APPS` → `'apps.warehouse'`
- URLs incluidas en `config/urls.py`
