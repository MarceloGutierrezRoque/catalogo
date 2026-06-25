"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminOrder, useUpdateOrderStatus, useDeleteOrder } from "@/hooks/use-admin-orders";
import { OrderStatusSelect } from "@/components/orders/admin/order-status-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  FileText,
  Package,
  Clock,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/api";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = Number(id);

  const { data: order, isLoading, isError, refetch, isFetching } = useAdminOrder(orderId);
  const updateStatusMutation = useUpdateOrderStatus();
  const deleteMutation = useDeleteOrder();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(orderId);
      router.push("/dashboard/orders");
    } catch {
      // Error ya manejado por onError del mutation (toast)
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
    } catch {
      // Error ya manejado por onError del mutation (toast)
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Error state
  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Pedido no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El pedido que buscas no existe o fue eliminado.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/orders" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Calcular total
  const total = order.items?.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  ) ?? 0;

  const createdDate = new Date(order.created_at).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(order.updated_at).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/orders" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Pedido #{order.id}
          </h1>
          <p className="text-muted-foreground">
            Creado el {createdDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`text-base px-3 py-1 ${ORDER_STATUS_COLORS[order.status] ?? ""}`}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="icon-sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar pedido #{order.id}</DialogTitle>
                <DialogDescription>
                  Esta acción marca el pedido como eliminado. No se puede deshacer.
                  ¿Estás seguro de eliminar el pedido de <strong>{order.customer_name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar pedido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Datos del cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado del pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Estado del pedido
            </CardTitle>
            <CardDescription>
              Actualiza el estado según el progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusSelect
              currentStatus={order.status}
              onStatusChange={handleStatusChange}
              isPending={updateStatusMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Última actualización: {updatedDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Observaciones */}
      {order.observations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Items del pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Productos solicitados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-3">
                    Producto
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Cantidad
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Precio unit.
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{item.plushie_name}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      S/ {Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      S/ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-right">
                    Total estimado
                  </td>
                  <td className="px-6 py-4 text-right">
                    S/ {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
