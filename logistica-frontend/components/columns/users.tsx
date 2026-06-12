"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export interface UserColumnDeps {
  openEditDialog: (user: User) => void
  setDeleteTarget: (user: User) => void
  currentUser: { id: number } | null
  resolveGroupNames: (ids: number[]) => string
}

export function userColumns(deps: UserColumnDeps): ColumnDef<User>[] {
  const { openEditDialog, setDeleteTarget, currentUser, resolveGroupNames } = deps

  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <SortHeader label="ID" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <SortHeader label="Usuario" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortHeader label="Email" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => row.original.email || "—",
    },
    {
      id: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const first = row.original.first_name
        const last = row.original.last_name
        return first || last ? `${first} ${last}`.trim() : "—"
      },
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const ids = row.original.groups
        return ids.length > 0 ? resolveGroupNames(ids) : "—"
      },
    },
    {
      accessorKey: "is_superuser",
      header: "Superuser",
      cell: ({ row }) => (
        <Badge variant={row.original.is_superuser ? "default" : "secondary"}>
          {row.original.is_superuser ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Activo",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Sí" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(u)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            {u.id !== currentUser?.id && (
              <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(u)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Eliminar</span>
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
