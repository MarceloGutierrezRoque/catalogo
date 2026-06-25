# Spec: Dashboard — Admin (Estadísticas)

## 1. Resumen del módulo

Panel de estadísticas del admin (Fase 8 del MVP — fase final).

Muestra tarjetas con conteos de órdenes por estado (pendientes, contactadas, cerradas, canceladas) y resumen de peluches (activos/inactivos). Es una vista únicamente de lectura — no hay operaciones CRUD.

**Endpoint que consume (requiere JWT Bearer):**

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/dashboard/` | Estadísticas agregadas de órdenes y peluches |

**Ruta del módulo:**

| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/dashboard` | 🔒 Protegida | Tarjetas con counts + resúmenes |

**Estructura de respuesta del endpoint:**

```json
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
    "total": 10
  }
}
```

**Particularidades del módulo:**
- No usa TanStack Table (no hay listados tabulares)
- No usa formularios ni Zod (solo lectura)
- No usa mutaciones (no hay create/update/delete)
- Un solo `useQuery` para todo el dashboard
- Los datos ya existen como tipo `DashboardStats` en `types/api.ts`

---

## 2. Archivos a crear (4 archivos)

| # | Ruta | Propósito |
|---|------|-----------|
| 1 | `services/dashboard.ts` | API service: `fetchDashboard()` |
| 2 | `hooks/use-dashboard.ts` | TanStack Query hook: `useDashboard()` |
| 3 | `components/dashboard/stats-cards.tsx` | Grid de 4 tarjetas con conteos de órdenes |
| 4 | `components/dashboard/plushies-summary.tsx` | Resumen de peluches activos/inactivos |

**Nota:** No se crea un componente `orders-summary.tsx` separado. Las tarjetas de stats (`stats-cards.tsx`) ya muestran los 4 estados de órdenes. El detalle adicional de órdenes se integra dentro del propio `stats-cards.tsx` como subtítulos en cada tarjeta.

---

## 3. Archivos a modificar (1 archivo)

| # | Ruta | Cambio |
|---|------|--------|
| 1 | `app/dashboard/page.tsx` | Reemplazar placeholder con componente real que integra todos los subcomponentes |

---

## 4. Detalle de cada archivo

### 4.1 `services/dashboard.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { DashboardStats } from "@/types/api";

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/api/dashboard/");
  return data;
}
```

**Decisiones técnicas:**
- Servicio mínimo — un solo endpoint, sin parámetros, sin paginación.
- Retorna directamente `DashboardStats` (no hay wrapper paginado).
- No necesita interfaz de params (el endpoint no acepta filtros).

---

### 4.2 `hooks/use-dashboard.ts` — TanStack Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/services/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    refetchInterval: 30_000, // Refrescar cada 30s (datos en tiempo real)
  });
}
```

**Decisiones técnicas:**
- `queryKey` simple: `["dashboard"]` — no hay listas ni detalles.
- `refetchInterval: 30_000` — los datos del dashboard son estadísticas que pueden cambiar cuando otros admins modifican órdenes/peluches. Refresco automático cada 30 segundos.
- No se necesita `useMutation` — el módulo es solo lectura.
- No se necesita `useQueryClient` ni invalidación cruzada — los datos se refrescan solos.

---

### 4.3 `components/dashboard/stats-cards.tsx` — Grid de tarjetas de órdenes

```tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Phone, CheckCircle2, XCircle } from "lucide-react";
import type { DashboardStats } from "@/types/api";

interface StatsCardsProps {
  data: DashboardStats["orders"];
}

const orderConfig = [
  {
    key: "pending" as const,
    label: "Pendientes",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconBg: "bg-yellow-100",
  },
  {
    key: "contacted" as const,
    label: "Contactadas",
    icon: Phone,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    key: "closed" as const,
    label: "Cerradas",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
  },
  {
    key: "cancelled" as const,
    label: "Canceladas",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconBg: "bg-red-100",
  },
] as const;

export function StatsCards({ data }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {orderConfig.map((config) => {
        const Icon = config.icon;
        const value = data[config.key];

        return (
          <Card
            key={config.key}
            className={`${config.bgColor} ${config.borderColor} border-2`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {config.label}
              </CardTitle>
              <div className={`rounded-full p-2 ${config.iconBg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${config.color}`}>
                {value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {data.total} órdenes totales
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

**Decisiones técnicas:**
- Grid responsivo: 1 columna en mobile, 2 en tablet (`sm:`), 4 en desktop (`lg:`).
- Cada tarjeta tiene:
  - Fondo de color suave (`bg-*-50`)
  - Borde de color (`border-*-200`)
  - Ícono en círculo con fondo de color
  - Número grande en color
- Config declarativa: `orderConfig` array define las 4 tarjetas (DRY).
- Subtítulo "de X órdenes totales" para dar contexto.
- Usa los mismos colores semánticos que `ORDER_STATUS_COLORS` (amarillo, azul, verde, rojo).

---

### 4.4 `components/dashboard/plushies-summary.tsx` — Resumen de Peluches

```tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, XCircle } from "lucide-react";
import type { DashboardStats } from "@/types/api";

interface PlushiesSummaryProps {
  data: DashboardStats["plushies"];
}

export function PlushiesSummary({ data }: PlushiesSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Peluches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Activos */}
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-700">
                  {data.active}
                </span>
                <Badge variant="secondary" className="bg-green-200 text-green-800">
                  En catálogo
                </Badge>
              </div>
            </div>
          </div>

          {/* Inactivos */}
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="rounded-full bg-red-100 p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactivos</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-700">
                  {data.inactive}
                </span>
                <Badge variant="secondary" className="bg-red-200 text-red-800">
                  No visible
                </Badge>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <div className="rounded-full bg-muted p-2">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{data.total}</span>
                <Badge variant="outline">Peluches</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Decisiones técnicas:**
- Una sola `Card` de shadcn con 3 sub-tarjetas internas en grid.
- Cada sub-tarjeta: ícono + label + valor grande + badge descriptivo.
- Colores semánticos: verde para activos, rojo para inactivos, neutral para total.
- Badges: "En catálogo" / "No visible" / "Peluches" — dan contexto extra.

---

### 4.5 `app/dashboard/page.tsx` — Página principal del Dashboard

```tsx
"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PlushiesSummary } from "@/components/dashboard/plushies-summary";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>

        {/* Skeleton: 4 cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton: plushies summary card */}
        <div className="h-40 bg-muted rounded-xl animate-pulse" />

        {/* Skeleton: second row card */}
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── ERROR ──
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          Error al cargar estadísticas
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          No pudimos obtener los datos del dashboard. Verifica que el servidor
          esté funcionando e intenta nuevamente.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Reintentar
        </Button>
      </div>
    );
  }

  // ── SUCCESS ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del catálogo y pedidos
        </p>
      </div>

      <StatsCards data={data.orders} />
      <PlushiesSummary data={data.plushies} />
    </div>
  );
}
```

**Decisiones técnicas:**
- `"use client"` — necesario porque usa hooks (`useDashboard`).
- Tres estados visuales completos: LOADING (skeletons), ERROR (ícono + mensaje + reintentar), SUCCESS (datos reales).
- Skeletons con `animate-pulse` y `rounded-xl` para que coincidan visualmente con los `Card` reales.
- Página reemplaza completamente el placeholder actual.

---

## 5. Componentes shadcn/ui utilizados

**Ya instalados en `components/ui/`:**
- `card.tsx` ✅ (`Card`, `CardHeader`, `CardTitle`, `CardContent`)
- `badge.tsx` ✅ (en `PlushiesSummary`)
- `button.tsx` ✅ (en error state)

**Íconos lucide-react necesarios (todos disponibles en el paquete):**
- `Clock` — pendientes
- `Phone` — contactadas
- `CheckCircle2` — cerradas
- `XCircle` — canceladas
- `Package` — peluches total
- `CheckCircle` — activos
- `AlertCircle` — error
- `RefreshCw` — reintentar

---

## 6. Estados de los componentes

### DashboardPage (página principal)

```
┌─────────────────────────────────────────┐
│             DashboardPage                │
│                                          │
│  ┌─ LOADING ─────────────────────────┐  │
│  │  Skeleton: título + subtítulo      │  │
│  │  Skeleton: grid 4 tarjetas         │  │
│  │  Skeleton: card peluches summary   │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌─ ERROR ───────────────────────────┐  │
│  │  Icono alerta grande               │  │
│  │  "Error al cargar estadísticas"    │  │
│  │  Mensaje descriptivo               │  │
│  │  Botón "Reintentar" (con spinner)  │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌─ SUCCESS ─────────────────────────┐  │
│  │  Título + subtítulo                │  │
│  │  StatsCards: grid 4 tarjetas       │  │
│  │    ├── Pendientes (amarillo)       │  │
│  │    ├── Contactadas (azul)          │  │
│  │    ├── Cerradas (verde)            │  │
│  │    └── Canceladas (rojo)           │  │
│  │  PlushiesSummary: 3 sub-tarjetas   │  │
│  │    ├── Activos (verde)             │  │
│  │    ├── Inactivos (rojo)            │  │
│  │    └── Total (neutral)             │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌─ REFETCHING (sub-estado) ─────────┐  │
│  │  Los datos siguen visibles         │  │
│  │  Spinner solo en botón reintentar  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### StatsCards

```
┌─────────────────────────────────────────────┐
│              StatsCards                      │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──┐│
│  │ ⏰ Pend.  │ │ 📞 Cont.  │ │ ✅ Cerr.  │ │ ❌││
│  │   5       │ │   3       │ │   12      │ │ 1 ││
│  │ de 21     │ │ de 21     │ │ de 21     │ │.. ││
│  │ (yellow)  │ │ (blue)    │ │ (green)   │ │red││
│  └──────────┘ └──────────┘ └──────────┘ └───┘│
│  Grid: 1→2→4 columnas responsive              │
└───────────────────────────────────────────────┘
```

### PlushiesSummary

```
┌─────────────────────────────────────────────┐
│           PlushiesSummary                   │
│  📦 Peluches                               │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ✅ Act.  │ │ ❌ Inact. │ │ 📦 Total  │    │
│  │   8      │ │   2      │ │   10      │    │
│  │ [Catál.] │ │[No vis.] │ │ [Peluches]│    │
│  │ (green)  │ │ (red)    │ │ (neutral) │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│  Grid: 1→3 columnas responsive               │
└─────────────────────────────────────────────┘
```

---

## 7. Flujo de navegación

```
[/dashboard] Dashboard (raíz del panel)
  ├── Sidebar highlight: "Dashboard" con LayoutDashboard
  ├── Contenido:
  │   ├── Título: "Dashboard"
  │   ├── Subtítulo: "Resumen general del catálogo y pedidos"
  │   ├── StatsCards: 4 tarjetas de estado de órdenes
  │   └── PlushiesSummary: 3 tarjetas de peluches
  │
  ├── LOADING → skeletons animados
  ├── ERROR → mensaje + botón reintentar
  └── SUCCESS → datos en vivo (refetch cada 30s)
```

**Sidebar:** El link "Dashboard" → `/dashboard` ya existe en `sidebar.tsx` con ícono `LayoutDashboard`. No requiere modificación.

---

## 8. Reglas de negocio

| Regla | Implementación |
|-------|----------------|
| Solo admin puede ver estadísticas | El endpoint requiere JWT Bearer (el layout del dashboard ya redirige a `/login` si no hay sesión) |
| Datos de solo lectura | No hay mutaciones, el módulo es únicamente informativo |
| Refresco automático | `refetchInterval: 30_000` en `useDashboard()` |
| Sin filtros ni paginación | El endpoint devuelve agregados, no listas |

---

## 9. Notas técnicas importantes

### 9.1 Sin Zustand store

No se necesita store para este módulo. El estado de auth ya está cubierto por `stores/auth.ts` y el cache de TanStack Query es suficiente para los datos del dashboard.

### 9.2 Server vs Client components

- `app/dashboard/page.tsx` → **Client Component** (`"use client"`) porque usa hooks (`useDashboard`).
- `components/dashboard/stats-cards.tsx` → **Client Component** (aunque no tiene hooks directamente, es presentacional y recibe props; se marca como client por consistencia con el patrón del proyecto y porque es hijo de un client component).
- `components/dashboard/plushies-summary.tsx` → **Client Component** (misma razón).

### 9.3 Refetch automático

El dashboard implementa `refetchInterval: 30_000` para mantener los datos actualizados. Esto es útil porque:
- Otros admins pueden estar modificando órdenes o peluches simultáneamente.
- El dashboard es la primera vista que ve el admin al ingresar.
- No hay WebSockets en el backend, polling cada 30s es un balance razonable entre actualización y carga.

### 9.4 Sin TanStack Table ni formularios

A diferencia de otros módulos del admin, el dashboard no necesita:
- TanStack Table (no hay filas que ordenar/filtrar/paginar).
- shadcn Form + Zod (no hay formularios).
- Diálogos de confirmación (no hay delete).

### 9.5 Manejo de errores

Si el endpoint falla (servidor caído, token expirado, etc.), se muestra:
1. Ícono `AlertCircle` grande en rojo.
2. Título "Error al cargar estadísticas".
3. Mensaje descriptivo.
4. Botón "Reintentar" que ejecuta `refetch()`.

El interceptor JWT en `lib/axios.ts` ya maneja renovación de tokens — si el refresh falla, redirige a `/login`.

### 9.6 Colores y consistencia visual

Los colores de las tarjetas de órdenes siguen la misma semántica que `ORDER_STATUS_COLORS` en `types/api.ts`:
- Pendiente → amarillo (`yellow`)
- Contactado → azul (`blue`)
- Cerrado → verde (`green`)
- Cancelado → rojo (`red`)

Esto garantiza consistencia cross-module: un admin ve el mismo color para "Pendiente" en el dashboard que en la tabla de pedidos.

### 9.7 Sin necesidad de modificar types/api.ts

El tipo `DashboardStats` ya existe en `types/api.ts`:

```typescript
export interface DashboardStats {
  orders: {
    pending: number;
    contacted: number;
    closed: number;
    cancelled: number;
    total: number;
  };
  plushies: {
    active: number;
    inactive: number;
    total: number;
  };
}
```

No se requieren cambios.

---

## 10. Criterios de aceptación

### Funcionales

- [ ] `/dashboard` muestra 4 tarjetas de estado de órdenes en grid responsivo.
- [ ] Tarjeta "Pendientes" con ícono `Clock` y color amarillo.
- [ ] Tarjeta "Contactadas" con ícono `Phone` y color azul.
- [ ] Tarjeta "Cerradas" con ícono `CheckCircle2` y color verde.
- [ ] Tarjeta "Canceladas" con ícono `XCircle` y color rojo.
- [ ] Cada tarjeta muestra el número grande + "de X órdenes totales".
- [ ] Sección "Peluches" con 3 sub-tarjetas: Activos (verde), Inactivos (rojo), Total (neutral).
- [ ] Badges descriptivos en cada sub-tarjeta: "En catálogo", "No visible", "Peluches".
- [ ] Grid responsivo: 1 columna mobile, 2 tablet, 4 desktop para tarjetas de órdenes.
- [ ] Grid responsivo: 1 columna mobile, 3 desktop para sub-tarjetas de peluches.
- [ ] Título "Dashboard" + subtítulo "Resumen general del catálogo y pedidos".
- [ ] Sidebar: link "Dashboard" con ícono `LayoutDashboard` resaltado en la ruta `/dashboard`.

### Estados

- [ ] **LOADING**: 4 skeletons de cards + 2 skeletons de secciones + skeletons de título/subtítulo.
- [ ] **ERROR**: Ícono `AlertCircle` grande + mensaje + botón "Reintentar" con spinner.
- [ ] **SUCCESS**: Grid de tarjetas + sección de peluches con datos reales.
- [ ] **REFETCHING**: Los datos permanecen visibles mientras se refrescan en background.

### Técnicos

- [ ] `services/dashboard.ts` exporta `fetchDashboard()` correctamente.
- [ ] `hooks/use-dashboard.ts` exporta `useDashboard()` con `queryKey: ["dashboard"]`.
- [ ] `useDashboard()` tiene `refetchInterval: 30_000`.
- [ ] `StatsCards` recibe `DashboardStats["orders"]` como prop y es completamente declarativo.
- [ ] `PlushiesSummary` recibe `DashboardStats["plushies"]` como prop.
- [ ] No se modifica `types/api.ts` (el tipo ya existe).
- [ ] `app/dashboard/page.tsx` es `"use client"` y reemplaza el placeholder.
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.

---

## 11. Orden de implementación sugerido

```
1. services/dashboard.ts
2. hooks/use-dashboard.ts
3. components/dashboard/stats-cards.tsx
4. components/dashboard/plushies-summary.tsx
5. app/dashboard/page.tsx (modificar)
```

---

## 12. Resumen de cambios vs estado actual

| Archivo | Estado actual | Cambio |
|---------|---------------|--------|
| `app/dashboard/page.tsx` | Placeholder con título + "Seleccione un módulo..." | Reemplazar con página real con 3 estados (LOADING/ERROR/SUCCESS) |
| `types/api.ts` | ✅ `DashboardStats` ya existe | Sin cambios |
| `services/dashboard.ts` | ❌ No existe | Crear con `fetchDashboard()` |
| `hooks/use-dashboard.ts` | ❌ No existe | Crear con `useDashboard()` |
| `components/dashboard/stats-cards.tsx` | ❌ No existe | Crear con 4 tarjetas de órdenes |
| `components/dashboard/plushies-summary.tsx` | ❌ No existe | Crear con resumen de peluches |
| `components/dashboard/sidebar.tsx` | ✅ Link "Dashboard" ya existe | Sin cambios |
