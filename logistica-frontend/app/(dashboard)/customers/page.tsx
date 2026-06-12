"use client"

import { useState } from "react"
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useActivateCustomer,
} from "@/hooks/customers"
import type { Customer } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { customerColumns } from "@/components/columns/customers"
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
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { useAuthStore } from "@/stores/auth"

interface FormErrors {
  name?: string
  customer_type?: string
  document_type?: string
  document_number?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

// ── Helpers ──

function customerTypeLabel(type: string): string {
  return type === "company" ? "Empresa" : "Persona"
}

const customerTypeItems: Record<string, string> = {
  company: "Empresa",
  person: "Persona",
}

const docTypeItems: Record<string, string> = {
  ruc: "RUC",
  dni: "DNI",
  ce: "Carné de Extranjería",
  other: "Otro",
}

export default function CustomersPage() {
  const { data, isLoading, isError, refetch } = useCustomers()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()
  const activateMutation = useActivateCustomer()
  const can = useAuthStore((s) => s.can)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCustomerType, setFormCustomerType] = useState("")
  const [formDocumentType, setFormDocumentType] = useState("")
  const [formDocumentNumber, setFormDocumentNumber] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Table columns ──

  const columns = customerColumns({ can, openEditDialog, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const customerList = data ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingCustomer(null)
    setFormName("")
    setFormCustomerType("")
    setFormDocumentType("")
    setFormDocumentNumber("")
    setFormEmail("")
    setFormPhone("")
    setFormAddress("")
    setFormCity("")
    setFormCountry("")
    setDialogOpen(true)
  }

  function openEditDialog(customer: Customer) {
    setErrors({})
    setEditingCustomer(customer)
    setFormName(customer.name)
    setFormCustomerType(customer.customer_type)
    setFormDocumentType(customer.document_type ?? "")
    setFormDocumentNumber(customer.document_number ?? "")
    setFormEmail(customer.email ?? "")
    setFormPhone(customer.phone ?? "")
    setFormAddress(customer.address ?? "")
    setFormCity(customer.city ?? "")
    setFormCountry(customer.country ?? "")
    setDialogOpen(true)
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formName.trim()) errs.name = "El nombre es obligatorio"
    if (!formCustomerType) errs.customer_type = "Selecciona un tipo de cliente"
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
      customer_type: formCustomerType,
      document_type: formDocumentType || null,
      document_number: formDocumentNumber || null,
      email: formEmail || null,
      phone: formPhone || null,
      address: formAddress || null,
      city: formCity || null,
      country: formCountry || null,
    }

    if (editingCustomer) {
      updateMutation.mutate(
        { id: editingCustomer.id, data: payload },
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
        <p className="text-sm text-muted-foreground">Cargando clientes…</p>
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
          <p className="font-medium text-destructive">Error al cargar clientes</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los clientes registrados en el sistema
          </p>
        </div>
        {can("customer.add_customer") && (
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Cliente
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
        data={customerList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay clientes registrados"
        filteredEmptyMessage="No se encontraron clientes"
        noDataHint='Presiona "Nuevo Cliente" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Modifica los datos del cliente"
                : "Ingresa los datos del nuevo cliente"}
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
                placeholder="Juan Pérez"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_type">
                Tipo de Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formCustomerType}
                onValueChange={(val) => {
                  const type = val ?? ""
                  setFormCustomerType(type)
                  clearError("customer_type")
                  setFormDocumentType(type === "company" ? "ruc" : "dni")
                  setFormDocumentNumber("")
                }}
                items={customerTypeItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de cliente…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="person">Persona</SelectItem>
                </SelectContent>
              </Select>
              {errors.customer_type && <p className="text-sm text-destructive">{errors.customer_type}</p>}
            </div>

            {formCustomerType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipo de Documento</Label>
                  <Select
                    value={formDocumentType}
                    onValueChange={(val) => {
                      setFormDocumentType(val ?? "")
                      clearError("document_type")
                    }}
                    items={docTypeItems}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de documento…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ruc">RUC</SelectItem>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="ce">Carné de Extranjería</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.document_type && <p className="text-sm text-destructive">{errors.document_type}</p>}
                </div>

                {formDocumentType && (
                  <div className="space-y-2">
                    <Label htmlFor="document_number">Número de Documento</Label>
                    <Input
                      id="document_number"
                      value={formDocumentNumber}
                      onChange={(e) => {
                        setFormDocumentNumber(e.target.value)
                        clearError("document_number")
                      }}
                      placeholder={
                        formDocumentType === "ruc"
                          ? "20123456789"
                          : formDocumentType === "dni"
                            ? "12345678"
                            : "Número de documento"
                      }
                    />
                    {errors.document_number && <p className="text-sm text-destructive">{errors.document_number}</p>}
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="cliente@ejemplo.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={(e) => {
                  setFormAddress(e.target.value)
                  clearError("address")
                }}
                placeholder="Av. Principal 789"
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
              ) : editingCustomer ? (
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
                <DialogTitle>Eliminar Cliente</DialogTitle>
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
