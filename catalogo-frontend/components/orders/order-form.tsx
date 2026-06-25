"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePlushies } from "@/hooks/use-plushies";
import { useCreateOrder } from "@/hooks/use-orders";
import { OrderSuccess } from "@/components/orders/order-success";
import { useCartStore } from "@/stores/cart";
import type { Order } from "@/types/api";

// Schema de validación
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;

const orderItemSchema = z.object({
  plushie_id: z.number({ message: "Selecciona un peluche" })
    .positive("Selecciona un peluche"),
  quantity: z.number({ message: "Cantidad requerida" })
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
  const [initialized, setInitialized] = useState(false);

  // Cargar catálogo de peluches para el select
  const { data: plushiesData, isLoading: plushiesLoading } = usePlushies();

  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  // Leer items del carrito
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  // Tendremos acceso a los peluches activos
  const plushies = plushiesData?.results ?? [];

  const defaultFormItems =
    cartItems.length > 0
      ? cartItems.map((item) => ({
          plushie_id: item.plushie_id,
          quantity: item.quantity,
        }))
      : [{ plushie_id: undefined as unknown as number, quantity: 1 }];

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
      items: defaultFormItems,
    },
  });

  // Reset items when cart items change (only once on mount)
  useEffect(() => {
    if (!initialized && cartItems.length > 0) {
      reset({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        observations: "",
        items: cartItems.map((item) => ({
          plushie_id: item.plushie_id,
          quantity: item.quantity,
        })),
      });
      setInitialized(true);
    }
  }, [cartItems, reset, initialized]);

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
      clearCart();
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Hacer pedido</h1>
          <p className="text-muted-foreground">
            {cartItems.length > 0
              ? `Completa tus datos para confirmar tu pedido de ${cartItems.length} producto${cartItems.length === 1 ? "" : "s"}`
              : "Completa tus datos y selecciona los peluches que deseas"}
          </p>
        </div>
        {cartItems.length > 0 && (
          <Button variant="outline" nativeButton={false} render={<Link href="/cart" />} className="transition-all duration-200 hover:shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
        )}
      </div>

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
              onClick={() => append({ plushie_id: undefined as unknown as number, quantity: 1 })}
              className="transition-all duration-200 hover:shadow-sm"
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
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isPending ? "Enviando pedido..." : "Crear pedido"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/plushies" />} className="transition-all duration-200 hover:shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Button>
        </div>
      </form>
    </div>
  );
}
