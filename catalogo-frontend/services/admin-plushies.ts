import api from "@/lib/axios";
import type { Plushie, PaginatedResponse } from "@/types/api";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

export interface AdminPlushieListParams {
  page?: number;
  search?: string;
  ordering?: string;
}

/**
 * Construye FormData para crear/actualizar plushies con imagen.
 * Si image es null, envía el campo como string vacío para limpiar.
 * Si image es undefined, no lo incluye (no cambia).
 */
function buildFormData(data: AdminPlushieCreatePayload | AdminPlushieUpdatePayload): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "image" && value === null) {
      // Enviar string vacío para limpiar la imagen
      formData.append(key, "");
    } else if (key === "image" && value instanceof File) {
      formData.append(key, value);
    } else if (value !== null) {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export async function fetchAdminPlushies(
  params: AdminPlushieListParams = {}
): Promise<PaginatedResponse<Plushie>> {
  const { data } = await api.get<PaginatedResponse<Plushie>>("/api/admin/plushies/", {
    params,
  });
  return data;
}

export async function fetchAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.get<Plushie>(`/api/admin/plushies/${id}/`);
  return data;
}

export async function createAdminPlushie(
  payload: AdminPlushieCreatePayload
): Promise<Plushie> {
  const formData = buildFormData(payload);
  const { data } = await api.post<Plushie>("/api/admin/plushies/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAdminPlushie(
  id: number,
  payload: AdminPlushieUpdatePayload
): Promise<Plushie> {
  const formData = buildFormData(payload);
  const { data } = await api.put<Plushie>(`/api/admin/plushies/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteAdminPlushie(id: number): Promise<void> {
  await api.delete(`/api/admin/plushies/${id}/`);
}

export async function activateAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.patch<Plushie>(`/api/admin/plushies/${id}/activate/`);
  return data;
}

export async function deactivateAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.patch<Plushie>(`/api/admin/plushies/${id}/deactivate/`);
  return data;
}
