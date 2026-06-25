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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
        <Button variant="outline" nativeButton={false} render={<Link href="/plushies" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>
    </div>
  );
}
