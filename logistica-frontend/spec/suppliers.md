# Spec: Suppliers

Módulo de gestión de proveedores. CRUD completo + soft-delete.
Misma estructura que Warehouse (MVP: "Misma estructura que Warehouse — Sin FKs, formulario simple").

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/suppliers` | Listado de proveedores | `app/(dashboard)/suppliers/page.tsx` |

Create/edit vía Dialog desde la lista, mismo patrón que Warehouse.

---

## 2. Componentes

### 2.1 Tabla (TanStack Table)

- **Columnas:** name, contact_name, email, phone, address, city, country, is_active (badge), actions
- **Sort:** name, email
- **Filtro:** búsqueda client-side por name/contact_name/email
- **Paginated** con controles de página
- **Acciones:** Editar (lápiz), Activar (verde para inactivos), Eliminar (papelera + confirmación)

### 2.2 Formulario (Dialog)

- **Campos:**
  - `name` — Input (requerido)
  - `contact_name` — Input (opcional)
  - `email` — Input type email (opcional)
  - `phone` — Input (opcional)
  - `address` — Textarea (opcional)
  - `city` — Input (opcional)
  - `country` — Input (opcional)

### 2.3 Botón Activar (filas inactivas)

Mismo patrón que Warehouse — PATCH `{ is_active: true }` + invalidar query.

### 2.4 Confirmación de Eliminación

- Soft-delete (`DELETE /api/suppliers/{id}/`)

---

## 3. API Service

**Archivo:** `services/suppliers.ts`

| Función | Método | URL |
|---------|--------|-----|
| `getSuppliers()` | GET | `/suppliers/` |
| `getSupplier(id)` | GET | `/suppliers/{id}/` |
| `createSupplier(data)` | POST | `/suppliers/` |
| `updateSupplier(id, data)` | PUT | `/suppliers/{id}/` |
| `patchSupplier(id, data)` | PATCH | `/suppliers/{id}/` |
| `deleteSupplier(id)` | DELETE | `/suppliers/{id}/` |

Tipos: usar `Supplier` de `@/types/api`.

---

## 4. TanStack Query Hooks

| Hook | Query Key |
|------|-----------|
| `useSuppliers()` | `["suppliers"]` |
| `useSupplier(id)` | `["suppliers", id]` |
| `useCreateSupplier()` | mutation + invalidate `["suppliers"]` |
| `useUpdateSupplier()` | mutation + invalidate `["suppliers"]` |
| `useActivateSupplier()` | mutation PATCH + invalidate |
| `useDeleteSupplier()` | mutation + invalidate |

---

## 5. Diff con Warehouse

| Concepto | Warehouse | Suppliers |
|----------|-----------|-----------|
| Campo único | `code` (req), `capacity` | `contact_name`, `email`, `phone` |
| Columnas tabla | name, code, address, city, country, capacity | name, contact_name, email, phone, address, city, country |
| Formulario | 6 campos | 7 campos (sin code, con contact/email/phone) |
| Backend endpoint | `/api/warehouses/` | `/api/suppliers/` |
