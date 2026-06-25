# Spec: Orders — Formulario Público de Pedidos

## 1. Resumen del módulo

Formulario público (`/order`) donde clientes crean pedidos seleccionando peluches del catálogo activo. Corresponde a la **Fase 5** del MVP.

**Sin autenticación.** Usa `POST /api/orders/` (AllowAny).

### Flujo de usuario

1. Usuario navega el catálogo público (`/plushies`)
2. Desde la navbar o CTA, va a `/order`
3. Llena datos del cliente (nombre, email, teléfono)
4. Agrega items: selecciona peluche + cantidad (mín. 1 item)
5. Opcional: observaciones
6. Envía → si éxito, ve resumen del pedido
7. Si error, ve mensaje con opción de reintentar

---

## 2. Archivos a crear

| #  | Ruta | Propósito |
|----|------|-----------|
| 1  | `app/order/page.tsx` | Página pública del formulario |
| 2  | `services/orders.ts` | API service: `createOrder()` |
| 3  | `hooks/use-orders.ts` | TanStack Query hook: `useCreateOrder()` |
| 4  | `components/orders/order-form.tsx` | Formulario con items dinámicos |
| 5  | `components/orders/order-success.tsx` | Resumen post-creación |

---

## 3. Archivos a modificar

| #  | Ruta | Cambio |
|----|------|--------|
| 1  | `components/public/navbar.tsx` | Agregar link "Pedido" → `/order` |

---

## 4. Detalle de cada archivo

### 4.1 `services/orders.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { Order, OrderCreatePayload } from "@/types/api";

export async function createOrder(payload: OrderCreatePayload): Promise<Order> {
  const { data } = await api.post<Order>("/api/orders/", payload);
  return data;
}
```

**Nota:** Sin autenticación, el interceptor JWT no agrega token. `api` es la instancia pública de Axios.

### 4.2 `hooks/use-orders.ts` — TanStack Query Hook

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrder } from "@/services/orders";
import type { OrderCreatePayload } from "@/types/api";

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => createOrder(payload),
    onError: (error: Error) => {
      const err = error as { response?: { data?: Record<string, string | string[]> } };
      // Intentar extraer mensaje de error del backend
      const data = err?.response?.data;
      let message = "Error al crear el pedido. Intenta nuevamente.";

      if (data) {
        if (typeof data === "string") {
          message = data;
        } else if (Array.isArray(data)) {
          message = data.join(", ");
        } else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          message = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
        }
      }

      toast.error(message);
    },
  });
}
```

**Nota:** No hay `onSuccess` toast porque el componente maneja el éxito mostrando el resumen (no hay queries que invalidar ya que es solo creación).

### 4.3 `app/order/page.tsx` — Página del formulario

```tsx
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { OrderForm } from "@/components/orders/order-form";

export default function OrderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <OrderForm />
      </main>
      <Footer />
    </div>
  );
}
```

### 4.4 `components/orders/order-form.tsx` — Formulario principal

Componente cliente complejo. Estados:

- **IDLE** → formulario listo para llenar
- **LOADING** → enviando (botón deshabilitado + spinner)
- **SUCCESS** → pedido creado, mostrar `<OrderSuccess />`
- **ERROR** → mensaje de error + botón reintentar

#### Schema Zod (`orderSchema`)

```typescript
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePlushies } from "@/hooks/use-plushies";
import { useCreateOrder } from "@/hooks/use-orders";
import { OrderSuccess } from "@/components/orders/order-success";
import type { Order } from "@/types/api";

// Schema de validación
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;

const orderItemSchema = z.object({
  plushie_id: z.number({ required_error: "Selecciona un peluche" })
    .positive("Selecciona un peluche"),
  quantity: z.number({ required_error: "Cantidad requerida" })
    .int("Debe ser entero")
    .min(1, "Mínimo 1 unidad"),
});

const orderSchema = z.object({
  customer_name: z.string().min(1, "El nombre es requerido"),
  customer_email: z.string()
    .min(1, "El email es requerido")
    .regex(emailRegex, "Email inválido"),
  customer_phone: z.string()
    .min(1, "El teléfono es requerido")
    .regex(phoneRegex, "Teléfono inválido (mín. 7 dígitos)"),
  observations: z.string().optional(),
  items: z.array(orderItemSchema)
    .min(1, "Agrega al menos un producto"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm() {
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar catálogo de peluches para el select
  const { data: plushiesData, isLoading: plushiesLoading } = usePlushies();

  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  // Tendremos acceso a los peluches activos
  const plushies = plushiesData?.results ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      observations: "",
      items: [{ plushie_id: undefined as unknown as number, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch items para validar stock en tiempo real
  const watchedItems = watch("items");

  const getPlushieStock = (plushieId: number | undefined): number => {
    if (!plushieId) return 0;
    const plushie = plushies.find((p) => p.id === plushieId);
    return plushie?.stock ?? 0;
  };

  const getPlushiePrice = (plushieId: number | undefined): string => {
    if (!plushieId) return "";
    const plushie = plushies.find((p) => p.id === plushieId);
    return plushie?.price ?? "";
  };

  const onSubmit = async (values: OrderFormValues) => {
    setErrorMessage(null);
    try {
      const result = await createOrder({
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone,
        observations: values.observations || undefined,
        items: values.items.map((item) => ({
          plushie_id: item.plushie_id,
          quantity: item.quantity,
        })),
      });
      setOrderResult(result);
    } catch {
      setErrorMessage("No se pudo crear el pedido. Revisa los datos e intenta nuevamente.");
    }
  };

  // Pantalla de éxito
  if (orderResult) {
    return <OrderSuccess order={orderResult} onNewOrder={() => { reset(); setOrderResult(null); }} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Hacer pedido</h1>
      <p className="text-muted-foreground mb-8">
        Completa tus datos y selecciona los peluches que deseas
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ---- Datos del cliente ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tus datos</CardTitle>
            <CardDescription>
              Te contactaremos a este email o teléfono
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="customer_name">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customer_name"
                placeholder="Ej: María García"
                {...register("customer_name")}
              />
              {errors.customer_name && (
                <p className="text-sm text-destructive">{errors.customer_name.message}</p>
              )}
            </div>

            {/* Email y Teléfono en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="maria@email.com"
                  {...register("customer_email")}
                />
                {errors.customer_email && (
                  <p className="text-sm text-destructive">{errors.customer_email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  placeholder="+51 999 888 777"
                  {...register("customer_phone")}
                />
                {errors.customer_phone && (
                  <p className="text-sm text-destructive">{errors.customer_phone.message}</p>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                placeholder="Ej: Entregar en la tarde, horario sugerido..."
                rows={3}
                {...register("observations")}
              />
              {errors.observations && (
                <p className="text-sm text-destructive">{errors.observations.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ---- Items del pedido ---- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Productos</CardTitle>
              <CardDescription>
                Selecciona los peluches y sus cantidades
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const selectedPlushieId = watchedItems?.[index]?.plushie_id;
              const stock = getPlushieStock(selectedPlushieId);
              const price = getPlushiePrice(selectedPlushieId);
              const quantity = watchedItems?.[index]?.quantity ?? 1;

              return (
                <div key={field.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 space-y-2">
                    {/* Selector de peluche */}
                    <div className="space-y-1">
                      <Label htmlFor={`items.${index}.plushie_id`}>
                        Peluche <span className="text-destructive">*</span>
                      </Label>
                      {/* Usar un select nativo envuelto para mejor compatibilidad con react-hook-form.
                          Alternativa: usar Select de shadcn via setValue manual. */}
                      <select
                        id={`items.${index}.plushie_id`}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedPlushieId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue(`items.${index}.plushie_id`, val ? Number(val) : undefined as unknown as number, { shouldValidate: true });
                        }}
                      >
                        <option value="" disabled>
                          {plushiesLoading ? "Cargando..." : "Seleccionar peluche"}
                        </option>
                        {plushies.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock === 0}>
                            {p.name} — S/ {p.price} {p.stock === 0 ? "(Agotado)" : `(Stock: ${p.stock})`}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.plushie_id && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.plushie_id?.message}
                        </p>
                      )}
                      {/* Precio del seleccionado */}
                      {selectedPlushieId && price && (
                        <p className="text-xs text-muted-foreground">
                          Precio unitario: S/ {price}
                        </p>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-1">
                      <Label htmlFor={`items.${index}.quantity`}>
                        Cantidad <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`items.${index}.quantity`}
                        type="number"
                        min={1}
                        max={stock > 0 ? stock : 1}
                        placeholder="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                      {selectedPlushieId && quantity > stock && stock > 0 && (
                        <p className="text-sm text-destructive">
                          Stock disponible: {stock} unidades
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón eliminar item */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Botón agregar item */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ plushie_id: undefined as unknown as number, quantity: 1 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar producto
            </Button>

            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* ---- Error message ---- */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error al crear el pedido</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ---- Submit ---- */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isPending ? "Enviando pedido..." : "Crear pedido"}
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href="/plushies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al catálogo
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
```

**Notas de implementación:**

- Se usa `<select>` nativo en lugar del `Select` de shadcn/base-ui porque `react-hook-form` con `useFieldArray` se integra más limpiamente con inputs nativos. Si se prefiere el `Select` de shadcn, se debe usar `setValue` + `onValueChange` y manejar el valor como string.
- El `valueAsNumber: true` en `register` convierte automáticamente el string del input a número.
- La validación de stock > cantidad se hace en tiempo real con `watch`.
- `append` agrega un nuevo item con valores por defecto.
- `remove` elimina un item (mínimo 1 item, se bloquea botón si `fields.length <= 1`).

### 4.5 `components/orders/order-success.tsx` — Resumen de pedido creado

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShoppingBag, ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/types/api";

interface OrderSuccessProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderSuccess({ order, onNewOrder }: OrderSuccessProps) {
  const total = order.items?.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  ) ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">¡Pedido creado!</h1>
        <p className="text-muted-foreground mt-2">
          Hemos recibido tu solicitud. Te contactaremos pronto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Resumen del pedido #{order.id}
          </CardTitle>
          <CardDescription>
            Creado el {new Date(order.created_at).toLocaleDateString("es-PE", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Datos del cliente */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nombre:</span>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{order.customer_email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Teléfono:</span>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <Badge variant="secondary" className="mt-0.5">
                {order.status === "pending" ? "Pendiente" : order.status}
              </Badge>
            </div>
          </div>

          {order.observations && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observaciones:</span>
              <p className="mt-1">{order.observations}</p>
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Productos solicitados</h3>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{item.plushie_name}</p>
                    <p className="text-muted-foreground">
                      S/ {item.unit_price} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    S/ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-bold pt-3 border-t mt-3">
              <span>Total estimado</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Button onClick={onNewOrder} variant="outline">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Nuevo pedido
        </Button>
        <Button asChild>
          <Link href="/plushies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

### 4.6 `components/public/navbar.tsx` — Modificación

Agregar link "Pedido" al array `navLinks`:

```typescript
const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/plushies", label: "Catálogo" },
  { href: "/order", label: "Pedido" },  // ← NUEVO
];
```

**Nota:** Solo se modifica el array `navLinks`. El resto del componente no cambia.

---

## 5. Reglas de negocio y validaciones

### 5.1 Validaciones frontend (Zod)

| Campo | Regla | Mensaje |
|-------|-------|---------|
| `customer_name` | Requerido, string no vacío | "El nombre es requerido" |
| `customer_email` | Requerido, formato email válido | "Email inválido" |
| `customer_phone` | Requerido, 7-15 caracteres (dígitos, espacios, +, -, (, )) | "Teléfono inválido (mín. 7 dígitos)" |
| `observations` | Opcional, string | — |
| `items` | Array mínimo 1 elemento | "Agrega al menos un producto" |
| `items[].plushie_id` | Requerido, número positivo | "Selecciona un peluche" |
| `items[].quantity` | Requerido, entero ≥ 1 | "Mínimo 1 unidad" / "Debe ser entero" |

### 5.2 Validaciones en tiempo real (adicionales a Zod)

| Validación | Implementación |
|------------|----------------|
| Cantidad ≤ stock | `watch` items → comparar con `plushie.stock`. Si `quantity > stock`, mostrar mensaje rojo "Stock disponible: N unidades" |
| Item sin stock | Opción deshabilitada en el select (prop `disabled` en `<option>`) |
| Mín. 1 item | Botón eliminar oculto si `fields.length <= 1` |

### 5.3 Reglas de negocio

| Regla | Detalle |
|-------|---------|
| Solo peluches activos | Backend filtra; `usePlushies` solo trae activos |
| Precio congelado al crear | Backend copia `plushie.price` → `order_item.unit_price` |
| Stock no se descuenta al crear | Backend solo valida stock ≥ cantidad, no descuenta (el admin gestiona stock manualmente) |
| Estado inicial | Backend asigna `pending` automáticamente |
| Sin auth | `POST /api/orders/` es AllowAny |

---

## 6. Flujo de navegación

```
[/] Landing
  └── Navbar "Pedido" → [/order]

[/plushies] Catálogo
  ├── Navbar "Pedido" → [/order]
  └── Footer / Navbar "Inicio" → [/]

[/order] Formulario de pedido
  ├── Submit exitoso → [Resumen del pedido]
  │   ├── "Nuevo pedido" → [/order] (formulario limpio)
  │   └── "Volver al catálogo" → [/plushies]
  ├── Submit error → [Mensaje de error + botón reintentar]
  └── "Volver al catálogo" → [/plushies]
```

---

## 7. Componentes shadcn/ui adicionales necesarios

| Componente | ¿Ya existe? | Notas |
|------------|-------------|-------|
| `badge` | ✅ Sí | Para estado del pedido |
| `button` | ✅ Sí | — |
| `card` | ✅ Sí | — |
| `input` | ✅ Sí | — |
| `label` | ✅ Sí | — |
| `select` | ✅ Sí | No se usa en el spec (se prefiere select nativo por fieldArray). Si se prefiere usar, está disponible. |
| `textarea` | ✅ Sí | — |

**Íconos lucide-react necesarios:**
- `Loader2` — spinner de carga
- `Plus` — agregar item
- `Trash2` — eliminar item
- `ShoppingCart` — botón submit
- `CheckCircle2` — éxito
- `AlertCircle` — error
- `RefreshCw` — reintentar
- `ArrowLeft` — volver
- `ClipboardList` — resumen
- `ShoppingBag` — nuevo pedido

---

## 8. Estructura de estados del componente OrderForm

```
┌─────────────────────────────────────┐
│           OrderForm                  │
│                                     │
│  ┌─ plushiesLoading ─────────────┐  │
│  │  Select muestra "Cargando..." │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ form (IDLE) ────────────────┐  │
│  │  Todos los campos editables   │  │
│  │  Botón "Crear pedido" activo  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ isPending (LOADING) ────────┐  │
│  │  Botón deshabilitado + spinner│  │
│  │  "Enviando pedido..."         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ errorMessage ───────────────┐  │
│  │  Banner rojo con mensaje      │  │
│  │  Usuario puede corregir y     │  │
│  │  re-enviar                    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ orderResult (SUCCESS) ──────┐  │
│  │  Reemplaza todo el form con   │  │
│  │  <OrderSuccess />             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 9. Notas técnicas importantes

### 9.1 Integración react-hook-form + useFieldArray

- `control` se pasa desde `useForm` a `useFieldArray`
- `register` funciona directamente con `items.${index}.quantity`
- Para `plushie_id`, se usa `setValue` manual porque el `<select>` nativo maneja strings
- `valueAsNumber: true` en `register` para que `quantity` sea number, no string

### 9.2 Zod v4 + @hookform/resolvers v5

El proyecto usa Zod v4 y resolvers v5. El import es:
```typescript
import { zodResolver } from "@hookform/resolvers/zod";
```
Funciona sin cambios respecto a Zod v3.

### 9.3 Sin Zustand store

Este módulo no necesita store global. TanStack Query cache maneja el catálogo de peluches (`usePlushies`) y la mutación de creación es one-shot (no hay lista que refrescar).

### 9.4 Manejo de error del backend

El backend retorna errores con estructura:
```json
{ "items": ["El plushie con id 1 no está disponible"] }
{ "customer_email": ["Este campo es requerido."] }
{ "detail": "Error específico" }
```

El hook `useCreateOrder` extrae el primer mensaje de error y muestra un toast. Además, el componente `OrderForm` tiene su propio estado `errorMessage` para mostrar un banner si la mutación falla (para casos donde el toast no es suficiente).

---

## 10. Criterios de aceptación

- [ ] `/order` muestra formulario con datos del cliente + items dinámicos
- [ ] Selector de peluches carga desde el catálogo público (`usePlushies`)
- [ ] Items: mínimo 1, se pueden agregar/quitar dinámicamente
- [ ] Validación Zod: email, teléfono, nombre, cantidad, plushie_id
- [ ] Validación en tiempo real: cantidad ≤ stock muestra advertencia
- [ ] Botón "Crear pedido" con estado de carga (spinner + disabled)
- [ ] Éxito: muestra resumen del pedido (OrderSuccess)
- [ ] Error: muestra banner con mensaje + opción de reintentar
- [ ] "Volver al catálogo" funciona en todas las vistas
- [ ] "Nuevo pedido" resetea el formulario
- [ ] Navbar pública incluye link "Pedido" → `/order`
- [ ] Navbar link "Pedido" tiene active highlight en `/order`
- [ ] Sin peluches cargados → select muestra "Cargando..."
- [ ] Peluches con stock 0 → opción deshabilitada en el select
- [ ] Resumen muestra: datos cliente, estado, items con precios, total
- [ ] `npm run build` sin errores de TypeScript
- [ ] `npm run lint` sin errores
