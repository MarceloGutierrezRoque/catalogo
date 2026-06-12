import api from "@/lib/axios"
import type { User, Profile, PaginatedResponse } from "@/types/api"

// ── API functions ──

export function getUsers() {
  return api.get<User[] | PaginatedResponse<User>>("/auth/users/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getUser(id: number) {
  return api.get<User>(`/auth/users/${id}/`).then((r) => r.data)
}

export function createUser(data: Partial<User> & { password: string }) {
  return api.post<User>("/auth/users/", data).then((r) => r.data)
}

export function updateUser(id: number, data: Partial<User>) {
  return api.put<User>(`/auth/users/${id}/`, data).then((r) => r.data)
}

export function patchUser(id: number, data: Partial<User>) {
  return api.patch<User>(`/auth/users/${id}/`, data).then((r) => r.data)
}

export function updateMe(data: Partial<Profile>) {
  return api.patch<Profile>("/auth/me/", data).then((r) => r.data)
}

export function deleteUser(id: number) {
  return api.delete(`/auth/users/${id}/`).then((r) => r.data)
}
