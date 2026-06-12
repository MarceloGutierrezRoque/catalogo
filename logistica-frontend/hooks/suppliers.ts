import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  patchSupplier,
  deleteSupplier,
} from "@/services/suppliers"
import type { Supplier } from "@/types/api"

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => getSupplier(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => createSupplier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el proveedor")
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      updateSupplier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el proveedor")
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el proveedor")
    },
  })
}

export function useActivateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patchSupplier(id, { is_active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el proveedor")
    },
  })
}
