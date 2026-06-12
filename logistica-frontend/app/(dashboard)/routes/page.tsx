"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  useRoutes,
  useDeleteRoute,
  useActivateRoute,
} from "@/hooks/routes"
import type { Route } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { routeColumns } from "@/components/columns/routes"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { useAuthStore } from "@/stores/auth"

export default function RoutesPage() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useRoutes()
  const deleteMutation = useDeleteRoute()
  const activateMutation = useActivateRoute()
  const can = useAuthStore((s) => s.can)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null)

  // ── Table columns ──

  const columns = routeColumns({ can, router, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const routesList = data ?? []

  // ── Handlers ──

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  function handleActivate(id: number) {
    activateMutation.mutate(id)
  }

  // ── Loading / Error states ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando rutas…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-lg font-bold text-destructive">!</span>
        </div>
        <div>
          <p className="font-medium text-destructive">Error al cargar rutas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexión con el servidor e intenta nuevamente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra las rutas de transporte
          </p>
        </div>
        {can("route.add_route") && (
          <Button
            onClick={() => router.push("/routes/new")}
            size="lg"
            className="shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Ruta
          </Button>
        )}
      </div>

      <MobileFilterSheet
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        placeholder="Buscar…"
      />

      <DataTable
        columns={columns}
        data={routesList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay rutas registradas"
        filteredEmptyMessage="No se encontraron rutas"
      />

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Eliminar Ruta</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción desactivará la ruta{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
