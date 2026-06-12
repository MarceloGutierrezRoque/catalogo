# Spec: Driver (Conductores)

Módulo de gestión de conductores. CRUD completo + soft-delete.
Campos específicos: FK a `auth_user` (numérico), licencia, datos de contacto, fecha de contratación y disponibilidad.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/drivers` | Listado de conductores | `app/(dashboard)/drivers/page.tsx` |

Create/edit vía Dialog desde la lista, mismo patrón que Transport y Warehouse. No hay página de detalle separada.

---

## 2. Componentes

### 2.1 Tabla (TanStack Table)

**Columnas:**

| Columna | accessorKey | Detalles |
|---------|-------------|----------|
| # Licencia | `license_number` | Sortable — columna principal |
| Usuario | `user` | Mostrar `"User #{id}"` o simplemente el número. "—" si es null |
| Teléfono | `phone` | "—" si null |
| Email | `email` | "—" si null |
| Fecha Contratación | `hire_date` | Formatear con `new Date(val).toLocaleDateString("es-PE")`. "—" si null |
| Disponibilidad | `is_available` | Badge especial (ver sección 2.3) |
| Estado | `is_active` | Badge "Activo" / "Inactivo" (igual que otros módulos) |
| Acciones | *actions* | Editar (lápiz), Activar (verde para inactivos), Eliminar (papelera + confirmación) |

**Columna "Usuario" (FK display):**
```typescript
{
  accessorKey: "user",
  header: "Usuario",
  cell: ({ row }) => {
    const userId = row.original.user
    return userId ? `User #${userId}` : "—"
  },
}
```

**Sort:** license_number, hire_date, is_available

**Filtro:** búsqueda client-side por license_number, user (como string), phone, email (usa `globalFilter` de TanStack Table)

**Paginación:** 10 items por página, controles "Anterior" / "Siguiente"

**Acciones por fila:**
- Editar (icono lápiz) → abre Dialog en modo edición
- Eliminar (si `is_active === true`) → abre confirmación de eliminación (soft-delete)
- Activar (si `is_active === false`) → PATCH `{ is_active: true }`

### 2.2 Formulario (Dialog)

**Campos del formulario:**

| Campo | Tipo | Requerido | Observaciones |
|-------|------|-----------|---------------|
| `license_number` | Input | Sí | Placeholder: "LIC-001". Único en backend |
| `user` | Input type="number" min="1" | No | Placeholder: "ID de usuario…". Se envía como integer o null |
| `phone` | Input | No | Placeholder: "+51999000111" |
| `email` | Input type="email" | No | Placeholder: "juan@logistica.com" |
| `hire_date` | Input type="date" | No | Placeholder: "YYYY-MM-DD" |
| `is_available` | Checkbox | No | Default: true (checkbox marcado) |

**Nota sobre `user`:** Es FK a `auth_user.id`. Para el MVP se ingresa el ID numérico directamente. No hay dropdown de selección de usuarios — sería una mejora futura con un endpoint `/users/`.

**Payload para submit:**
```typescript
const payload = {
  license_number: formLicenseNumber,
  user: formUser ? Number(formUser) : null,
  phone: formPhone || null,
  email: formEmail || null,
  hire_date: formHireDate || null,
  is_available: formIsAvailable,
}
```

> **Importante:** Si `user` se envía como string vacío, convertir a `null` antes de enviar. El backend acepta `user: null` o un número entero.

**Validación:** `license_number` requerido en frontend. Botón de submit deshabilitado si falta.

### 2.3 Badge de Disponibilidad (`is_available`)

Mismo patrón que Transport:

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
      <Badge
        variant={available ? "default" : "secondary"}
        className={
          available
            ? ""
            : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
        }
      >
        {available ? "Disponible" : "No disponible"}
      </Badge>
    )
  },
}
```

### 2.4 Botón Activar (filas inactivas)

Mismo patrón que Warehouse/Transport — PATCH `{ is_active: true }` + invalidar query.
Botón pequeño con texto "Activar" en verde, visible solo cuando `is_active === false`.

### 2.5 Confirmación de Eliminación

- Soft-delete (`DELETE /api/drivers/{id}/`)
- AlertDialog con mensaje: "¿Estás seguro? Esta acción desactivará **{driver.license_number}**."
- Mismo patrón que Transport.

### 2.6 Estados de Carga y Error

- **Loading:** `<Loader2>` animado + texto "Cargando conductores…"
- **Error:** Icono de error + texto "Error al cargar conductores" + botón "Reintentar"
- **Empty:** "No hay conductores registrados" con sugerencia de crear uno
- **Empty con filtro:** "No se encontraron resultados" con sugerencia de cambiar búsqueda

---

## 3. API Service

**Archivo nuevo:** `services/drivers.ts`

### 3.1 Funciones API

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getDrivers()` | GET | `/drivers/` | — |
| `getDriver(id)` | GET | `/drivers/{id}/` | — |
| `createDriver(data)` | POST | `/drivers/` | Driver fields |
| `updateDriver(id, data)` | PUT | `/drivers/{id}/` | Driver fields |
| `deleteDriver(id)` | DELETE | `/drivers/{id}/` | — |
| `activateDriver(id)` | PATCH | `/drivers/{id}/` | `{ is_active: true }` |

**Manejo de paginación** (mismo patrón que Warehouse/Transport):
```typescript
export function getDrivers() {
  return api.get<Driver[] | PaginatedResponse<Driver>>("/drivers/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}
```

**Tipos:** usar `Driver` de `@/types/api` (ya existe en `types/api.ts` — línea 91).

### 3.2 TanStack Query Hooks

**Archivo:** `services/drivers.ts` (mismo archivo, hooks al final)

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useDrivers()` | `["drivers"]` | Listar todos (GET) — `staleTime: 5 * 60 * 1000` |
| `useDriver(id)` | `["drivers", id]` | Detalle (GET) — `enabled: !!id` |
| `useCreateDriver()` | mutation | POST + invalida `["drivers"]` |
| `useUpdateDriver()` | mutation | PUT + invalida `["drivers"]` |
| `useDeleteDriver()` | mutation | DELETE + invalida `["drivers"]` |
| `useActivateDriver()` | mutation | PATCH + invalida `["drivers"]` |

Patrón de cada hook (ejemplo para create):
```typescript
export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Driver>) => createDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el conductor")
    },
  })
}
```

El hook `useUpdateDriver` recibe `{ id, data }` como parámetro:
```typescript
export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Driver> }) =>
      updateDriver(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el conductor")
    },
  })
}
```

---

## 4. Store

No necesario — TanStack Query cache es suficiente. No se comparte estado de Driver entre módulos (Route usa el ID del driver, no el objeto completo).

---

## 5. Layout / Sidebar

El sidebar **ya incluye** el link `/drivers` con icono `UserCircle` y label "Conductores" (ver `layout.tsx` línea 33). No se requiere modificación.

---

## 6. Convenciones

- `"use client"` en el componente de página (tiene hooks)
- `ColumnDef<Driver>` para tipado de columnas
- Toast de éxito/error después de cada mutación (usar `sonner`)
- Loading skeleton / spinner en tabla mientras carga
- Error state con botón de reintento
- Soft-delete con PATCH `activateDriver` para re-activar
- `useState` por campo en el formulario (mismo patrón que Warehouse/Suppliers/Transport — sin react-hook-form)
- `is_available` renderizado como Checkbox en formulario, Badge en tabla
- `user` se muestra como `"User #{id}"` o el número simple en la tabla
- `hire_date` se formatea con `toLocaleDateString("es-PE")` en la tabla

---

## 7. Archivos a Crear

| Archivo | Acción |
|---------|--------|
| `services/drivers.ts` | **Crear** — funciones API + TanStack Query hooks |
| `app/(dashboard)/drivers/page.tsx` | **Crear** — página completa con tabla, diálogos, formulario |

No se requiere modificar `types/api.ts` (Driver ya existe — línea 91), ni el layout del sidebar.

---

## 8. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Tipo de formulario | `useState` por campo | Consistencia con módulos existentes (Warehouse, Suppliers, Products, Transport) |
| FK `user` como input numérico | `<Input type="number" min="1">` | No hay endpoint `/users/` en el MVP para poblar un Select; se ingresa ID directamente |
| Display de `user` en tabla | `"User #{id}"` o el número | Indica claramente que es un FK a auth_user; si es null se muestra "—" |
| Badge de disponibilidad | `Badge variant="default"` para disponible, `Badge variant="secondary"` con colores amber para no disponible | Feedback visual inmediato (verde = disponible, ámbar = no disponible) — mismo patrón que Transport |
| `hire_date` como date input | `<Input type="date">` | Navegador renderiza date picker nativo; formato YYYY-MM-DD compatible con backend |
| Formateo de fecha en tabla | `new Date(val).toLocaleDateString("es-PE")` | Formato legible en español peruano (ej: "15/1/2025") |
| Soft-delete | DELETE endpoint + botón Activar | Consistente con Warehouse, Suppliers, Customer, Products, Transport |
| Paginación | Client-side con TanStack Table `getPaginationRowModel` | Backend no usa paginación DRF (mismo patrón) |
| Validación frontend | Solo `license_number` requerido | Consistente con módulos existentes — validación adicional en backend |

---

## 9. Esquema del Formulario (Layout Visual)

```
┌───────────────────────────────────┐
│  Nuevo Conductor                  │
│  Ingresa los datos del nuevo      │
│  conductor                        │
├───────────────────────────────────┤
│  # Licencia *                     │
│  ┌─────────────────────────────┐  │
│  │ LIC-001                      │  │
│  └─────────────────────────────┘  │
│                                   │
│  ID Usuario         Teléfono      │
│  ┌───────────┐  ┌─────────────┐  │
│  │ 2          │  │ +51999000111│  │
│  └───────────┘  └─────────────┘  │
│                                   │
│  Email                            │
│  ┌─────────────────────────────┐  │
│  │ juan@logistica.com          │  │
│  └─────────────────────────────┘  │
│                                   │
│  Fecha Contratación               │
│  ┌─────────────────────────────┐  │
│  │ 2025-01-15  📅              │  │
│  └─────────────────────────────┘  │
│                                   │
│  ☑ Disponible                    │
│                                   │
├───────────────────────────────────┤
│            [Cancelar]  [Crear]    │
└───────────────────────────────────┘
```

**Estado inicial del formulario (create):**
| Campo | Valor inicial |
|-------|---------------|
| license_number | "" |
| user | "" |
| phone | "" |
| email | "" |
| hire_date | "" |
| is_available | true |

**Estado inicial del formulario (edit):**
Se cargan los valores existentes del objeto `Driver`. `user` se carga como string (para el input type number). `is_available` se setea con el valor booleano del backend.

---

## 10. Ejemplo de Flujo Completo

1. Usuario navega a `/drivers`.
2. `useDrivers()` → GET `/api/drivers/` → lista de conductores.
3. Tabla muestra # licencia, usuario, teléfono, email, fecha contratación (formateada), disponibilidad (badge), estado, acciones.
4. Usuario escribe "LIC-00" en búsqueda → tabla filtra client-side por license_number coincidentes.
5. Usuario hace clic en "Nuevo Conductor" → Dialog con formulario.
6. Usuario ingresa `license_number` (obligatorio), opcionalmente ID de usuario, teléfono, email, fecha → Submit.
7. `useCreateDriver()` → POST `/api/drivers/` → toast "Conductor creado exitosamente" → tabla se actualiza.
8. Editar → clic en lápiz → Dialog precargado con valores existentes → PUT `/api/drivers/{id}/`.
9. Eliminar → clic en papelera → confirmación "¿Estás seguro? Esta acción desactivará **{driver.license_number}**." → DELETE `/api/drivers/{id}/` → soft-delete → badge cambia a "Inactivo" + botón "Activar".
10. Activar → clic en "Activar" → PATCH `{ is_active: true }` → badge vuelve a "Activo" + botón "Eliminar" reaparece.
