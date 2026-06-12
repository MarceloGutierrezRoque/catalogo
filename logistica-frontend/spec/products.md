# Spec: Products

Módulo de gestión de productos. CRUD completo + soft-delete. FK a Supplier y Warehouse.

---

## 1. Páginas / Rutas

| Ruta | Página | Archivo |
|------|--------|---------|
| `/products` | Listado de productos | `app/(dashboard)/products/page.tsx` |

Create/edit vía Dialog desde la lista, mismo patrón que Warehouse y Suppliers. No hay página de detalle separada.

---

## 2. Data Types

### 2.1 Actualizar `Product` en `types/api.ts`

El tipo actual `Product` tiene `supplier: number` y `warehouse: number`. En GET responses, el backend devuelve estos campos como **objetos expandidos** (con `select_related`):

```json
{
  "id": 1,
  "name": "Laptop Gamer X1",
  "supplier": { "id": 1, "name": "TecnoSupply S.A." },
  "warehouse": { "id": 1, "name": "Almacén Central" }
}
```

Se recomienda actualizar `Product` para que ambos FKs sean **uniables** (`number | objeto mínimo`):

```typescript
export interface Product {
  id: number
  name: string
  sku: string
  description: string | null
  category: string | null
  brand: string | null
  unit_price: string | null
  weight: string | null
  dimensions: string | null
  stock_quantity: number
  min_stock_level: number
  supplier: number | { id: number; name: string }
  warehouse: number | { id: number; name: string }
  is_active: boolean
  created_at: string
  updated_at: string
}
```

De esta forma:
- En la tabla se accede a `supplier.name` / `warehouse.name` (con chequeo de tipo).
- En el formulario se envía `supplier: number` y `warehouse: number` explícitamente.

### 2.2 Helper de display (opcional pero recomendado)

Dentro de la página, crear helpers inline:

```typescript
function supplierName(p: Product): string {
  return typeof p.supplier === "object" ? p.supplier.name : "—"
}

function warehouseName(p: Product): string {
  return typeof p.warehouse === "object" ? p.warehouse.name : "—"
}
```

---

## 3. API Service

**Archivo nuevo:** `services/products.ts`

Mismo patrón que `services/warehouse.ts` y `services/suppliers.ts`.

### 3.1 Funciones API

| Función | Método | URL | Body |
|---------|--------|-----|------|
| `getProducts()` | GET | `/products/` | — |
| `getProduct(id)` | GET | `/products/{id}/` | — |
| `createProduct(data)` | POST | `/products/` | Product fields (FKs como integers) |
| `updateProduct(id, data)` | PUT | `/products/{id}/` | Product fields (FKs como integers) |
| `deleteProduct(id)` | DELETE | `/products/{id}/` | — |

Nota: `getProducts()` debe manejar que el backend no usa paginación por defecto — retorna array plano. Usar el mismo patrón que Warehouse (`Array.isArray` check por si acaso):

```typescript
export function getProducts() {
  return api.get<Product[]>("/products/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}
```

### 3.2 TanStack Query Hooks

| Hook | Query Key | Descripción |
|------|-----------|-------------|
| `useProducts()` | `["products"]` | Listar todos (GET) |
| `useProduct(id)` | `["products", id]` | Detalle (GET) — `enabled: !!id` |
| `useCreateProduct()` | mutation | POST + invalida `["products"]` |
| `useUpdateProduct()` | mutation | PUT + invalida `["products"]` |
| `useDeleteProduct()` | mutation | DELETE + invalida `["products"]` |

Cada hook sigue el mismo patrón: `onSuccess` invalida queryKey `["products"]` y muestra toast de éxito. `onError` muestra toast de error.

No se necesita `useActivateProduct` por ahora (a menos que el MVP lo requiera explícitamente). Si se necesita en el futuro, se agrega un PATCH con `{ is_active: true }`.

---

## 4. UI Page

**Archivo:** `app/(dashboard)/products/page.tsx`

Sigue exactamente el mismo patrón que `warehouses/page.tsx` y `suppliers/page.tsx`:
- `"use client"`
- Estado de tabla: `sorting`, `globalFilter`
- Estado de diálogo: `dialogOpen`, `editingProduct`, `deleteTarget`
- Estado de formulario: un `useState` por campo

### 4.1 Tabla (TanStack Table)

**Columnas visibles:**

| Columna | accessorKey | Detalles |
|---------|-------------|----------|
| Nombre | `name` | Sortable |
| SKU | `sku` | Sortable |
| Categoría | `category` | Mostrar `—` si es null |
| Proveedor | *custom* | Mostrar `supplierName(p)` (helper) |
| Almacén | *custom* | Mostrar `warehouseName(p)` (helper) |
| Stock | `stock_quantity` | Badge: **rojo** si `stock_quantity < min_stock_level`, **verde** si tiene stock OK, **amarillo** si está cerca del mínimo |
| Precio | `unit_price` | Formateado como moneda (`S/ 4,999.99`). Usar `Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" })` |
| Estado | `is_active` | Badge "Activo" / "Inactivo" (igual que Warehouse) |
| Acciones | *actions* | Editar (lápiz), Eliminar (papelera + confirmación) / Activar (verde) |

**Columnas custom** (Proveedor, Almacén):
```typescript
{
  id: "supplier_name",
  header: "Proveedor",
  cell: ({ row }) => supplierName(row.original),
}
```

**Filtro:** búsqueda client-side por nombre, SKU, categoría (usa `globalFilter` de TanStack Table).

**Paginación:** 10 items por página, controles "Anterior" / "Siguiente".

**Sort:** name, sku, stock_quantity, unit_price.

**Acciones:**
- Editar → abre Dialog en modo edición
- Eliminar (si `is_active === true`) → abre confirmación de eliminación (soft-delete)
- Activar (si `is_active === false`) → PATCH `{ is_active: true }`

### 4.2 Formulario (Dialog)

**Campos del formulario:**

| Campo | Tipo | Requerido | Observaciones |
|-------|------|-----------|---------------|
| `name` | Input | Sí | — |
| `sku` | Input | Sí | Código único del producto |
| `description` | Textarea | No | — |
| `category` | Input | No | — |
| `brand` | Input | No | — |
| `unit_price` | Input type="number" step="0.01" | No | — |
| `weight` | Input type="number" step="0.001" | No | — |
| `dimensions` | Input | No | Ej: "35x25x2" |
| `stock_quantity` | Input type="number" | No | Por defecto 0 |
| `min_stock_level` | Input type="number" | No | Por defecto 0 |
| `supplier` | Select (combobox) | No | Cargar opciones con `useSuppliers()` |
| `warehouse` | Select (combobox) | No | Cargar opciones con `useWarehouses()` |

**Select de Supplier y Warehouse:**

- Usar el hook `useSuppliers()` de `@/services/suppliers` para obtener la lista de proveedores.
- Usar el hook `useWarehouses()` de `@/services/warehouse` para obtener la lista de almacenes.
- Renderizar un `<select>` nativo o un shadcn `<Select>` con las opciones.
- Cada opción muestra el `name` del proveedor/almacén y el `value` es su `id`.
- Incluir una opción por defecto "Seleccionar..." con value vacío.

**Payload para submit:**

```typescript
const payload = {
  name: formName,
  sku: formSku,
  description: formDescription || null,
  category: formCategory || null,
  brand: formBrand || null,
  unit_price: formUnitPrice || null,
  weight: formWeight || null,
  dimensions: formDimensions || null,
  stock_quantity: formStockQuantity ? Number(formStockQuantity) : 0,
  min_stock_level: formMinStock ? Number(formMinStock) : 0,
  supplier: formSupplier ? Number(formSupplier) : null,
  warehouse: formWarehouse ? Number(formWarehouse) : null,
}
```

**Validación:** `name` y `sku` requeridos en frontend. Botón de submit deshabilitado si faltan.

### 4.3 Stock Badge

Celda especial para `stock_quantity` que muestre un badge de color según la relación con `min_stock_level`:

| Condición | Color |
|-----------|-------|
| `stock_quantity === 0` | `destructive` (rojo) — "Sin stock" |
| `stock_quantity <= min_stock_level` | `warning` / amber (amarillo) — "Stock bajo" |
| `stock_quantity > min_stock_level` | `success` / verde — "En stock" o solo el número |

Usar un badge condicional:

```typescript
function StockBadge({ product }: { product: Product }) {
  const qty = product.stock_quantity
  const min = product.min_stock_level
  let variant: "destructive" | "secondary" | "outline" = "outline"
  let label = `${qty} unidades`

  if (qty === 0) {
    variant = "destructive"
    label = "Sin stock"
  } else if (qty <= min) {
    variant = "secondary"
    label = `${qty} — Stock bajo`
  }

  return <Badge variant={variant}>{label}</Badge>
}
```

### 4.4 Formato de Precio

Usar `Intl.NumberFormat` para dar formato al precio:

```typescript
function formatPrice(price: string | null): string {
  if (!price) return "—"
  const n = Number.parseFloat(price)
  if (isNaN(n)) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n)
}
```

### 4.5 Confirmación de Eliminación

- Soft-delete (`DELETE /api/products/{id}/`)
- AlertDialog con mensaje: "¿Estás seguro? Esta acción desactivará **{product.name}**."
- Mismo patrón que Warehouse.

### 4.6 Estados de Carga y Error

- **Loading:** `<Loader2>` animado + texto "Cargando productos…"
- **Error:** Icono de error + texto "Error al cargar productos" + botón "Reintentar"
- **Empty:** "No hay productos registrados" con sugerencia de crear uno
- **Empty con filtro:** "No se encontraron resultados" con sugerencia de cambiar búsqueda

---

## 5. Store

No necesario — TanStack Query cache es suficiente. Los datos de Suppliers y Warehouse se cargan con sus propios hooks y se cachean independientemente.

---

## 6. Layout / Sidebar

El sidebar **ya incluye** el link `/products` con icono `Package` y label "Productos" (ver `layout.tsx` línea 30). No se requiere modificación.

---

## 7. Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `types/api.ts` | **Modificar** — actualizar `Product.supplier` y `Product.warehouse` a tipo unión `number \| { id: number; name: string }` |
| `services/products.ts` | **Crear** — funciones API + TanStack Query hooks |
| `app/(dashboard)/products/page.tsx` | **Crear** — página completa con tabla, diálogos, formulario |

No se requiere modificar el layout del sidebar.

---

## 8. Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Tipo de FK en Product | `number \| { id: number; name: string }` | GET devuelve objetos expandidos; POST/PUT envía integers. La unión permite ambos sin romper tipos. |
| Select de FK en formulario | `<select>` nativo o shadcn `<Select>` con opciones de `useSuppliers()` / `useWarehouses()` | Reutiliza hooks existentes; evita duplicar lógica de carga. |
| Formato de precio | `Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" })` | Estándar del navegador, sin librerías adicionales. |
| Stock badge | Badge condicional según `stock_quantity` vs `min_stock_level` | Feedback visual inmediato sobre estado de inventario. |
| Estado del formulario | `useState` por campo (mismo patrón que Warehouse/Suppliers) | Consistencia con módulos existentes; evita agregar react-hook-form. |
| Paginación | Client-side con TanStack Table `getPaginationRowModel` | Backend no usa paginación DRF. |
| Soft-delete | `DELETE` endpoint + mostrar botón "Activar" en filas inactivas | Consistente con Warehouse y Suppliers. |

---

## 9. Ejemplo de Flujo Completo

1. Usuario navega a `/products`.
2. `useProducts()` → GET `/api/products/` → lista de productos con `supplier` y `warehouse` como objetos expandidos.
3. `useSuppliers()` y `useWarehouses()` se ejecutan en paralelo (cacheados 5 min).
4. Tabla muestra nombre, SKU, categoría, proveedor (columna custom), almacén (columna custom), stock (badge), precio (formateado), estado, acciones.
5. Usuario hace clic en "Nuevo Producto" → Dialog con formulario.
6. Selects de proveedor y almacén poblados desde cache.
7. Submit → POST `/api/products/` con FKs como integers → invalida `["products"]` → tabla se actualiza.
8. Editar → PUT `/api/products/{id}/` → mismo formulario precargado.
9. Eliminar → DELETE `/api/products/{id}/` → soft-delete → badge cambia a "Inactivo".
10. Activar → PATCH (si se implementa) o no aplica (soft-delete con DELETE endpoint como Warehouse).
