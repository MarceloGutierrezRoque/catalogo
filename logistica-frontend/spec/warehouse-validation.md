# Spec: Validación Inline en Formulario Warehouse (Dialog)

Agregar validación con helper text al formulario de creación/edición de almacenes dentro del Dialog existente en `app/(dashboard)/warehouses/page.tsx`.

---

## 1. Motivación

Actualmente el formulario valida solo al deshabilitar el botón submit cuando `name` o `code` están vacíos:
```tsx
disabled={!formName || !formCode || isMutating}
```
Esto no muestra al usuario **qué** campo falta ni por qué. Necesitamos errores inline debajo de cada campo, igual que en el formulario de Shipment (`app/(dashboard)/shipments/new/page.tsx` y `app/(dashboard)/shipments/[id]/page.tsx`).

---

## 2. Cambios en el archivo existente

**Archivo a modificar:** `app/(dashboard)/warehouses/page.tsx` (único archivo — el formulario está inline en la página).

No se crean archivos nuevos, no se modifica `services/warehouse.ts`.

---

## 3. Interface `FormErrors`

Agregar **localmente** en el componente (no en `types/api.ts`), justo antes de la definición del componente `WarehousesPage`:

```typescript
interface FormErrors {
  name?: string
  code?: string
  address?: string
  city?: string
  country?: string
  capacity?: string
}
```

Cada clave opcional → `string` con el mensaje de error en español.

---

## 4. Estado `errors`

Agregar junto al resto de `useState` del formulario (línea ~66):

```typescript
const [errors, setErrors] = useState<FormErrors>({})
```

Estado inicial vacío. Se puebla al hacer submit (vía `validate()`) y se limpia por campo (vía `clearError()`).

---

## 5. Función `validate()`

Agregar antes de `handleSubmit` (después de las funciones de diálogo, ~línea 220):

```typescript
function validate(): FormErrors {
  const errs: FormErrors = {}
  if (!formName.trim()) errs.name = "El nombre es obligatorio"
  if (!formCode.trim()) errs.code = "El código es obligatorio"
  if (formCapacity && (isNaN(Number(formCapacity)) || Number(formCapacity) < 0)) {
    errs.capacity = "La capacidad debe ser un número positivo"
  }
  return errs
}
```

**Reglas de validación por campo:**

| Campo | Regla | Mensaje |
|-------|-------|---------|
| `name` | Requerido, no vacío (trim) | `"El nombre es obligatorio"` |
| `code` | Requerido, no vacío (trim) | `"El código es obligatorio"` |
| `address` | Opcional — sin validación | — |
| `city` | Opcional — sin validación | — |
| `country` | Opcional — sin validación | — |
| `capacity` | Opcional — si tiene valor, debe ser número >= 0 | `"La capacidad debe ser un número positivo"` |

---

## 6. Función `clearError()`

Agregar junto a `validate()`:

```typescript
function clearError(field: keyof FormErrors) {
  setErrors((prev) => ({ ...prev, [field]: undefined }))
}
```

---

## 7. Modificar `handleSubmit()` existente

**Antes** (~línea 221):
```typescript
function handleSubmit() {
  const payload = { ... }
  if (editingWarehouse) {
    updateMutation.mutate(..., { onSuccess: ... })
  } else {
    createMutation.mutate(..., { onSuccess: ... })
  }
}
```

**Después:**
```typescript
function handleSubmit() {
  const errs = validate()
  setErrors(errs)
  if (Object.keys(errs).length > 0) return

  const payload = { ... }
  if (editingWarehouse) {
    updateMutation.mutate(..., { onSuccess: () => setDialogOpen(false) })
  } else {
    createMutation.mutate(..., { onSuccess: () => setDialogOpen(false) })
  }
}
```

El `return` temprano evita el envío si hay errores.

---

## 8. Modificar `openCreateDialog()` y `openEditDialog()`

Agregar `setErrors({})` al inicio de ambas funciones para limpiar errores al abrir el diálogo:

```typescript
function openCreateDialog() {
  setErrors({})
  setEditingWarehouse(null)
  // ... reset form fields ...
  setDialogOpen(true)
}

function openEditDialog(warehouse: Warehouse) {
  setErrors({})
  setEditingWarehouse(warehouse)
  // ... set form fields ...
  setDialogOpen(true)
}
```

---

## 9. Agregar helper text en JSX

Cada `div.space-y-2` que contiene un campo debe tener:

1. `onChange` del `Input` → llamar `clearError("fieldName")`
2. `<p className="text-sm text-destructive">` condicional debajo del Input

### 9.1 Campo `name`

```tsx
<div className="space-y-2">
  <Label htmlFor="name">
    Nombre <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    value={formName}
    onChange={(e) => {
      setFormName(e.target.value)
      clearError("name")
    }}
    placeholder="Almacén Central"
    required
  />
  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
</div>
```

### 9.2 Campo `code`

```tsx
<div className="space-y-2">
  <Label htmlFor="code">
    Código <span className="text-destructive">*</span>
  </Label>
  <Input
    id="code"
    value={formCode}
    onChange={(e) => {
      setFormCode(e.target.value)
      clearError("code")
    }}
    placeholder="ALC-001"
    required
  />
  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
</div>
```

### 9.3 Campo `address`

```tsx
<div className="space-y-2">
  <Label htmlFor="address">Dirección</Label>
  <Input
    id="address"
    value={formAddress}
    onChange={(e) => {
      setFormAddress(e.target.value)
      clearError("address")
    }}
    placeholder="Av. Siempre Viva 123"
  />
  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
</div>
```

### 9.4 Campo `city`

```tsx
<div className="space-y-2">
  <Label htmlFor="city">Ciudad</Label>
  <Input
    id="city"
    value={formCity}
    onChange={(e) => {
      setFormCity(e.target.value)
      clearError("city")
    }}
    placeholder="Lima"
  />
  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
</div>
```

### 9.5 Campo `country`

```tsx
<div className="space-y-2">
  <Label htmlFor="country">País</Label>
  <Input
    id="country"
    value={formCountry}
    onChange={(e) => {
      setFormCountry(e.target.value)
      clearError("country")
    }}
    placeholder="Perú"
  />
  {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
</div>
```

### 9.6 Campo `capacity`

```tsx
<div className="space-y-2">
  <Label htmlFor="capacity">Capacidad</Label>
  <Input
    id="capacity"
    type="number"
    value={formCapacity}
    onChange={(e) => {
      setFormCapacity(e.target.value)
      clearError("capacity")
    }}
    placeholder="5000"
  />
  {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
</div>
```

---

## 10. Botón Submit

**Antes:**
```tsx
disabled={!formName || !formCode || isMutating}
```

**Después:**
```tsx
disabled={isMutating}
```

La validación ahora se maneja en `handleSubmit()` vía `validate()`. Ya no es necesario deshabilitar el botón por campos vacíos. El usuario llena el formulario, hace clic en submit, y ve qué campos faltan.

---

## 11. Resumen de cambios

| Elemento | Archivo | Cambio |
|----------|---------|--------|
| `interface FormErrors` | `page.tsx` | Agregar antes del componente |
| `const [errors, setErrors]` | `page.tsx` | Agregar en sección de form state |
| `function validate()` | `page.tsx` | Agregar antes de `handleSubmit` |
| `function clearError()` | `page.tsx` | Agregar junto a `validate` |
| `handleSubmit()` | `page.tsx` | Validar antes de enviar, `return` si hay errores |
| `openCreateDialog()` | `page.tsx` | Agregar `setErrors({})` |
| `openEditDialog()` | `page.tsx` | Agregar `setErrors({})` |
| 6 campos × `onChange` | `page.tsx` | Agregar `clearError("field")` en cada onChange |
| 6 campos × helper text | `page.tsx` | Agregar `<p className="text-sm text-destructive">` debajo de cada Input |
| Botón submit `disabled` | `page.tsx` | Cambiar de `!formName || !formCode || isMutating` a solo `isMutating` |

**Archivos afectados:** solo `app/(dashboard)/warehouses/page.tsx`.

---

## 12. Comportamiento esperado

1. Usuario abre el Dialog (crear o editar)
2. No hay errores visibles inicialmente (`errors = {}`)
3. Usuario hace clic en "Crear" / "Actualizar" sin llenar campos requeridos → validate() ejecuta → errores aparecen debajo de cada campo como texto rojo (`text-destructive`)
4. Usuario empieza a escribir en un campo → `clearError("campo")` limpia el error de ese campo inmediatamente
5. Usuario vuelve a hacer clic en submit → validate() ejecuta de nuevo → si todo OK, envía el formulario
6. Al cerrar y volver a abrir el Dialog → `setErrors({})` limpia todos los errores

---

## 13. Patrón Shipment (referencia)

Este spec sigue exactamente el mismo patrón implementado en:

- `app/(dashboard)/shipments/new/page.tsx` (líneas 43–51, 90, 94–108, 135–138, más bloques JSX)
- `app/(dashboard)/shipments/[id]/page.tsx` (líneas 48–56, 117, 121–136, 170–173, más bloques JSX)

La única diferencia es que Warehouse usa campos tipo `Input` (no `Select` ni `Textarea`), por lo que el patrón es más simple.
