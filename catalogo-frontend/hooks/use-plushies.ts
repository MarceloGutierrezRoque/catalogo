import { useQuery } from "@tanstack/react-query";
import { fetchPlushies, fetchPlushie } from "@/services/plushies";
import type { PlushieListParams } from "@/services/plushies";

export const plushieKeys = {
  all: ["plushies"] as const,
  lists: () => [...plushieKeys.all, "list"] as const,
  list: (params: PlushieListParams) => [...plushieKeys.lists(), params] as const,
  details: () => [...plushieKeys.all, "detail"] as const,
  detail: (id: number) => [...plushieKeys.details(), id] as const,
};

export function usePlushies(params: PlushieListParams = {}) {
  return useQuery({
    queryKey: plushieKeys.list(params),
    queryFn: () => fetchPlushies(params),
  });
}

export function usePlushie(id: number) {
  return useQuery({
    queryKey: plushieKeys.detail(id),
    queryFn: () => fetchPlushie(id),
    enabled: !!id && id > 0,
  });
}
