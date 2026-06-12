# logistica-frontend

Next.js 16.2.6 + React 19 + Tailwind CSS 4 + TypeScript strict (5.x). App Router.

```bash
npm run dev    # puerto 3000
npm run build
npm run lint   # ESLint con eslint-config-next
```

## Stack

| Herramienta | Propósito |
|---|---|
| Next.js 16 + React 19 | Framework |
| Tailwind CSS 4 + shadcn/ui | UI (new-york style, "use client") |
| TanStack Query | Server state — fetching, caching, mutations |
| TanStack Table | Tablas con sort, filter, paginación |
| Axios | HTTP client + interceptor JWT |
| Zustand | Estado global cliente (auth) |
| sonner | Notificaciones toast |

## Agent Workflows

### Orquestador (SDD)
- **Flujo:** Spect → aprobación → Implement → Validator
- Crea spec en `spec/<module>.md` antes de codificar
- Un módulo a la vez

### Build
- **Sin specs** — análisis e implementación directa
- Validación post-facto con `npm run lint` + `npm run build`
- Para cambios rápidos y correcciones puntuales

## Stack quirks

- **Tailwind v4** usa `@tailwindcss/postcss` — NO hay `tailwind.config.js`. Config via CSS.
- **Path alias**: `@/*` → `./*`
- Sin tests, sin typecheck script
- Componentes con hooks deben tener `"use client"`

## Estructura

```
logistica-frontend/
├── app/
│   ├── layout.tsx          # Root layout + providers
│   ├── (dashboard)/        # Rutas protegidas con sidebar
│   │   └── <module>/       # Páginas por módulo
│   └── globals.css         # Tailwind + shadcn tokens
├── components/
│   └── ui/                 # shadcn components
├── lib/
│   ├── axios.ts            # Axios instance + JWT interceptor
│   ├── constants.ts        # API base URL
│   └── utils.ts            # cn() utility
├── stores/
│   └── auth.ts             # Zustand store (login/logout/tokens)
├── providers/              # Query, Auth, Sonner providers
├── services/               # API functions por módulo
├── types/
│   └── api.ts              # TypeScript interfaces de la API
├── spec/                   # Specs por módulo (SDD)
├── docs/
│   ├── api-reference.md    # Backend API completa
│   └── mvp.md              # Visión general del MVP
├── .opencode/agents/       # SDD agent definitions
├── next.config.ts
├── eslint.config.mjs
└── tsconfig.json
```

## Backend API — logistica-api

Django 6 + DRF 3.17. Base: `http://localhost:8000/api`. Auth: JWT (SimpleJWT).

`docs/api-reference.md` — referencia completa de endpoints, modelos y campos.

| Módulo | Endpoint | FK relevantes |
|--------|----------|---------------|
| Auth | `POST /api/token/`, `POST /api/token/refresh/` | — |
| Warehouse | `/api/warehouses/` | — |
| Suppliers | `/api/suppliers/` | — |
| Products | `/api/products/` | supplier, warehouse |
| Customer | `/api/customers/` | — |
| Shipment | `/api/shipments/` | customer, origin_warehouse, route; nested items |
| ShipmentItem | `/api/shipment-items/` | shipment, product |
| Driver | `/api/drivers/` | user (auth_user) |
| Transport | `/api/transports/` | — |
| Route | `/api/routes/` | transport, driver; nested stops |
| Stop | `/api/stops/` | route, warehouse |

CRUD estándar (list, create, retrieve, update, partial_update, destroy). Soft-delete via `is_active=false` en entidades principales. ShipmentItems y Stops son hard-delete.

Select_related/prefetch_related en Products, Shipment, Route para eager loading de relaciones.

### Convenciones API

- Header: `Authorization: Bearer <access_token>`
- Read-only: `id`, `created_at`, `updated_at`
- FK como integers en requests, objetos expandidos en GET responses
- Fechas ISO 8601. Paginación DRF default (PageNumberPagination)
