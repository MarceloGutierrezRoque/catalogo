"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Driver } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export function formatDate(val: string | null): string {
  if (!val) return "—"
  try {
    return new Date(val).toLocaleDateString("es-PE")
  } catch {
    return "—"
  }
}

export interface DriverColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (driver: Driver) => void
  setDeleteTarget: (driver: Driver) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function driverColumns(deps: DriverColumnDeps): ColumnDef<Driver>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "license_number",
      header: ({ column }) => (
        <SortHeader label="# Licencia" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "user",
      header: "Usuario",
      cell: ({ row }) => {
        const userId = row.original.user
        return userId ? `User #${userId}` : "—"
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email ?? "—",
    },
    {
      accessorKey: "hire_date",
      header: ({ column }) => (
        <SortHeader label="Fecha Cont." sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => formatDate(row.original.hire_date),
    },
    {
      accessorKey: "is_available",
      header: ({ column }) => (
        <SortHeader label="Disponibilidad" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => {
        const available = row.original.is_available
        return (
          <Badge
            variant={available ? "default" : "secondary"}
            className={
              available
                ? ""
                : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
            }
          >
            {available ? "Disponible" : "No disponible"}
          </Badge>
        )
      },
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
        const d = row.original
        return (
          <div className="flex items-center gap-1">
            {can("driver.change_driver") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(d)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("driver.delete_driver") && (
              d.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(d)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(d.id)}
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
