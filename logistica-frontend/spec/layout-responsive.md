# Spec: Layout Responsive Improvements

Módulo: Layout de la aplicación (Root Layout + Dashboard Layout).

---

## 1. Objetivo

Mejorar la responsividad, accesibilidad y experiencia del layout principal de la aplicación, siguiendo las guías UI/UX Pro Max para Layout & Responsive (Priority 5), Accessibility (Priority 1) y Navigation Patterns (Priority 9).

---

## 2. Análisis del layout actual

### Root Layout (`app/layout.tsx`)
- ✅ Providers correctamente anidados
- ✅ `h-full` en html, `min-h-full flex flex-col` en body
- ✅ font Geist con variable CSS
- ❌ Sin atributo `style` de color-scheme para evitar flash en dark mode

### Dashboard Layout (`app/(dashboard)/layout.tsx`)
| # | Problema | Severidad | Guía UI/UX Pro Max |
|---|----------|-----------|-------------------|
| 1 | `h-screen` en contenedor principal → problema con toolbars móviles | Alta | §5: `viewport-units` — usar `min-h-dvh` |
| 2 | Padding fijo `p-6` en main content, no se adapta a distintos viewports | Media | §5: `spacing-scale` — usar padding responsive |
| 3 | Sin `max-width` en contenido → ilegible en monitores ultra-wide (>1600px) | Media | §5: `container-width` |
| 4 | Sidebar `w-64` fijo, no colapsable en desktop | Baja | §9: `adaptive-navigation` |
| 5 | Sin handler de tecla Escape para cerrar sidebar móvil | Alta | §1: `escape-routes` + `keyboard-nav` |
| 6 | Sin `aria-*` attributes en sidebar y overlay | Alta | §1: `aria-labels` |
| 7 | Sin keyboard trap en sidebar móvil (focus queda fuera) | Alta | §1: `keyboard-nav` |
| 8 | Nav items sin `aria-current="page"` en el activo | Media | §1: `aria-labels` |
| 9 | Overlay sin `aria-hidden` | Media | §1: `aria-labels` |
| 10 | Logout no está espacialmente separado de nav normal | Media | §9: `destructive-nav-separation` |

---

## 3. Mejoras propuestas

### 3.1 Root Layout

| # | Mejora | Archivo | Descripción |
|---|--------|---------|-------------|
| 1 | Color-scheme meta | `layout.tsx` | Agregar `style={{ colorScheme: "light dark" }}` en html para evitar flash |

### 3.2 Dashboard Layout — Contenedor Principal

| # | Mejora | Descripción |
|---|--------|-------------|
| 2 | `min-h-dvh` en lugar de `h-screen` | Usar `min-h-dvh` para mejor comportamiento en móvil con toolbars dinámicas |
| 3 | Padding responsive | Cambiar `p-6` por `p-4 sm:p-6 lg:p-8` |
| 4 | Max-width container | Agregar `max-w-7xl mx-auto` al main content para legibilidad en pantallas grandes |

### 3.3 Dashboard Layout — Sidebar

| # | Mejora | Descripción |
|---|--------|-------------|
| 5 | Escape key handler | Cerrar sidebar al presionar Escape |
| 6 | Aria attributes | `role="dialog"` en sidebar móvil, `aria-modal`, `aria-label="Navegación"` |
| 7 | Overlay aria | `aria-hidden="true"` en overlay |
| 8 | Nav active state | `aria-current="page"` en el nav item activo |
| 9 | Focus trap | Enfocar el sidebar al abrirse y atrapar foco dentro |
| 10 | Logout separado | Agregar separador visual `<hr>` antes del logout |
| 11 | Sidebar scroll mejorado | `overflow-y-auto` con `scrollbar-thin` para mejor UX |
| 12 | Sidebar ancho responsive | `w-64` puede ser `w-72` en desktop para mejor legibilidad |

### 3.4 Login Page

| # | Mejora | Descripción |
|---|--------|-------------|
| 13 | Responsive card padding | `p-6` en card content → `p-4 sm:p-6` |
| 14 | Form spacing | Mejorar espaciado vertical en móvil |

### 3.5 Global CSS

| # | Mejora | Descripción |
|---|--------|-------------|
| 15 | Scrollbar styles | Agregar estilos de scrollbar sutiles para sidebar |
| 16 | Focus visible global | Asegurar `focus-visible` rings consistentes |

---

## 4. Layout visual (desktop vs mobile)

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌───────────────────────────────────────────┐  │
│ │          │ │  Main Content (max-w-7xl, p-6 lg:p-8)     │  │
│ │ Sidebar  │ │  ┌─────────────────────────────────────┐  │  │
│ │ w-72     │ │  │                                     │  │  │
│ │ static   │ │  │                                     │  │  │
│ │          │ │  └─────────────────────────────────────┘  │  │
│ │          │ │                                           │  │
│ └──────────┘ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (<1024px)
```
┌─────────────────────────────────┐
│ ┌──┐ ┌──────────────────────┐  │
│ │☰ │ │ Logística App        │  │ ← Mobile header (h-14)
│ └──┘ └──────────────────────┘  │
│ ┌──────────────────────────────┐│
│ │  Main Content (p-4)          ││
│ │                              ││
│ │                              ││
│ └──────────────────────────────┘│
└─────────────────────────────────┘

[Sidebar slides in from left as overlay]
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░ Sidebar overlay ░░░░░░░░░░  │ ← z-50, w-64
│ ░░ (backdrop black/50)    ░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────┘
```

---

## 5. Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `app/layout.tsx` | Agregar `style={{ colorScheme: "light dark" }}` en html |
| `app/(dashboard)/layout.tsx` | Todas las mejoras del layout principal (items 2-12) |
| `app/login/page.tsx` | Padding responsive en card, espaciado mejorado |
| `app/globals.css` | Scrollbar styles, focus visible improvements |

### Archivos nuevos

Ninguno.

---

## 6. Checklist UI/UX Pro Max aplicada

### §1 — Accessibility (CRITICAL)
- [x] `aria-label` en sidebar (navegación principal)
- [x] `aria-current="page"` en nav item activo
- [x] `aria-hidden="true"` en overlay
- [x] `role="dialog"` + `aria-modal="true"` en sidebar móvil
- [x] Escape key cierra sidebar
- [x] Focus management al abrir/cerrar sidebar
- [x] `aria-label` en botón de menú hamburguesa
- [x] `aria-label` en botón de cerrar sidebar

### §5 — Layout & Responsive (HIGH)
- [x] `min-h-dvh` en lugar de `h-screen`
- [x] Padding responsive (`p-4 sm:p-6 lg:p-8`)
- [x] Max-width container (`max-w-7xl mx-auto`)
- [x] Sidebar adaptativo (overlay en mobile, static en desktop)
- [x] Sin horizontal scroll en mobile
- [x] Espaciado consistente (8px grid system)

### §9 — Navigation Patterns (HIGH)
- [x] Sidebar con links + iconos consistentes
- [x] Active state visual (ya existe)
- [x] `aria-current="page"`
- [x] Logout separado del nav principal
- [x] Mobile header con hamburguesa

---

## 7. Criterios de aceptación

- [ ] `min-h-dvh` reemplaza `h-screen` — funciona en Chrome/Safari/Firefox móvil
- [ ] Padding responsive: `p-4` en móvil, `p-6` en tablet, `p-8` en desktop
- [ ] Main content tiene `max-w-7xl mx-auto` en desktop
- [ ] Sidebar se cierra con tecla Escape
- [ ] Sidebar tiene `aria-label="Navegación principal"`
- [ ] Nav item activo tiene `aria-current="page"`
- [ ] Overlay tiene `aria-hidden="true"`
- [ ] Sidebar móvil tiene `role="dialog"` + `aria-modal`
- [ ] Botón hamburguesa tiene `aria-label="Abrir menú"`
- [ ] Botón cerrar tiene `aria-label="Cerrar menú"`
- [ ] Login card tiene padding responsive
- [ ] Scrollbar en sidebar es sutil
- [ ] No hay horizontal scroll en ninguna página
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` pasa sin errores

---

## 8. Anti-patterns a evitar

- ❌ No usar `100vh` — usar `100dvh` o `min-h-dvh`
- ❌ No deshabilitar zoom (viewport meta)
- ❌ No usar paddings fijos sin variantes responsive
- ❌ No ocultar scrollbar completamente (accesibilidad)
- ❌ No eliminar focus rings nativos
- ❌ No usar fixed widths sin fallback responsive
- ❌ No mezclar unidades (px/rem/vh) inconsistentemente
