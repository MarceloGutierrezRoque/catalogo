# Spec: driver

## Modelo

### Driver

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo          | Tipo           | Constraints                    |
|----------------|----------------|--------------------------------|
| id             | INTEGER PK     | Auto                           |
| user           | FK → auth_user | NOT NULL, on_delete=PROTECT    |
| license_number | VARCHAR(50)    | NOT NULL, unique               |
| phone          | VARCHAR(20)    | NULL                           |
| email          | VARCHAR(254)   | NULL                           |
| hire_date      | DATE           | NULL                           |
| is_available   | BOOLEAN        | default=True                   |
| is_active      | BOOLEAN        | default=True                   |
| created_at     | DATETIME       | auto_now_add=True              |
| updated_at     | DATETIME       | auto_now=True                  |

`db_table = 'driver_drivers'`

## Serializer

- `DriverSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `DriverViewSet(ModelViewSet)`
- `queryset = Driver.objects.select_related('user').all()`
- `serializer_class = DriverSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `drivers/`
- Prefijo: `/api/`

## Admin

- `DriverAdmin(ModelAdmin)`
- `list_display = ['user', 'license_number', 'phone', 'email', 'hire_date', 'is_available', 'is_active']`
- `search_fields = ['user__username', 'license_number', 'email']`
- `list_filter = ['is_available', 'is_active']`

## Config

- `apps.py` → `name = 'apps.driver'`
- `INSTALLED_APPS` → `'apps.driver'`
- URLs incluidas en `config/urls.py`
