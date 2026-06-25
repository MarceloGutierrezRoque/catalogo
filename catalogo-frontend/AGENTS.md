# catalogo-frontend

Next.js 16.2 + React 19 + Tailwind CSS 4 + TypeScript strict. App Router.

## Stack

| Herramienta | Propósito |
|---|---|
| Next.js 16 + React 19 | Framework |
| Tailwind CSS 4 + shadcn/ui | UI (new-york style) |
| TanStack Query | Server state — fetching, caching, mutations |
| TanStack Table | Tablas con sort, filter, paginación |
| Axios | HTTP client + interceptor JWT |
| Zustand | Estado global cliente (auth) |
| sonner | Notificaciones toast |
| Zod | Validación de formularios |

## Agent Workflows

### Orquestador (SDD)
- **Flujo:** Spect → aprobación → Implement → Validator
- Crea spec en `spec/<module>.md` antes de codificar
- Un módulo a la vez, orden definido en `docs/mvp.md`
- Consultar siempre `docs/api-reference.md` y `docs/mvp.md`
- **Antes de responder cualquier prompt, consultar `.opencode/agents/orchestrator.md`**

### Build
- **Sin specs** — análisis e implementación directa
- Validación post-facto con `npm run lint` + `npm run build`
- Para cambios rápidos y correcciones puntuales

## Stack quirks

- **Tailwind v4** — NO hay `tailwind.config.js`. Config via CSS (`@theme inline` en `app/globals.css`). PostCSS plugin: `@tailwindcss/postcss`.
- **Path alias:** `@/*` → `./*`
- Sin typecheck script, sin tests.
- ESLint: `eslint-config-next` con `core-web-vitals` + `typescript`.

## Comandos

```bash
npm run dev    # puerto 3000 — siempre manual
npm run build
npm run lint
```

## Backend — catalogo-backend

Django 6 + DRF 3.17. Base: `http://localhost:8000`. Auth: JWT (Bearer).

`docs/api-reference.md` — referencia completa de endpoints, modelos, validaciones y convenciones.

| Módulo | Endpoints | Auth |
|--------|-----------|------|
| Auth | `POST /api/token/`, `/api/token/refresh/` | — |
| Plushies (público) | `GET /api/plushies/`, `/api/plushies/{id}/` | AllowAny |
| Plushies (admin) | `GET/POST/PUT/PATCH/DELETE /api/admin/plushies/{id}/`, `activate/`, `deactivate/` | JWT |
| Órdenes (público) | `POST /api/orders/` (con items anidados) | AllowAny |
| Órdenes (admin) | `GET /api/admin/orders/`, `/api/admin/orders/{id}/` (PATCH status) | JWT |
| Usuarios (admin) | `GET/POST/PUT/PATCH/DELETE /api/users/{id}/` | JWT |
| Dashboard | `GET /api/dashboard/` | JWT |

## Conventions

- Docs/comms español, código/identificadores/commits inglés.
- `npm run dev` nunca ejecutar automáticamente.
- Sin CI/CD, sin Docker.
