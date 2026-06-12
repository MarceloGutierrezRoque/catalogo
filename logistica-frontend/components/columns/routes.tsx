"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Route } from "@/types/api"
import Link from "next/link"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export function RouteStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    planned: { label: "Planificada", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    in_progress: { label: "En curso", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    completed: { label: "Completada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-700" }
  return (
    <Badge className={c.className} variant="outline">
      {c.label}
    </Badge>
  )
}

export interface RouteColumnDeps {
  can: (perm: string) => boolean
  router: AppRouterInstance
  setDeleteTarget: (route: Route) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function routeColumns(deps: RouteColumnDeps): ColumnDef<Route>[] {
  const { can, router, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => (
        <Link href={`/routes/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "transport",
      header: "Vehículo",
      cell: ({ row }) => <span>Vehículo #{row.original.transport}</span>,
    },
    {
      id: "driver",
      header: "Conductor",
      cell: ({ row }) => <span>Conductor #{row.original.driver}</span>,
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <SortHeader label="Fecha Inicio" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => {
        const date = row.original.start_date
        if (!date) return <span className="text-muted-foreground">—</span>
        return new Date(date).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      },
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => (
        <SortHeader label="Fecha Fin" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => {
        const date = row.original.end_date
        if (!date) return <span className="text-muted-foreground">—</span>
        return new Date(date).toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      },
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => <RouteStatusBadge status={row.original.status} />,
    },
    {
      id: "stops_count",
      header: "Paradas",
      cell: ({ row }) => {
        const count = row.original.stops?.length ?? 0
        return <Badge variant="outline">{count}</Badge>
      },
    },
    {
      accessorKey: "is_active",
      header: "Activo",
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
        const r = row.original
        return (
          <div className="flex items-center gap-1">
            {can("route.change_route") && (
              <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/routes/${r.id}`)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("route.delete_route") && (
              r.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(r)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(r.id)}
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
