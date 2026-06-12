import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  activateTransport,
} from "@/services/transports"
import type { Transport } from "@/types/api"

export function useTransports() {
  return useQuery({
    queryKey: ["transports"],
    queryFn: getTransports,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTransport(id: number) {
  return useQuery({
    queryKey: ["transports", id],
    queryFn: () => getTransport(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Transport>) => createTransport(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el vehículo")
    },
  })
}

export function useUpdateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transport> }) =>
      updateTransport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el vehículo")
    },
  })
}

export function useDeleteTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTransport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el vehículo")
    },
  })
}

export function useActivateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activateTransport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transports"] })
      toast.success("Vehículo activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el vehículo")
    },
  })
}
