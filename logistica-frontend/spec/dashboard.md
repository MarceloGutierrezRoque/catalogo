# Spec: Dashboard Analytics

Módulo de analytics para el dashboard principal. Agrega 10 visualizaciones (KPIs, donuts, series temporales, rankings) debajo del banner de bienvenida y las tarjetas de módulos existentes.

---

## 1. Objetivo

Proporcionar una vista general del estado del sistema logístico mediante indicadores clave (KPIs), distribuciones (donuts), tendencias temporales (área chart) y rankings (bar lists). Todas las agregaciones se realizan **client-side** a partir de los datos obtenidos por los hooks TanStack Query existentes.

---

## 2. Funcionalidades

| # | Funcionalidad | Tipo |
|---|---------------|------|
| 1 | Total de envíos activos | KPI |
| 2 | Rutas activas (no completadas ni canceladas) | KPI |
| 3 | Suma total de stock de productos activos | KPI |
| 4 | Almacenes activos | KPI |
| 5 | Distribución de envíos por estado | Donut chart |
| 6 | Distribución de rutas por estado | Donut chart |
| 7 | Disponibilidad de vehículos | Donut chart |
| 8 | Envíos creados por mes (serie temporal) | Area chart |
| 9 | Productos con stock bajo (stock ≤ min_stock_level) | Bar list |
| 10 | Envíos agrupados por ciudad destino | Bar list |
| — | Filtro por rango de fechas (desde/hasta) | Filtros |
| — | Filtro por estado de envío | Filtros |

---

## 3. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [BANNER DE BIENVENIDA — existente, sin cambios]               │
├─────────────────────────────────────────────────────────────────┤
│  [TARJETAS DE MÓDULOS — 8 cards, existentes, sin cambios]      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────── ANALYTICS SECTION ──────────────────────────┐ │
│  │  [Filtros: Fecha desde | Fecha hasta | Estado envío]       │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  ROW 1 — KPI Cards (4 cards inline)                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ Total    │ │ Rutas    │ │ Stock    │ │ Almacenes│      │ │
│  │  │ Envíos   │ │ Activas  │ │ Total    │ │ Activos  │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  ROW 2 — Donut Charts (3 cards side by side)               │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │ Envíos por  │ │ Rutas por   │ │ Dispon.     │          │ │
│  │  │ Estado      │ │ Estado      │ │ Vehículos   │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  ROW 3 — Area Chart (full width)                           │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ Envíos en el Tiempo                                 │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  ROW 4 — Ranking Lists (2 cards side by side)              │ │
│  │  ┌────────────────────┐ ┌────────────────────┐             │ │
│  │  │ Stock Bajo         │ │ Envíos por Ciudad  │             │ │
│  │  └────────────────────┘ └────────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Grid layout (Tailwind)

```tsx
// Row 1 — KPIs
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* 4 KPI cards */}
</div>

// Row 2 — Donuts
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* 3 Donut cards */}
</div>

// Row 3 — Area chart (full width)
<div>
  {/* 1 Area chart card */}
</div>

// Row 4 — Bar lists
<div className="grid gap-4 sm:grid-cols-2">
  {/* 2 Bar list cards */}
</div>
```

---

## 4. Componentes Tremor a usar

Instalar: `npm install @tremor/react recharts`

| Componente Tremor | Props clave | Uso |
|-------------------|-------------|-----|
| `DonutChart` | `data`, `category`, `index`, `colors`, `valueFormatter`, `showLabel`, `variant="donut"` | Charts 5, 6, 7 |
| `AreaChart` | `data`, `index`, `categories`, `colors`, `valueFormatter`, `showLegend`, `showGridLines`, `curveType="monotone"` | Chart 8 |
| `BarList` | `data`, `valueFormatter`, `sortOrder`, `showAnimation` | Charts 9, 10 |

**Nota:** shadcn `Card` se usa para todos los contenedores (ya instalado). Tremor `Card` NO se usa.

### Colores para charts

```ts
// Tremor color palette tokens
const statusColors: Record<string, string> = {
  pending: "yellow",
  picked_up: "blue",
  in_transit: "cyan",
  delivered: "green",
  cancelled: "red",
}

const routeStatusColors: Record<string, string> = {
  planned: "blue",
  in_progress: "cyan",
  completed: "green",
  cancelled: "red",
}

const availabilityColors = ["emerald", "red"] // available / not available
```

---

## 5. Data Flow

### Fetching

Todas las queries se ejecutan en paralelo al montar el componente Dashboard:

```
useShipments()       → queryKey: ["shipments"]
useRoutes()          → queryKey: ["routes"]
useProducts()        → queryKey: ["products"]
useWarehouses()      → queryKey: ["warehouses"]
useTransports()      → queryKey: ["transports"]
```

Usar `useQueries` de TanStack Query para ejecutar todas en paralelo y manejar estados individualmente.

### Aggregation (client-side, todas en `utils/dashboard.ts`)

```typescript
// 1. Total envíos activos
countShipments(data: Shipment[]): number
  → data.filter(s => s.is_active && s.status !== "cancelled").length

// 2. Rutas activas
countActiveRoutes(data: Route[]): number
  → data.filter(r => r.is_active && r.status !== "completed" && r.status !== "cancelled").length

// 3. Stock total
sumStock(data: Product[]): number
  → data.filter(p => p.is_active).reduce((sum, p) => sum + p.stock_quantity, 0)

// 4. Almacenes activos
countActiveWarehouses(data: Warehouse[]): number
  → data.filter(w => w.is_active).length

// 5. Envíos por estado — agrupar por status
groupByStatus(data: Shipment[]): { name: string; value: number }[]
  → agrupa por shipment.status, cuenta cada grupo
  → labels: "Pendiente", "Recogido", "En tránsito", "Entregado", "Cancelado"

// 6. Rutas por estado — agrupar por status
groupByRouteStatus(data: Route[]): { name: string; value: number }[]
  → agrupa por route.status
  → labels: "Planificada", "En progreso", "Completada", "Cancelada"

// 7. Disponibilidad vehículos
groupByAvailability(data: Transport[]): { name: string; value: number }[]
  → is_available: true → "Disponible", false → "No disponible"

// 8. Envíos por mes — agrupar por mes de created_at
groupByMonth(data: Shipment[], dateFrom?: string, dateTo?: string): { date: string; Envíos: number }[]
  → filtra por rango de fechas si se provee
  → agrupa por "YYYY-MM" usando created_at
  → ordena cronológicamente
  → si un mes no tiene envíos, se omite (no se rellena con cero para MVP)

// 9. Stock bajo
lowStockProducts(data: Product[], limit = 10): { name: string; value: number }[]
  → data.filter(p => p.is_active && p.stock_quantity <= p.min_stock_level)
  → sort por stock_quantity ascendente
  → limit 10
  → cada item: { name: product.name, value: product.stock_quantity }

// 10. Envíos por ciudad
groupByCity(data: Shipment[], limit = 10): { name: string; value: number }[]
  → agrupa por destination_city
  → sort descendente por count
  → limit 10
```

**Nota sobre filtros:** las funciones `groupByMonth`, `groupByStatus`, `groupByCity` aceptan un parámetro opcional `filters: { dateFrom?: string; dateTo?: string; status?: string }` que se aplica ANTES de agrupar.

### Filtros (applyFilters)

Aplicar al array de shipments antes de pasarlo a cualquier función de agregación:

```typescript
function applyFilters(
  shipments: Shipment[],
  filters: { dateFrom?: string; dateTo?: string; status?: string }
): Shipment[] {
  let filtered = [...shipments]
  if (filters.dateFrom) {
    filtered = filtered.filter(s => s.created_at >= filters.dateFrom)
  }
  if (filters.dateTo) {
    filtered = filtered.filter(s => s.created_at <= filters.dateTo + "T23:59:59Z")
  }
  if (filters.status) {
    filtered = filtered.filter(s => s.status === filters.status)
  }
  return filtered
}
```

---

## 6. Estados

### Loading

Cada chart/envase muestra su propio indicador de carga. Usar `Skeleton` de shadcn:

```tsx
// KPI skeleton
<Card>
  <CardHeader className="pb-2">
    <Skeleton className="h-4 w-24" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-16" />
  </CardContent>
</Card>

// Chart skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-40" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[250px] w-full rounded-lg" />
  </CardContent>
</Card>
```

**Comportamiento:** Cada query de TanStack Query se maneja individualmente. Si una query está cargando, su sección muestra skeleton. Las demás secciones ya renderizan datos normalmente.

### Empty

Cuando la data existe pero el resultado de la agregación está vacío:

- **KPIs:** mostrar `0`
- **Donuts:** mostrar mensaje "Sin datos" centrado dentro del chart area
- **Area chart:** mostrar mensaje "Sin datos" centrado
- **Bar lists:** mostrar lista vacía con mensaje "Sin datos"

```tsx
// Empty state helper component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  )
}
```

### Error

Cada chart/envase maneja su propio error. Si una query falla, NO debe romper todo el dashboard.

```tsx
// Error state helper component
function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center text-destructive text-sm">
      <AlertCircle className="mr-2 h-4 w-4" />
      Error al cargar: {message}
    </div>
  )
}
```

Implementar chequeo por query:

```tsx
const shipments = useShipments()
const routes = useRoutes()
// ...

if (shipments.isError) {
  return <ChartError message="envíos" />
}
// ...
```

---

## 7. API calls needed

Ninguna nueva. Se reutilizan los hooks existentes de `services/`:

| Módulo | Hook | Endpoint | Query Key |
|--------|------|----------|-----------|
| Shipments | `useShipments()` | `GET /api/shipments/` | `["shipments"]` |
| Routes | `useRoutes()` | `GET /api/routes/` | `["routes"]` |
| Products | `useProducts()` | `GET /api/products/` | `["products"]` |
| Warehouses | `useWarehouses()` | `GET /api/warehouses/` | `["warehouses"]` |
| Transports | `useTransports()` | `GET /api/transports/` | `["transports"]` |

**Nota:** La paginación puede limitar los datos. Para MVP, si el backend devuelve paginado, aumentar `?page_size=1000` o similar para obtener todos los registros. Alternativamente, los hooks ya manejan paginación con `Array.isArray` check.

---

## 8. Estructura de archivos

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `components/dashboard/kpi-card.tsx` | Componente reutilizable para KPI Card |
| `components/dashboard/donut-card.tsx` | Card con DonutChart de Tremor |
| `components/dashboard/area-chart-card.tsx` | Card con AreaChart de Tremor |
| `components/dashboard/bar-list-card.tsx` | Card con BarList de Tremor |
| `components/dashboard/chart-skeleton.tsx` | Skeleton loader para charts |
| `components/dashboard/chart-error.tsx` | Error state para charts |
| `components/dashboard/empty-state.tsx` | Empty state para charts |
| `components/dashboard/dashboard-filters.tsx` | Filtros (fecha desde/hasta, estado) |
| `utils/dashboard.ts` | Funciones de agregación client-side |
| `hooks/use-dashboard.ts` | Hook personalizado que orquesta queries y agregaciones |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `app/(dashboard)/dashboard/page.tsx` | Importar y renderizar `DashboardAnalytics` debajo de module cards |
| `package.json` | Agregar `@tremor/react` y `recharts` como dependencias |

### Árbol de componentes

```
DashboardPage (page.tsx)
├── Welcome Banner (existente)
├── Module Cards (existente)
└── DashboardAnalytics (nuevo — componente contenedor)
    ├── DashboardFilters
    ├── KpiCard (x4)
    │   ├── Total Envíos
    │   ├── Rutas Activas
    │   ├── Stock Total
    │   └── Almacenes Activos
    ├── DonutCard (x3)
    │   ├── Envíos por Estado
    │   ├── Rutas por Estado
    │   └── Disponibilidad Vehículos
    ├── AreaChartCard
    │   └── Envíos en el Tiempo
    ├── BarListCard (x2)
    │   ├── Stock Bajo
    │   └── Envíos por Ciudad
```

---

## 9. Filtros

### Position

Los filtros se colocan justo antes de la primera fila de analytics, dentro de un contenedor con borde o fondo sutil para separarlos visualmente.

### Componentes UI

| Filtro | Componente | Fuente |
|--------|-----------|--------|
| Fecha desde | `Input` type="date" de shadcn | `@/components/ui/input` |
| Fecha hasta | `Input` type="date" de shadcn | `@/components/ui/input` |
| Estado envío | `Select` de shadcn | `@/components/ui/select` |

### Select options para estado de envío

```tsx
const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "picked_up", label: "Recogido" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]
```

### Estado local de filtros

Usar `useState` en `DashboardAnalytics` (no Zustand store, no URL params para MVP):

```typescript
const [dateFrom, setDateFrom] = useState<string>("")
const [dateTo, setDateTo] = useState<string>("")
const [statusFilter, setStatusFilter] = useState<string>("")
```

### Efecto en charts

Los filtros afectan a los charts basados en shipments (charts 1, 5, 8, 10). Los charts de routes (2, 6), transports (7), products (3, 9) y warehouses (4) NO SE VEN AFECTADOS por los filtros.

Específicamente:

| Chart | Afectado por filtros |
|-------|---------------------|
| 1. Total Envíos (KPI) | ✅ Sí (filtra shipments) |
| 2. Rutas Activas (KPI) | ❌ No |
| 3. Stock Total (KPI) | ❌ No |
| 4. Almacenes Activos (KPI) | ❌ No |
| 5. Envíos por Estado (Donut) | ✅ Sí (filtra shipments antes de agrupar) |
| 6. Rutas por Estado (Donut) | ❌ No |
| 7. Disponibilidad Vehículos (Donut) | ❌ No |
| 8. Envíos en el Tiempo (Area) | ✅ Sí (filtra shipments antes de agrupar por mes) |
| 9. Stock Bajo (BarList) | ❌ No |
| 10. Envíos por Ciudad (BarList) | ✅ Sí (filtra shipments antes de agrupar) |

---

## 10. Criterios de aceptación

- [ ] Tremor `@tremor/react` instalado y configurado correctamente
- [ ] DashboardPage renderiza banner + module cards + analytics sin romper nada existente
- [ ] Las 10 visualizaciones se renderizan correctamente con datos reales de la API
- [ ] Cada visualización respeta su propio loading state (skeleton) → no se bloquea todo el dashboard
- [ ] Cada visualización maneja error state individual (mensaje de error) → no rompe otras secciones
- [ ] Cada visualización maneja empty state (sin datos) con mensaje "Sin datos"
- [ ] Los 4 KPIs muestran valores numéricos correctos
- [ ] Los 3 Donut charts muestran segmentos con colores distintos y tooltip con valores
- [ ] El Area chart muestra envíos agrupados por mes en el eje X
- [ ] Las 2 Bar lists muestran items ordenados (stock bajo: ascendente, ciudades: descendente)
- [ ] Filtro de fechas funciona: cambia los datos de charts afectados
- [ ] Filtro de estado de envío funciona: cambia los datos de charts afectados
- [ ] Reset de filtros (valores vacíos) retorna a datos sin filtrar
- [ ] Charts de routes, transports, products, warehouses NO se ven afectados por filtros
- [ ] Código de agregación vive en `utils/dashboard.ts` (testeable)
- [ ] No se crearon nuevas API calls — solo se reutilizan hooks existentes

---

## Appendix A: Value Formatters

```typescript
// Para KPIs
const formatNumber = (n: number) => n.toLocaleString("es-PE")

// Para moneda (si se usa luego)
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n)

// Para donut charts (cantidades)
const valueFormatter = (n: number) => n.toLocaleString("es-PE")
```

## Appendix B: Status Labels (para mostrar en español)

```typescript
const shipmentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  picked_up: "Recogido",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const routeStatusLabels: Record<string, string> = {
  planned: "Planificada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
}
```

## Appendix C: DashboardAnalytics Component Flow

```typescript
// hooks/use-dashboard.ts
export function useDashboard(filters: DashboardFilters) {
  const shipments = useShipments()
  const routes = useRoutes()
  const products = useProducts()
  const warehouses = useWarehouses()
  const transports = useTransports()

  // Aplicar filtros a shipments
  const filteredShipments = useMemo(
    () => applyFilters(shipments.data ?? [], filters),
    [shipments.data, filters]
  )

  // KPIs
  const totalShipments = useMemo(
    () => countShipments(filteredShipments),
    [filteredShipments]
  )
  const activeRoutes = useMemo(
    () => countActiveRoutes(routes.data ?? []),
    [routes.data]
  )
  const totalStock = useMemo(
    () => sumStock(products.data ?? []),
    [products.data]
  )
  const activeWarehouses = useMemo(
    () => countActiveWarehouses(warehouses.data ?? []),
    [warehouses.data]
  )

  // Charts data
  const shipmentsByStatus = useMemo(
    () => groupByStatus(filteredShipments),
    [filteredShipments]
  )
  const routesByStatus = useMemo(
    () => groupByRouteStatus(routes.data ?? []),
    [routes.data]
  )
  const availability = useMemo(
    () => groupByAvailability(transports.data ?? []),
    [transports.data]
  )
  const shipmentsByMonth = useMemo(
    () => groupByMonth(filteredShipments),
    [filteredShipments]
  )
  const lowStock = useMemo(
    () => lowStockProducts(products.data ?? []),
    [products.data]
  )
  const shipmentsByCity = useMemo(
    () => groupByCity(filteredShipments),
    [filteredShipments]
  )

  return {
    // Raw query states
    queries: { shipments, routes, products, warehouses, transports },
    // Computed data
    totalShipments,
    activeRoutes,
    totalStock,
    activeWarehouses,
    shipmentsByStatus,
    routesByStatus,
    availability,
    shipmentsByMonth,
    lowStock,
    shipmentsByCity,
  }
}
```
