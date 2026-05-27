# Schema de Base de Datos - logistica-api

## Tablas de Django (built-in)

### auth_user

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| password | VARCHAR(128) | Hash de contraseña |
| last_login | DATETIME | Último inicio de sesión |
| is_superuser | BOOLEAN | Flag de superusuario |
| username | VARCHAR(150) | Nombre de usuario (unique) |
| first_name | VARCHAR(150) | Nombre |
| last_name | VARCHAR(150) | Apellido |
| email | VARCHAR(254) | Correo electrónico |
| is_staff | BOOLEAN | Acceso al admin |
| is_active | BOOLEAN | Cuenta activa |
| date_joined | DATETIME | Fecha de registro |

### auth_group

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(150) | Nombre del grupo (unique) |

### auth_user_groups

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| user_id | INTEGER FK → auth_user.id | Relación con usuario |
| group_id | INTEGER FK → auth_group.id | Relación con grupo |

### auth_permission

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre del permiso |
| codename | VARCHAR(100) | Código del permiso |
| content_type_id | INTEGER FK → django_content_type.id | Tipo de contenido |

### django_content_type

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| app_label | VARCHAR(100) | Label de la app |
| model | VARCHAR(100) | Modelo |

### django_session

| Columna | Tipo | Descripción |
|---------|------|-------------|
| session_key | VARCHAR(40) PK | Clave de sesión |
| session_data | TEXT | Datos de sesión |
| expire_date | DATETIME | Fecha de expiración |

### django_migrations

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| app | VARCHAR(255) | Nombre de la app |
| name | VARCHAR(255) | Nombre de migración |
| applied | DATETIME | Fecha de aplicación |

---

## Tablas del Proyecto

### customer_customers

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre del cliente |
| customer_type | VARCHAR(20) | Tipo: 'company' o 'person' |
| document_type | VARCHAR(20) | Tipo de documento (dni, rut, etc.) |
| document_number | VARCHAR(50) | Número de documento |
| email | VARCHAR(254) | Correo electrónico |
| phone | VARCHAR(20) | Teléfono |
| address | TEXT | Dirección |
| city | VARCHAR(100) | Ciudad |
| country | VARCHAR(100) | País |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |
| is_active | BOOLEAN | Cliente activo |

### warehouse_warehouses

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre del almacén |
| code | VARCHAR(50) | Código único del almacén |
| address | TEXT | Dirección |
| city | VARCHAR(100) | Ciudad |
| country | VARCHAR(100) | País |
| capacity | INTEGER | Capacidad en unidades |
| is_active | BOOLEAN | Almacén activo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### suppliers_suppliers

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre del proveedor |
| contact_name | VARCHAR(255) | Nombre de contacto |
| email | VARCHAR(254) | Correo electrónico |
| phone | VARCHAR(20) | Teléfono |
| address | TEXT | Dirección |
| city | VARCHAR(100) | Ciudad |
| country | VARCHAR(100) | País |
| is_active | BOOLEAN | Proveedor activo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### products_products

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre del producto |
| sku | VARCHAR(50) | Código único de producto |
| description | TEXT | Descripción |
| category | VARCHAR(100) | Categoría |
| brand | VARCHAR(100) | Marca |
| unit_price | DECIMAL(10,2) | Precio unitario |
| weight | DECIMAL(10,3) | Peso en kg |
| dimensions | VARCHAR(50) | Dimensiones (LxAxA) |
| stock_quantity | INTEGER | Cantidad en stock |
| min_stock_level | INTEGER | Nivel mínimo de stock |
| supplier_id | INTEGER FK → suppliers_suppliers.id | Proveedor |
| warehouse_id | INTEGER FK → warehouse_warehouses.id | Almacén |
| is_active | BOOLEAN | Producto activo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### driver_drivers

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| user_id | INTEGER FK → auth_user.id | Usuario Django associado |
| license_number | VARCHAR(50) | Número de licencia |
| phone | VARCHAR(20) | Teléfono |
| email | VARCHAR(254) | Correo electrónico |
| hire_date | DATE | Fecha de contratación |
| is_available | BOOLEAN | Disponible para rutas |
| is_active | BOOLEAN | Conductor activo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### transport_transports

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| plate | VARCHAR(20) | Placa del vehículo |
| vehicle_type | VARCHAR(50) | Tipo: 'truck', 'van', 'car' |
| brand | VARCHAR(100) | Marca |
| model | VARCHAR(100) | Modelo |
| year | INTEGER | Año |
| capacity_kg | DECIMAL(10,2) | Capacidad en kg |
| capacity_volume | DECIMAL(10,2) | Capacidad en volumen |
| is_available | BOOLEAN | Disponible |
| is_active | BOOLEAN | Transporte activo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### route_routes

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| name | VARCHAR(255) | Nombre de la ruta |
| transport_id | INTEGER FK → transport_transports.id | Transporte asignado |
| driver_id | INTEGER FK → driver_drivers.id | Conductor asignado |
| start_date | DATETIME | Fecha de inicio |
| end_date | DATETIME | Fecha de fin |
| status | VARCHAR(20) | Estado: 'planned', 'in_progress', 'completed', 'cancelled' |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### route_stops

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| route_id | INTEGER FK → route_routes.id | Ruta |
| order | INTEGER | Orden de la parada |
| warehouse_id | INTEGER FK → warehouse_warehouses.id | Almacén (origen/destino) |
| arrival_time | DATETIME | Hora de llegada |
| departure_time | DATETIME | Hora de salida |
| status | VARCHAR(20) | Estado: 'pending', 'arrived', 'completed' |

### shipment_shipments

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| tracking_number | VARCHAR(50) | Número de tracking único |
| customer_id | INTEGER FK → customer_customers.id | Cliente |
| origin_warehouse_id | INTEGER FK → warehouse_warehouses.id | Almacén de origen |
| destination_address | TEXT | Dirección de destino |
| destination_city | VARCHAR(100) | Ciudad de destino |
| destination_country | VARCHAR(100) | País de destino |
| status | VARCHAR(20) | Estado: 'pending', 'picked_up', 'in_transit', 'delivered', 'cancelled' |
| shipping_date | DATE | Fecha de envío |
| estimated_delivery_date | DATE | Fecha estimada de entrega |
| actual_delivery_date | DATE | Fecha real de entrega |
| route_id | INTEGER FK → route_routes.id | Ruta asignada (nullable) |
| observations | TEXT | Observaciones |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

### shipment_items

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Identificador único |
| shipment_id | INTEGER FK → shipment_shipments.id | Envío |
| product_id | INTEGER FK → products_products.id | Producto |
| quantity | INTEGER | Cantidad |
| unit_price_at_shipping | DECIMAL(10,2) | Precio unitario al momento del envío |

---

## Diagrama de Relaciones

```
+---------------------------------------------------------------------+
|                      DJANGO TABLES                                  |
+---------------------------------------------------------------------+
|  auth_user                                                          |
|       |                                                             |
|       +--driver_drivers (user_id)                                  |
|                                                                     |
|  auth_group +-- auth_user_groups +-- auth_user                     |
|                                                                     |
|  auth_permission +-- django_content_type                          |
+---------------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|                      PROJECT TABLES                                |
+---------------------------------------------------------------------+

customer_customers
       |
       +-- 1:N --> shipment_shipments

suppliers_suppliers
       |
       +-- 1:N --> products_products

warehouse_warehouses
       |
       +-- 1:N --> products_products
       |
       +-- 1:N --> route_stops
       |
       +-- 1:N --> shipment_shipments (origin)

products_products
       |
       +-- 1:N --> shipment_items

shipment_shipments
       |
       +-- 1:N --> shipment_items
       |
       +-- 0:1 --> route_routes

route_routes
       |
       +-- 1:1 --> transport_transports
       |
       +-- 1:1 --> driver_drivers
       |
       +-- 1:N --> route_stops
```

---

## Notas

1. **Relaciones basadas en convenciones Django** - ForeignKey con suffijo `_id`
2. **Campos de auditoría** - `created_at`, `updated_at` en todas las entidades del proyecto
3. **Soft deletes** - `is_active` en entidades que pueden necesitar desactivación lógica
4. **Índices sugeridos** - `tracking_number` (unique), `sku` (unique), `plate` (unique)