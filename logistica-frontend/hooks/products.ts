import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
} from "@/services/products"
import type { Product } from "@/types/api"

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Product>) => createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el producto")
    },
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el producto")
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el producto")
    },
  })
}

export function useActivateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => patchProduct(id, { is_active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto activado exitosamente")
    },
    onError: () => {
      toast.error("Error al activar el producto")
    },
  })
}
