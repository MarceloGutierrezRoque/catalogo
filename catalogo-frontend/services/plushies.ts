import api from "@/lib/axios";
import type { Plushie, PaginatedResponse } from "@/types/api";

export interface PlushieListParams {
  page?: number;
  search?: string;
}

export async function fetchPlushies(params: PlushieListParams = {}): Promise<PaginatedResponse<Plushie>> {
  const { data } = await api.get<PaginatedResponse<Plushie>>("/api/plushies/", { params });
  return data;
}

export async function fetchPlushie(id: number): Promise<Plushie> {
  const { data } = await api.get<Plushie>(`/api/plushies/${id}/`);
  return data;
}

export async function registerPlushieClick(id: number): Promise<void> {
  await api.post(`/api/plushies/${id}/register_click/`);
}
