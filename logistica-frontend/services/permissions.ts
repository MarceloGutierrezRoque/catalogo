import api from "@/lib/axios"
import type { Permission, PaginatedResponse } from "@/types/api"

export function getPermissions() {
  return api.get<Permission[] | PaginatedResponse<Permission>>("/auth/permissions/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}
