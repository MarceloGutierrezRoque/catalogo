import api from "@/lib/axios"
import type { Shipment, ShipmentItem, PaginatedResponse } from "@/types/api"

// ── Shipment API ──

export function getShipments() {
  return api.get<Shipment[] | PaginatedResponse<Shipment>>("/shipments/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getShipment(id: number) {
  return api.get<Shipment>(`/shipments/${id}/`).then((r) => r.data)
}

export function createShipment(data: Partial<Shipment>) {
  return api.post<Shipment>("/shipments/", data).then((r) => r.data)
}

export function updateShipment(id: number, data: Partial<Shipment>) {
  return api.put<Shipment>(`/shipments/${id}/`, data).then((r) => r.data)
}

export function deleteShipment(id: number) {
  return api.delete(`/shipments/${id}/`).then((r) => r.data)
}

export function patchShipment(id: number, data: Partial<Shipment>) {
  return api.patch<Shipment>(`/shipments/${id}/`, data).then((r) => r.data)
}

// ── ShipmentItem API ──

export function getShipmentItems(shipmentId?: number) {
  const params = shipmentId ? { shipment: shipmentId } : {}
  return api.get<ShipmentItem[] | PaginatedResponse<ShipmentItem>>("/shipment-items/", { params }).then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function createShipmentItem(data: { shipment: number; product: number; quantity: number; unit_price_at_shipping?: string }) {
  return api.post<ShipmentItem>("/shipment-items/", data).then((r) => r.data)
}

export function deleteShipmentItem(id: number) {
  return api.delete(`/shipment-items/${id}/`).then((r) => r.data)
}
