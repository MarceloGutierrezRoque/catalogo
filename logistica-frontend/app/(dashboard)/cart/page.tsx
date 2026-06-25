"use client"

import { useMemo, useState } from "react"
import { useProducts } from "@/hooks/products"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { createCheckoutSession } from "@/services/payments"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100)
}

export default function CartPage() {
  const { data: products, isLoading, isError, refetch } = useProducts()
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalCents,
  } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const activeProducts = useMemo(
    () => (products ?? []).filter((p) => p.is_active),
    [products],
  )

  const cartProductIds = useMemo(
    () => new Set(items.map((i) => i.product_id)),
    [items],
  )

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckoutLoading(true)
    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        success_url: `${window.location.origin}/orden-exitosa`,
        cancel_url: `${window.location.origin}/cart`,
        customer_email: user?.email || undefined,
      }
      const { session_url } = await createCheckoutSession(payload)
      window.location.href = session_url
    } catch {
      toast.error("Error al iniciar el pago. Intenta de nuevo.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Error al cargar los productos</p>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Carrito de Compras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeProducts.length} productos disponibles
          </p>
        </div>
        <Badge variant="secondary" className="text-sm gap-1.5 w-fit">
          <ShoppingCart className="h-4 w-4" />
          {totalItems()} {totalItems() === 1 ? "item" : "items"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">Productos</h2>
          {activeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Package className="h-10 w-10" />
              <p>No hay productos disponibles</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeProducts.map((product) => {
                const inCart = cartProductIds.has(product.id)
                const priceCents = Math.round(
                  parseFloat(product.unit_price ?? "0") * 100,
                )
                return (
                  <Card
                    key={product.id}
                    size="sm"
                    className={cn(
                      "transition-shadow",
                      inCart && "ring-2 ring-primary/30",
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                          {product.name}
                        </CardTitle>
                        {inCart && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] h-4 px-1.5"
                          >
                            En carrito
                          </Badge>
                        )}
                      </div>
                      {product.brand && (
                        <CardDescription>{product.brand}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold text-base">
                        {priceCents > 0 ? formatPrice(priceCents) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stock: {product.stock_quantity}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        size="sm"
                        variant={inCart ? "secondary" : "default"}
                        className="w-full"
                        onClick={() => addItem(product)}
                        disabled={product.stock_quantity <= 0}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {inCart ? "Agregar otro" : "Agregar"}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Mi Carrito
              </CardTitle>
              <CardDescription>
                {items.length === 0
                  ? "Agrega productos desde el catálogo"
                  : `${totalItems()} ${totalItems() === 1 ? "producto" : "productos"} seleccionados`}
              </CardDescription>
            </CardHeader>

            {items.length > 0 && (
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-2 pb-3 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium w-20 text-right tabular-nums shrink-0">
                      {formatPrice(item.unit_price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.product_id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            )}

            <CardFooter className="flex-col gap-3">
              {items.length > 0 && (
                <>
                  <div className="flex items-center justify-between w-full text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-base">
                      {formatPrice(totalCents())}
                    </span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      "Procesando..."
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pagar con Stripe
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={clearCart}
                  >
                    Vaciar carrito
                  </Button>
                </>
              )}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  El carrito está vacío
                </p>
              )}
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
  )
}
