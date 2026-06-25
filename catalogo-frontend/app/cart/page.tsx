"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Minus,
  Plus,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clear, totalItems: getTotalItems } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Vaciar carrito
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-8">
            Agrega algunos peluches desde el catálogo
          </p>
          <Link href="/plushies">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ir al catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Tu carrito</h1>
              <p className="text-muted-foreground mt-1">
                {totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Lista de items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.plushie_id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        S/ {item.price} c/u
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {item.stock} unidades
                      </p>
                    </div>

                    {/* Controls + Price + Delete row */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Control de cantidad */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${item.plushie_id}`} className="sr-only">
                          Cantidad
                        </Label>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.plushie_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          id={`qty-${item.plushie_id}`}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) updateQuantity(item.plushie_id, val);
                          }}
                          className="h-8 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.plushie_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Precio subtotal */}
                      <div className="text-right min-w-[70px]">
                        <p className="font-semibold">
                          S/ {(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Botón eliminar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeItem(item.plushie_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumen */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Productos ({totalItems})</span>
                    <span>S/ {totalPrice.toFixed(2)}</span>
                  </div>
                  <hr className="border-t" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>S/ {totalPrice.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    className="w-full"
                    onClick={() => router.push("/order")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Proceder al pedido
                  </Button>
                  <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/plushies" />}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Seguir comprando
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
