# Spec: Customer

Módulo de gestión de clientes. CRUD completo + soft-delete.
Campos específicos: tipo de cliente (company/person), documentos según tipo, datos de contacto y ubicación.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/customers` | Listado de clientes | `app/(dashboard)/customers/page.tsx` |

Create/edit vía Dialog desde la lista, mismo patrón que Warehouse y Suppliers. No hay página de detalle separada.

---

## 2. Componentes

### 2.1 Tabla (TanStack Table)

**Columnas:**

| Columna | accessorKey | Detalles |
|---------|-------------|----------|
| Nombre | `name` | Sortable |
| Tipo Cliente | `customer_type` | Mostrar "Empresa" / "Persona" (mapeo visual) |
| Documento | *custom* | Mostrar `{document_type}: {document_number}` o "—" |
| Email | `email` | Mostrar "—" si es null |
| Teléfono | `phone` | Mostrar "—" si es null |
| Ciudad | `city` | Mostrar "—" si es null |
| País | `country` | Mostrar "—" si es null |
| Estado | `is_active` | Badge "Activo" / "Inactivo" |
| Acciones | *actions* | Editar (lápiz), Activar (verde para inactivos), Eliminar (papelera + confirmación) |

**Mapeo de customer_type:**
```typescript
function customerTypeLabel(type: string): string {
  return type === "company" ? "Empresa" : "Persona"
}
```

**Columna documento (custom):**
```typescript
{
  id: "document",
  header: "Documento",
  cell: ({ row }) => {
    const dt = row.original.document_type
    const dn = row.original.document_number
    return dt && dn ? `${dt.toUpperCase()}: ${dn}` : "—"
  },
}
```

**Sort:** name, customer_type, email, city

**Filtro:** búsqueda client-side por name, email, document_number, city (usa `globalFilter` de TanStack Table)

**Paginación:** 10 items por página, controles "Anterior" / "Siguiente"

**Acciones por fila:**
- Editar (icono lápiz) → abre Dialog en modo edición
- Eliminar (si `is_active === true`) → abre confirmación de eliminación (soft-delete)
- Activar (si `is_active === false`) → PATCH `{ is_active: true }`

### 2.2 Formulario (Dialog)

**Campos del formulario:**

| Campo | Tipo | Requerido | Observaciones |
|-------|------|-----------|---------------|
| `name` | Input | Sí | — |
| `customer_type` | Select | Sí | Opciones: "company" → "Empresa", "person" → "Persona" |
| `document_type` | Select | No (condicional) | Solo visible si `customer_type` está seleccionado. Opciones: "ruc", "dni", "ce", "other" |
| `document_number` | Input | No (condicional) | Solo visible si `document_type` está seleccionado |
| `email` | Input type="email" | No | — |
| `phone` | Input | No | — |
| `address` | Textarea | No | — |
| `city` | Input | No | — |
| `country` | Input | No | — |

**Regla de visibilidad condicional (CustomerType → DocumentType → DocumentNumber):**

1. Si `customer_type` está vacío → ocultar sección de documento completa.
2. Si `customer_type === "company"` → `document_type` default "ruc", mostrar Select + document_number.
3. Si `customer_type === "person"` → `document_type` default "dni", mostrar Select + document_number.

En la práctica, se muestra la sección de documento SOLO cuando `customer_type` tiene valor:

```
{customerType && (
  <>
    {/* Select document_type */}
    {/* Input document_number */}
  </>
)}
```

**Select de customer_type:**
```tsx
<Select
  value={formCustomerType}
  onValueChange={(val) => {
    setFormCustomerType(val)
    // Resetear document fields al cambiar tipo
    setFormDocumentType(val === "company" ? "ruc" : "dni")
    setFormDocumentNumber("")
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar tipo de cliente…" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="company">Empresa</SelectItem>
    <SelectItem value="person">Persona</SelectItem>
  </SelectContent>
</Select>
```

**Select de document_type:**
```tsx
<Select
  value={formDocumentType}
  onValueChange={setFormDocumentType}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar tipo de documento…" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ruc">RUC</SelectItem>
    <SelectItem value="dni">DNI</SelectItem>
    <SelectItem value="ce">Carné de Extranjería</SelectItem>
    <SelectItem value="other">Otro</SelectItem>
  </SelectContent>
</Select>
```

**Payload para submit:**
```typescript
const payload = {
  name: formName,
  customer_type: formCustomerType,
  document_type: formDocumentType || null,
  document_number: formDocumentNumber || null,
  email: formEmail || null,
  phone: formPhone || null,
  address: formAddress || null,
  city: formCity || null,
  country: formCountry || null,
}
```

**Validación:** `name` y `customer_type` requeridos en frontend. Botón de submit deshabilitado si faltan.

### 2.3 Botón Activar (filas inactivas)

Mismo patrón que Warehouse — PATCH `{ is_active: true }` + invalidar query.

### 2.4 Confirmación de Eliminación

- Soft-delete (`DELETE /api/customers/{id}/`)
- AlertDialog con mensaje: "¿Estás seguro? Esta acción desactivará **{customer.name}**."
- Mismo patrón que Warehouse.

### 2.5 Estados de Carga y Error

- **Loading:** `<Loader2>` animado + texto "Cargando clientes…"
- **Error:** Icono de error + texto "Error al cargar clientes" + botón "Reintentar"
- **Empty:** "No hay clientes registrados" con sugerencia de crear uno
- **Empty con filtro:** "No se encontraron resultados" con sugerencia de cambiar búsqueda

---

## 3. API Service

**Archivo nuevo:** `services/customers.ts`

### 3.1 Funciones API

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getCustomers()` | GET | `/customers/` | — |
| `getCustomer(id)` | GET | `/customers/{id}/` | — |
| `createCustomer(data)` | POST | `/customers/` | Customer fields |
| `updateCustomer(id, data)` | PUT | `/customers/{id}/` | Customer fields |
| `deleteCustomer(id)` | DELETE | `/customers/{id}/` | — |
| `activateCustomer(id)` | PATCH | `/customers/{id}/` | `{ is_active: true }` |

**Manejo de paginación** (mismo patrón que Warehouse):
```typescript
export function getCustomers() {
  return api.get<Customer[] | PaginatedResponse<Customer>>("/customers/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}
```

**Tipos:** usar `Customer` de `@/types/api` (ya existe).

### 3.2 TanStack Query Hooks

**Archivo:** `services/customers.ts` (mismo archivo, hooks al final)

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useCustomers()` | `["customers"]` | Listar todos (GET) — `staleTime: 5 * 60 * 1000` |
| `useCustomer(id)` | `["customers", id]` | Detalle (GET) — `enabled: !!id` |
| `useCreateCustomer()` | mutation | POST + invalida `["customers"]` |
| `useUpdateCustomer()` | mutation | PUT + invalida `["customers"]` |
| `useDeleteCustomer()` | mutation | DELETE + invalida `["customers"]` |
| `useActivateCustomer()` | mutation | PATCH + invalida `["customers"]` |

Patrón de cada hook (ejemplo para create):
```typescript
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Customer>) => createCustomer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el cliente")
    },
  })
}
```

El hook `useUpdateCustomer` recibe `{ id, data }` como parámetro (mismo patrón que Warehouse):
```typescript
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el cliente")
    },
  })
}
```

---

## 4. Store

No necesario — TanStack Query cache es suficiente. No se comparte estado de clientes entre módulos (Shipment usa el ID del cliente, no el objeto completo).

---

## 5. Layout / Sidebar

El sidebar **ya incluye** el link `/customers` con icono `Users` y label "Clientes" (ver `layout.tsx` línea 31). No se requiere modificación.

---

## 6. Convenciones

- `"use client"` en el componente de página (tiene hooks)
- `ColumnDef<Customer>` para tipado de columnas
- Toast de éxito/error después de cada mutación (usar `sonner`)
- Loading skeleton / spinner en tabla mientras carga
- Error state con botón de reintento
- Soft-delete con PATCH `activateCustomer` para re-activar
- `useState` por campo en el formulario (mismo patrón que Warehouse/Suppliers — sin react-hook-form)
- `Select` de shadcn/ui para `customer_type` y `document_type`

---

## 7. Archivos a Crear

| Archivo | Acción |
|---------|--------|
| `services/customers.ts` | **Crear** — funciones API + TanStack Query hooks |
| `app/(dashboard)/customers/page.tsx` | **Crear** — página completa con tabla, diálogos, formulario |

No se requiere modificar `types/api.ts` (Customer ya existe), ni el layout del sidebar.

---

## 8. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Tipo de formulario | `useState` por campo | Consistencia con módulos existentes (Warehouse, Suppliers, Products) |
| Select de shadcn/ui | `Select` + `SelectTrigger` + `SelectContent` + `SelectItem` | Consistente con patrón del proyecto; permite placeholder |
| Visibilidad condicional de documento | `{customerType && (...)}` anidado | `customer_type` requerido → documento solo se muestra cuando está definido |
| Default document_type | "ruc" si company, "dni" si person | UX: el tipo de documento más común según el tipo de cliente |
| Reset de documento al cambiar tipo | `setFormDocumentType(...)` + `setFormDocumentNumber("")` | Evita datos inconsistentes (ej: RUC para una persona) |
| Columna documento en tabla | Custom cell con formato `{TYPE}: {number}` o "—" | Información compacta y legible |
| Soft-delete | DELETE endpoint + botón Activar | Consistente con Warehouse y Suppliers |
| Paginación | Client-side con TanStack Table `getPaginationRowModel` | Backend no usa paginación DRF (mismo patrón) |

---

## 9. Especificación del Formulario (Diagrama de Flujo Condicional)

```
customer_type seleccionado?
├── No → Oculta sección documento
└── Sí → Muestra:
    ├── document_type (Select: ruc/dni/ce/other)
    │   └── Default: "ruc" si company, "dni" si person
    └── document_number (Input)
        └── Solo visible si document_type tiene valor
```

**Estado inicial del formulario (create):**
| Campo | Valor inicial |
|-------|---------------|
| name | "" |
| customer_type | "" |
| document_type | "" |
| document_number | "" |
| email | "" |
| phone | "" |
| address | "" |
| city | "" |
| country | "" |

**Estado inicial del formulario (edit):**
Se cargan los valores existentes del objeto `Customer`. Si `customer_type` está definido, se muestra la sección de documento con los valores del backend.

---

## 10. Ejemplo de Flujo Completo

1. Usuario navega a `/customers`.
2. `useCustomers()` → GET `/api/customers/` → lista de clientes.
3. Tabla muestra nombre, tipo (Empresa/Persona), documento, email, teléfono, ciudad, país, estado, acciones.
4. Usuario hace clic en "Nuevo Cliente" → Dialog con formulario.
5. Usuario selecciona `customer_type = "company"` → aparece `document_type` (default "ruc") + `document_number`.
6. Usuario completa nombre (obligatorio) y datos opcionales → Submit.
7. `useCreateCustomer()` → POST `/api/customers/` → toast "Cliente creado exitosamente" → tabla se actualiza.
8. Editar → Dialog precargado con valores existentes → PUT `/api/customers/{id}/`.
9. Eliminar → DELETE `/api/customers/{id}/` → soft-delete → badge cambia a "Inactivo" + botón "Activar".
10. Activar → PATCH `{ is_active: true }` → badge vuelve a "Activo".
