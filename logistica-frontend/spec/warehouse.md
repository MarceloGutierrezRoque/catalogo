# Spec: Warehouse

Módulo de gestión de almacenes. CRUD completo + soft-delete.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/warehouses` | Listado de almacenes | `app/(dashboard)/warehouses/page.tsx` |
| Creación y edición en un mismo Dialog/modal desde la lista | — |

No hay página de detalle separada — create/edit vía Dialog reutilizable.

---

## 2. Componentes

### 2.1 Tabla (TanStack Table)

- **Columnas:** name, code, address, city, country, capacity, is_active (badge), created_at, actions
- **Sort:** name, code, capacity, created_at
- **Filtro:** búsqueda por texto en name/code (client-side filter)
- **Paginated** con controles de página
- **Acciones por fila:** Editar (icono lápiz), Eliminar (icono papelera + confirmación)

### 2.2 Formulario (Dialog)

- **Modo creación:** Dialog con botón "Nuevo Almacén" arriba de la tabla
- **Modo edición:** Dialog al hacer clic en Editar de una fila
- **Campos:**
  - `name` — Input (requerido)
  - `code` — Input (requerido)
  - `address` — Textarea (opcional)
  - `city` — Input (opcional)
  - `country` — Input (opcional)
  - `capacity` — Input type number (opcional)
- **Submit:** POST para crear, PUT para editar
- **Validación:** name y code requeridos en frontend

### 2.3 Botón Activar (filas inactivas)

- Para almacenes con `is_active: false`, mostrar botón "Activar" (verde) en lugar de Eliminar
- Al hacer clic → PATCH `/api/warehouses/{id}/` con `{ is_active: true }`
- Invalida query `["warehouses"]` + toast "Almacén activado exitosamente"

### 2.4 Confirmación de Eliminación

- AlertDialog con mensaje: "¿Estás seguro de eliminar el almacén {name}?"
- Delete → soft-delete (`DELETE /api/warehouses/{id}/`)

---

## 3. API Service

**Archivo:** `services/warehouse.ts`

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getWarehouses()` | GET | `/warehouses/` | — |
| `getWarehouse(id)` | GET | `/warehouses/{id}/` | — |
| `createWarehouse(data)` | POST | `/warehouses/` | Warehouse fields |
| `updateWarehouse(id, data)` | PUT | `/warehouses/{id}/` | Warehouse fields |
| `deleteWarehouse(id)` | DELETE | `/warehouses/{id}/` | — |

Tipos: usar `Warehouse` de `@/types/api`.

---

## 4. TanStack Query Hooks

**Archivo:** `services/warehouse.ts` (mismo archivo, hooks al final)

| Hook | Query Key | Uso |
|------|-----------|-----|
| `useWarehouses()` | `["warehouses"]` | Listar todos (GET) |
| `useWarehouse(id)` | `["warehouses", id]` | Detalle (GET) |
| `useCreateWarehouse()` | mutation | POST + invalida `["warehouses"]` |
| `useUpdateWarehouse()` | mutation | PUT + invalida `["warehouses"]` |
| `useDeleteWarehouse()` | mutation | DELETE + invalida `["warehouses"]` |

---

## 5. Store

No necesario — TanStack Query cache es suficiente.

---

## 6. Layout / Sidebar

El sidebar ya tiene el link `/warehouses` con icono `Warehouse` y label "Almacenes" — **listo del módulo Auth**.

---

## 7. Convenciones

- `"use client"` en todos los componentes con hooks
- `ColumnDef<Warehouse>` para tipado de columnas
- Toast de éxito/error después de cada mutación
- Loading skeleton en tabla mientras carga (opcional)
- Error boundary para la página
