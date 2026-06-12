"use client"

import { useState } from "react"
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useActivateDriver,
} from "@/hooks/drivers"
import type { Driver } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/data-table"
import { driverColumns } from "@/components/columns/drivers"
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
  license_number?: string
  user?: string
  phone?: string
  email?: string
  hire_date?: string
}

export default function DriversPage() {
  const { data, isLoading, isError, refetch } = useDrivers()
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const deleteMutation = useDeleteDriver()
  const activateMutation = useActivateDriver()
  const can = useAuthStore((s) => s.can)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)

  // Form state
  const [formLicenseNumber, setFormLicenseNumber] = useState("")
  const [formUser, setFormUser] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formHireDate, setFormHireDate] = useState("")
  const [formIsAvailable, setFormIsAvailable] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Table columns ──

  const columns = driverColumns({ can, openEditDialog, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const driversList = data ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingDriver(null)
    setFormLicenseNumber("")
    setFormUser("")
    setFormPhone("")
    setFormEmail("")
    setFormHireDate("")
    setFormIsAvailable(true)
    setDialogOpen(true)
  }

  function openEditDialog(driver: Driver) {
    setErrors({})
    setEditingDriver(driver)
    setFormLicenseNumber(driver.license_number)
    setFormUser(driver.user != null ? String(driver.user) : "")
    setFormPhone(driver.phone ?? "")
    setFormEmail(driver.email ?? "")
    setFormHireDate(driver.hire_date ?? "")
    setFormIsAvailable(driver.is_available)
    setDialogOpen(true)
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formLicenseNumber.trim()) errs.license_number = "El número de licencia es obligatorio"
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
      license_number: formLicenseNumber,
      user: formUser ? Number(formUser) : undefined,
      phone: formPhone || null,
      email: formEmail || null,
      hire_date: formHireDate || null,
      is_available: formIsAvailable,
    }

    if (editingDriver) {
      updateMutation.mutate(
        { id: editingDriver.id, data: payload },
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
        <p className="text-sm text-muted-foreground">Cargando conductores…</p>
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
          <p className="font-medium text-destructive">Error al cargar conductores</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Conductores</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los conductores registrados en el sistema
          </p>
        </div>
        {can("driver.add_driver") && (
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Conductor
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
        data={driversList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay conductores registrados"
        filteredEmptyMessage="No se encontraron conductores"
        noDataHint='Presiona "Nuevo Conductor" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? "Editar Conductor" : "Nuevo Conductor"}
            </DialogTitle>
            <DialogDescription>
              {editingDriver
                ? "Modifica los datos del conductor"
                : "Ingresa los datos del nuevo conductor"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Row 1: License number (full width) */}
            <div className="space-y-2">
              <Label htmlFor="license_number">
                # Licencia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="license_number"
                value={formLicenseNumber}
                onChange={(e) => {
                  setFormLicenseNumber(e.target.value)
                  clearError("license_number")
                }}
                placeholder="LIC-001"
                required
              />
              {errors.license_number && <p className="text-sm text-destructive">{errors.license_number}</p>}
            </div>

            {/* Row 2: ID Usuario + Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">ID Usuario</Label>
                <Input
                  id="user"
                  type="number"
                  min="1"
                  value={formUser}
                  onChange={(e) => {
                    setFormUser(e.target.value)
                    clearError("user")
                  }}
                  placeholder="ID de usuario…"
                />
                {errors.user && <p className="text-sm text-destructive">{errors.user}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formPhone}
                  onChange={(e) => {
                    setFormPhone(e.target.value)
                    clearError("phone")
                  }}
                  placeholder="+51999000111"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
            </div>

            {/* Row 3: Email (full width) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value)
                  clearError("email")
                }}
                placeholder="juan@logistica.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Row 4: Fecha Contratación (full width) */}
            <div className="space-y-2">
              <Label htmlFor="hire_date">Fecha Contratación</Label>
              <Input
                id="hire_date"
                type="date"
                value={formHireDate}
                onChange={(e) => {
                  setFormHireDate(e.target.value)
                  clearError("hire_date")
                }}
              />
              {errors.hire_date && <p className="text-sm text-destructive">{errors.hire_date}</p>}
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
              ) : editingDriver ? (
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
                <DialogTitle>Eliminar Conductor</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción desactivará{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.license_number}
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
