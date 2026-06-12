import api from "@/lib/axios"
import type { Warehouse, PaginatedResponse } from "@/types/api"

// ── API functions ──

export function getWarehouses() {
  return api.get<Warehouse[] | PaginatedResponse<Warehouse>>("/warehouses/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getWarehouse(id: number) {
  return api.get<Warehouse>(`/warehouses/${id}/`).then((r) => r.data)
}

export function createWarehouse(data: Partial<Warehouse>) {
  return api.post<Warehouse>("/warehouses/", data).then((r) => r.data)
}

export function updateWarehouse(id: number, data: Partial<Warehouse>) {
  return api.put<Warehouse>(`/warehouses/${id}/`, data).then((r) => r.data)
}

export function deleteWarehouse(id: number) {
  return api.delete(`/warehouses/${id}/`).then((r) => r.data)
}

export function activateWarehouse(id: number) {
  return api.patch<Warehouse>(`/warehouses/${id}/`, { is_active: true }).then((r) => r.data)
}
