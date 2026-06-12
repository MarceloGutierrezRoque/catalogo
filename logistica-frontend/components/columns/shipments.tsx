"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Shipment } from "@/types/api"
import Link from "next/link"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendiente", variant: "secondary" },
    picked_up: { label: "Recogido", variant: "default" },
    in_transit: { label: "En tránsito", variant: "outline" },
    delivered: { label: "Entregado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  }
  const c = config[status] ?? { label: status, variant: "outline" as const }

  const colorClasses: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    picked_up: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    in_transit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  }

  return (
    <Badge variant={c.variant} className={colorClasses[status] ?? ""}>
      {c.label}
    </Badge>
  )
}

export interface ShipmentColumnDeps {
  can: (perm: string) => boolean
  router: AppRouterInstance
  setDeleteTarget: (shipment: Shipment) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function shipmentColumns(deps: ShipmentColumnDeps): ColumnDef<Shipment>[] {
  const { can, router, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "tracking_number",
      header: ({ column }) => (
        <SortHeader label="Tracking" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => (
        <Link href={`/shipments/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.tracking_number}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Cliente",
      cell: ({ row }) => <span>Cliente #{row.original.customer}</span>,
    },
    {
      id: "origin_warehouse",
      header: "Almacén Origen",
      cell: ({ row }) => <span>Almacén #{row.original.origin_warehouse}</span>,
    },
    {
      accessorKey: "destination_city",
      header: ({ column }) => (
        <SortHeader label="Ciudad Destino" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "shipping_date",
      header: "Fecha Envío",
      cell: ({ row }) => {
        const date = row.original.shipping_date
        if (!date) return <span className="text-muted-foreground">—</span>
        return new Date(date).toLocaleDateString("es-PE")
      },
    },
    {
      id: "items_count",
      header: "Items",
      cell: ({ row }) => {
        const count = row.original.items?.length ?? 0
        return <Badge variant="outline">{count}</Badge>
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-1">
            {can("shipment.change_shipment") && (
              <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/shipments/${s.id}`)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("shipment.delete_shipment") && (
              s.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(s)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(s.id)}
                  disabled={activateMutation.isPending}
                >
                  <span className="ml-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Activar
                  </span>
                  <span className="sr-only">Activar</span>
                </Button>
              )
            )}
          </div>
        )
      },
    },
  ]
}
