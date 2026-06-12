# Spec: Dashboard UI Improvements

Módulo: Dashboard (existente). Mejoras visuales, de interacción, accesibilidad y experiencia de usuario basadas en la guía UI/UX Pro Max.

---

## 1. Objetivo

Mejorar la calidad percibida, usabilidad y accesibilidad del dashboard actual sin cambiar la funcionalidad existente. Se mantienen todas las visualizaciones, datos y estructura actual — solo se mejora la presentación e interacción.

---

## 2. Mejoras por sección

### 2.1 Welcome Banner

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | Gradiente más vibrante | Usar `from-primary/10 via-primary/20 to-primary/5` con decoración de patrón de cuadrícula sutil |
| 2 | Quick counts row | Agregar fila de mini-stats debajo del título: "X módulos disponibles", mostrando conteo rápido |
| 3 | Mejor jerarquía visual | Título más grande, subtítulo con icono, separación visual clara |

### 2.2 KPI Cards

| # | Mejora | Descripción |
|---|--------|-------------|
| 4 | Icono por KPI | Agregar icono relevante (Shipment, Route, Package, Warehouse) dentro de cada card con color semántico |
| 5 | Color-coded accent | Borde izquierdo (o top) con color semántico por KPI usando variante `border-l-4` |
| 6 | Trend indicator | Agregar badge de tendencia (sube/baja) con porcentaje simulado o real |
| 7 | Skeleton mejorado | Mostrar icon placeholder + barra animada en lugar de skeleton genérico |

### 2.3 Chart Cards (Donut, Area, BarList)

| # | Mejora | Descripción |
|---|--------|-------------|
| 8 | Info tooltip | Agregar botón de información (icono `Info`) con descripción del chart via tooltip o popover |
| 9 | Empty states contextuales | Mensaje específico por tipo de chart con icono ilustrativo y acción sugerida |
| 10 | Error states con retry | Botón "Reintentar" en error states usando `refetch()` de TanStack Query |
| 11 | Chart actions bar | Botones opcionales (expandir, exportar como CSV) en el header de cada card |

### 2.4 Filters Bar

| # | Mejora | Descripción |
|---|--------|-------------|
| 12 | Badge de filtros activos | Mostrar contador de filtros activos como badge numerado |
| 13 | Clear all button | Botón "Limpiar filtros" visible solo cuando hay filtros activos |
| 14 | Visual feedback | Transición suave al cambiar filtros; skeleton sutil en charts afectados |
| 15 | Diseño compacto | Inputs más compactos con mejor alineación; labels más visibles |

### 2.5 Module Navigation Cards

| # | Mejora | Descripción |
|---|--------|-------------|
| 16 | Hover mejorado | Escala suave (scale-[1.02]) + elevación + sombra más marcada |
| 17 | Focus visible | Anillo de foco `ring-2 ring-primary` para navegación por teclado |
| 18 | Quick count badge | Badge opcional con conteo de registros (ej: "(12)") |
| 19 | Icon sizing consistente | Forzar tamaño uniforme de icono (h-5 w-5 fijo) |

### 2.6 Estados de Carga

| # | Mejora | Descripción |
|---|--------|-------------|
| 20 | Page-level shimmer | Shimmer animado para toda la sección de analytics mientras carga inicial |
| 21 | Chart skeleton con forma | Skeleton con forma geométrica que evoca un chart (ej: rectángulo con ondas para area chart) |

### 2.7 Accesibilidad

| # | Mejora | Descripción |
|---|--------|-------------|
| 22 | Focus rings | Asegurar `focus-visible:ring-2 focus-visible:ring-primary` en cards, botones y links |
| 23 | Aria labels | `aria-label` en iconos decorativos, `role="img"` en charts |
| 24 | Keyboard nav | Navegación completa por teclado (Tab, Enter, Escape) en todos los elementos interactivos |
| 25 | Screen reader | Skip link para analytics, anuncio de carga de datos |

### 2.8 Dark Mode

| # | Mejora | Descripción |
|---|--------|-------------|
| 26 | Chart color check | Verificar que colores Tremor funcionan en dark mode (contraste 3:1 mínimo) |
| 27 | Card surface | Asegurar que cards tienen fondo distinguible en dark mode (card vs background) |
| 28 | Icon colors | Verificar que iconos en módulos mantienen contraste en dark mode |

---

## 3. Layout

Sin cambios en el layout general. Solo modificaciones visuales dentro de los componentes existentes.

### Stack layout actual (sin cambios):

```
DashboardPage (page.tsx)
├── Welcome Banner (mejorado)
├── Module Cards Grid (mejorado)
└── DashboardAnalytics (mejorado)
    ├── DashboardFilters (mejorado)
    ├── KPIs Grid (mejorado)
    ├── Donuts Grid (mejorado)
    ├── Area Chart (mejorado)
    └── Bar Lists Grid (mejorado)
```

---

## 4. Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `app/(dashboard)/dashboard/page.tsx` | Mejorar welcome banner, mejorar module cards con focus/hover, agregar quick counts |
| `components/dashboard/kpi-card.tsx` | Agregar props `icon`, `trend`, `accentColor`; mejorar skeleton y layout |
| `components/dashboard/donut-card.tsx` | Agregar info tooltip, mejorar empty/error states con retry |
| `components/dashboard/area-chart-card.tsx` | Agregar info tooltip, mejorar empty/error states con retry |
| `components/dashboard/bar-list-card.tsx` | Agregar info tooltip, mejorar empty/error states con retry |
| `components/dashboard/dashboard-filters.tsx` | Agregar badge de activos, clear button, mejor diseño |
| `components/dashboard/empty-state.tsx` | Agregar icono + mensaje contextual + acción sugerida |
| `components/dashboard/chart-error.tsx` | Agregar botón de retry + prop `onRetry` |
| `components/dashboard/chart-skeleton.tsx` | Mejorar con forma de chart animada |
| `components/dashboard/dashboard-analytics.tsx` | Mejorar sección header, pasar refetch a charts |

### Archivos nuevos

Ninguno. Todas las mejoras son sobre archivos existentes.

---

## 5. Props API — cambios en interfaces

### KpiCard (props extendidas)

```typescript
interface KpiCardProps {
  title: string
  value: number
  icon?: React.ComponentType<{ className?: string }>
  accentColor?: string // ej: "blue", "green", "orange", "purple"
  trend?: { direction: "up" | "down"; percentage: number }
  loading?: boolean
  error?: boolean
  formatter?: (n: number) => string
}
```

### ChartError (props extendidas)

```typescript
interface ChartErrorProps {
  message: string
  onRetry?: () => void
}
```

### EmptyState (props extendidas)

```typescript
interface EmptyStateProps {
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: { label: string; onClick: () => void }
}
```

---

## 6. Estados

### Loading

- KPIs: skeleton con icon placeholder + barra de color animada (shimmer)
- Charts: skeleton con forma específica (circular para donut, rectangular con ondas para area)
- Page: shimmer animado para toda la sección analytics en carga inicial

### Empty

- Mensaje contextual + icono ilustrativo:
  - KPIs: "0" (sin cambios)
  - Donuts: "Sin datos de {tipo}" con icono de chart vacío
  - Area: "No hay envíos registrados" con icono de timeline
  - Bar lists: "Sin datos que mostrar" con icono de lista

### Error

- Mensaje de error + botón "Reintentar" que llama `refetch()`
- Icono `AlertCircle` existente se mantiene

---

## 7. Colores semánticos para KPIs

| KPI | Accent Color | Icon |
|-----|-------------|------|
| Total Envíos | blue | Ship |
| Rutas Activas | emerald | MapPin |
| Stock Total | amber | Package |
| Almacenes Activos | violet | Warehouse |

---

## 8. Animaciones

- Module cards hover: `scale-[1.02]` + `shadow-md` + transición 200ms ease-out
- KPI trend badge: fade-in 300ms
- Filter clear button: fade-in/out 200ms
- Chart error retry button: hover scale effect
- Empty state: fade-in 300ms

Todas las animaciones respetan `prefers-reduced-motion`.

---

## 9. Criterios de aceptación

- [ ] Welcome banner tiene mejor jerarquía visual y quick counts
- [ ] KPI cards tienen icono, color de acento y trend indicator
- [ ] KPI cards con loading muestran skeleton con icon placeholder
- [ ] Chart cards tienen info tooltip con descripción
- [ ] Empty states son contextuales con icono y acción sugerida
- [ ] Error states tienen botón "Reintentar" que hace refetch
- [ ] Filters bar muestra badge con conteo de filtros activos
- [ ] Filters bar tiene botón "Limpiar filtros" cuando hay filtros activos
- [ ] Module cards tienen hover scale + shadow mejorado
- [ ] Module cards tienen focus ring visible para navegación por teclado
- [ ] Chart skeleton tiene forma específica (circular/rectangular)
- [ ] Todas las animaciones respetan prefers-reduced-motion
- [ ] No hay regresiones funcionales en analytics existente
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` pasa sin errores

---

## 10. Anti-patterns a evitar (basado en UI/UX Pro Max)

- ❌ No usar emojis como iconos estructurales — usar Lucide SVG icons
- ❌ No cambiar layout bounds en hover (evitar layout shift)
- ❌ No usar animaciones decorativas sin propósito
- ❌ No modificar el flujo de datos ni las queries existentes
- ❌ No eliminar focus rings nativos del navegador
- ❌ No mezclar estilos de iconos (todos Lucide, consistente stroke)
- ❌ No hardcodear colores hex — usar tokens CSS variables
- ❌ No romper dark mode — verificar contraste en ambos temas
