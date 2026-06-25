import api from "@/lib/axios";
import type { User, PaginatedResponse } from "@/types/api";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export interface AdminUserListParams {
  page?: number;
  search?: string;
  ordering?: string;
}

export async function fetchAdminUsers(
  params: AdminUserListParams = {}
): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>("/api/users/", {
    params,
  });
  return data;
}

export async function fetchAdminUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/api/users/${id}/`);
  return data;
}

export async function createAdminUser(
  payload: UserCreatePayload
): Promise<User> {
  const { data } = await api.post<User>("/api/users/", payload);
  return data;
}

export async function updateAdminUser(
  id: number,
  payload: UserUpdatePayload
): Promise<User> {
  // Usamos PATCH para actualización parcial
  const { data } = await api.patch<User>(`/api/users/${id}/`, payload);
  return data;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}/`);
}
