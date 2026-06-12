"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Warehouse } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export interface WarehouseColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (warehouse: Warehouse) => void
  setDeleteTarget: (warehouse: Warehouse) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function warehouseColumns(deps: WarehouseColumnDeps): ColumnDef<Warehouse>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortHeader label="Código" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "address",
      header: "Dirección",
      cell: ({ row }) => row.original.address ?? "—",
    },
    {
      accessorKey: "city",
      header: "Ciudad",
      cell: ({ row }) => row.original.city ?? "—",
    },
    {
      accessorKey: "country",
      header: "País",
      cell: ({ row }) => row.original.country ?? "—",
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => (
        <SortHeader label="Capacidad" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) =>
        row.original.capacity != null ? row.original.capacity.toLocaleString() : "—",
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const w = row.original
        return (
          <div className="flex items-center gap-1">
            {can("warehouse.change_warehouse") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(w)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("warehouse.delete_warehouse") && (
              w.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(w)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(w.id)}
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
