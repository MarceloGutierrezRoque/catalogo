# Spec: Route + Stops (Rutas)

Módulo de gestión de rutas de transporte. **Cabecera + Stops anidados.** CRUD para Route vía endpoint `/api/routes/`. Gestión separada de Stops vía `/api/stops/`.

Patrón idéntico a Shipment + ShipmentItems: páginas dedicadas para create/edit, mini-tabla de stops embebida, API independiente para stops.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/routes` | Listado de rutas | `app/(dashboard)/routes/page.tsx` |
| `/routes/new` | Crear nueva ruta | `app/(dashboard)/routes/new/page.tsx` |
| `/routes/[id]` | Detalle de ruta (editable) | `app/(dashboard)/routes/[id]/page.tsx` |

### Decisión: Páginas dedicadas (no Dialog) para create/edit

Mismas razones que Shipment:

1. **Formulario extenso:** name, transport, driver, start_date, end_date, status. Más la sección completa de stops.
2. **Stops anidados:** Mini-tabla con capacidad de agregar/eliminar stops. Necesita espacio vertical.
3. **UX:** Crear una ruta con múltiples paradas es una tarea compleja que merece página completa.

**Flujo de navegación:**

- Lista (`/routes`): Tabla con todas las rutas. Botón "Nueva Ruta" → navega a `/routes/new`. Clic en "Editar" de una fila → navega a `/routes/[id]`.
- Crear (`/routes/new`): Formulario de cabecera + sección de stops. Submit → crea route + stops → redirige a `/routes`.
- Detalle/Editar (`/routes/[id]`): Mismo formulario precargado + stops existentes. Submit → actualiza route + sincroniza stops → redirige a `/routes`.
- Una página sirve tanto para ver detalle como para editar (el formulario está precargado y editable).

---

## 2. Componentes

### 2.1 Tabla de Listado (`/routes`)

**Columnas (TanStack Table):**

| Columna | accessorKey / id | Detalles |
|---------|-----------------|----------|
| Nombre | `name` | Sortable. Link que navega a `/routes/[id]` |
| Transporte | _custom_ | Mostrar `"Vehículo #{transport}"` (ID numérico por ahora) |
| Conductor | _custom_ | Mostrar `"Conductor #{driver}"` (ID numérico por ahora) |
| Fecha Inicio | `start_date` | Formateada como datetime legible o `—` si null |
| Fecha Fin | `end_date` | Formateada como datetime legible o `—` si null |
| Estado | `status` | Badge con color según el estado (ver 2.1.1) |
| Paradas | _custom_ | Contar `stops.length` y mostrar badge con el número |
| Activo | `is_active` | Badge "Activo" / "Inactivo" |
| Acciones | _actions_ | Editar (navega a `/[id]`), Eliminar (confirmación soft-delete) |

#### 2.1.1 Status Badge

```typescript
function RouteStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    planned: { label: "Planificada", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    in_progress: { label: "En curso", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    completed: { label: "Completada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-700" }
  return <Badge className={c.className} variant="outline">{c.label}</Badge>
}
```

#### 2.1.2 Stop Status Badge (para mini-tabla)

```typescript
function StopStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-gray-100 text-gray-700" },
    arrived: { label: "Llegó", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completada", className: "bg-green-100 text-green-700" },
    skipped: { label: "Saltada", className: "bg-amber-100 text-amber-700" },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-700" }
  return <Badge className={c.className} variant="outline">{c.label}</Badge>
}
```

#### 2.1.3 Filtro y Búsqueda

- Búsqueda client-side por name (usa `globalFilter` de TanStack Table)
- Input con icono de búsqueda, mismo patrón que Shipment

#### 2.1.4 Paginación

- 10 items por página, controles "Anterior" / "Siguiente"
- Mismo patrón que Shipment

#### 2.1.5 Acciones por fila

- **Editar** (icono lápiz `Pencil`) → `router.push(\`/routes/${id}\`)`
- **Eliminar** (icono papelera `Trash2`, solo si `is_active === true`) → AlertDialog de confirmación → soft-delete (`DELETE /api/routes/{id}/`)
- **Activar** (botón verde "Activar", solo si `is_active === false`) → PATCH `{ is_active: true }`

### 2.2 Formulario de Cabecera (`/routes/new` y `/routes/[id]`)

**Campos del formulario:**

| Campo | Componente | Requerido | Observaciones |
|-------|-----------|-----------|---------------|
| `name` | Input | Sí | Texto libre, ej: "Ruta Lima-Cusco" |
| `transport` | Select (shadcn `<Select>`) | Sí | Poblado con `useTransports()`. Mostrar placa del vehículo (`plate`), value = `id` |
| `driver` | Select (shadcn `<Select>`) | Sí | Poblado con `useDrivers()`. Mostrar `"Conductor #{id}"` o `license_number`, value = `id` |
| `start_date` | Input type="datetime-local" | Sí | Formato `YYYY-MM-DDTHH:mm` |
| `end_date` | Input type="datetime-local" | No | Formato `YYYY-MM-DDTHH:mm`. Debe ser posterior a `start_date` si se especifica |
| `status` | Select (shadcn `<Select>`) | No | Valores: planned (default, "Planificada"), in_progress ("En curso"), completed ("Completada"), cancelled ("Cancelada") |

**Layout del formulario (3 columnas en desktop, 2 en tablet, 1 en mobile):**

```
Fila 1: [name (text, full width on mobile, 2 cols desktop)                               ]
Fila 2: [transport (Select)         ] [driver (Select)              ] [status (Select)     ]
Fila 3: [start_date (datetime-local)] [end_date (datetime-local)    ]                      
```

Usar grid responsivo: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
El campo `name` ocupa todo el ancho: `md:col-span-2 lg:col-span-3`.

### 2.3 Sección de Stops (embebida en la misma página)

Debajo del formulario de cabecera, una sección con título "Paradas de la Ruta".

#### 2.3.1 Mini-tabla de Stops

| Columna | Detalles |
|---------|----------|
| Orden | Número de orden (1, 2, 3…). Sortable en la mini-tabla. |
| Almacén | Mostrar nombre del warehouse (de `useWarehouses()` cache). Si no disponible, `"Almacén #{warehouse}"` |
| Llegada | `arrival_time` formateado como datetime o `—` si null |
| Salida | `departure_time` formateado como datetime o `—` si null |
| Estado | StopStatusBadge (ver 2.1.2) |
| Acciones | Botón eliminar (icono papelera rojo) con confirmación simple |

#### 2.3.2 Botón "Agregar Parada"

- Abre un **sub-diálogo** (Dialog) para agregar una parada
- Campos en el diálogo:
  - `order` — Input type="number" (requerido, mínimo 1). **Auto-generado** (siguiente orden disponible)
  - `warehouse` — Select poblado con `useWarehouses()` (requerido)
  - `arrival_time` — Input type="datetime-local" (opcional)
  - `departure_time` — Input type="datetime-local" (opcional). Si se especifica, debe ser posterior a `arrival_time`
  - `status` — Select (opcional). Valores: pending (default), arrived, completed, skipped
- Botón "Agregar" → agrega el stop al estado local
- El diálogo se cierra al agregar
- **Order auto-generado:** El campo `order` se pre-rellena con `stops.length + 1` y es editable por el usuario por si necesita insertar entre paradas existentes.

#### 2.3.3 Manejo de Stops en Estado Local

```typescript
// Tipo para stops locales (antes de persistir)
interface StopDraft {
  tempId: string // para key de React, usar crypto.randomUUID()
  id?: number // presente si es un stop existente (modo edición)
  order: number
  warehouse: number
  arrival_time: string | null
  departure_time: string | null
  status: string
}
```

**Estado:**
- `stops: StopDraft[]` — stops actuales visibles en la tabla
- `deletedStopIds: number[]` — IDs de stops eliminados (solo en modo edición)

**Operaciones:**
- **Agregar:** `setStops(prev => [...prev, { tempId, order, warehouse, arrival_time, departure_time, status }])`
- **Eliminar:** Si el stop tiene `id`, agregarlo a `deletedStopIds`. Filtrarlo de `stops`.
- **Reordenar:** Al eliminar un stop intermedio, los órdenes de los stops posteriores NO se reordenan automáticamente en el MVP (el usuario puede editar el campo `order` manualmente).

#### 2.3.4 Submit de Stops

**Flujo al guardar:**

1. Si es **creación**: POST `/api/routes/` con datos de cabecera → obtener `id` de la route creada → luego POST cada stop en `stops` a `/api/stops/`
2. Si es **edición**: PUT `/api/routes/{id}/` con datos de cabecera → DELETE cada ID en `deletedStopIds` de `/api/stops/{id}/` → POST cada stop nuevo (sin `id`) a `/api/stops/`

**Orden de operaciones:**

1. Guardar cabecera (POST o PUT)
2. Eliminar stops marcados (DELETE)
3. Crear stops nuevos (POST)

Si alguna operación falla, mostrar toast de error específico.

---

## 3. Interface FormErrors

```typescript
interface FormErrors {
  name?: string
  transport?: string
  driver?: string
  start_date?: string
  end_date?: string
  status?: string
  stops?: string // error general de stops (ej: "Debe haber al menos una parada")
  stops_detail?: Record<string, Record<string, string>> // stopIndex -> field -> error message
}
```

Misma convención que Shipment: estado local `errors: FormErrors` inicializado como `{}`, se actualiza en validación inline y en el catch de submit (mapeo de errores API).

---

## 4. API Service

**Archivo nuevo:** `services/routes.ts`

### 4.1 Funciones API (Route)

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getRoutes()` | GET | `/routes/` | — |
| `getRoute(id)` | GET | `/routes/{id}/` | — |
| `createRoute(data)` | POST | `/routes/` | Route fields (FKs como integers) |
| `updateRoute(id, data)` | PUT | `/routes/{id}/` | Route fields (FKs como integers) |
| `deleteRoute(id)` | DELETE | `/routes/{id}/` | — (soft-delete) |
| `activateRoute(id)` | PATCH | `/routes/{id}/` | `{ is_active: true }` |

### 4.2 Funciones API (Stop)

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getStops(routeId?)` | GET | `/stops/?route={id}` | — (opcional, stops vienen anidados en route) |
| `createStop(data)` | POST | `/stops/` | `{ route, order, warehouse, arrival_time?, departure_time?, status? }` |
| `deleteStop(id)` | DELETE | `/stops/{id}/` | — (hard-delete) |

### 4.3 Payload Types

```typescript
// Para POST/PUT de Route
interface RoutePayload {
  name: string
  transport: number
  driver: number
  start_date?: string | null
  end_date?: string | null
  status?: string
}

// Para POST de Stop
interface StopPayload {
  route: number
  order: number
  warehouse: number
  arrival_time?: string | null
  departure_time?: string | null
  status?: string
}
```

### 4.4 Código de servicio

```typescript
import api from "@/lib/axios"
import type { Route, Stop, PaginatedResponse } from "@/types/api"

// ── Route API ──

export function getRoutes() {
  return api.get<Route[] | PaginatedResponse<Route>>("/routes/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getRoute(id: number) {
  return api.get<Route>(`/routes/${id}/`).then((r) => r.data)
}

export function createRoute(data: Partial<Route>) {
  return api.post<Route>("/routes/", data).then((r) => r.data)
}

export function updateRoute(id: number, data: Partial<Route>) {
  return api.put<Route>(`/routes/${id}/`, data).then((r) => r.data)
}

export function deleteRoute(id: number) {
  return api.delete(`/routes/${id}/`).then((r) => r.data)
}

export function activateRoute(id: number) {
  return api.patch<Route>(`/routes/${id}/`, { is_active: true }).then((r) => r.data)
}

// ── Stop API ──

export function getStops(routeId?: number) {
  const params = routeId ? { route: routeId } : {}
  return api.get<Stop[] | PaginatedResponse<Stop>>("/stops/", { params }).then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function createStop(data: { route: number; order: number; warehouse: number; arrival_time?: string | null; departure_time?: string | null; status?: string }) {
  return api.post<Stop>("/stops/", data).then((r) => r.data)
}

export function deleteStop(id: number) {
  return api.delete(`/stops/${id}/`).then((r) => r.data)
}
```

---

## 5. TanStack Query Hooks

**Archivo:** `services/routes.ts` (mismo archivo, hooks al final)

### 5.1 Route Hooks

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useRoutes()` | `["routes"]` | Listar todas las rutas. `staleTime: 5 * 60 * 1000` |
| `useRoute(id)` | `["routes", id]` | Detalle de la ruta con stops anidados. `enabled: !!id` |
| `useCreateRoute()` | mutation | POST + invalida `["routes"]`. `onSuccess` toast "Ruta creada exitosamente" |
| `useUpdateRoute()` | mutation | PUT + invalida `["routes"]` y `["routes", id]`. `onSuccess` toast |
| `useDeleteRoute()` | mutation | DELETE + invalida `["routes"]`. `onSuccess` toast |
| `useActivateRoute()` | mutation | PATCH `{ is_active: true }` + invalida `["routes"]`. `onSuccess` toast |

### 5.2 Stop Hooks

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useStops(routeId)` | `["stops", routeId]` | Listar stops de una ruta. `enabled: !!routeId`. **Opcional** — los stops ya vienen en `useRoute()`. |
| `useCreateStop()` | mutation | POST + invalida `["routes"]` y `["routes", routeId]`. `onSuccess` toast. |
| `useDeleteStop()` | mutation | DELETE + invalida `["routes"]` y `["routes", routeId]`. `onSuccess` toast. |

### 5.3 Estrategia de Invalidation para Stops

Cuando se crea o elimina un Stop, se debe invalidar:
- `["routes"]` — porque el conteo de stops cambia en la lista
- `["routes", routeId]` — porque los stops anidados cambian en el detalle

Los hooks de stops reciben el `routeId` como parámetro para poder invalidar correctamente:

```typescript
export function useCreateStop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { route: number; order: number; warehouse: number; arrival_time?: string | null; departure_time?: string | null; status?: string }) =>
      createStop(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      qc.invalidateQueries({ queryKey: ["routes", variables.route] })
      toast.success("Parada agregada a la ruta")
    },
    onError: () => {
      toast.error("Error al agregar la parada")
    },
  })
}
```

### 5.4 Hook para Guardar Ruta Completa (Cabecera + Stops)

Mismo patrón que Shipment — lógica encapsulada en la página:

```typescript
// En la página (NO como hook global)
async function handleSave(
  formData: RoutePayload,
  stops: StopDraft[],
  deletedStopIds: number[],
  editingId?: number
) {
  try {
    // 1. Guardar cabecera
    let routeId: number
    if (editingId) {
      await updateRoute(editingId, formData)
      routeId = editingId
    } else {
      const created = await createRoute(formData)
      routeId = created.id
    }

    // 2. Eliminar stops marcados
    for (const id of deletedStopIds) {
      await deleteStop(id)
    }

    // 3. Crear stops nuevos
    for (const stop of stops) {
      if (!stop.id) {
        await createStop({
          route: routeId,
          order: stop.order,
          warehouse: stop.warehouse,
          arrival_time: stop.arrival_time || null,
          departure_time: stop.departure_time || null,
          status: stop.status || "pending",
        })
      }
    }

    // 4. Invalidar queries
    queryClient.invalidateQueries({ queryKey: ["routes"] })
    if (editingId) {
      queryClient.invalidateQueries({ queryKey: ["routes", editingId] })
    }

    toast.success(editingId ? "Ruta actualizada exitosamente" : "Ruta creada exitosamente")
    router.push("/routes")
  } catch (error: any) {
    // 5. Mapear errores API a inline
    if (error?.response?.data) {
      mapApiErrorsToForm(error.response.data, setErrors)
    }
    toast.error("Error al guardar la ruta")
  }
}
```

---

## 6. Store

No necesario — TanStack Query cache es suficiente. Los datos de Transport, Driver, y Warehouse se cargan con sus propios hooks y se cachean independientemente.

---

## 7. Layout / Sidebar

El sidebar **ya incluye** el link `/routes` con icono `MapPin` y label "Rutas" (ver `app/(dashboard)/layout.tsx` línea 35). No se requiere modificación.

---

## 8. Estados de Carga y Error

### 8.1 Página de Lista (`/routes`)

Mismo patrón que Shipment:
- **Loading:** `<Loader2>` animado + texto "Cargando rutas…"
- **Error:** Icono de error + texto "Error al cargar rutas" + botón "Reintentar"
- **Empty:** "No hay rutas registradas" + sugerencia de crear una
- **Empty con filtro:** "No se encontraron resultados" + sugerencia de cambiar búsqueda

### 8.2 Página de Detalle/Editar (`/routes/[id]`)

- **Loading:** Skeleton o Loader2 + "Cargando ruta…"
- **Error:** "Error al cargar la ruta" + botón "Volver" y "Reintentar"
- **404 / No encontrado:** Mensaje "Ruta no encontrada" + botón "Volver a rutas"

### 8.3 Página de Crear (`/routes/new`)

No tiene estado de carga inicial (no hay datos que cargar). Solo estados de submit y error.

---

## 9. Validación Inline

### 9.1 Validación Frontend

| Campo | Validación | Mensaje de error |
|-------|-----------|------------------|
| `name` | Requerido, no vacío | "El nombre de la ruta es requerido" |
| `transport` | Requerido (Select debe tener valor) | "Debes seleccionar un vehículo" |
| `driver` | Requerido (Select debe tener valor) | "Debes seleccionar un conductor" |
| `start_date` | Requerido, no vacío | "La fecha de inicio es requerida" |
| `end_date` | Debe ser posterior a `start_date` si se especifica | "La fecha de fin debe ser posterior a la fecha de inicio" |
| Stops | Al menos 1 stop requerido | "Debes agregar al menos una parada a la ruta" |
| Stop `order` | Número entero >= 1 | "El orden debe ser un número positivo" |
| Stop `warehouse` | Requerido (Select debe tener valor) | "Debes seleccionar un almacén" |

### 9.2 Mapeo de Errores API a Inline

```typescript
interface ApiErrorResponse {
  name?: string[]
  transport?: string[]
  driver?: string[]
  start_date?: string[]
  end_date?: string[]
  status?: string[]
  non_field_errors?: string[]
}

function mapApiErrorsToForm(apiErrors: ApiErrorResponse, setErrors: Dispatch<SetStateAction<FormErrors>>) {
  const mapped: FormErrors = {}

  if (apiErrors.name) mapped.name = apiErrors.name.join(", ")
  if (apiErrors.transport) mapped.transport = apiErrors.transport.join(", ")
  if (apiErrors.driver) mapped.driver = apiErrors.driver.join(", ")
  if (apiErrors.start_date) mapped.start_date = apiErrors.start_date.join(", ")
  if (apiErrors.end_date) mapped.end_date = apiErrors.end_date.join(", ")
  if (apiErrors.status) mapped.status = apiErrors.status.join(", ")
  if (apiErrors.non_field_errors) {
    // Mostrar como toast para errores generales
    toast.error(apiErrors.non_field_errors.join(", "))
  }

  // Errores de stops no vienen tipados — se manejan en el toast general
  if (apiErrors.stops) {
    mapped.stops = "Error en las paradas: verifica los datos"
  }

  setErrors(mapped)
}
```

### 9.3 Helper Text Pattern (igual que Shipment)

```typescript
// Cada campo requerido muestra helper text solo cuando hay error
{errors.name && (
  <p className="text-sm font-medium text-destructive">{errors.name}</p>
)}
```

### 9.4 Submit Button State

```typescript
const isSubmitDisabled = !formName || !formTransport || !formDriver || !formStartDate || stops.length === 0 || isSubmitting

<Button type="submit" disabled={isSubmitDisabled}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Guardando…
    </>
  ) : editingId ? (
    "Guardar Cambios"
  ) : (
    "Crear Ruta"
  )}
</Button>
```

---

## 10. Archivos a Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `services/routes.ts` | **Crear** | Funciones API + TanStack Query hooks para Route y Stop |
| `app/(dashboard)/routes/page.tsx` | **Crear** | Página de listado con tabla TanStack |
| `app/(dashboard)/routes/new/page.tsx` | **Crear** | Página de creación (formulario cabecera + stops) |
| `app/(dashboard)/routes/[id]/page.tsx` | **Crear** | Página de detalle/edición (formulario precargado + stops) |

No se requiere modificar `types/api.ts` — los tipos `Route`, `Stop`, `Transport`, `Driver`, y `Warehouse` ya existen con los campos correctos.

---

## 11. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Create/Edit: ¿Dialog o página? | **Página dedicada** (`/routes/new` y `/[id]`) | Formulario extenso + stops anidados requieren espacio. Mismo patrón que Shipment. |
| Stops: ¿se guardan anidados o separados? | **Por separado** (POST `/api/stops/` después de crear la route) | La API no soporta stops anidados en POST/PUT de Route. Son read-only en el GET. |
| Stops locales: ¿cómo se manejan antes de submit? | Array `StopDraft[]` en estado local con `tempId` para React keys | Permite gestión completa (agregar/eliminar) antes de persistir. |
| Stops eliminados en edición | Array `deletedStopIds: number[]` | Se eliminan vía DELETE después de actualizar la cabecera, antes de crear nuevos. |
| Select de Transport | `useTransports()` + shadcn `<Select>`. Mostrar `plate`. | Hook existente. Reutiliza cache. |
| Select de Driver | `useDrivers()` + shadcn `<Select>`. Mostrar `license_number` o ID. | Hook existente. Reutiliza cache. |
| Select de Warehouse (en stops) | `useWarehouses()` + shadcn `<Select>` | Hook existente. Reutiliza cache. |
| Status enum (Route) | Select con labels: Planificada, En curso, Completada, Cancelada | Mapeo directo con la API. Default: "planned". |
| Status enum (Stop) | Select con labels: Pendiente, Llegó, Completada, Saltada | Mapeo directo. Default: "pending". |
| Estado del formulario | `useState` por campo (mismo patrón que otros módulos) | Consistencia. Evita agregar react-hook-form. |
| Paginación en lista | Client-side con TanStack Table `getPaginationRowModel` | Backend no fuerza paginación (array plano). |
| Soft-delete (Route) | DELETE endpoint + botón Activar en filas inactivas | Consistente con otros módulos. |
| Hard-delete (Stop) | DELETE endpoint | Coincide con comportamiento API (Stops son hard-delete como ShipmentItems). |
| Order auto-generado | `stops.length + 1` como valor inicial, editable por usuario | UX amigable pero permite inserción entre paradas existentes. |
| Navegación post-submit | `router.push("/routes")` | Redirige a la lista después de crear/editar. |
| Toast de éxito | `sonner.toast.success()` | Consistente con otros módulos. |
| Validación de `end_date` | Solo si se especifica. Debe ser > `start_date` | Previene errores lógicos sin bloquear (end_date es opcional). |

---

## 12. Flujo Completo (Creación)

1. Usuario navega a `/routes` → lista vacía con botón "Nueva Ruta"
2. Usuario hace clic en "Nueva Ruta" → navega a `/routes/new`
3. Página carga `useTransports()`, `useDrivers()`, `useWarehouses()` (cacheados)
4. Usuario llena formulario de cabecera:
   - Nombre: "Ruta Lima-Cusco"
   - Transporte: Selecciona de dropdown (vehículos disponibles)
   - Conductor: Selecciona de dropdown (conductores disponibles)
   - Fecha Inicio: "2026-06-01T08:00"
   - Fecha Fin: "2026-06-03T18:00" (opcional)
   - Estado: "Planificada" (default)
5. Usuario agrega stops:
   - Clic "Agregar Parada" → Dialog con Orden (auto: 1), Almacén (Select), Llegada (opcional), Salida (opcional), Estado (default: Pendiente)
   - Parada aparece en la mini-tabla con orden, almacén, estados
   - Repite para cada parada (orden auto-incrementa)
6. Usuario hace clic "Crear Ruta"
7. Lógica de submit:
   - POST `/api/routes/` con datos de cabecera → obtiene `id=1`
   - POST `/api/stops/` para cada stop (con `route: 1`)
   - Invalida queries
   - Toast "Ruta creada exitosamente"
   - Redirige a `/routes`
8. Tabla muestra la nueva ruta con su nombre, vehículo, conductor, estado "Planificada", conteo de stops

---

## 13. Flujo Completo (Edición)

1. Usuario navega a `/routes` → encuentra la ruta "Ruta Lima-Cusco"
2. Usuario hace clic en "Editar" → navega a `/routes/1`
3. Página: `useRoute(1)` → GET `/api/routes/1/` → precarga formulario
4. Stops precargados en la mini-tabla (con sus `id`)
5. Usuario puede:
   - Modificar campos de cabecera (nombre, transporte, conductor, fechas, estado)
   - Agregar nuevos stops (sin `id`)
   - Eliminar stops existentes (se agregan a `deletedStopIds`)
   - Reordenar (eliminar y volver a agregar con nuevo orden)
6. Usuario hace clic "Guardar Cambios"
7. Lógica de submit:
   - PUT `/api/routes/1/` con datos de cabecera
   - DELETE `/api/stops/{id}/` para cada ID en `deletedStopIds`
   - POST `/api/stops/` para cada stop nuevo
   - Invalida queries
   - Toast "Ruta actualizada exitosamente"
   - Redirige a `/routes`

---

## 14. Mockups de las Páginas

### 14.1 Página de Lista (`/routes`)

```
┌─────────────────────────────────────────────────────────────┐
│  Rutas                                       [Nueva Ruta]   │
│  Administra las rutas de transporte                         │
│                                                              │
│  🔍 Buscar por nombre...                                    │
│                                                              │
│  ┌──────┬─────────┬────────┬──────────┬──────────┬─────┬────┐│
│  │Nombre│Vehículo │Conductor│Inicio   │ Estado   │Pdas.│ ▶ ││
│  ├──────┼─────────┼────────┼──────────┼──────────┼─────┼────┤│
│  │Lima- │Vehículo#│Cond#1  │01/06/08:00│🔵Planif.│  3  │ ✏🗑││
│  │Cusco │1        │        │          │          │     │    ││
│  │Arequ-│Vehículo#│Cond#2  │05/06/10:00│🟢Compl. │  2  │ ✏🗑││
│  │ipa   │2        │        │          │          │     │    ││
│  └──────┴─────────┴────────┴──────────┴──────────┴─────┴────┘│
│                                                              │
│  2 registros en total  ← Anterior  Siguiente →               │
└─────────────────────────────────────────────────────────────┘
```

### 14.2 Página de Crear/Editar (`/routes/new` o `/[id]`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Volver a Rutas                                            │
│                                                               │
│  Nueva Ruta                                                   │
│  ────────────────────────────────────────────────             │
│                                                               │
│  ┌───Datos de la Ruta─────────────────────────────────────┐   │
│  │ [Nombre de la Ruta *                                ]  │   │
│  │ [Vehículo * ▼]   [Conductor * ▼]   [Estado ▼]         │   │
│  │ [Fecha Inicio *]  [Fecha Fin  ]                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───Paradas de la Ruta──────────────────────────────────┐    │
│  │ [Agregar Parada +]                                    │    │
│  │ ┌─────┬──────────┬────────────┬────────────┬─────────┐│    │
│  │ │Orden│ Almacén  │ Llegada    │ Salida     │ Estado  ││    │
│  │ ├─────┼──────────┼────────────┼────────────┼─────────┤│    │
│  │ │  1  │Alm.Central│01/06 08:00│01/06 09:00│Completa ││    │
│  │ │  2  │Alm.Sur   │01/06 14:00│—          │Llegó    ││    │
│  │ └─────┴──────────┴────────────┴────────────┴─────────┘│    │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  [Cancelar]                           [Crear Ruta]            │
└──────────────────────────────────────────────────────────────┘
```

### 14.3 Sub-Diálogo "Agregar Parada"

```
┌──────────────────────────────────┐
│  Agregar Parada                  │
│  ────────────────────────        │
│                                  │
│  Orden *                         │
│  ┌────────────────────────────┐  │
│  │ 3                          │  │
│  └────────────────────────────┘  │
│                                  │
│  Almacén *                       │
│  ┌────────────────────────────┐  │
│  │ Seleccionar almacén...  ▼  │  │
│  └────────────────────────────┘  │
│                                  │
│  Llegada (opcional)              │
│  ┌────────────────────────────┐  │
│  │ 2026-06-01T14:00           │  │
│  └────────────────────────────┘  │
│                                  │
│  Salida (opcional)               │
│  ┌────────────────────────────┐  │
│  │ 2026-06-01T15:00           │  │
│  └────────────────────────────┘  │
│                                  │
│  Estado (opcional)               │
│  ┌────────────────────────────┐  │
│  │ Pendiente               ▼  │  │
│  └────────────────────────────┘  │
│                                  │
│                    [Cancelar] [Agregar] │
└──────────────────────────────────┘
```

---

## 15. Dependencias entre Módulos

Route depende de (y debe esperar que estén implementados):
- ✅ **Transport** — `useTransports()` para Select de vehículo
- ✅ **Driver** — `useDrivers()` para Select de conductor
- ✅ **Warehouse** — `useWarehouses()` para Select de almacén en stops

---

## 16. Notas Adicionales

### 16.1 Fechas (datetime-local vs ISO 8601)

La API espera fechas en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ` para datetimes). El input `type="datetime-local"` produce `YYYY-MM-DDTHH:mm`. Se debe convertir:

```typescript
// En el payload antes de enviar
const payload = {
  ...formData,
  start_date: formStartDate ? `${formStartDate}:00Z` : null,  // agregar :00Z
  end_date: formEndDate ? `${formEndDate}:00Z` : null,
}
```

### 16.2 Stops Vacíos en Creación

Al crear una nueva ruta, la tabla de stops comienza vacía. El botón "Crear Ruta" debe estar deshabilitado si no hay stops. Mostrar texto informativo: "Agrega al menos una parada a la ruta".

### 16.3 Display de Transport y Driver en Lista

Mientras no se implemente el display expandido en la API (objetos anidados con `__str__`), mostrar:
- Transporte: `"Vehículo #{id}"` (ej: "Vehículo #1")
- Conductor: `"Conductor #{id}"` (ej: "Conductor #1")

En el futuro, cuando la API devuelva objetos expandidos, actualizar a `transport.plate` y `driver.license_number`.

### 16.4 Stop Status

La API define los status de Stop como `pending | arrived | completed`. Además se incluye `skipped` como opción adicional (validar con backend si está soportado). El default para nuevos stops es `pending`.

### 16.5 End Date Validation

`end_date` es opcional. Si se especifica, se valida que sea posterior a `start_date`. Validación solo frontend (la API puede o no validarlo).

### 16.6 Orden de Stops

El campo `order` determina la secuencia de paradas. No se requiere que sea contiguo (1, 2, 3…), pero es buena práctica mantenerlo así. Al agregar un stop, se sugiere `stops.length + 1` pero el usuario puede cambiarlo.
