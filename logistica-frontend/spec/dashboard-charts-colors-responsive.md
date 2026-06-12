# Spec: Dashboard Charts, Colors & Responsive Improvements

Módulo: Dashboard — componentes de visualización (KPIs, charts, estados).

---

## 1. Análisis de problemas actuales

| # | Problema | Severidad | Guía UI/UX Pro Max |
|---|----------|-----------|-------------------|
| 1 | Todos los KPI usan mismo icono `BarChart3` — sin diferenciación semántica | 🔴 Alta | §4: `icon-style-consistent` + semántica visual |
| 2 | Donut charts sin labels ni leyenda — `showLabel={false}` | 🔴 Alta | §10: `legend-visible`, `direct-labeling` |
| 3 | Area chart sin leyenda — `showLegend={false}` | 🟡 Media | §10: `legend-visible` |
| 4 | Altura fija `h-[220px]`/`h-[250px]` en charts — no responsive | 🟡 Media | §5: `responsive-chart` |
| 5 | Colores Tremor por defecto — no verificados en dark mode | 🟡 Media | §6: `color-dark-mode`, `color-accessible-pairs` |
| 6 | Info tooltip usa `title` nativo — no visible en touch/mobile | 🟡 Media | §2: `hover-vs-tap` |
| 7 | Filter bar `bg-muted/30` — contraste insuficiente en dark mode | 🟡 Media | §6: `color-dark-mode` |
| 8 | Empty/Error states con altura fija — riesgo de overflow en mobile | 🟢 Baja | §5: `spacing-scale` |

---

## 2. Mejoras propuestas

### 2.1 KPI Cards — Iconos semánticos

| KPI | Icono actual | Icono propuesto | Color acento |
|-----|-------------|-----------------|-------------|
| Total Envíos | BarChart3 | **Ship** | blue |
| Rutas Activas | BarChart3 | **MapPin** | emerald |
| Stock Total | BarChart3 | **Package** | amber |
| Almacenes Activos | BarChart3 | **Warehouse** | violet |

### 2.2 Donut Charts — Leyendas visibles

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | Mostrar labels en segmentos | Agregar `valueFormatter` con counts y activar `showLabel` |
| 2 | Agregar leyenda externa | Leyenda con dots de color + label + valor debajo del donut |
| 3 | Colores accesibles en dark mode | Usar colores Tremor con contraste ≥3:1 en dark mode |

### 2.3 Area Chart — Leyenda + mejora visual

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | Activar leyenda | `showLegend={true}` con label "Envíos" |
| 2 | Mejor curva | Mantener `curveType="monotone"` |
| 3 | Colores de área semitransparentes | Verificar que el fill del área funciona en dark mode |

### 2.4 Responsive Heights

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | `min-h-[220px]` en lugar de `h-[220px]` | Permitir que charts crezcan si es necesario |
| 2 | Altura responsive en area chart | `h-[200px] sm:h-[250px]` |

### 2.5 Dark Mode — Contraste mejorado

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | Filter bar background | `bg-muted/30` → `bg-muted/50 dark:bg-muted/20` |
| 2 | Info icon color | `text-muted-foreground/60` → usar opacidad fija que funcione en ambos modos |
| 3 | Card borders | Verificar `border-border/50` funciona en dark mode |

### 2.6 Empty/Error States

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | `min-h-[220px]` en lugar de `h-[220px]` | Flexibilidad en mobile |
| 2 | Mensajes más descriptivos | Incluir sugerencia de acción |

### 2.7 Info Tooltip — Touch friendly

| # | Mejora | Descripción |
|---|--------|-------------|
| 1 | Agregar `onClick` toggle | Click/tap abre/cierra tooltip como fallback para touch |
| 2 | Usar `aria-describedby` | Para accesibilidad en screen readers |

---

## 3. Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `components/dashboard/dashboard-analytics.tsx` | Cambiar iconos de KPI a Ship, MapPin, Package, Warehouse |
| `components/dashboard/kpi-card.tsx` | Sin cambios (props ya soportan iconos) |
| `components/dashboard/donut-card.tsx` | Agregar `valueFormatter`, `showLabel=true`, leyenda externa, `min-h-[220px]` |
| `components/dashboard/area-chart-card.tsx` | Activar `showLegend`, altura responsive, `min-h-[220px]` |
| `components/dashboard/bar-list-card.tsx` | `min-h-[220px]` |
| `components/dashboard/empty-state.tsx` | `min-h-[220px]` en lugar de `h-[220px]` |
| `components/dashboard/chart-error.tsx` | `min-h-[220px]` en lugar de `h-[220px]` |
| `components/dashboard/chart-skeleton.tsx` | `min-h-[220px]` en lugar de `h-[220px]` |
| `components/dashboard/dashboard-filters.tsx` | Mejorar dark mode contrast en bg |

---

## 4. Criterios de aceptación

- [ ] Cada KPI tiene su propio icono semántico (Ship, MapPin, Package, Warehouse)
- [ ] Donut charts muestran labels/valores en los segmentos
- [ ] Donut charts tienen leyenda visible con colores y valores
- [ ] Area chart tiene leyenda visible ("Envíos")
- [ ] Todos los charts usan `min-h` en lugar de `h` fijo
- [ ] Area chart tiene altura responsive (`h-[200px] sm:h-[250px]`)
- [ ] Filter bar tiene mejor contraste en dark mode
- [ ] Empty/Error states usan `min-h-[220px]`
- [ ] Chart skeletons usan `min-h-[220px]`
- [ ] No hay regresiones funcionales
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` pasa sin errores

---

## 5. Anti-patterns a evitar

- ❌ No usar solo color para diferenciar segmentos — asegurar labels visibles
- ❌ No usar alturas fijas que corten contenido en mobile
- ❌ No confiar solo en hover/title para tooltips (no funciona en touch)
- ❌ No usar colores Tremor sin verificar contraste en dark mode
