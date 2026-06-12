# API Reference — logistica-api

Backend: Django 6 + DRF 3.17. Base URL: `http://localhost:8000/api`. Auth: JWT (SimpleJWT).

---

## Auth

### POST /api/token/

Obtener par JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

### POST /api/token/refresh/

Refrescar access token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1Qi..."
}
```

---

## CRUD estándar (ModelViewSet)

Todas las rutas protegidas requieren: `Authorization: Bearer <access_token>`

| Método | URL | Acción | Body |
|--------|-----|--------|------|
| GET | `/<plural>/` | Listar (array) | — |
| POST | `/<plural>/` | Crear | JSON del modelo |
| GET | `/<plural>/{id}/` | Detalle | — |
| PUT | `/<plural>/{id}/` | Actualizar completo | JSON del modelo |
| PATCH | `/<plural>/{id}/` | Actualizar parcial | JSON parcial |
| DELETE | `/<plural>/{id}/` | Soft-delete (`is_active=false`) | — |

---

## 1. Warehouse (Almacenes)

**Endpoint:** `/api/warehouses/`

### POST — Crear

**Request:**
```json
{
  "name": "Almacén Central",
  "code": "ALC-001",
  "address": "Av. Siempre Viva 123",
  "city": "Lima",
  "country": "Perú",
  "capacity": 5000
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Almacén Central",
  "code": "ALC-001",
  "address": "Av. Siempre Viva 123",
  "city": "Lima",
  "country": "Perú",
  "capacity": 5000,
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

### GET /api/warehouses/ — Listar

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Almacén Central",
    "code": "ALC-001",
    "address": "Av. Siempre Viva 123",
    "city": "Lima",
    "country": "Perú",
    "capacity": 5000,
    "is_active": true,
    "created_at": "2026-05-27T20:00:00Z",
    "updated_at": "2026-05-27T20:00:00Z"
  }
]
```

### GET /api/warehouses/1/ — Detalle

Misma forma que el POST response, incluyendo `id` y timestamps.

### PATCH /api/warehouses/1/ — Actualizar parcial

**Request:**
```json
{
  "capacity": 8000
}
```

**Response (200):** Objeto completo con `capacity` actualizado.

---

## 2. Suppliers (Proveedores)

**Endpoint:** `/api/suppliers/`

### POST — Crear

**Request:**
```json
{
  "name": "TecnoSupply S.A.",
  "contact_name": "Carlos López",
  "email": "carlos@tecnosupply.com",
  "phone": "+51999000111",
  "address": "Jr. Las Flores 456",
  "city": "Arequipa",
  "country": "Perú"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "TecnoSupply S.A.",
  "contact_name": "Carlos López",
  "email": "carlos@tecnosupply.com",
  "phone": "+51999000111",
  "address": "Jr. Las Flores 456",
  "city": "Arequipa",
  "country": "Perú",
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

---

## 3. Products (Productos)

**Endpoint:** `/api/products/`

### POST — Crear

**Request:**
```json
{
  "name": "Laptop Gamer X1",
  "sku": "LAP-X1-001",
  "description": "Laptop con RTX 5090",
  "category": "Electrónica",
  "brand": "TechBrand",
  "unit_price": 4999.99,
  "weight": 2.500,
  "dimensions": "35x25x2",
  "stock_quantity": 50,
  "min_stock_level": 10,
  "supplier": 1,
  "warehouse": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Laptop Gamer X1",
  "sku": "LAP-X1-001",
  "description": "Laptop con RTX 5090",
  "category": "Electrónica",
  "brand": "TechBrand",
  "unit_price": "4999.99",
  "weight": "2.500",
  "dimensions": "35x25x2",
  "stock_quantity": 50,
  "min_stock_level": 10,
  "supplier": 1,
  "warehouse": 1,
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

> Los FK `supplier` y `warehouse` se envían como integers. En GET responses aparecen como objetos expandidos (si el backend usa serializadores anidados) — verificar según implementación.

---

## 4. Customer (Clientes)

**Endpoint:** `/api/customers/`

### POST — Crear

**Request:**
```json
{
  "name": "Empresa Logística Perú",
  "customer_type": "company",
  "document_type": "ruc",
  "document_number": "20123456789",
  "email": "contacto@elp.com",
  "phone": "+5112345678",
  "address": "Av. Principal 789",
  "city": "Lima",
  "country": "Perú"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Empresa Logística Perú",
  "customer_type": "company",
  "document_type": "ruc",
  "document_number": "20123456789",
  "email": "contacto@elp.com",
  "phone": "+5112345678",
  "address": "Av. Principal 789",
  "city": "Lima",
  "country": "Perú",
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

---

## 5. Shipment (Envíos)

**Endpoint:** `/api/shipments/`

### POST — Crear

**Request:**
```json
{
  "tracking_number": "SHP-001",
  "customer": 1,
  "origin_warehouse": 1,
  "destination_address": "Av. Destino 321",
  "destination_city": "Cusco",
  "destination_country": "Perú",
  "status": "pending",
  "shipping_date": "2026-06-01",
  "estimated_delivery_date": "2026-06-10",
  "observations": "Frágil, manejar con cuidado"
}
```

**Response (201):**
```json
{
  "id": 1,
  "tracking_number": "SHP-001",
  "customer": 1,
  "origin_warehouse": 1,
  "destination_address": "Av. Destino 321",
  "destination_city": "Cusco",
  "destination_country": "Perú",
  "status": "pending",
  "shipping_date": "2026-06-01",
  "estimated_delivery_date": "2026-06-10",
  "actual_delivery_date": null,
  "route": null,
  "observations": "Frágil, manejar con cuidado",
  "items": [],
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

> `items` es read-only anidado. Para agregar items crear ShipmentItems por separado.

### GET /api/shipments/1/ — Detalle con items

**Response (200):**
```json
{
  "id": 1,
  "tracking_number": "SHP-001",
  "customer": 1,
  "origin_warehouse": 1,
  "destination_address": "Av. Destino 321",
  "destination_city": "Cusco",
  "destination_country": "Perú",
  "status": "in_transit",
  "shipping_date": "2026-06-01",
  "estimated_delivery_date": "2026-06-10",
  "actual_delivery_date": null,
  "route": 1,
  "observations": "Frágil, manejar con cuidado",
  "items": [
    {
      "id": 1,
      "shipment": 1,
      "product": 1,
      "quantity": 10,
      "unit_price_at_shipping": "4999.99"
    }
  ],
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-28T10:00:00Z"
}
```

### ShipmentItems

**Endpoint:** `/api/shipment-items/`

### POST — Crear

**Request:**
```json
{
  "shipment": 1,
  "product": 1,
  "quantity": 10,
  "unit_price_at_shipping": 4999.99
}
```

**Response (201):**
```json
{
  "id": 1,
  "shipment": 1,
  "product": 1,
  "quantity": 10,
  "unit_price_at_shipping": "4999.99"
}
```

---

## 6. Driver (Conductores)

**Endpoint:** `/api/drivers/`

### POST — Crear

**Request:**
```json
{
  "user": 2,
  "license_number": "LIC-001",
  "phone": "+51988000111",
  "email": "juan.perez@logistica.com",
  "hire_date": "2025-01-15",
  "is_available": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "user": 2,
  "license_number": "LIC-001",
  "phone": "+51988000111",
  "email": "juan.perez@logistica.com",
  "hire_date": "2025-01-15",
  "is_available": true,
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

> `user` FK a `auth_user.id`. Crear usuario vía admin o registro antes de asignar driver.

---

## 7. Transport (Vehículos)

**Endpoint:** `/api/transports/`

### POST — Crear

**Request:**
```json
{
  "plate": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2024,
  "capacity_kg": 20000.00,
  "capacity_volume": 80.00,
  "is_available": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "plate": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2024,
  "capacity_kg": "20000.00",
  "capacity_volume": "80.00",
  "is_available": true,
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

---

## 8. Route (Rutas)

**Endpoint:** `/api/routes/`

### POST — Crear

**Request:**
```json
{
  "name": "Ruta Lima-Cusco",
  "transport": 1,
  "driver": 1,
  "start_date": "2026-06-01T08:00:00Z",
  "end_date": "2026-06-03T18:00:00Z",
  "status": "planned"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Ruta Lima-Cusco",
  "transport": 1,
  "driver": 1,
  "start_date": "2026-06-01T08:00:00Z",
  "end_date": "2026-06-03T18:00:00Z",
  "status": "planned",
  "stops": [],
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-27T20:00:00Z"
}
```

> `stops` es read-only anidado. Crear Stops por separado después.

### GET /api/routes/1/ — Detalle con stops

**Response (200):**
```json
{
  "id": 1,
  "name": "Ruta Lima-Cusco",
  "transport": 1,
  "driver": 1,
  "start_date": "2026-06-01T08:00:00Z",
  "end_date": "2026-06-03T18:00:00Z",
  "status": "in_progress",
  "stops": [
    {
      "id": 1,
      "route": 1,
      "order": 1,
      "warehouse": 1,
      "arrival_time": "2026-06-01T08:00:00Z",
      "departure_time": "2026-06-01T09:00:00Z",
      "status": "completed"
    },
    {
      "id": 2,
      "route": 1,
      "order": 2,
      "warehouse": 2,
      "arrival_time": "2026-06-01T14:00:00Z",
      "departure_time": null,
      "status": "arrived"
    }
  ],
  "is_active": true,
  "created_at": "2026-05-27T20:00:00Z",
  "updated_at": "2026-05-28T12:00:00Z"
}
```

### Stops (Paradas)

**Endpoint:** `/api/stops/`

### POST — Crear

**Request:**
```json
{
  "route": 1,
  "order": 1,
  "warehouse": 1,
  "arrival_time": "2026-06-01T08:00:00Z",
  "status": "pending"
}
```

**Response (201):**
```json
{
  "id": 1,
  "route": 1,
  "order": 1,
  "warehouse": 1,
  "arrival_time": "2026-06-01T08:00:00Z",
  "departure_time": null,
  "status": "pending"
}
```

---

## Diagrama de relaciones

```
Customer 1:N Shipment → Shipment N:N Product (via ShipmentItem)
Warehouse 1:N Product
Supplier  1:N Product
Warehouse 1:N Shipment (origin)
Route     1:N Stop → Warehouse
Transport 1:1 Route
Driver    1:1 Route
```

## Convenciones

- **Auth:** Header `Authorization: Bearer <access_token>`
- **Soft-delete:** `DELETE` setea `is_active=false`. ShipmentItems y Stops son hard-delete
- **Read-only:** `id`, `created_at`, `updated_at` (se ignoran en request)
- **FK:** se envían como integers en POST/PUT/PATCH; en GET responses aparecen como objetos expandidos con `select_related`
- **Fechas:** ISO 8601 (`YYYY-MM-DD` para dates, `YYYY-MM-DDTHH:mm:ssZ` para datetimes)
- **Paginación:** DRF PageNumberPagination (parámetros `?page=1&page_size=10`)
- **Precios:** `Decimal` se serializa como string `"4999.99"`
