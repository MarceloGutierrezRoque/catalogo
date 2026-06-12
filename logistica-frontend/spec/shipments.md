# Spec: Shipments + ShipmentItems (Envíos)

Módulo de gestión de envíos. **Cabecera + Items anidados.** CRUD para Shipment vía endpoint `/api/shipments/`. Gestión separada de ShipmentItems vía `/api/shipment-items/`.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/shipments` | Listado de envíos | `app/(dashboard)/shipments/page.tsx` |
| `/shipments/new` | Crear nuevo envío | `app/(dashboard)/shipments/new/page.tsx` |
| `/shipments/[id]` | Detalle del envío (editable) | `app/(dashboard)/shipments/[id]/page.tsx` |

### Decisión: Páginas dedicadas (no Dialog) para create/edit

A diferencia de módulos anteriores (Warehouse, Products, etc.) que usan Dialog para crear/editar, Shipment **requiere páginas dedicadas**. Razones:

1. **Formulario extenso:** tracking_number, customer, origin_warehouse, destination_address, destination_city, destination_country, status, shipping_date, estimated_delivery_date, route, observations. Un Dialog sería demasiado grande y difícil de navegar.

2. **Items anidados:** Requiere una mini-tabla embebida con capacidad de agregar/eliminar items. Esto necesita espacio vertical que un Dialog no proporciona cómodamente.

3. **Experiencia de usuario:** El flujo de crear un envío con múltiples productos es una tarea compleja que merece una página completa.

**Flujo de navegación:**

- Lista (`/shipments`): Tabla con todos los envíos. Botón "Nuevo Envío" → navega a `/shipments/new`. Clic en "Editar" de una fila → navega a `/shipments/[id]`.
- Crear (`/shipments/new`): Formulario de cabecera + sección de items. Submit → crea shipment + items → redirige a `/shipments`.
- Detalle/Editar (`/shipments/[id]`): Mismo formulario precargado + items existentes. Submit → actualiza shipment + sincroniza items → redirige a `/shipments`.
- Una página sirve tanto para ver detalle como para editar (el formulario está precargado y editable).

---

## 2. Componentes

### 2.1 Tabla de Listado (`/shipments`)

**Columnas (TanStack Table):**

| Columna | accessorKey / id | Detalles |
|---------|-----------------|----------|
| Tracking | `tracking_number` | Sortable. Link que navega a `/shipments/[id]` |
| Cliente | *custom* | Mostrar `"Cliente #{customer}"` (por ahora, ID numérico) |
| Almacén Origen | *custom* | Mostrar `"Almacén #{origin_warehouse}"` (por ahora, ID numérico) |
| Ciudad Destino | `destination_city` | Sortable |
| Estado | `status` | Badge con color según el estado (ver sección 2.1.1) |
| Fecha de Envío | `shipping_date` | Formateada como fecha legible o `—` si es null |
| Items | *custom* | Contar `items.length` y mostrar badge con el número |
| Acciones | *actions* | Editar (navega a `/[id]`), Eliminar (confirmación soft-delete) |

#### 2.1.1 Status Badge

```typescript
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendiente", variant: "secondary" },
    picked_up: { label: "Recogido", variant: "default" },
    in_transit: { label: "En tránsito", variant: "outline" },
    delivered: { label: "Entregado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  }
  const c = config[status] ?? { label: status, variant: "outline" as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}
```

Colores CSS adicionales (vía className):
- `pending` → `bg-gray-100 text-gray-700` (gris)
- `picked_up` → `bg-blue-100 text-blue-700` (azul)
- `in_transit` → `bg-amber-100 text-amber-700` (ámbar)
- `delivered` → `bg-green-100 text-green-700` (verde)
- `cancelled` → `bg-red-100 text-red-700` (rojo)

#### 2.1.2 Filtro y Búsqueda

- Búsqueda client-side por tracking_number, destination_city (usa `globalFilter` de TanStack Table)
- Input con icono de búsqueda, mismo patrón que Products

#### 2.1.3 Paginación

- 10 items por página, controles "Anterior" / "Siguiente"
- Mismo patrón que Products

#### 2.1.4 Acciones por fila

- **Editar** (icono lápiz `Pencil`) → `router.push(\`/shipments/${id}\`)`
- **Eliminar** (icono papelera `Trash2`, solo si `is_active === true`) → AlertDialog de confirmación → soft-delete (`DELETE /api/shipments/{id}/`)
- **Activar** (botón verde "Activar", solo si `is_active === false`) → PATCH `{ is_active: true }` (opcional — puede implementarse después)

### 2.2 Formulario de Cabecera (`/shipments/new` y `/shipments/[id]`)

**Campos del formulario:**

| Campo | Componente | Requerido | Observaciones |
|-------|-----------|-----------|---------------|
| `tracking_number` | Input | Sí | Texto libre, ej: "SHP-001" |
| `customer` | Select (shadcn `<Select>`) | Sí | Poblado con `useCustomers()`. Mostrar `name` del cliente, value = `id` |
| `origin_warehouse` | Select (shadcn `<Select>`) | Sí | Poblado con `useWarehouses()`. Mostrar `name` del almacén, value = `id` |
| `destination_address` | Input | Sí | Dirección de destino |
| `destination_city` | Input | Sí | Ciudad de destino |
| `destination_country` | Input | Sí | País de destino |
| `status` | Select (shadcn `<Select>`) | No | Valores: pending (default), picked_up, in_transit, delivered, cancelled |
| `shipping_date` | Input type="date" | No | Formato YYYY-MM-DD |
| `estimated_delivery_date` | Input type="date" | No | Formato YYYY-MM-DD |
| `route` | Input type="number" | No | FK numérico a Route. Opcional y nullable. Ruta como ID numérico por ahora. |
| `observations` | Textarea | No | Observaciones generales |

**Layout del formulario (3 columnas en desktop, 2 en tablet, 1 en mobile):**

```
Fila 1: [tracking_number            ] [customer (Select)          ] [origin_warehouse (Select)  ]
Fila 2: [destination_address        ] [destination_city          ] [destination_country        ]
Fila 3: [status (Select)            ] [shipping_date (date)      ] [estimated_delivery (date)  ]
Fila 4: [route (number, optional)   ]                                                           
Fila 5: [observations (textarea, full width, 3 rows)                                          ]
```

Usar grid responsivo: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

### 2.3 Sección de Items (embebida en la misma página)

Debajo del formulario de cabecera, una sección con título "Productos del Envío".

#### 2.3.1 Mini-tabla de Items

| Columna | Detalles |
|---------|----------|
| Producto | Mostrar nombre del producto (de `useProducts()` cache). Si no está disponible, mostrar `"Producto #{product}"` |
| Cantidad | Número entero |
| Precio Unitario | Formateado como moneda (`Intl.NumberFormat("es-PE", ...)`) |
| Acciones | Botón eliminar (icono papelera rojo) con confirmación |

#### 2.3.2 Botón "Agregar Producto"

- Abre un **sub-diálogo** (Dialog) para agregar un item
- Campos en el diálogo:
  - `product` — Select poblado con `useProducts()`
  - `quantity` — Input type="number" (requerido, mínimo 1)
  - `unit_price_at_shipping` — Input type="number" step="0.01" (opcional)
- Botón "Agregar" → agrega el item al estado local
- El diálogo se cierra al agregar

#### 2.3.3 Manejo de Items en Estado Local

```typescript
// Tipo para items locales (antes de persistir)
interface ShipmentItemDraft {
  tempId: string // para key de React, usar crypto.randomUUID()
  id?: number // presente si es un item existente (modo edición)
  product: number
  quantity: number
  unit_price_at_shipping: string
}
```

**Estado:**
- `items: ShipmentItemDraft[]` — items actuales visibles en la tabla
- `deletedItemIds: number[]` — IDs de items eliminados (solo en modo edición)

**Operaciones:**
- **Agregar:** `setItems(prev => [...prev, { tempId, product, quantity, unit_price }])`
- **Eliminar:** Si el item tiene `id`, agregarlo a `deletedItemIds`. Filtrarlo de `items`.
- **Editar:** No se permite editar items individuales en el MVP (se elimina y se vuelve a agregar).

#### 2.3.4 Submit de Items

**Flujo al guardar:**
1. Si es **creación**: POST `/api/shipments/` con datos de cabecera → obtener `id` del shipment creado → luego POST cada item en `items` a `/api/shipment-items/`
2. Si es **edición**: PUT `/api/shipments/{id}/` con datos de cabecera → DELETE cada ID en `deletedItemIds` de `/api/shipment-items/{id}/` → POST cada item nuevo (sin `id`) a `/api/shipment-items/`

**Orden de operaciones:**
1. Guardar cabecera (POST o PUT)
2. Eliminar items marcados (DELETE)
3. Crear items nuevos (POST)

Si alguna operación falla, mostrar toast de error específico.

---

## 3. API Service

**Archivo nuevo:** `services/shipments.ts`

### 3.1 Funciones API (Shipment)

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getShipments()` | GET | `/shipments/` | — |
| `getShipment(id)` | GET | `/shipments/{id}/` | — |
| `createShipment(data)` | POST | `/shipments/` | Shipment fields (FKs como integers) |
| `updateShipment(id, data)` | PUT | `/shipments/{id}/` | Shipment fields (FKs como integers) |
| `deleteShipment(id)` | DELETE | `/shipments/{id}/` | — |
| `patchShipment(id, data)` | PATCH | `/shipments/{id}/` | Partial update (ej: `{ is_active: true }`) |

**Nota importante sobre `route`:** Es un FK opcional a Route. Si Route no está implementado aún, el usuario puede dejarlo vacío (se envía como `null`). El valor se envía como `number | null` en POST/PUT.

### 3.2 Funciones API (ShipmentItem)

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getShipmentItems(shipmentId?)` | GET | `/shipment-items/?shipment={id}` | — |
| `createShipmentItem(data)` | POST | `/shipment-items/` | `{ shipment, product, quantity, unit_price_at_shipping }` |
| `deleteShipmentItem(id)` | DELETE | `/shipment-items/{id}/` | — (hard-delete) |

> `getShipmentItems` no es estrictamente necesaria porque los items vienen anidados en `getShipment()`. Se incluye por si se necesita filtrar independientemente.

### 3.3 Payload Types

```typescript
// Para POST/PUT de Shipment
interface ShipmentPayload {
  tracking_number: string
  customer: number
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status?: string
  shipping_date?: string | null
  estimated_delivery_date?: string | null
  route?: number | null
  observations?: string | null
}

// Para POST de ShipmentItem
interface ShipmentItemPayload {
  shipment: number
  product: number
  quantity: number
  unit_price_at_shipping?: string
}
```

### 3.4 Código de servicio

```typescript
import api from "@/lib/axios"
import type { Shipment, ShipmentItem, PaginatedResponse } from "@/types/api"

// ── Shipment API ──

export function getShipments() {
  return api.get<Shipment[] | PaginatedResponse<Shipment>>("/shipments/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getShipment(id: number) {
  return api.get<Shipment>(`/shipments/${id}/`).then((r) => r.data)
}

export function createShipment(data: Partial<Shipment>) {
  return api.post<Shipment>("/shipments/", data).then((r) => r.data)
}

export function updateShipment(id: number, data: Partial<Shipment>) {
  return api.put<Shipment>(`/shipments/${id}/`, data).then((r) => r.data)
}

export function deleteShipment(id: number) {
  return api.delete(`/shipments/${id}/`).then((r) => r.data)
}

export function patchShipment(id: number, data: Partial<Shipment>) {
  return api.patch<Shipment>(`/shipments/${id}/`, data).then((r) => r.data)
}

// ── ShipmentItem API ──

export function getShipmentItems(shipmentId?: number) {
  const params = shipmentId ? { shipment: shipmentId } : {}
  return api.get<ShipmentItem[] | PaginatedResponse<ShipmentItem>>("/shipment-items/", { params }).then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function createShipmentItem(data: { shipment: number; product: number; quantity: number; unit_price_at_shipping?: string }) {
  return api.post<ShipmentItem>("/shipment-items/", data).then((r) => r.data)
}

export function deleteShipmentItem(id: number) {
  return api.delete(`/shipment-items/${id}/`).then((r) => r.data)
}
```

---

## 4. TanStack Query Hooks

**Archivo:** `services/shipments.ts` (mismo archivo, hooks al final)

### 4.1 Shipment Hooks

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useShipments()` | `["shipments"]` | Listar todos los envíos. `staleTime: 5 * 60 * 1000` |
| `useShipment(id)` | `["shipments", id]` | Detalle del envío con items anidados. `enabled: !!id` |
| `useCreateShipment()` | mutation | POST + invalida `["shipments"]`. `onSuccess` toast "Envío creado exitosamente" |
| `useUpdateShipment()` | mutation | PUT + invalida `["shipments"]` y `["shipments", id]`. `onSuccess` toast |
| `useDeleteShipment()` | mutation | DELETE + invalida `["shipments"]`. `onSuccess` toast |
| `useActivateShipment()` | mutation | PATCH `{ is_active: true }` + invalida `["shipments"]`. `onSuccess` toast |

### 4.2 ShipmentItem Hooks

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useShipmentItems(shipmentId)` | `["shipment-items", shipmentId]` | Listar items de un envío. `enabled: !!shipmentId`. **Opcional** — los items ya vienen en `useShipment()`. |
| `useCreateShipmentItem()` | mutation | POST + invalida `["shipments"]` y `["shipments", id]`. `onSuccess` toast. |
| `useDeleteShipmentItem()` | mutation | DELETE + invalida `["shipments"]` y `["shipments", id]`. `onSuccess` toast. |

### 4.3 Estrategia de Invalidation para Items

Cuando se crea o elimina un ShipmentItem, se debe invalidar:
- `["shipments"]` — porque el conteo de items cambia en la lista
- `["shipments", shipmentId]` — porque los items anidados cambian en el detalle

Los hooks de items reciben el `shipmentId` como parámetro para poder invalidar correctamente:

```typescript
export function useCreateShipmentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { shipment: number; product: number; quantity: number; unit_price_at_shipping?: string }) =>
      createShipmentItem(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      qc.invalidateQueries({ queryKey: ["shipments", variables.shipment] })
      toast.success("Producto agregado al envío")
    },
    onError: () => {
      toast.error("Error al agregar el producto")
    },
  })
}
```

### 4.4 Hook para Guardar Envío Completo (Cabecera + Items)

Para simplificar el flujo de submit, se puede crear un hook que encapsule toda la lógica:

```typescript
// En la página, NO como hook global (es lógica de UI)
async function handleSave(formData, items, deletedItemIds, editingId?) {
  try {
    // 1. Guardar cabecera
    let shipmentId: number
    if (editingId) {
      await updateShipment(editingId, formData)
      shipmentId = editingId
    } else {
      const created = await createShipment(formData)
      shipmentId = created.id
    }

    // 2. Eliminar items marcados
    for (const id of deletedItemIds) {
      await deleteShipmentItem(id)
    }

    // 3. Crear items nuevos
    for (const item of items) {
      if (!item.id) {
        await createShipmentItem({
          shipment: shipmentId,
          product: item.product,
          quantity: item.quantity,
          unit_price_at_shipping: item.unit_price_at_shipping,
        })
      }
    }

    // 4. Invalidar queries
    queryClient.invalidateQueries({ queryKey: ["shipments"] })
    if (editingId) {
      queryClient.invalidateQueries({ queryKey: ["shipments", editingId] })
    }
    
    toast.success(editingId ? "Envío actualizado" : "Envío creado")
    router.push("/shipments")
  } catch (error) {
    toast.error("Error al guardar el envío")
  }
}
```

---

## 5. Store

No necesario — TanStack Query cache es suficiente. Los datos de Customer, Warehouse, y Products se cargan con sus propios hooks y se cachean independientemente.

---

## 6. Layout / Sidebar

El sidebar **ya incluye** el link `/shipments` con icono `Ship` y label "Envíos" (ver `app/(dashboard)/layout.tsx` línea 32). No se requiere modificación.

---

## 7. Estados de Carga y Error

### 7.1 Página de Lista (`/shipments`)

Mismo patrón que Products:
- **Loading:** `<Loader2>` animado + texto "Cargando envíos…"
- **Error:** Icono de error + texto "Error al cargar envíos" + botón "Reintentar"
- **Empty:** "No hay envíos registrados" + sugerencia de crear uno
- **Empty con filtro:** "No se encontraron resultados" + sugerencia de cambiar búsqueda

### 7.2 Página de Detalle/Editar (`/shipments/[id]`)

- **Loading:** Skeleton o Loader2 + "Cargando envío…"
- **Error:** "Error al cargar el envío" + botón "Volver" y "Reintentar"
- **404 / No encontrado:** Mensaje "Envío no encontrado" + botón "Volver a envíos"

### 7.3 Página de Crear (`/shipments/new`)

No tiene estado de carga inicial (no hay datos que cargar). Solo estados de submit y error.

---

## 8. Archivos a Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `services/shipments.ts` | **Crear** | Funciones API + TanStack Query hooks para Shipment y ShipmentItem |
| `app/(dashboard)/shipments/page.tsx` | **Crear** | Página de listado con tabla TanStack |
| `app/(dashboard)/shipments/new/page.tsx` | **Crear** | Página de creación (formulario cabecera + items) |
| `app/(dashboard)/shipments/[id]/page.tsx` | **Crear** | Página de detalle/edición (formulario precargado + items) |
| `app/(dashboard)/shipments/layout.tsx` | **Crear** (opcional) | Solo si se necesita layout específico para el módulo |

No se requiere modificar `types/api.ts` — los tipos `Shipment` y `ShipmentItem` ya existen con los campos correctos.

---

## 9. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Create/Edit: ¿Dialog o página? | **Página dedicada** (`/shipments/new` y `/[id]`) | Formulario extenso + items anidados requieren espacio. Dialog sería incómodo. |
| Items: ¿se guardan anidados o separados? | **Por separado** (POST `/api/shipment-items/` después de crear el shipment) | La API no soporta items anidados en POST/PUT de Shipment. Los items son read-only en el GET. |
| Items locales: ¿cómo se manejan antes de submit? | Array `ShipmentItemDraft[]` en estado local con `tempId` para React keys | Permite gestión completa de items (agregar/eliminar) antes de persistir. |
| Items eliminados en edición | Array `deletedItemIds: number[]` | Se eliminan vía DELETE después de actualizar la cabecera, antes de crear nuevos. |
| Select de Customer | `useCustomers()` + shadcn `<Select>` | Hook existente. Reutiliza cache. |
| Select de Warehouse | `useWarehouses()` + shadcn `<Select>` | Hook existente. Reutiliza cache. |
| Select de Product (en items) | `useProducts()` + shadcn `<Select>` | Hook existente. Reutiliza cache. |
| Route FK | Input numérico opcional | Route no está implementado aún. Se puede reemplazar por Select cuando exista. |
| Status enum | Select con labels: Pendiente, Recogido, En tránsito, Entregado, Cancelado | Mapeo directo con la API. Default: "pending". |
| Estado del formulario | `useState` por campo (mismo patrón que otros módulos) | Consistencia. Evita agregar react-hook-form para este MVP. |
| Paginación en lista | Client-side con TanStack Table `getPaginationRowModel` | Backend no fuerza paginación (array plano). |
| Soft-delete | `DELETE` endpoint + botón "Activar" en filas inactivas | Consistente con otros módulos. |
| Navegación post-submit | `router.push("/shipments")` | Redirige a la lista después de crear/editar. |
| Toast de éxito | `sonner.toast.success()` | Consistente con otros módulos. |

---

## 10. Flujo Completo (Creación)

1. Usuario navega a `/shipments` → lista vacía con botón "Nuevo Envío"
2. Usuario hace clic en "Nuevo Envío" → navega a `/shipments/new`
3. Página carga `useCustomers()`, `useWarehouses()`, `useProducts()` (cacheados)
4. Usuario llena formulario de cabecera:
   - Tracking: "SHP-002"
   - Cliente: Selecciona de dropdown
   - Almacén Origen: Selecciona de dropdown
   - Dirección, ciudad, país de destino
   - Status: Pendiente (default)
   - Fechas (opcional)
   - Observaciones (opcional)
5. Usuario agrega items:
   - Clic "Agregar Producto" → Dialog con Select de producto + cantidad + precio
   - Producto aparece en la tabla de items
   - Repite para cada producto
6. Usuario hace clic "Guardar Envío"
7. Lógica de submit:
   - POST `/api/shipments/` con datos de cabecera → obtiene `id=1`
   - POST `/api/shipment-items/` para cada item (con `shipment: 1`)
   - Invalida queries
   - Toast "Envío creado exitosamente"
   - Redirige a `/shipments`
8. Tabla muestra el nuevo envío con su tracking, cliente, estado "Pendiente", conteo de items

---

## 11. Flujo Completo (Edición)

1. Usuario navega a `/shipments` → encuentra el envío "SHP-001"
2. Usuario hace clic en "Editar" → navega a `/shipments/1`
3. Página: `useShipment(1)` → GET `/api/shipments/1/` → precarga formulario
4. Items precargados en la tabla de items (con sus `id`)
5. Usuario puede:
   - Modificar campos de cabecera
   - Agregar nuevos items (sin `id`)
   - Eliminar items existentes (se agregan a `deletedItemIds`)
6. Usuario hace clic "Guardar Cambios"
7. Lógica de submit:
   - PUT `/api/shipments/1/` con datos de cabecera
   - DELETE `/api/shipment-items/{id}/` para cada ID en `deletedItemIds`
   - POST `/api/shipment-items/` para cada item nuevo
   - Invalida queries
   - Toast "Envío actualizado exitosamente"
   - Redirige a `/shipments`

---

## 12. Mockups de las Páginas

### 12.1 Página de Lista (`/shipments`)

```
┌─────────────────────────────────────────────────────┐
│  Envíos                               [Nuevo Envío] │
│  Administra los envíos registrados                   │
│                                                      │
│  🔍 Buscar por tracking o ciudad...                  │
│                                                      │
│  ┌──────┬────────┬────────┬──────┬────────┬──────┬──┐│
│  │Tracking│Cliente│Origen │Destino│ Estado │Items │ ▶││
│  ├──────┼────────┼────────┼──────┼────────┼──────┼──┤│
│  │SHP-001│Cliente#1│Alm#1  │Cusco │🟡Pend. │  3   │ ✏🗑││
│  │SHP-002│Cliente#2│Alm#2  │Lima  │🟢Entreg.│  1   │ ✏🗑││
│  └──────┴────────┴────────┴──────┴────────┴──────┴──┘│
│                                                      │
│  2 registros en total  ← Anterior  Siguiente →       │
└─────────────────────────────────────────────────────┘
```

### 12.2 Página de Crear/Editar (`/shipments/new` o `/[id]`)

```
┌─────────────────────────────────────────────────────┐
│  ← Volver a Envíos                                   │
│                                                      │
│  Nuevo Envío                                         │
│  ──────────────────────────────────────────────      │
│                                                      │
│  ┌───Datos del Envío─────────────────────────────┐   │
│  │ [Tracking *]   [Cliente * ▼] [Almacén Origen*▼]│  │
│  │ [Dirección *]  [Ciudad *]    [País *]          │  │
│  │ [Estado ▼]     [F. Envío  ]  [F. Est. Entrega ]│  │
│  │ [Ruta (ID) ]                                   │  │
│  │ [Observaciones                              ]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌───Productos del Envío────────────────────────┐    │
│  │ [Agregar Producto +]                         │    │
│  │ ┌─────────┬──────────┬───────────┬──────────┐│    │
│  │ │Producto │ Cantidad │ Precio    │ Acciones ││    │
│  │ ├─────────┼──────────┼───────────┼──────────┤│    │
│  │ │Laptop X1│    10    │ S/ 4,999  │    🗑    ││    │
│  │ │Mouse G3 │    50    │ S/ 89.90  │    🗑    ││    │
│  │ └─────────┴──────────┴───────────┴──────────┘│    │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Cancelar]                       [Guardar Envío]    │
└─────────────────────────────────────────────────────┘
```

---

## 13. Notas Adicionales

### 13.1 Manejo del campo `route`

El campo `route` es un FK opcional al módulo Route (no implementado aún). Por ahora se maneja como:
- Input numérico con placeholder "ID de ruta (opcional)"
- Se valida como número positivo si se ingresa
- Se envía como `null` si está vacío
- En el futuro se reemplazará por un Select con `useRoutes()`

### 13.2 Fechas (timezone)

La API espera fechas en formato ISO 8601 (`YYYY-MM-DD` para date fields). El input `type="date"` ya produce este formato. No se requiere manipulación adicional.

### 13.3 Precios en Items

`unit_price_at_shipping` es un decimal que la API serializa como string. Se debe convertir a string antes de enviar:
```typescript
const payload = {
  shipment: shipmentId,
  product: Number(item.product),
  quantity: Number(item.quantity),
  unit_price_at_shipping: item.unit_price_at_shipping || null,
}
```

### 13.4 Dependencias entre Módulos

Shipment depende de (y debe esperar que estén implementados):
- ✅ **Customer** — `useCustomers()` para Select de cliente
- ✅ **Warehouse** — `useWarehouses()` para Select de almacén origen
- ✅ **Products** — `useProducts()` para Select de productos en items
- ⏳ **Route** — Pendiente. Se usa como input numérico por ahora.

### 13.5 Validación Frontend

| Campo | Validación |
|-------|-----------|
| `tracking_number` | Requerido, no vacío |
| `customer` | Requerido (Select debe tener valor) |
| `origin_warehouse` | Requerido (Select debe tener valor) |
| `destination_address` | Requerido, no vacío |
| `destination_city` | Requerido, no vacío |
| `destination_country` | Requerido, no vacío |
| Items | Al menos 1 item requerido |
| `quantity` en item | Número entero >= 1 |
| `unit_price_at_shipping` | Número positivo (si se ingresa) |

El botón de submit se deshabilita si no se cumplen las validaciones requeridas.

### 13.6 Items Vacíos en Creación

Al crear un nuevo envío, la tabla de items comienza vacía. El botón "Guardar Envío" debe estar deshabilitado si no hay items. Mostrar mensaje: "Agrega al menos un producto al envío".
