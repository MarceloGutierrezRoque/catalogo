import api from "@/lib/axios"
import type { Product, PaginatedResponse } from "@/types/api"

export function getProducts() {
  return api.get<Product[] | PaginatedResponse<Product>>("/products/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getProduct(id: number) {
  return api.get<Product>(`/products/${id}/`).then((r) => r.data)
}

export function createProduct(data: Partial<Product>) {
  return api.post<Product>("/products/", data).then((r) => r.data)
}

export function updateProduct(id: number, data: Partial<Product>) {
  return api.put<Product>(`/products/${id}/`, data).then((r) => r.data)
}

export function patchProduct(id: number, data: Partial<Product>) {
  return api.patch<Product>(`/products/${id}/`, data).then((r) => r.data)
}

export function deleteProduct(id: number) {
  return api.delete(`/products/${id}/`).then((r) => r.data)
}
