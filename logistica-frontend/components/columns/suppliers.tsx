"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Supplier } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export interface SupplierColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (supplier: Supplier) => void
  setDeleteTarget: (supplier: Supplier) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function supplierColumns(deps: SupplierColumnDeps): ColumnDef<Supplier>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "contact_name",
      header: "Contacto",
      cell: ({ row }) => row.original.contact_name ?? "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortHeader label="Email" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => row.original.email ?? "—",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.original.phone ?? "—",
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
        const s = row.original
        return (
          <div className="flex items-center gap-1">
            {can("suppliers.change_supplier") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(s)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("suppliers.delete_supplier") && (
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
