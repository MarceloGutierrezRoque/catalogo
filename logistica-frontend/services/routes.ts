import api from "@/lib/axios"
import type { Route, Stop, PaginatedResponse } from "@/types/api"

// ── Route API ──

export function getRoutes() {
  return api.get<Route[] | PaginatedResponse<Route>>("/routes/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getRoute(id: number) {
  return api.get<Route>(`/routes/${id}/`).then((r) => r.data)
}

export function createRoute(data: Partial<Route>) {
  return api.post<Route>("/routes/", data).then((r) => r.data)
}

export function updateRoute(id: number, data: Partial<Route>) {
  return api.put<Route>(`/routes/${id}/`, data).then((r) => r.data)
}

export function deleteRoute(id: number) {
  return api.delete(`/routes/${id}/`).then((r) => r.data)
}

export function activateRoute(id: number) {
  return api.patch<Route>(`/routes/${id}/`, { is_active: true }).then((r) => r.data)
}

// ── Stop API ──

export function createStop(data: {
  route: number
  order: number
  warehouse: number
  arrival_time?: string | null
  departure_time?: string | null
  status?: string
}) {
  return api.post<Stop>("/stops/", data).then((r) => r.data)
}

export function deleteStop(id: number) {
  return api.delete(`/stops/${id}/`).then((r) => r.data)
}
