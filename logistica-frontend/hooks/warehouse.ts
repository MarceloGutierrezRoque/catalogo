import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  activateWarehouse,
} from "@/services/warehouse"
import type { Warehouse } from "@/types/api"

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
    staleTime: 5 * 60 * 1000,
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => getWarehouse(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Warehouse>) => createWarehouse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el almacén")
    },
  })
}

export function useUpdateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Warehouse> }) =>
      updateWarehouse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el almacén")
    },
  })
}

export function useDeleteWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el almacén")
    },
  })
}

export function useActivateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activateWarehouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el almacén")
    },
  })
}
