# Spec: route

## Modelos

### Route

Hereda de `BaseModel` (is_active, created_at, updated_at).

| Campo       | Tipo           | Constraints                         |
|-------------|----------------|-------------------------------------|
| id          | INTEGER PK     | Auto                                |
| name        | VARCHAR(255)   | NOT NULL                            |
| transport   | FK → Transport | NOT NULL, on_delete=PROTECT         |
| driver      | FK → Driver    | NOT NULL, on_delete=PROTECT         |
| start_date  | DATETIME       | NULL                                |
| end_date    | DATETIME       | NULL                                |
| status      | VARCHAR(20)    | default='planned'                   |
| is_active   | BOOLEAN        | default=True                        |
| created_at  | DATETIME       | auto_now_add=True                   |
| updated_at  | DATETIME       | auto_now=True                       |

`db_table = 'route_routes'`

`status` choices: `planned`, `in_progress`, `completed`, `cancelled`

### Stop

Hereda de `models.Model` (detalle, sin BaseModel).

| Campo         | Tipo            | Constraints                     |
|---------------|-----------------|---------------------------------|
| id            | INTEGER PK      | Auto                            |
| route         | FK → Route      | NOT NULL, on_delete=CASCADE     |
| order         | INTEGER         | NOT NULL                        |
| warehouse     | FK → Warehouse  | NOT NULL, on_delete=PROTECT     |
| arrival_time  | DATETIME        | NULL                            |
| departure_time| DATETIME        | NULL                            |
| status        | VARCHAR(20)     | default='pending'               |

`db_table = 'route_stops'`

## Serializers

- `StopSerializer(serializers.ModelSerializer)`
- Campos: todos, `read_only_fields = ['id']`

- `RouteSerializer(serializers.ModelSerializer)`
- Campos: todos
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- Incluir `stops` como nested (StopSerializer, many=True, read_only)

## ViewSets

### RouteViewSet

- `ModelViewSet`
- `queryset = Route.objects.select_related('transport', 'driver').prefetch_related('stops__warehouse').all()`
- `serializer_class = RouteSerializer`
- `permission_classes = [IsAuthenticated]`
- Soft delete: `perform_destroy` → `is_active = False`

### StopViewSet

- `ModelViewSet`
- `queryset = Stop.objects.select_related('route', 'warehouse').all()`
- `serializer_class = StopSerializer`
- `permission_classes = [IsAuthenticated]`

## URLs

- Router: `routes/`, `stops/`
- Prefijo: `/api/`

## Admin

### RouteAdmin
- `list_display = ['name', 'transport', 'driver', 'start_date', 'end_date', 'status', 'is_active']`
- `search_fields = ['name', 'transport__plate', 'driver__license_number']`
- `list_filter = ['status', 'is_active']`

### StopAdmin
- `list_display = ['route', 'order', 'warehouse', 'arrival_time', 'departure_time', 'status']`
- `search_fields = ['route__name', 'warehouse__name']`
- `list_filter = ['status', 'route__status']`

## Config

- `apps.py` → `name = 'apps.route'`
- `INSTALLED_APPS` → `'apps.route'`
- URLs incluidas en `config/urls.py`

## Pendiente: FK route en shipment

Agregar campo `route` (FK → Route, nullable, SET_NULL) al modelo Shipment como migración posterior.
