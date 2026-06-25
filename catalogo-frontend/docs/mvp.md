# MVP — Catálogo de Peluches

Plataforma web de catálogo y gestión de pedidos de peluches.
Clientes navegan catálogo público → seleccionan peluches → completan formulario → generan solicitud de pedido.
Admin recibe pedido, continúa conversación y cierra venta por WhatsApp.

## Stack frontend

- Next.js 16 + React 19 + TypeScript strict
- Tailwind CSS 4 + shadcn/ui (new-york style)
- TanStack Query — server state (fetching, caching, mutaciones)
- TanStack Table — tablas con sort, filter, paginación
- Axios — HTTP client + interceptor JWT
- Zustand — estado global cliente (auth tokens, UI state)
- sonner — notificaciones toast
- Zod — validación de formularios

## Stack backend

- Django 6.0 + DRF 3.17 + SimpleJWT
- Base: `http://localhost:8000`

---

## Orden de módulos

Cada módulo debe completarse (Spect → aprobación → Implement → Validator) antes de iniciar el siguiente.

### Fase 1 — Infraestructura base

Antes del primer módulo, crear:
- `lib/axios.ts` — instancia Axios con base URL e interceptor JWT
- `stores/auth.ts` — Zustand store (login, logout, tokens, user)
- `types/api.ts` — interfaces compartidas
- `providers/query.tsx` — QueryClientProvider
- `providers/auth.tsx` — AuthProvider con persistencia de sesión
- `lib/utils.ts` — `cn()` utility (ya creado por shadcn)

### Fase 2 — Módulo: auth

Autenticación de administradores.

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario login con username + password |
| `/(dashboard)/layout.tsx` | Layout protegido con sidebar y header |

**Endpoints:** `POST /api/token/`, `POST /api/token/refresh/`

### Fase 3 — Módulo: plushies (público)

Catálogo público visible sin autenticación.

| Ruta | Descripción |
|------|-------------|
| `/` o `/plushies` | Listado de peluches activos |
| `/plushies/[id]` | Detalle de peluche (imagen, precio, stock, descripción) |

**Endpoints públicos:** `GET /api/plushies/`, `GET /api/plushies/{id}/`

### Fase 4 — Módulo: plushies (admin)

CRUD completo de peluches desde el panel admin.

| Ruta | Descripción |
|------|-------------|
| `/(dashboard)/plushies` | Listado con TanStack Table (todos, incluye inactivos/eliminados) |
| `/(dashboard)/plushies/new` | Formulario de creación |
| `/(dashboard)/plushies/[id]` | Detalle y edición |
| — | Diálogo de confirmación para delete (soft-delete) |
| — | Botones activate/deactivate |

**Endpoints admin:** CRUD `/api/admin/plushies/`, `activate/`, `deactivate/`

### Fase 5 — Módulo: orders (público)

Formulario público de creación de pedidos.

| Ruta | Descripción |
|------|-------------|
| `/order` | Formulario con datos del cliente + selección de items |
| — | Selector de peluches con cantidad |

**Endpoints públicos:** `POST /api/orders/`

**Validaciones frontend:** email, teléfono, al menos 1 item, cantidad ≤ stock

### Fase 6 — Módulo: orders (admin)

Gestión de pedidos desde el panel admin.

| Ruta | Descripción |
|------|-------------|
| `/(dashboard)/orders` | Listado con TanStack Table (status filter, sort) |
| `/(dashboard)/orders/[id]` | Detalle con items anidados y cambio de estado |

**Endpoints admin:** `GET /api/admin/orders/`, `GET /api/admin/orders/{id}/`, `PATCH /api/admin/orders/{id}/`

**Transiciones:** `pending → contacted → closed/cancelled`

### Fase 7 — Módulo: users (admin)

CRUD de usuarios administradores.

| Ruta | Descripción |
|------|-------------|
| `/(dashboard)/users` | Listado con TanStack Table |
| `/(dashboard)/users/new` | Formulario de creación |
| `/(dashboard)/users/[id]` | Detalle y edición |
| — | Diálogo de confirmación para delete (soft-delete) |

**Endpoints admin:** CRUD `/api/users/`

### Fase 8 — Módulo: dashboard

Estadísticas del panel admin.

| Ruta | Descripción |
|------|-------------|
| `/(dashboard)/` | Tarjetas con counts de órdenes por estado + peluches activos/inactivos |

**Endpoints admin:** `GET /api/dashboard/`
