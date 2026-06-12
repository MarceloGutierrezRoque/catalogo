import api from "@/lib/axios"
import type { Driver, PaginatedResponse } from "@/types/api"

export function getDrivers() {
  return api.get<Driver[] | PaginatedResponse<Driver>>("/drivers/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getDriver(id: number) {
  return api.get<Driver>(`/drivers/${id}/`).then((r) => r.data)
}

export function createDriver(data: Partial<Driver>) {
  return api.post<Driver>("/drivers/", data).then((r) => r.data)
}

export function updateDriver(id: number, data: Partial<Driver>) {
  return api.put<Driver>(`/drivers/${id}/`, data).then((r) => r.data)
}

export function deleteDriver(id: number) {
  return api.delete(`/drivers/${id}/`).then((r) => r.data)
}

export function activateDriver(id: number) {
  return api.patch<Driver>(`/drivers/${id}/`, { is_active: true }).then((r) => r.data)
}
