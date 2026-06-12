import api from "@/lib/axios"
import type { Transport, PaginatedResponse } from "@/types/api"

// ── API functions ──

export function getTransports() {
  return api.get<Transport[] | PaginatedResponse<Transport>>("/transports/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getTransport(id: number) {
  return api.get<Transport>(`/transports/${id}/`).then((r) => r.data)
}

export function createTransport(data: Partial<Transport>) {
  return api.post<Transport>("/transports/", data).then((r) => r.data)
}

export function updateTransport(id: number, data: Partial<Transport>) {
  return api.put<Transport>(`/transports/${id}/`, data).then((r) => r.data)
}

export function deleteTransport(id: number) {
  return api.delete(`/transports/${id}/`).then((r) => r.data)
}

export function activateTransport(id: number) {
  return api.patch<Transport>(`/transports/${id}/`, { is_active: true }).then((r) => r.data)
}
