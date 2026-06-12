import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
} from "@/services/customers"
import type { Customer } from "@/types/api"

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Customer>) => createCustomer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el cliente")
    },
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el cliente")
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el cliente")
    },
  })
}

export function useActivateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activateCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el cliente")
    },
  })
}
