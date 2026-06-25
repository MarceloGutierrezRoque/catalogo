import { AdminOrdersTable } from "@/components/orders/admin/admin-orders-table";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona los pedidos de los clientes
          </p>
        </div>
      </div>
      <AdminOrdersTable />
    </div>
  );
}
