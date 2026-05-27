# Spec: shipment

## Modelos

### Shipment

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo                  | Tipo           | Constraints                         |
|------------------------|----------------|-------------------------------------|
| id                     | INTEGER PK     | Auto                                |
| tracking_number        | VARCHAR(50)    | NOT NULL, unique                    |
| customer               | FK → Customer  | NOT NULL, on_delete=PROTECT         |
| origin_warehouse       | FK → Warehouse | NOT NULL, on_delete=PROTECT         |
| destination_address    | TEXT           | NOT NULL                            |
| destination_city       | VARCHAR(100)   | NOT NULL                            |
| destination_country    | VARCHAR(100)   | NOT NULL                            |
| status                 | VARCHAR(20)    | default='pending'                   |
| shipping_date          | DATE           | NULL                                |
| estimated_delivery_date| DATE           | NULL                                |
| actual_delivery_date   | DATE           | NULL                                |
| route                  | FK → Route     | NULL, on_delete=SET_NULL            |
| observations           | TEXT           | NULL                                |
| is_active              | BOOLEAN        | default=True                        |
| created_at             | DATETIME       | auto_now_add=True                   |
| updated_at             | DATETIME       | auto_now=True                       |

`db_table = 'shipment_shipments'`

`status` choices: `pending`, `picked_up`, `in_transit`, `delivered`, `cancelled`

### ShipmentItem

Hereda de `models.Model` (sin BaseModel — es detalle, no entidad independiente).

| Campo                 | Tipo           | Constraints                     |
|-----------------------|----------------|---------------------------------|
| id                    | INTEGER PK     | Auto                            |
| shipment              | FK → Shipment  | NOT NULL, on_delete=CASCADE     |
| product               | FK → Product   | NOT NULL, on_delete=PROTECT     |
| quantity              | INTEGER        | NOT NULL                        |
| unit_price_at_shipping| DECIMAL(10,2)  | NOT NULL                        |

`db_table = 'shipment_items'`

## Serializers

- `ShipmentSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- Incluir `items` como nested (ShipmentItemSerializer, many=True, read_only)

- `ShipmentItemSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id']`

## ViewSets

### ShipmentViewSet

- `ModelViewSet`
- `queryset = Shipment.objects.select_related('customer', 'origin_warehouse').prefetch_related('items__product').all()`
- `serializer_class = ShipmentSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

### ShipmentItemViewSet

- `ModelViewSet`
- `queryset = ShipmentItem.objects.select_related('shipment', 'product').all()`
- `serializer_class = ShipmentItemSerializer`
- `permission_classes = [IsAuthenticated]`

## URLs

- Router: `shipments/`, `shipment-items/`
- Prefijo: `/api/`

## Admin

### ShipmentAdmin

- `list_display = ['tracking_number', 'customer', 'status', 'shipping_date', 'estimated_delivery_date', 'is_active']`
- `search_fields = ['tracking_number', 'customer__name']`
- `list_filter = ['status', 'is_active', 'shipping_date']`

### ShipmentItemAdmin

- `list_display = ['shipment', 'product', 'quantity', 'unit_price_at_shipping']`
- `search_fields = ['shipment__tracking_number', 'product__name']`
- `list_filter = ['shipment__status']`

## Config

- `apps.py` → `name = 'apps.shipment'`
- `INSTALLED_APPS` → `'apps.shipment'`
- URLs incluidas en `config/urls.py`
