"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useShipment } from "@/hooks/shipments"
import { useCustomers } from "@/hooks/customers"
import { useWarehouses } from "@/hooks/warehouse"
import { useProducts } from "@/hooks/products"
import { isAxiosError } from "axios"
import {
  updateShipment,
  createShipmentItem,
  deleteShipmentItem,
} from "@/services/shipments"
import { useRoutes } from "@/hooks/routes"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Trash2, Plus, Loader2 } from "lucide-react"
import type { Shipment, Customer, Warehouse, Product, Route } from "@/types/api"

// ── Types ──

interface ShipmentItemDraft {
  tempId: string
  id?: number
  product: number
  quantity: number
  unit_price_at_shipping: string
}

interface FormErrors {
  tracking_number?: string
  customer?: string
  origin_warehouse?: string
  destination_address?: string
  destination_city?: string
  destination_country?: string
  route?: string
  items?: string
}

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "picked_up", label: "Recogido" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

const shipmentStatusItems: Record<string, string> = {
  pending: "Pendiente",
  picked_up: "Recogido",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

// ── Form Component ──

function ShipmentEditForm({
  shipment,
  customers,
  warehouses,
  products,
  routes,
  shipmentId,
  onCancel,
}: {
  shipment: Shipment
  customers: Customer[] | undefined
  warehouses: Warehouse[] | undefined
  products: Product[] | undefined
  routes: Route[] | undefined
  shipmentId: number
  onCancel: () => void
}) {
  const customerItems = useMemo(
    () => Object.fromEntries((customers ?? []).map((c) => [String(c.id), c.name])),
    [customers],
  )
  const warehouseItems = useMemo(
    () => Object.fromEntries((warehouses ?? []).map((w) => [String(w.id), w.name])),
    [warehouses],
  )
  const routeItems = useMemo(
    () => Object.fromEntries((routes ?? []).map((r) => [String(r.id), r.name])),
    [routes],
  )
  const productItems = useMemo(
    () => Object.fromEntries((products ?? []).map((p) => [String(p.id), `${p.name} (SKU: ${p.sku})`])),
    [products],
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  // ── Header form state (initialized from props) ──
  const [formTracking, setFormTracking] = useState(shipment.tracking_number)
  const [formCustomer, setFormCustomer] = useState(String(shipment.customer))
  const [formOriginWarehouse, setFormOriginWarehouse] = useState(String(shipment.origin_warehouse))
  const [formDestAddress, setFormDestAddress] = useState(shipment.destination_address)
  const [formDestCity, setFormDestCity] = useState(shipment.destination_city)
  const [formDestCountry, setFormDestCountry] = useState(shipment.destination_country)
  const [formStatus, setFormStatus] = useState(shipment.status)
  const [formShippingDate, setFormShippingDate] = useState(shipment.shipping_date ?? "")
  const [formEstimatedDelivery, setFormEstimatedDelivery] = useState(shipment.estimated_delivery_date ?? "")
  const [formRoute, setFormRoute] = useState(shipment.route ? String(shipment.route) : "")
  const [formObservations, setFormObservations] = useState(shipment.observations ?? "")

  // ── Items state ──
  const [items, setItems] = useState<ShipmentItemDraft[]>(
    shipment.items.map((item) => ({
      tempId: crypto.randomUUID(),
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      unit_price_at_shipping: item.unit_price_at_shipping,
    }))
  )
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([])
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [newItemProduct, setNewItemProduct] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")

  // ── Submit state ──
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Validation ──

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formTracking.trim()) errs.tracking_number = "El tracking es obligatorio"
    if (!formCustomer) errs.customer = "Selecciona un cliente"
    if (!formOriginWarehouse) errs.origin_warehouse = "Selecciona un almacén de origen"
    if (!formDestAddress.trim()) errs.destination_address = "La dirección de destino es obligatoria"
    if (!formDestCity.trim()) errs.destination_city = "La ciudad de destino es obligatoria"
    if (!formDestCountry.trim()) errs.destination_country = "El país de destino es obligatorio"
    if (items.length === 0) errs.items = "Agrega al menos un producto al envío"
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Item handlers ──

  function handleAddItem() {
    if (!newItemProduct || !newItemQuantity) return
    clearError("items")
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        product: Number(newItemProduct),
        quantity: Number(newItemQuantity),
        unit_price_at_shipping: newItemPrice || "",
      },
    ])
    setNewItemProduct("")
    setNewItemQuantity("")
    setNewItemPrice("")
    setItemDialogOpen(false)
  }

  function handleRemoveItem(tempId: string) {
    const removed = items.find((i) => i.tempId === tempId)
    if (removed?.id) {
      setDeletedItemIds((prev) => [...prev, removed.id!])
    }
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }

  // ── Submit ──

  async function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    try {
      const shipmentPayload = {
        tracking_number: formTracking,
        customer: Number(formCustomer),
        origin_warehouse: Number(formOriginWarehouse),
        destination_address: formDestAddress,
        destination_city: formDestCity,
        destination_country: formDestCountry,
        status: formStatus as Shipment["status"],
        shipping_date: formShippingDate || null,
        estimated_delivery_date: formEstimatedDelivery || null,
        route: formRoute ? Number(formRoute) : null,
        observations: formObservations || null,
      }

      // 1. Update header
      await updateShipment(shipmentId, shipmentPayload)

      // 2. Delete removed items (deduplicated)
      for (const id of [...new Set(deletedItemIds)]) {
        await deleteShipmentItem(id)
      }

      // 3. Create new items
      for (const item of items) {
        if (!item.id) {
          await createShipmentItem({
            shipment: shipmentId,
            product: item.product,
            quantity: item.quantity,
            unit_price_at_shipping: item.unit_price_at_shipping || undefined,
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      queryClient.invalidateQueries({ queryKey: ["shipments", shipmentId] })
      toast.success("Envío actualizado exitosamente")
      router.push("/shipments")
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        const apiData = err.response.data as Record<string, string | string[]>
        const formFields: Set<string> = new Set([
          "tracking_number", "customer", "origin_warehouse",
          "destination_address", "destination_city", "destination_country",
          "route",
        ])
        for (const [field, msgs] of Object.entries(apiData)) {
          if (!formFields.has(field)) continue
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
          setErrors((prev) => ({ ...prev, [field]: msg }))
        }
      }
      toast.error("Error al guardar el envío. Revisa los campos marcados.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid =
    formTracking &&
    formCustomer &&
    formOriginWarehouse &&
    formDestAddress &&
    formDestCity &&
    formDestCountry &&
    items.length > 0

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/shipments"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver a Envíos
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Editar Envío: {shipment.tracking_number}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Modifica los datos del envío y sus productos
        </p>
      </div>

      {/* ── Header Form ── */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-6">Datos del Envío</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 */}
          <div className="space-y-2">
            <Label htmlFor="tracking_number">
              Tracking <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tracking_number"
              value={formTracking}
              onChange={(e) => {
                setFormTracking(e.target.value)
                clearError("tracking_number")
              }}
              placeholder="SHP-001"
              required
            />
            {errors.tracking_number && (
              <p className="text-sm text-destructive">{errors.tracking_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formCustomer}
              onValueChange={(val) => {
                setFormCustomer(val ?? "")
                clearError("customer")
              }}
              items={customerItems}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente…" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} (#{c.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer && (
              <p className="text-sm text-destructive">{errors.customer}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin_warehouse">
              Almacén Origen <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formOriginWarehouse}
              onValueChange={(val) => {
                setFormOriginWarehouse(val ?? "")
                clearError("origin_warehouse")
              }}
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
            {errors.origin_warehouse && (
              <p className="text-sm text-destructive">{errors.origin_warehouse}</p>
            )}
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <Label htmlFor="destination_address">
              Dirección Destino <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination_address"
              value={formDestAddress}
              onChange={(e) => {
                setFormDestAddress(e.target.value)
                clearError("destination_address")
              }}
              placeholder="Av. Principal 123"
              required
            />
            {errors.destination_address && (
              <p className="text-sm text-destructive">{errors.destination_address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_city">
              Ciudad Destino <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination_city"
              value={formDestCity}
              onChange={(e) => {
                setFormDestCity(e.target.value)
                clearError("destination_city")
              }}
              placeholder="Cusco"
              required
            />
            {errors.destination_city && (
              <p className="text-sm text-destructive">{errors.destination_city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_country">
              País Destino <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination_country"
              value={formDestCountry}
              onChange={(e) => {
                setFormDestCountry(e.target.value)
                clearError("destination_country")
              }}
              placeholder="Perú"
              required
            />
            {errors.destination_country && (
              <p className="text-sm text-destructive">{errors.destination_country}</p>
            )}
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formStatus}
              onValueChange={(val) => setFormStatus(val ?? "pending")}
              items={shipmentStatusItems}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_date">Fecha de Envío</Label>
            <Input
              id="shipping_date"
              type="date"
              value={formShippingDate}
              onChange={(e) => setFormShippingDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_delivery">Fecha Est. Entrega</Label>
            <Input
              id="estimated_delivery"
              type="date"
              value={formEstimatedDelivery}
              onChange={(e) => setFormEstimatedDelivery(e.target.value)}
            />
          </div>

          {/* Row 4 */}
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="route">Ruta (ID)</Label>
            <Select
              value={formRoute}
              onValueChange={(val) => {
                setFormRoute(val ?? "")
                clearError("route")
              }}
              items={routeItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar ruta…" />
              </SelectTrigger>
              <SelectContent>
                {routes?.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name} (#{r.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.route && <p className="text-sm text-destructive">{errors.route}</p>}
          </div>

          {/* Row 5 */}
          <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              value={formObservations}
              onChange={(e) => setFormObservations(e.target.value)}
              placeholder="Observaciones generales del envío…"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* ── Items Section ── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Productos del Envío</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItemDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>

        {errors.items && (
          <p className="text-sm text-destructive mb-2">{errors.items}</p>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Agrega al menos un producto al envío
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Producto</th>
                  <th className="text-left py-3 px-4 font-medium">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Precio Unitario
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = products?.find(
                    (p) => p.id === item.product
                  )
                  return (
                    <tr
                      key={item.tempId}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        {product?.name ?? `Producto #${item.product}`}
                      </td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">
                        {item.unit_price_at_shipping
                          ? `S/ ${Number(item.unit_price_at_shipping).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveItem(item.tempId)}
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

      {/* ── Add Item Dialog ── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="item_product">
                Producto <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newItemProduct}
                onValueChange={(val) => setNewItemProduct(val ?? "")}
                items={productItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto…" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (SKU: {p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_quantity">
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item_quantity"
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_price">Precio Unitario</Label>
              <Input
                id="item_price"
                type="number"
                step="0.01"
                min="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddItem}
              disabled={!newItemProduct || !newItemQuantity}
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

export default function EditShipmentPage() {
  const router = useRouter()
  const params = useParams()
  const shipmentId = Number(params.id)

  const { data: shipment, isLoading, isError } = useShipment(shipmentId)
  const { data: customers } = useCustomers()
  const { data: warehouses } = useWarehouses()
  const { data: products } = useProducts()
  const { data: routes } = useRoutes()

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando envío…</p>
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
          <p className="font-medium text-destructive">Error al cargar el envío</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexión con el servidor e intenta nuevamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/shipments")}
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

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="font-medium text-muted-foreground">Envío no encontrado</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/shipments")}
        >
          Volver a envíos
        </Button>
      </div>
    )
  }

  // ── Render form with key to force remount on data change ──

  return (
    <ShipmentEditForm
      key={shipment.id}
      shipment={shipment}
      customers={customers}
      warehouses={warehouses}
      products={products}
      routes={routes}
      shipmentId={shipmentId}
      onCancel={() => router.push("/shipments")}
    />
  )
}
