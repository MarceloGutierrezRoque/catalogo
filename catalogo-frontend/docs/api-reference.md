# API Reference — Catálogo de Peluches

Backend: `catalogo-backend/` — Django 6.0 + DRF 3.17.
Base URL: `http://localhost:8000`. Auth: JWT (SimpleJWT).

---

## Autenticación

Access token: 8h lifetime. Refresh token: 7d lifetime.
Header: `Authorization: Bearer <access_token>`

### POST /api/token/

```
Content-Type: application/json
```

```json
// Request
{ "username": "admin", "password": "secreto123" }

// Response 200
{ "access": "eyJ0eXAiOiJKV1QiLCJhbGc...", "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." }
```

### POST /api/token/refresh/

```json
// Request
{ "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." }

// Response 200
{ "access": "eyJ0eXAiOiJKV1QiLCJhbGc..." }
```

---

## Endpoints públicos (sin auth)

### GET /api/plushies/

Lista paginada de peluches activos (`is_active=true`, `is_deleted=false`).

```
GET /api/plushies/?page=1
```

```json
// Response 200
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Pikachu Peluche",
      "description": "Peluche suave de Pikachu de 30cm",
      "price": "25.99",
      "image": "http://localhost:8000/media/plushies/pikachu.jpg",
      "stock": 15,
      "created_at": "2026-06-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "Charmander Peluche",
      "description": "Peluche de Charmander con llama incluida",
      "price": "22.50",
      "image": null,
      "stock": 8,
      "created_at": "2026-06-18T12:05:00Z"
    }
  ]
}
```

### GET /api/plushies/{id}/

```json
// Response 200
{
  "id": 1,
  "name": "Pikachu Peluche",
  "description": "Peluche suave de Pikachu de 30cm",
  "price": "25.99",
  "image": "http://localhost:8000/media/plushies/pikachu.jpg",
  "stock": 15,
  "created_at": "2026-06-18T12:00:00Z"
}
```

### POST /api/orders/

Crea un pedido con items anidados. El precio se congela al crear.

```json
// Request
{
  "customer_name": "María García",
  "customer_email": "maria@email.com",
  "customer_phone": "+51999888777",
  "observations": "Entregar en la tarde",
  "items": [
    { "plushie_id": 1, "quantity": 2 },
    { "plushie_id": 2, "quantity": 1 }
  ]
}

// Response 201
{
  "id": 1,
  "customer_name": "María García",
  "customer_email": "maria@email.com",
  "customer_phone": "+51999888777",
  "observations": "Entregar en la tarde",
  "status": "pending",
  "items": [
    { "id": 1, "plushie_name": "Pikachu Peluche", "quantity": 2, "unit_price": "25.99" },
    { "id": 2, "plushie_name": "Charmander Peluche", "quantity": 1, "unit_price": "22.50" }
  ],
  "created_at": "2026-06-18T14:30:00Z"
}
```

**Validaciones:**
- `plushie_id` debe existir, estar activo, no eliminado
- `quantity` ≥ 1 y ≤ stock disponible
- Precio congelado al crear (copia de `plushie.price` al momento)

---

## Endpoints admin (requieren JWT Bearer)

Header: `Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...`

### Usuarios (Admin)

CRUD sobre `auth_user`. DELETE es soft-delete (`is_active=false`).

#### GET /api/users/

```json
// Response 200
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@ejemplo.com",
      "first_name": "Admin",
      "last_name": "Principal",
      "is_active": true,
      "is_staff": true,
      "is_superuser": true,
      "date_joined": "2026-06-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/users/

```json
// Request
{
  "username": "operador1",
  "email": "operador@ejemplo.com",
  "password": "pass123",
  "first_name": "Carlos",
  "last_name": "López",
  "is_staff": true
}

// Response 201
{
  "id": 3,
  "username": "operador1",
  "email": "operador@ejemplo.com",
  "first_name": "Carlos",
  "last_name": "López",
  "is_active": true,
  "is_staff": true,
  "is_superuser": false,
  "date_joined": "2026-06-18T15:00:00Z"
}
```

#### GET /api/users/{id}/

```json
// Response 200
{
  "id": 1,
  "username": "admin",
  "email": "admin@ejemplo.com",
  "first_name": "Admin",
  "last_name": "Principal",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "date_joined": "2026-06-01T10:00:00Z"
}
```

#### PUT /api/users/{id}/

```json
// Request
{
  "username": "operador1",
  "email": "nuevo@ejemplo.com",
  "password": "nuevopass",
  "first_name": "Carlos",
  "last_name": "López",
  "is_staff": true
}

// Response 200
{
  "id": 3,
  "username": "operador1",
  "email": "nuevo@ejemplo.com",
  "first_name": "Carlos",
  "last_name": "López",
  "is_active": true,
  "is_staff": true,
  "is_superuser": false,
  "date_joined": "2026-06-18T15:00:00Z"
}
```

#### PATCH /api/users/{id}/

```json
// Request
{ "first_name": "Carlos Alberto" }

// Response 200
{
  "id": 3,
  "username": "operador1",
  "email": "nuevo@ejemplo.com",
  "first_name": "Carlos Alberto",
  "last_name": "López",
  "is_active": true,
  "is_staff": true,
  "is_superuser": false,
  "date_joined": "2026-06-18T15:00:00Z"
}
```

#### DELETE /api/users/{id}/

```
// Response 204 (sin body)
```

Soft-delete: `is_active=false`.

---

### Plushies — Admin CRUD

Opera sobre todos los plushies (incluye inactivos y eliminados).
DELETE es soft-delete (`is_deleted=true`).

#### GET /api/admin/plushies/

```json
// Response 200
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Pikachu Peluche",
      "description": "Peluche suave de Pikachu de 30cm",
      "price": "25.99",
      "image": "http://localhost:8000/media/plushies/pikachu.jpg",
      "stock": 15,
      "is_active": true,
      "is_deleted": false,
      "created_at": "2026-06-18T12:00:00Z",
      "updated_at": "2026-06-18T12:00:00Z"
    },
    {
      "id": 3,
      "name": "Bulbasaur Peluche",
      "description": "Peluche de Bulbasaur edición limitada",
      "price": "30.00",
      "image": null,
      "stock": 0,
      "is_active": false,
      "is_deleted": false,
      "created_at": "2026-06-18T13:00:00Z",
      "updated_at": "2026-06-18T13:00:00Z"
    }
  ]
}
```

#### POST /api/admin/plushies/

Para imágenes, usar `multipart/form-data`.

```json
// Request (JSON)
{
  "name": "Squirtle Peluche",
  "description": "Peluche de Squirtle con gafas",
  "price": "24.00",
  "stock": 10,
  "is_active": true
}

// Response 201
{
  "id": 4,
  "name": "Squirtle Peluche",
  "description": "Peluche de Squirtle con gafas",
  "price": "24.00",
  "image": null,
  "stock": 10,
  "is_active": true,
  "is_deleted": false,
  "created_at": "2026-06-18T16:00:00Z",
  "updated_at": "2026-06-18T16:00:00Z"
}
```

#### GET /api/admin/plushies/{id}/

```json
// Response 200
{
  "id": 1,
  "name": "Pikachu Peluche",
  "description": "Peluche suave de Pikachu de 30cm",
  "price": "25.99",
  "image": "http://localhost:8000/media/plushies/pikachu.jpg",
  "stock": 15,
  "is_active": true,
  "is_deleted": false,
  "created_at": "2026-06-18T12:00:00Z",
  "updated_at": "2026-06-18T12:00:00Z"
}
```

#### PUT /api/admin/plushies/{id}/

```json
// Request
{
  "name": "Pikachu Peluche Gigante",
  "description": "Peluche gigante de Pikachu de 50cm",
  "price": "45.99",
  "stock": 5,
  "is_active": true
}

// Response 200
{
  "id": 1,
  "name": "Pikachu Peluche Gigante",
  "description": "Peluche gigante de Pikachu de 50cm",
  "price": "45.99",
  "image": "http://localhost:8000/media/plushies/pikachu.jpg",
  "stock": 5,
  "is_active": true,
  "is_deleted": false,
  "created_at": "2026-06-18T12:00:00Z",
  "updated_at": "2026-06-18T16:30:00Z"
}
```

#### PATCH /api/admin/plushies/{id}/

```json
// Request
{ "price": "39.99", "stock": 20 }

// Response 200
{
  "id": 1,
  "name": "Pikachu Peluche Gigante",
  "description": "Peluche gigante de Pikachu de 50cm",
  "price": "39.99",
  "image": "http://localhost:8000/media/plushies/pikachu.jpg",
  "stock": 20,
  "is_active": true,
  "is_deleted": false,
  "created_at": "2026-06-18T12:00:00Z",
  "updated_at": "2026-06-18T16:35:00Z"
}
```

#### DELETE /api/admin/plushies/{id}/

```
// Response 204 (sin body)
```

Hard-delete: el registro se elimina físicamente de la BD. Los `OrderItem` que referenciaban al plushie quedan con `plushie=null` y muestran `"[Eliminado]"` como nombre.

#### PATCH /api/admin/plushies/{id}/activate/

```json
// Request (body vacío)
{}

// Response 200
{
  "id": 3,
  "name": "Bulbasaur Peluche",
  "description": "Peluche de Bulbasaur edición limitada",
  "price": "30.00",
  "image": null,
  "stock": 0,
  "is_active": true,
  "is_deleted": false,
  "created_at": "2026-06-18T13:00:00Z",
  "updated_at": "2026-06-18T16:40:00Z"
}
```

#### PATCH /api/admin/plushies/{id}/deactivate/

```json
// Request (body vacío)
{}

// Response 200
{
  "id": 1,
  "name": "Pikachu Peluche Gigante",
  "description": "Peluche gigante de Pikachu de 50cm",
  "price": "39.99",
  "image": "http://localhost:8000/media/plushies/pikachu.jpg",
  "stock": 20,
  "is_active": false,
  "is_deleted": false,
  "created_at": "2026-06-18T12:00:00Z",
  "updated_at": "2026-06-18T16:45:00Z"
}
```

---

### Órdenes — Admin consulta + cambio de estado

Solo lectura + actualización parcial de estado. No se eliminan ni editan items.

#### GET /api/admin/orders/

Lista sin items anidados.

```json
// Response 200
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer_name": "María García",
      "customer_email": "maria@email.com",
      "customer_phone": "+51999888777",
      "observations": "Entregar en la tarde",
      "status": "pending",
      "created_at": "2026-06-18T14:30:00Z",
      "updated_at": "2026-06-18T14:30:00Z"
    },
    {
      "id": 2,
      "customer_name": "Juan Pérez",
      "customer_email": "juan@email.com",
      "customer_phone": "+51999111222",
      "observations": null,
      "status": "contacted",
      "created_at": "2026-06-17T10:00:00Z",
      "updated_at": "2026-06-18T09:00:00Z"
    }
  ]
}
```

#### GET /api/admin/orders/{id}/

Con items anidados.

```json
// Response 200
{
  "id": 1,
  "customer_name": "María García",
  "customer_email": "maria@email.com",
  "customer_phone": "+51999888777",
  "observations": "Entregar en la tarde",
  "status": "pending",
  "items": [
    { "id": 1, "plushie_name": "Pikachu Peluche", "quantity": 2, "unit_price": "25.99" },
    { "id": 2, "plushie_name": "Charmander Peluche", "quantity": 1, "unit_price": "22.50" }
  ],
  "created_at": "2026-06-18T14:30:00Z",
  "updated_at": "2026-06-18T14:30:00Z"
}
```

#### PATCH /api/admin/orders/{id}/

Solo actualiza `status`. Valida transiciones.

```json
// Request — pending → contacted
{ "status": "contacted" }

// Response 200
{
  "id": 1,
  "customer_name": "María García",
  "customer_email": "maria@email.com",
  "customer_phone": "+51999888777",
  "observations": "Entregar en la tarde",
  "status": "contacted",
  "items": [
    { "id": 1, "plushie_name": "Pikachu Peluche", "quantity": 2, "unit_price": "25.99" },
    { "id": 2, "plushie_name": "Charmander Peluche", "quantity": 1, "unit_price": "22.50" }
  ],
  "created_at": "2026-06-18T14:30:00Z",
  "updated_at": "2026-06-18T17:00:00Z"
}
```

**Transiciones válidas:**
- `pending` → `contacted`
- `contacted` → `closed`, `cancelled`
- `closed` → (terminal)
- `cancelled` → (terminal)

---

### Dashboard — Estadísticas

#### GET /api/dashboard/

```json
// Response 200
{
  "orders": {
    "pending": 5,
    "contacted": 3,
    "closed": 12,
    "cancelled": 1,
    "total": 21
  },
  "plushies": {
    "active": 8,
    "inactive": 2,
    "total": 10,
    "_note": "total = active + inactive. Excluye is_deleted=True."
}
```

---

## Documentación API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/schema/` | OpenAPI 3.0 schema |
| GET | `/api/docs/` | Swagger UI |
| GET | `/api/redoc/` | Redoc UI |

---

## Convenciones API

- **Paginación:** PageNumberPagination, 100 items por página. Params: `?page=1`
- **Filtros globales:** `django-filter`, `SearchFilter`, `OrderingFilter`
- **Fechas:** ISO 8601. Read-only: `created_at`, `updated_at`
- **IDs como integers.** FK en requests como integers.
- **Imágenes:** Subir a `POST /api/admin/plushies/` con `multipart/form-data`. Servidas en `http://localhost:8000/media/plushies/<filename>`.

## Modelos — Resumen

### Plushie
`name`, `description`, `price` (Decimal), `image` (ImageField), `stock`, `is_active`, `is_deleted`, `created_at`, `updated_at`

### Order
`customer_name`, `customer_email`, `customer_phone`, `observations`, `status` (pending/contacted/closed/cancelled), `created_at`, `updated_at`

### OrderItem
`order` (FK→Order, CASCADE), `plushie` (FK→Plushie, PROTECT), `quantity`, `unit_price` (congelado al crear)
