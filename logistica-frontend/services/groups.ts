import api from "@/lib/axios"
import type { Group, PaginatedResponse } from "@/types/api"

export function getGroups() {
  return api.get<Group[] | PaginatedResponse<Group>>("/auth/groups/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getGroup(id: number) {
  return api.get<Group>(`/auth/groups/${id}/`).then((r) => r.data)
}

export function createGroup(data: Partial<Group>) {
  return api.post<Group>("/auth/groups/", data).then((r) => r.data)
}

export function updateGroup(id: number, data: Partial<Group>) {
  return api.put<Group>(`/auth/groups/${id}/`, data).then((r) => r.data)
}

export function deleteGroup(id: number) {
  return api.delete(`/auth/groups/${id}/`).then((r) => r.data)
}
