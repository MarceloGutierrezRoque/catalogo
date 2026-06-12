"use client"

import { useState } from "react"
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useActivateWarehouse,
} from "@/hooks/warehouse"
import type { Warehouse } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { warehouseColumns } from "@/components/columns/warehouse"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { useAuthStore } from "@/stores/auth"

interface FormErrors {
  name?: string
  code?: string
  address?: string
  city?: string
  country?: string
  capacity?: string
}

export default function WarehousesPage() {
  const { data, isLoading, isError, refetch } = useWarehouses()
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const deleteMutation = useDeleteWarehouse()
  const activateMutation = useActivateWarehouse()
  const can = useAuthStore((s) => s.can)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [formCapacity, setFormCapacity] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Table columns ──

  const columns = warehouseColumns({ can, openEditDialog, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const warehousesList = data ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingWarehouse(null)
    setFormName("")
    setFormCode("")
    setFormAddress("")
    setFormCity("")
    setFormCountry("")
    setFormCapacity("")
    setDialogOpen(true)
  }

  function openEditDialog(warehouse: Warehouse) {
    setErrors({})
    setEditingWarehouse(warehouse)
    setFormName(warehouse.name)
    setFormCode(warehouse.code)
    setFormAddress(warehouse.address ?? "")
    setFormCity(warehouse.city ?? "")
    setFormCountry(warehouse.country ?? "")
    setFormCapacity(warehouse.capacity != null ? String(warehouse.capacity) : "")
    setDialogOpen(true)
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formName.trim()) errs.name = "El nombre es obligatorio"
    if (!formCode.trim()) errs.code = "El código es obligatorio"
    if (formCapacity && (isNaN(Number(formCapacity)) || Number(formCapacity) < 0)) {
      errs.capacity = "La capacidad debe ser un número positivo"
    }
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload = {
      name: formName,
      code: formCode,
      address: formAddress || null,
      city: formCity || null,
      country: formCountry || null,
      capacity: formCapacity ? Number(formCapacity) : null,
    }

    if (editingWarehouse) {
      updateMutation.mutate(
        { id: editingWarehouse.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

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
        <p className="text-sm text-muted-foreground">Cargando almacenes…</p>
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
          <p className="font-medium text-destructive">Error al cargar almacenes</p>
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

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Almacenes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los almacenes registrados en el sistema
          </p>
        </div>
        {can("warehouse.add_warehouse") && (
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Almacén
          </Button>
        )}
      </div>

      <MobileFilterSheet
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        placeholder="Buscar por nombre, código, dirección…"
      />

      <DataTable
        columns={columns}
        data={warehousesList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay almacenes registrados"
        filteredEmptyMessage="No se encontraron almacenes"
        noDataHint='Presiona "Nuevo Almacén" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? "Modifica los datos del almacén"
                : "Ingresa los datos del nuevo almacén"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  clearError("name")
                }}
                placeholder="Almacén Central"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => {
                  setFormCode(e.target.value)
                  clearError("code")
                }}
                placeholder="ALC-001"
                required
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={(e) => {
                  setFormAddress(e.target.value)
                  clearError("address")
                }}
                placeholder="Av. Siempre Viva 123"
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formCity}
                  onChange={(e) => {
                    setFormCity(e.target.value)
                    clearError("city")
                  }}
                  placeholder="Lima"
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formCountry}
                  onChange={(e) => {
                    setFormCountry(e.target.value)
                    clearError("country")
                  }}
                  placeholder="Perú"
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad</Label>
              <Input
                id="capacity"
                type="number"
                value={formCapacity}
                onChange={(e) => {
                  setFormCapacity(e.target.value)
                  clearError("capacity")
                }}
                placeholder="5000"
              />
              {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isMutating}
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : editingWarehouse ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <DialogTitle>Eliminar Almacén</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción desactivará{" "}
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
