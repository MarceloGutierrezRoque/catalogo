import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  activateDriver,
} from "@/services/drivers"
import type { Driver } from "@/types/api"

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: getDrivers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => getDriver(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Driver>) => createDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el conductor")
    },
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Driver> }) =>
      updateDriver(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el conductor")
    },
  })
}

export function useDeleteDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el conductor")
    },
  })
}

export function useActivateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activateDriver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el conductor")
    },
  })
}
