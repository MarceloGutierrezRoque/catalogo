# Architecture — catalogo-backend (MVP)

## Stack

| | |
|---|---|
| Framework | Django 6 + Django REST Framework 3.17 |
| Auth | SimpleJWT (access + refresh tokens) |
| DB | SQLite (dev) / PostgreSQL (prod) via `psycopg2` |
| Config | `python-decouple` (`.env`) |
| CORS | `django-cors-headers` |
| Media | ImageField local (storage backend TBD — revisar antes de producción) |

---

## Directory structure

```
catalogo-backend/
├── config/                   # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/                     # Domain apps
│   ├── authentication/       # JWT + permission classes
│   ├── users/                # CRUD admins (auth_user)
│   ├── plushies/             # Plushie catalog
│   ├── orders/               # Customer orders
│   ├── order_items/          # Order ↔ plushie relation
│   └── dashboard/            # Summary stats
├── media/                    # Uploaded images (gitignored)
├── docs/
│   ├── db-schema.md
│   └── architecture.md
├── manage.py
├── requirements.txt
└── db.sqlite3
```

### Per-app pattern

```
apps/<app>/
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── permissions.py    (if custom)
├── admin.py
└── tests.py
```

---

## API endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plushies/` | Active plushies list (is_active=True, is_deleted=False) |
| GET | `/api/plushies/:id/` | Plushie detail |
| POST | `/api/orders/` | Create order + nested items |

### Admin (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token/` | Obtain JWT pair |
| POST | `/api/token/refresh/` | Refresh access token |
| GET | `/api/users/` | List admins |
| POST | `/api/users/` | Create admin |
| GET | `/api/users/:id/` | Admin detail |
| PUT/PATCH | `/api/users/:id/` | Update admin |
| DELETE | `/api/users/:id/` | Delete admin |
| GET | `/api/admin/plushies/` | List all plushies (incl. inactive/deleted) |
| POST | `/api/admin/plushies/` | Create plushie |
| GET | `/api/admin/plushies/:id/` | Plushie detail |
| PUT/PATCH | `/api/admin/plushies/:id/` | Update plushie |
| DELETE | `/api/admin/plushies/:id/` | Hard-delete (borrado físico permanente) |
| GET | `/api/admin/orders/` | List orders |
| GET | `/api/admin/orders/:id/` | Order detail + items |
| PATCH | `/api/admin/orders/:id/` | Update order status |
| GET | `/api/dashboard/` | Summary stats |

---

## Permissions

| Scope | DRF class | Notes |
|-------|-----------|-------|
| Public endpoints | `AllowAny` | Only `plushies/` GET and `orders/` POST |
| Admin endpoints | `IsAuthenticated` | JWT required for everything else |

Public plushie viewset applies an additional filter: `is_active=True, is_deleted=False`.

---

## Development phases

### Phase 1 — Foundation

1. Register `rest_framework`, `rest_framework_simplejwt`, `corsheaders`, `django_filters` in `INSTALLED_APPS`
2. Create `.env` with `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
3. Configure `python-decouple` in `settings.py`
4. Create `apps/authentication` — JWT endpoints + `IsAuthenticated` default
5. Create `apps/users` — `ModelViewSet` on `auth_user`

### Phase 2 — Catalog

6. Create `apps/plushies` — model, two serializers (public/admin), two viewsets (filtered/full)
7. Configure media: `MEDIA_URL`, `MEDIA_ROOT`, serve in dev via `urls.py`
8. Add filters: `is_active`, `is_deleted`, `name` search

### Phase 3 — Orders

9. Create `apps/order_items` — model + serializer
10. Create `apps/orders` — model + serializer with nested `order_items`
11. Public `POST /api/orders/` with nested item creation (override `.create()`)
12. Admin `GET/PATCH /api/admin/orders/` with status transitions

### Phase 4 — Dashboard + Polish

13. Create `apps/dashboard` — `APIView` with aggregated queries (`Count`, `Q`)
14. Tests per app
15. Validations: stock check on order creation, frozen price logic, status transitions

---

## Nested order creation flow

```
POST /api/orders/
Body:
{
  "customer_name": "...",
  "customer_email": "...",
  "customer_phone": "...",
  "observations": "...",
  "items": [
    {"plushie_id": 1, "quantity": 2},
    {"plushie_id": 3, "quantity": 1}
  ]
}
```

1. Validate each `plushie_id` exists and has `stock >= quantity`
2. For each item: read `plushie.price` → store as `unit_price` (frozen)
3. Create `Order` → create each `OrderItem` with frozen prices
4. Return full order detail with items

---

## Key conventions

- **ViewSets** for CRUD, `APIView` for dashboard, `CreateAPIView` if read-only create needed
- **Two viewsets for plushies:** public (filtered) vs admin (full). Same model, different serializers + querysets
- **`@action(detail=True)`** for activate/deactivate plushie
- **Frozen price** — `OrderItem.unit_price` copies `Plushie.price` at creation, never auto-updates
- **Hard-delete** — `DELETE /api/admin/plushies/:id/` elimina el registro físicamente. No hay soft-delete.
- **`is_active` / `is_deleted`** — `is_active=False` oculta del catálogo público. `is_deleted=True` (no usado por la API actualmente) existe en el modelo pero no se asigna desde los endpoints. El dashboard y catálogo público filtran con `is_deleted=False`.
- **Pagination** — `PageNumberPagination` (DRF default, 100/page)
- **Dates** — ISO 8601 (DRF default)
- **Status transitions:** `pending → contacted → closed | cancelled`
- **All apps go under `apps/`** — registered as `apps.<name>` in `INSTALLED_APPS`
