"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useRoute } from "@/hooks/routes"
import { useTransports } from "@/hooks/transports"
import { useDrivers } from "@/hooks/drivers"
import { useWarehouses } from "@/hooks/warehouse"
import { isAxiosError } from "axios"
import {
  updateRoute,
  createStop,
  deleteStop,
} from "@/services/routes"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Loader2 } from "lucide-react"
import type { Route, Transport, Driver, Warehouse } from "@/types/api"

// ── Types ──

interface StopDraft {
  tempId: string
  id?: number
  order: number
  warehouse: number
  arrival_time: string | null
  departure_time: string | null
  status: string
}

interface FormErrors {
  name?: string
  transport?: string
  driver?: string
  start_date?: string
  end_date?: string
  status?: string
  stops?: string
}

const routeStatusOptions = [
  { value: "planned", label: "Planificada" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
]

const stopStatusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "arrived", label: "Llegó" },
  { value: "completed", label: "Completada" },
  { value: "skipped", label: "Saltada" },
]

const routeStatusItems: Record<string, string> = {
  planned: "Planificada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
}

const stopStatusItems: Record<string, string> = {
  pending: "Pendiente",
  arrived: "Llegó",
  completed: "Completada",
  skipped: "Saltada",
}

// ── StopStatusBadge ──

function StopStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-gray-100 text-gray-700" },
    arrived: { label: "Llegó", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completada", className: "bg-green-100 text-green-700" },
    skipped: { label: "Saltada", className: "bg-amber-100 text-amber-700" },
  }
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-700" }
  return (
    <Badge className={c.className} variant="outline">
      {c.label}
    </Badge>
  )
}

// ── Form Component ──

function RouteEditForm({
  route,
  transports,
  drivers,
  warehouses,
  routeId,
  onCancel,
}: {
  route: Route
  transports: Transport[] | undefined
  drivers: Driver[] | undefined
  warehouses: Warehouse[] | undefined
  routeId: number
  onCancel: () => void
}) {
  const transportItems = useMemo(
    () => Object.fromEntries((transports ?? []).map((t) => [String(t.id), `${t.plate} (#${t.id})`])),
    [transports],
  )
  const driverItems = useMemo(
    () => Object.fromEntries((drivers ?? []).map((d) => [String(d.id), `Conductor #${d.id} (${d.license_number})`])),
    [drivers],
  )
  const warehouseItems = useMemo(
    () => Object.fromEntries((warehouses ?? []).map((w) => [String(w.id), w.name])),
    [warehouses],
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  // ── Helper to convert ISO string to datetime-local value ──

  function toDatetimeLocal(iso: string | null): string {
    if (!iso) return ""
    // "2026-06-01T08:00:00Z" → "2026-06-01T08:00"
    try {
      const d = new Date(iso)
      const pad = (n: number) => String(n).padStart(2, "0")
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return ""
    }
  }

  // ── Header form state (initialized from props) ──
  const [formName, setFormName] = useState(route.name)
  const [formTransport, setFormTransport] = useState(String(route.transport))
  const [formDriver, setFormDriver] = useState(String(route.driver))
  const [formStartDate, setFormStartDate] = useState(toDatetimeLocal(route.start_date))
  const [formEndDate, setFormEndDate] = useState(toDatetimeLocal(route.end_date))
  const [formStatus, setFormStatus] = useState(route.status)

  // ── Stops state ──
  const [stops, setStops] = useState<StopDraft[]>(
    route.stops.map((stop) => ({
      tempId: crypto.randomUUID(),
      id: stop.id,
      order: stop.order,
      warehouse: stop.warehouse,
      arrival_time: stop.arrival_time,
      departure_time: stop.departure_time,
      status: stop.status,
    }))
  )
  const [deletedStopIds, setDeletedStopIds] = useState<number[]>([])
  const [stopDialogOpen, setStopDialogOpen] = useState(false)

  // Stop dialog form fields
  const [newStopOrder, setNewStopOrder] = useState("1")
  const [newStopWarehouse, setNewStopWarehouse] = useState("")
  const [newStopArrival, setNewStopArrival] = useState("")
  const [newStopDeparture, setNewStopDeparture] = useState("")
  const [newStopStatus, setNewStopStatus] = useState("pending")

  // ── Submit state ──
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Validation ──

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formName.trim()) errs.name = "El nombre de la ruta es requerido"
    if (!formTransport) errs.transport = "Debes seleccionar un vehículo"
    if (!formDriver) errs.driver = "Debes seleccionar un conductor"
    if (!formStartDate) errs.start_date = "La fecha de inicio es requerida"
    if (formEndDate && formStartDate && new Date(formEndDate) <= new Date(formStartDate)) {
      errs.end_date = "La fecha de fin debe ser posterior a la fecha de inicio"
    }
    if (stops.length === 0) errs.stops = "Debes agregar al menos una parada a la ruta"
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Stop dialog handlers ──

  function openStopDialog() {
    setNewStopOrder(String(stops.length + 1))
    setNewStopWarehouse("")
    setNewStopArrival("")
    setNewStopDeparture("")
    setNewStopStatus("pending")
    setStopDialogOpen(true)
  }

  function handleAddStop() {
    if (!newStopWarehouse || !newStopOrder) return
    clearError("stops")
    setStops((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        order: Number(newStopOrder),
        warehouse: Number(newStopWarehouse),
        arrival_time: newStopArrival || null,
        departure_time: newStopDeparture || null,
        status: newStopStatus,
      },
    ])
    setStopDialogOpen(false)
  }

  function handleRemoveStop(tempId: string) {
    setStops((prev) => {
      const removed = prev.find((s) => s.tempId === tempId)
      if (removed?.id) {
        setDeletedStopIds((prevIds) => [...prevIds, removed.id!])
      }
      return prev.filter((s) => s.tempId !== tempId)
    })
  }

  // ── Submit ──

  async function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formName,
        transport: Number(formTransport),
        driver: Number(formDriver),
        start_date: formStartDate ? `${formStartDate}:00Z` : null,
        end_date: formEndDate ? `${formEndDate}:00Z` : null,
        status: formStatus as Route["status"],
      }

      // 1. Update header
      await updateRoute(routeId, payload)

      // 2. Delete removed stops
      for (const id of deletedStopIds) {
        await deleteStop(id)
      }

      // 3. Create new stops
      for (const stop of stops) {
        if (!stop.id) {
          await createStop({
            route: routeId,
            order: stop.order,
            warehouse: stop.warehouse,
            arrival_time: stop.arrival_time,
            departure_time: stop.departure_time,
            status: stop.status,
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ["routes"] })
      queryClient.invalidateQueries({ queryKey: ["routes", routeId] })
      toast.success("Ruta actualizada exitosamente")
      router.push("/routes")
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        const apiData = err.response.data as Record<string, string | string[]>
        const formFields: Set<string> = new Set([
          "name", "transport", "driver", "start_date", "end_date", "status",
        ])
        for (const [field, msgs] of Object.entries(apiData)) {
          if (!formFields.has(field)) continue
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
          setErrors((prev) => ({ ...prev, [field]: msg }))
        }
      }
      toast.error("Error al guardar la ruta. Revisa los campos marcados.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid =
    formName &&
    formTransport &&
    formDriver &&
    formStartDate &&
    stops.length > 0

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/routes"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver a Rutas
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Editar Ruta: {route.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Modifica los datos de la ruta y sus paradas
        </p>
      </div>

      {/* ── Header Form ── */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-6">Datos de la Ruta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 — Name (full width) */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="name">
              Nombre de la Ruta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                clearError("name")
              }}
              placeholder="Ruta Lima-Cusco"
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <Label htmlFor="transport">
              Vehículo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formTransport}
              onValueChange={(val) => {
                setFormTransport(val ?? "")
                clearError("transport")
              }}
              items={transportItems}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vehículo…" />
              </SelectTrigger>
              <SelectContent>
                {transports?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.plate} (#{t.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transport && (
              <p className="text-sm text-destructive">{errors.transport}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver">
              Conductor <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formDriver}
              onValueChange={(val) => {
                setFormDriver(val ?? "")
                clearError("driver")
              }}
              items={driverItems}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar conductor…" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    Conductor #{d.id} ({d.license_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver && (
              <p className="text-sm text-destructive">{errors.driver}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formStatus}
              onValueChange={(val) => setFormStatus(val ?? "planned")}
              items={routeStatusItems}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routeStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <Label htmlFor="start_date">
              Fecha Inicio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start_date"
              type="datetime-local"
              value={formStartDate}
              onChange={(e) => {
                setFormStartDate(e.target.value)
                clearError("start_date")
              }}
              required
            />
            {errors.start_date && (
              <p className="text-sm text-destructive">{errors.start_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha Fin</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formEndDate}
              onChange={(e) => {
                setFormEndDate(e.target.value)
                clearError("end_date")
              }}
            />
            {errors.end_date && (
              <p className="text-sm text-destructive">{errors.end_date}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stops Section ── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Paradas de la Ruta</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={openStopDialog}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar Parada
          </Button>
        </div>

        {errors.stops && (
          <p className="text-sm text-destructive mb-2">{errors.stops}</p>
        )}

        {stops.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Agrega al menos una parada a la ruta
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Orden</th>
                  <th className="text-left py-3 px-4 font-medium">Almacén</th>
                  <th className="text-left py-3 px-4 font-medium">Llegada</th>
                  <th className="text-left py-3 px-4 font-medium">Salida</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((stop) => {
                  const warehouse = warehouses?.find(
                    (w) => w.id === stop.warehouse
                  )
                  return (
                    <tr
                      key={stop.tempId}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">{stop.order}</td>
                      <td className="py-3 px-4">
                        {warehouse?.name ?? `Almacén #${stop.warehouse}`}
                      </td>
                      <td className="py-3 px-4">
                        {stop.arrival_time
                          ? new Date(stop.arrival_time).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {stop.departure_time
                          ? new Date(stop.departure_time).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <StopStatusBadge status={stop.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveStop(stop.tempId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>

      {/* ── Add Stop Dialog ── */}
      <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar Parada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stop_order">
                Orden <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stop_order"
                type="number"
                min="1"
                value={newStopOrder}
                onChange={(e) => setNewStopOrder(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop_warehouse">
                Almacén <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newStopWarehouse}
                onValueChange={(val) => setNewStopWarehouse(val ?? "")}
                items={warehouseItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén…" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} (#{w.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop_arrival">Llegada (opcional)</Label>
              <Input
                id="stop_arrival"
                type="datetime-local"
                value={newStopArrival}
                onChange={(e) => setNewStopArrival(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop_departure">Salida (opcional)</Label>
              <Input
                id="stop_departure"
                type="datetime-local"
                value={newStopDeparture}
                onChange={(e) => setNewStopDeparture(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop_status">Estado</Label>
              <Select
                value={newStopStatus}
                onValueChange={(val) => setNewStopStatus(val ?? "pending")}
                items={stopStatusItems}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stopStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddStop}
              disabled={!newStopWarehouse || !newStopOrder}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Page Component ──

export default function EditRoutePage() {
  const router = useRouter()
  const params = useParams()
  const routeId = Number(params.id)

  const { data: route, isLoading, isError } = useRoute(routeId)
  const { data: transports } = useTransports()
  const { data: drivers } = useDrivers()
  const { data: warehouses } = useWarehouses()

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando ruta…</p>
      </div>
    )
  }

  // ── Error state ──

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-lg font-bold text-destructive">!</span>
        </div>
        <div>
          <p className="font-medium text-destructive">Error al cargar la ruta</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexión con el servidor e intenta nuevamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/routes")}
          >
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // ── Not found state ──

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="font-medium text-muted-foreground">Ruta no encontrada</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/routes")}
        >
          Volver a rutas
        </Button>
      </div>
    )
  }

  // ── Render form with key to force remount on data change ──

  return (
    <RouteEditForm
      key={route.id}
      route={route}
      transports={transports}
      drivers={drivers}
      warehouses={warehouses}
      routeId={routeId}
      onCancel={() => router.push("/routes")}
    />
  )
}
