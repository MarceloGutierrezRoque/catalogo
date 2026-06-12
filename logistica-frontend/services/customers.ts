import api from "@/lib/axios"
import type { Customer, PaginatedResponse } from "@/types/api"

export function getCustomers() {
  return api.get<Customer[] | PaginatedResponse<Customer>>("/customers/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getCustomer(id: number) {
  return api.get<Customer>(`/customers/${id}/`).then((r) => r.data)
}

export function createCustomer(data: Partial<Customer>) {
  return api.post<Customer>("/customers/", data).then((r) => r.data)
}

export function updateCustomer(id: number, data: Partial<Customer>) {
  return api.put<Customer>(`/customers/${id}/`, data).then((r) => r.data)
}

export function deleteCustomer(id: number) {
  return api.delete(`/customers/${id}/`).then((r) => r.data)
}

export function activateCustomer(id: number) {
  return api.patch<Customer>(`/customers/${id}/`, { is_active: true }).then((r) => r.data)
}
