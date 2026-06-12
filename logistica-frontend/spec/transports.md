# Spec: Transport (Vehículos)

Módulo de gestión de vehículos de transporte. CRUD completo + soft-delete.
Sin FKs — formulario simple, similar a Warehouse.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/transports` | Listado de vehículos | `app/(dashboard)/transports/page.tsx` |

Create/edit vía Dialog desde la lista, mismo patrón que Warehouse y Suppliers. No hay página de detalle separada.

---

## 2. Componentes

### 2.1 Tabla (TanStack Table)

**Columnas:**

| Columna | accessorKey | Detalles |
|---------|-------------|----------|
| Placa | `plate` | Sortable — columna principal |
| Tipo | `vehicle_type` | Mostrar label traducido (ver helpers). "—" si null |
| Marca | `brand` | "—" si null |
| Modelo | `model` | "—" si null |
| Año | `year` | "—" si null |
| Capacidad (kg) | `capacity_kg` | Formateado con `Number(...).toLocaleString()`. "—" si null |
| Capacidad (vol.) | `capacity_volume` | Formateado con `Number(...).toLocaleString()`. "—" si null |
| Disponibilidad | `is_available` | Badge especial (ver sección 2.4) |
| Estado | `is_active` | Badge "Activo" / "Inactivo" (igual que Warehouse) |
| Acciones | *actions* | Editar (lápiz), Activar (verde para inactivos), Eliminar (papelera + confirmación) |

**Helpers de display:**

```typescript
function vehicleTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    truck: "Camión",
    van: "Furgoneta",
    pickup: "Camioneta",
    other: "Otro",
  }
  return type ? labels[type] ?? type : "—"
}

function formatNumber(val: string | null): string {
  if (!val) return "—"
  const n = Number.parseFloat(val)
  return isNaN(n) ? "—" : n.toLocaleString("es-PE")
}
```

**Sort:** plate, vehicle_type, year, capacity_kg, is_available

**Filtro:** búsqueda client-side por plate, brand, model, vehicle_type (usa `globalFilter` de TanStack Table)

**Paginación:** 10 items por página, controles "Anterior" / "Siguiente"

**Acciones por fila:**
- Editar (icono lápiz) → abre Dialog en modo edición
- Eliminar (si `is_active === true`) → abre confirmación de eliminación (soft-delete)
- Activar (si `is_active === false`) → PATCH `{ is_active: true }`

### 2.2 Formulario (Dialog)

**Campos del formulario:**

| Campo | Tipo | Requerido | Observaciones |
|-------|------|-----------|---------------|
| `plate` | Input | Sí | Placeholder: "ABC-123". Único en backend |
| `vehicle_type` | Select | No | Opciones: truck→"Camión", van→"Furgoneta", pickup→"Camioneta", other→"Otro" |
| `brand` | Input | No | Placeholder: "Volvo" |
| `model` | Input | No | Placeholder: "FH16" |
| `year` | Input type="number" | No | min="1900", max="2099", placeholder: "2024" |
| `capacity_kg` | Input type="number" step="0.01" | No | min="0", placeholder: "20000" |
| `capacity_volume` | Input type="number" step="0.01" | No | min="0", placeholder: "80" |
| `is_available` | Switch/Checkbox | No | Default: true (checkbox marcado). O Select con "Sí"/"No" |

**Payload para submit:**
```typescript
const payload = {
  plate: formPlate,
  vehicle_type: formVehicleType || null,
  brand: formBrand || null,
  model: formModel || null,
  year: formYear ? Number(formYear) : null,
  capacity_kg: formCapacityKg || null,
  capacity_volume: formCapacityVolume || null,
  is_available: formIsAvailable,
}
```

**Validación:** `plate` requerido en frontend. Botón de submit deshabilitado si falta.

### 2.3 Badge de Disponibilidad (`is_available`)

Celda especial para `is_available`:

```typescript
{
  accessorKey: "is_available",
  header: ({ column }) => (
    <button
      className="flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting()}
    >
      Disponibilidad
      <ArrowUpDown className="h-3 w-3" />
    </button>
  ),
  cell: ({ row }) => {
    const available = row.original.is_available
    return (
      <Badge variant={available ? "default" : "secondary"}
        className={available ? "" : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"}
      >
        {available ? "Disponible" : "En uso"}
      </Badge>
    )
  },
}
```

### 2.4 Botón Activar (filas inactivas)

Mismo patrón que Warehouse — PATCH `{ is_active: true }` + invalidar query.

### 2.5 Confirmación de Eliminación

- Soft-delete (`DELETE /api/transports/{id}/`)
- AlertDialog con mensaje: "¿Estás seguro? Esta acción desactivará **{transport.plate}**."
- Mismo patrón que Warehouse.

### 2.6 Estados de Carga y Error

- **Loading:** `<Loader2>` animado + texto "Cargando vehículos…"
- **Error:** Icono de error + texto "Error al cargar vehículos" + botón "Reintentar"
- **Empty:** "No hay vehículos registrados" con sugerencia de crear uno
- **Empty con filtro:** "No se encontraron resultados" con sugerencia de cambiar búsqueda

---

## 3. API Service

**Archivo nuevo:** `services/transports.ts`

### 3.1 Funciones API

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getTransports()` | GET | `/transports/` | — |
| `getTransport(id)` | GET | `/transports/{id}/` | — |
| `createTransport(data)` | POST | `/transports/` | Transport fields |
| `updateTransport(id, data)` | PUT | `/transports/{id}/` | Transport fields |
| `deleteTransport(id)` | DELETE | `/transports/{id}/` | — |
| `activateTransport(id)` | PATCH | `/transports/{id}/` | `{ is_active: true }` |

**Manejo de paginación** (mismo patrón que Warehouse):
```typescript
export function getTransports() {
  return api.get<Transport[] | PaginatedResponse<Transport>>("/transports/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}
```

**Tipos:** usar `Transport` de `@/types/api` (ya existe en `types/api.ts` — línea 104).

### 3.2 TanStack Query Hooks

**Archivo:** `services/transports.ts` (mismo archivo, hooks al final)

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useTransports()` | `["transports"]` | Listar todos (GET) — `staleTime: 5 * 60 * 1000` |
| `useTransport(id)` | `["transports", id]` | Detalle (GET) — `enabled: !!id` |
| `useCreateTransport()` | mutation | POST + invalida `["transports"]` |
| `useUpdateTransport()` | mutation | PUT + invalida `["transports"]` |
| `useDeleteTransport()` | mutation | DELETE + invalida `["transports"]` |
| `useActivateTransport()` | mutation | PATCH + invalida `["transports"]` |

Patrón de cada hook (ejemplo para create):
```typescript
export function useCreateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Transport>) => createTransport(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el vehículo")
    },
  })
}
```

El hook `useUpdateTransport` recibe `{ id, data }` como parámetro:
```typescript
export function useUpdateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transport> }) =>
      updateTransport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el vehículo")
    },
  })
}
```

---

## 4. Store

No necesario — TanStack Query cache es suficiente. No se comparte estado de Transport entre módulos (Route usa el ID del transporte, no el objeto completo).

---

## 5. Layout / Sidebar

El sidebar **ya incluye** el link `/transports` con icono `Bus` y label "Vehículos" (ver `layout.tsx` línea 34). No se requiere modificación.

---

## 6. Convenciones

- `"use client"` en el componente de página (tiene hooks)
- `ColumnDef<Transport>` para tipado de columnas
- Toast de éxito/error después de cada mutación (usar `sonner`)
- Loading skeleton / spinner en tabla mientras carga
- Error state con botón de reintento
- Soft-delete con PATCH `activateTransport` para re-activar
- `useState` por campo en el formulario (mismo patrón que Warehouse/Suppliers — sin react-hook-form)
- `Select` de shadcn/ui para `vehicle_type`
- `is_available` renderizado como Switch o Checkbox (según prefieras) — para consistencia con `is_available` de Driver

---

## 7. Archivos a Crear

| Archivo | Acción |
|---------|--------|
| `services/transports.ts` | **Crear** — funciones API + TanStack Query hooks |
| `app/(dashboard)/transports/page.tsx` | **Crear** — página completa con tabla, diálogos, formulario |

No se requiere modificar `types/api.ts` (Transport ya existe — línea 104), ni el layout del sidebar.

---

## 8. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Tipo de formulario | `useState` por campo | Consistencia con módulos existentes (Warehouse, Suppliers, Products, Customer) |
| Select de vehicle_type | shadcn `<Select>` con labels en español | Consistente con patrón Customer; mapeo visual claro |
| Badge de disponibilidad | `Badge variant="default"` para disponible, `Badge variant="secondary"` con colores amber para "En uso" | Feedback visual inmediato (verde = disponible, ámbar = ocupado) |
| Formato de capacidades | `Number.parseFloat(val).toLocaleString("es-PE")` | Separadores de miles con locale peruano |
| is_available como checkbox | Switch o Checkbox simple | Valor booleano, default `true` — más intuitivo que un Select |
| Soft-delete | DELETE endpoint + botón Activar | Consistente con Warehouse, Suppliers, Customer, Products |
| Paginación | Client-side con TanStack Table `getPaginationRowModel` | Backend no usa paginación DRF (mismo patrón) |

---

## 9. Ejemplo de Flujo Completo

1. Usuario navega a `/transports`.
2. `useTransports()` → GET `/api/transports/` → lista de vehículos.
3. Tabla muestra placa, tipo (traducido), marca, modelo, año, capacidades (formateadas), disponibilidad (badge), estado, acciones.
4. Usuario hace clic en "Nuevo Vehículo" → Dialog con formulario.
5. Usuario ingresa placa (obligatorio), selecciona tipo, completa datos opcionales → Submit.
6. `useCreateTransport()` → POST `/api/transports/` → toast "Vehículo creado exitosamente" → tabla se actualiza.
7. Editar → Dialog precargado con valores existentes → PUT `/api/transports/{id}/`.
8. Eliminar → DELETE `/api/transports/{id}/` → soft-delete → badge cambia a "Inactivo" + botón "Activar".
9. Activar → PATCH `{ is_active: true }` → badge vuelve a "Activo".

---

## 10. Esquema del Formulario (Layout Visual)

```
┌─────────────────────────────────────┐
│  Nuevo Vehículo                     │
│  Ingresa los datos del nuevo        │
│  vehículo                           │
├─────────────────────────────────────┤
│  Placa *               Tipo         │
│  ┌─────────────────┐  ┌──────────┐  │
│  │ ABC-123          │  │ Camión ▾ │  │
│  └─────────────────┘  └──────────┘  │
│                                     │
│  Marca                Modelo        │
│  ┌─────────────────┐  ┌──────────┐  │
│  │ Volvo            │  │ FH16     │  │
│  └─────────────────┘  └──────────┘  │
│                                     │
│  Año                               │
│  ┌─────────────────────────────────┐│
│  │ 2024                            ││
│  └─────────────────────────────────┘│
│                                     │
│  Capacidad (kg)     Capacidad (vol.)│
│  ┌─────────────────┐  ┌──────────┐  │
│  │ 20000            │  │ 80       │  │
│  └─────────────────┘  └──────────┘  │
│                                     │
│  ☑ Disponible                      │
│                                     │
├─────────────────────────────────────┤
│              [Cancelar]  [Crear]    │
└─────────────────────────────────────┘
```

**Estado inicial del formulario (create):**
| Campo | Valor inicial |
|-------|---------------|
| plate | "" |
| vehicle_type | "" |
| brand | "" |
| model | "" |
| year | "" |
| capacity_kg | "" |
| capacity_volume | "" |
| is_available | true |

**Estado inicial del formulario (edit):**
Se cargan los valores existentes del objeto `Transport`. `is_available` se setea con el valor booleano del backend.
