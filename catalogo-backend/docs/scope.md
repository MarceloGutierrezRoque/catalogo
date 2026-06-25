# Scope — catalogo-backend MVP

## Fases de desarrollo

### Fase 0 — Base Setup

**Objetivo:** Proyecto configurado y listo para desarrollar apps.

| Paso | Acción |
|------|--------|
| 1 | Instalar paquetes faltantes: `gunicorn`, `whitenoise`, `django-cors-headers`, `django-filter`, `djangorestframework-simplejwt` |
| 2 | Crear `.env` con `SECRET_KEY`, `DEBUG=True`, `ALLOWED_HOSTS=localhost,127.0.0.1` |
| 3 | Configurar `settings.py`: `python-decouple` para SECRET_KEY/DEBUG/ALLOWED_HOSTS, registrar `rest_framework`, `rest_framework_simplejwt`, `corsheaders` (app + middleware), `django_filters` |
| 4 | Crear `apps/` directorio + `apps/__init__.py` |
| 5 | Configurar CORS para dev (`localhost:5173`, `localhost:3000`) |
| 6 | Configurar DRF defaults: `DEFAULT_AUTHENTICATION_CLASSES` (SimpleJWT), `DEFAULT_PERMISSION_CLASSES` (IsAuthenticated), `DEFAULT_PAGINATION_CLASS` |
| 7 | Verificar `python manage.py check` + migrate sin errores |

---

### Fase 1 — Fundación

**Apps:** authentication, users

**Objetivo:** Sistema de auth funcional. Admin puede login JWT + gestionar admins.

| App | Acción |
|-----|--------|
| authentication | Register DRF + SimpleJWT en settings. Crear `apps/authentication/`. JWT endpoints (`POST /api/token/`, `POST /api/token/refresh/`). Default permission class `IsAuthenticated` |
| users | Crear `apps/users/`. ViewSet CRUD sobre `auth_user`. Admin puede crear, editar, activar/desactivar admins |

**Endpoints disponibles tras F1:**
```
POST /api/token/
POST /api/token/refresh/
GET/POST    /api/users/
GET/PUT/PATCH/DELETE /api/users/:id/
```

---

### Fase 2 — Catálogo

**App:** plushies

**Objetivo:** CRUD completo de peluches. Catálogo público visible.

| App | Acción |
|-----|--------|
| plushies | Crear `apps/plushies/`. Modelo con name, description, price, image, stock, is_active, is_deleted, timestamps. Dos ViewSets: público (solo activos) y admin (todo). Config media files |

**Endpoints disponibles tras F2:**
```
GET /api/plushies/              ← público
GET /api/plushies/:id/          ← público
GET/POST    /api/admin/plushies/        ← admin
GET/PUT/PATCH/DELETE /api/admin/plushies/:id/  ← admin
```

---

### Fase 3 — Pedidos

**Apps:** order_items, orders

**Objetivo:** Cliente puede enviar pedido con múltiples peluches. Admin puede ver y cambiar estado.

| App | Acción |
|-----|--------|
| order_items | Crear `apps/order_items/`. Modelo con FK a order + plushie, quantity, unit_price (congelado). Serializer para nested creation |
| orders | Crear `apps/orders/`. Modelo con customer_name, email, phone, observations, status, timestamps. View público POST with nested items. View admin GET/PATCH |

**Endpoints disponibles tras F3:**
```
POST /api/orders/                         ← público (crea pedido + items)
GET /api/admin/orders/                    ← admin
GET /api/admin/orders/:id/               ← admin
PATCH /api/admin/orders/:id/             ← admin (cambiar estado)
```

---

### Fase 4 — Dashboard + Deploy prep

**App:** dashboard

**Objetivo:** Stats para panel admin. Proyecto listo para Railway.

| App | Acción |
|-----|--------|
| dashboard | Crear `apps/dashboard/`. APIView con counts: pedidos nuevos, contactados, cerrados; peluches activos, desactivados |
| Config | .env para Railway. Migrations aplicadas. Static files config. SECRET_KEY via env. DEBUG=False listo |

**Endpoints disponibles tras F4:**
```
GET /api/dashboard/  ← admin
```

---

## Resumen de endpoints finales

### Públicos
```
GET  /api/plushies/
GET  /api/plushies/:id/
POST /api/orders/
```

### Admin
```
POST   /api/token/
POST   /api/token/refresh/
GET    /api/dashboard/
GET    /api/users/
POST   /api/users/
GET    /api/users/:id/
PUT    /api/users/:id/
PATCH  /api/users/:id/
DELETE /api/users/:id/
GET    /api/admin/plushies/
POST   /api/admin/plushies/
GET    /api/admin/plushies/:id/
PUT    /api/admin/plushies/:id/
PATCH  /api/admin/plushies/:id/
DELETE /api/admin/plushies/:id/
GET    /api/admin/orders/
GET    /api/admin/orders/:id/
PATCH  /api/admin/orders/:id/
```

---

## Railway deploy checklist

- [ ] `requirements.txt` incluye gunicorn + whitenoise
- [ ] `Procfile`: `web: python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
- [ ] `.env` con SECRET_KEY, DEBUG=False, ALLOWED_HOSTS
- [ ] `settings.py` usa `python-decouple` para config
- [ ] Static files con whitenoise
- [ ] CORS configurado para frontend
