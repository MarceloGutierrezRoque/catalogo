# Spec: products

## Modelo

### Product

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo           | Tipo           | Constraints                         |
|-----------------|----------------|-------------------------------------|
| id              | INTEGER PK     | Auto                                |
| name            | VARCHAR(255)   | NOT NULL                            |
| sku             | VARCHAR(50)    | NOT NULL, unique                    |
| description     | TEXT           | NULL                                |
| category        | VARCHAR(100)   | NULL                                |
| brand           | VARCHAR(100)   | NULL                                |
| unit_price      | DECIMAL(10,2)  | NULL                                |
| weight          | DECIMAL(10,3)  | NULL                                |
| dimensions      | VARCHAR(50)    | NULL                                |
| stock_quantity  | INTEGER        | default=0                           |
| min_stock_level | INTEGER        | default=0                           |
| supplier        | FK → Supplier  | NOT NULL, on_delete=PROTECT         |
| warehouse       | FK → Warehouse | NOT NULL, on_delete=PROTECT         |
| is_active       | BOOLEAN        | default=True                        |
| created_at      | DATETIME       | auto_now_add=True                   |
| updated_at      | DATETIME       | auto_now=True                       |

`db_table = 'products_products'`

## Serializer

- `ProductSerializer(serializers.ModelSerializer)`
- Campos: todos (incluyendo supplier_id, warehouse_id)
- `read_only_fields = ['id', 'created_at', 'updated_at']`

## ViewSet

- `ProductViewSet(ModelViewSet)`
- `queryset = Product.objects.select_related('supplier', 'warehouse').all()`
- `serializer_class = ProductSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

## URLs

- Router: `products/`
- Prefijo: `/api/`

## Admin

- `ProductAdmin(ModelAdmin)`
- `list_display = ['name', 'sku', 'category', 'brand', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'is_active']`
- `search_fields = ['name', 'sku', 'brand']`
- `list_filter = ['category', 'brand', 'is_active', 'supplier', 'warehouse']`

## Config

- `apps.py` → `name = 'apps.products'`
- `INSTALLED_APPS` → `'apps.products'`
- URLs incluidas en `config/urls.py`

## Nota: migrar products app existente

La app `products/` existe en raíz del proyecto. Se debe:
1. Mover carpeta `products/` dentro de `apps/`
2. Actualizar `apps.py` → `name = 'apps.products'`
