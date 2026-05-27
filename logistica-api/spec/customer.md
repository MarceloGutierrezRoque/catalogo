# Spec: customer

## Modelo

### Customer

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo          | Tipo         | Constraints        |
|----------------|--------------|--------------------|
| id             | INTEGER PK   | Auto               |
| name           | VARCHAR(255) | NOT NULL           |
| customer_type  | VARCHAR(20)  | NOT NULL           |
| document_type  | VARCHAR(20)  | NULL               |
| document_number| VARCHAR(50)  | NULL               |
| email          | VARCHAR(254) | NULL               |
| phone          | VARCHAR(20)  | NULL               |
| address        | TEXT         | NULL               |
| city           | VARCHAR(100) | NULL               |
| country        | VARCHAR(100) | NULL               |
| is_active      | BOOLEAN      | default=True       |
| created_at     | DATETIME     | auto_now_add=True  |
| updated_at     | DATETIME     | auto_now=True      |

`db_table = 'customer_customers'`

## Serializer

- `CustomerSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `CustomerViewSet(ModelViewSet)`
- `queryset = Customer.objects.all()`
- `serializer_class = CustomerSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `customers/`
- Prefijo: `/api/`

## Admin

- `CustomerAdmin(ModelAdmin)`
- `list_display = ['name', 'customer_type', 'document_number', 'email', 'phone', 'city', 'country', 'is_active']`
- `search_fields = ['name', 'document_number', 'email']`
- `list_filter = ['customer_type', 'is_active', 'country']`

## Config

- `apps.py` → `name = 'apps.customer'`
- `INSTALLED_APPS` → `'apps.customer'`
- URLs incluidas en `config/urls.py`
