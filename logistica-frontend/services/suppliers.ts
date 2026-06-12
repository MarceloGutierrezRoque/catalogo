import api from "@/lib/axios"
import type { Supplier } from "@/types/api"

// ── API functions ──

export function getSuppliers() {
  return api.get<Supplier[]>("/suppliers/").then((r) => r.data)
}

export function getSupplier(id: number) {
  return api.get<Supplier>(`/suppliers/${id}/`).then((r) => r.data)
}

export function createSupplier(data: Partial<Supplier>) {
  return api.post<Supplier>("/suppliers/", data).then((r) => r.data)
}

export function updateSupplier(id: number, data: Partial<Supplier>) {
  return api.put<Supplier>(`/suppliers/${id}/`, data).then((r) => r.data)
}

export function patchSupplier(id: number, data: Partial<Supplier>) {
  return api.patch<Supplier>(`/suppliers/${id}/`, data).then((r) => r.data)
}

export function deleteSupplier(id: number) {
  return api.delete(`/suppliers/${id}/`).then((r) => r.data)
}
