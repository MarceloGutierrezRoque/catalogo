"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Transport } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export function vehicleTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    truck: "Camión",
    van: "Furgoneta",
    pickup: "Camioneta",
    other: "Otro",
  }
  return type ? labels[type] ?? type : "—"
}

export const vehicleTypeItems: Record<string, string> = {
  truck: "Camión",
  van: "Furgoneta",
  pickup: "Camioneta",
  other: "Otro",
}

export function formatNumber(val: string | null): string {
  if (!val) return "—"
  const n = Number.parseFloat(val)
  return isNaN(n) ? "—" : n.toLocaleString("es-PE")
}

export interface TransportColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (transport: Transport) => void
  setDeleteTarget: (transport: Transport) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function transportColumns(deps: TransportColumnDeps): ColumnDef<Transport>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "plate",
      header: ({ column }) => (
        <SortHeader label="Placa" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "vehicle_type",
      header: ({ column }) => (
        <SortHeader label="Tipo" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => vehicleTypeLabel(row.original.vehicle_type),
    },
    {
      accessorKey: "brand",
      header: "Marca",
      cell: ({ row }) => row.original.brand ?? "—",
    },
    {
      accessorKey: "model",
      header: "Modelo",
      cell: ({ row }) => row.original.model ?? "—",
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <SortHeader label="Año" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => (row.original.year != null ? String(row.original.year) : "—"),
    },
    {
      accessorKey: "capacity_kg",
      header: ({ column }) => (
        <SortHeader label="Capacidad (kg)" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => formatNumber(row.original.capacity_kg),
    },
    {
      accessorKey: "capacity_volume",
      header: ({ column }) => (
        <SortHeader label="Capacidad (vol.)" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => formatNumber(row.original.capacity_volume),
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
            {available ? "Disponible" : "En uso"}
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
        const t = row.original
        return (
          <div className="flex items-center gap-1">
            {can("transport.change_transport") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(t)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("transport.delete_transport") && (
              t.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(t.id)}
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
