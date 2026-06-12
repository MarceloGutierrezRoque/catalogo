import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  patchShipment,
  getShipmentItems,
  createShipmentItem,
  deleteShipmentItem,
} from "@/services/shipments"
import type { Shipment } from "@/types/api"

// ── Shipment hooks ──

export function useShipments() {
  return useQuery({
    queryKey: ["shipments"],
    queryFn: getShipments,
    staleTime: 5 * 60 * 1000,
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ["shipments", id],
    queryFn: () => getShipment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Shipment>) => createShipment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el envío")
    },
  })
}

export function useUpdateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Shipment> }) =>
      updateShipment(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      qc.invalidateQueries({ queryKey: ["shipments", variables.id] })
      toast.success("Envío actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el envío")
    },
  })
}

export function useDeleteShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShipment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el envío")
    },
  })
}

export function useActivateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patchShipment(id, { is_active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el envío")
    },
  })
}

// ── ShipmentItem hooks ──

export function useShipmentItems(shipmentId: number | undefined) {
  return useQuery({
    queryKey: ["shipment-items", shipmentId],
    queryFn: () => getShipmentItems(shipmentId),
    enabled: !!shipmentId,
  })
}

export function useCreateShipmentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      shipment: number
      product: number
      quantity: number
      unit_price_at_shipping?: string
    }) => createShipmentItem(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      qc.invalidateQueries({ queryKey: ["shipments", variables.shipment] })
      toast.success("Producto agregado al envío")
    },
    onError: () => {
      toast.error("Error al agregar el producto")
    },
  })
}

export function useDeleteShipmentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShipmentItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Producto eliminado del envío")
    },
    onError: () => {
      toast.error("Error al eliminar el producto")
    },
  })
}
