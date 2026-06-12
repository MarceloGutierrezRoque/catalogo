"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Group } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export interface RoleColumnDeps {
  openEditDialog: (group: Group) => void
  setDeleteTarget: (group: Group) => void
}

export function roleColumns(deps: RoleColumnDeps): ColumnDef<Group>[] {
  const { openEditDialog, setDeleteTarget } = deps

  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <SortHeader label="ID" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      id: "permissions_count",
      header: ({ column }) => (
        <SortHeader label="Permisos" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      accessorFn: (row) => row.permissions.length,
      cell: ({ row }) => {
        const count = row.original.permissions.length
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>
            {count} {count === 1 ? "permiso" : "permisos"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const g = row.original
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(g)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(g)}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
        )
      },
    },
  ]
}
