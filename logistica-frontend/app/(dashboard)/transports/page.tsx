"use client"

import { useState } from "react"
import {
  useTransports,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
  useActivateTransport,
} from "@/hooks/transports"
import type { Transport } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/data-table"
import { transportColumns, vehicleTypeItems } from "@/components/columns/transports"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { useAuthStore } from "@/stores/auth"

interface FormErrors {
  plate?: string
  vehicle_type?: string
  brand?: string
  model?: string
  year?: string
  capacity_kg?: string
  capacity_volume?: string
}

export default function TransportsPage() {
  const { data, isLoading, isError, refetch } = useTransports()
  const createMutation = useCreateTransport()
  const updateMutation = useUpdateTransport()
  const deleteMutation = useDeleteTransport()
  const activateMutation = useActivateTransport()
  const can = useAuthStore((s) => s.can)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transport | null>(null)

  // Form state
  const [formPlate, setFormPlate] = useState("")
  const [formVehicleType, setFormVehicleType] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formModel, setFormModel] = useState("")
  const [formYear, setFormYear] = useState("")
  const [formCapacityKg, setFormCapacityKg] = useState("")
  const [formCapacityVolume, setFormCapacityVolume] = useState("")
  const [formIsAvailable, setFormIsAvailable] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Table columns ──

  const columns = transportColumns({ can, openEditDialog, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const transports = data ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingTransport(null)
    setFormPlate("")
    setFormVehicleType("")
    setFormBrand("")
    setFormModel("")
    setFormYear("")
    setFormCapacityKg("")
    setFormCapacityVolume("")
    setFormIsAvailable(true)
    setDialogOpen(true)
  }

  function openEditDialog(transport: Transport) {
    setErrors({})
    setEditingTransport(transport)
    setFormPlate(transport.plate)
    setFormVehicleType(transport.vehicle_type ?? "")
    setFormBrand(transport.brand ?? "")
    setFormModel(transport.model ?? "")
    setFormYear(transport.year != null ? String(transport.year) : "")
    setFormCapacityKg(transport.capacity_kg ?? "")
    setFormCapacityVolume(transport.capacity_volume ?? "")
    setFormIsAvailable(transport.is_available)
    setDialogOpen(true)
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formPlate.trim()) errs.plate = "La placa es obligatoria"
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
      plate: formPlate,
      vehicle_type: formVehicleType || null,
      brand: formBrand || null,
      model: formModel || null,
      year: formYear ? Number(formYear) : null,
      capacity_kg: formCapacityKg || null,
      capacity_volume: formCapacityVolume || null,
      is_available: formIsAvailable,
    }

    if (editingTransport) {
      updateMutation.mutate(
        { id: editingTransport.id, data: payload },
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
        <p className="text-sm text-muted-foreground">Cargando vehículos…</p>
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
          <p className="font-medium text-destructive">Error al cargar vehículos</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los vehículos registrados en el sistema
          </p>
        </div>
        {can("transport.add_transport") && (
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Vehículo
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
        data={transports}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay vehículos registrados"
        filteredEmptyMessage="No se encontraron vehículos"
        noDataHint='Presiona "Nuevo Vehículo" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransport ? "Editar Vehículo" : "Nuevo Vehículo"}
            </DialogTitle>
            <DialogDescription>
              {editingTransport
                ? "Modifica los datos del vehículo"
                : "Ingresa los datos del nuevo vehículo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Row 1: Placa + Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plate">
                  Placa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plate"
                  value={formPlate}
                  onChange={(e) => {
                    setFormPlate(e.target.value)
                    clearError("plate")
                  }}
                  placeholder="ABC-123"
                  required
                />
                {errors.plate && <p className="text-sm text-destructive">{errors.plate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipo</Label>
                <Select
                  value={formVehicleType}
                    onValueChange={(val) => {
                      setFormVehicleType(val ?? "")
                      clearError("vehicle_type")
                    }}
                    items={vehicleTypeItems}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Camión</SelectItem>
                    <SelectItem value="van">Furgoneta</SelectItem>
                    <SelectItem value="pickup">Camioneta</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicle_type && <p className="text-sm text-destructive">{errors.vehicle_type}</p>}
              </div>
            </div>

            {/* Row 2: Marca + Modelo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formBrand}
                  onChange={(e) => {
                    setFormBrand(e.target.value)
                    clearError("brand")
                  }}
                  placeholder="Volvo"
                />
                {errors.brand && <p className="text-sm text-destructive">{errors.brand}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formModel}
                  onChange={(e) => {
                    setFormModel(e.target.value)
                    clearError("model")
                  }}
                  placeholder="FH16"
                />
                {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
              </div>
            </div>

            {/* Row 3: Año */}
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2099"
                value={formYear}
                onChange={(e) => {
                  setFormYear(e.target.value)
                  clearError("year")
                }}
                placeholder="2024"
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
            </div>

            {/* Row 4: Capacidad kg + Capacidad vol */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity_kg">Capacidad (kg)</Label>
                <Input
                  id="capacity_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCapacityKg}
                  onChange={(e) => {
                    setFormCapacityKg(e.target.value)
                    clearError("capacity_kg")
                  }}
                  placeholder="20000"
                />
                {errors.capacity_kg && <p className="text-sm text-destructive">{errors.capacity_kg}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity_volume">Capacidad (vol.)</Label>
                <Input
                  id="capacity_volume"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCapacityVolume}
                  onChange={(e) => {
                    setFormCapacityVolume(e.target.value)
                    clearError("capacity_volume")
                  }}
                  placeholder="80"
                />
                {errors.capacity_volume && <p className="text-sm text-destructive">{errors.capacity_volume}</p>}
              </div>
            </div>

            {/* Row 5: Disponible checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_available"
                checked={formIsAvailable}
                onCheckedChange={(checked) => setFormIsAvailable(checked === true)}
              />
              <Label htmlFor="is_available">Disponible</Label>
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
              ) : editingTransport ? (
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
                <DialogTitle>Eliminar Vehículo</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción desactivará{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.plate}
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
