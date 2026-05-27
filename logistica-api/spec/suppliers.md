# Spec: suppliers

## Modelo

### Supplier

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo        | Tipo         | Constraints        |
|--------------|--------------|--------------------|
| id           | INTEGER PK   | Auto               |
| name         | VARCHAR(255) | NOT NULL           |
| contact_name | VARCHAR(255) | NULL               |
| email        | VARCHAR(254) | NULL               |
| phone        | VARCHAR(20)  | NULL               |
| address      | TEXT         | NULL               |
| city         | VARCHAR(100) | NULL               |
| country      | VARCHAR(100) | NULL               |
| is_active    | BOOLEAN      | default=True       |
| created_at   | DATETIME     | auto_now_add=True  |
| updated_at   | DATETIME     | auto_now=True      |

`db_table = 'suppliers_suppliers'`

## Serializer

- `SupplierSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `SupplierViewSet(ModelViewSet)`
- `queryset = Supplier.objects.all()`
- `serializer_class = SupplierSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `suppliers/`
- Prefijo: `/api/`

## Admin

- `SupplierAdmin(ModelAdmin)`
- `list_display = ['name', 'contact_name', 'email', 'phone', 'city', 'country', 'is_active']`
- `search_fields = ['name', 'contact_name', 'email']`
- `list_filter = ['is_active', 'country']`

## Config

- `apps.py` → `name = 'apps.suppliers'`
- `INSTALLED_APPS` → `'apps.suppliers'`
- URLs incluidas en `config/urls.py`
