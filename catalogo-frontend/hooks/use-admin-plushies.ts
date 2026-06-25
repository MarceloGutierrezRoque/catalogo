import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminPlushies,
  fetchAdminPlushie,
  createAdminPlushie,
  updateAdminPlushie,
  deleteAdminPlushie,
  activateAdminPlushie,
  deactivateAdminPlushie,
} from "@/services/admin-plushies";
import type { AdminPlushieListParams } from "@/services/admin-plushies";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

export const adminPlushieKeys = {
  all: ["admin-plushies"] as const,
  lists: () => [...adminPlushieKeys.all, "list"] as const,
  list: (params: AdminPlushieListParams) => [...adminPlushieKeys.lists(), params] as const,
  details: () => [...adminPlushieKeys.all, "detail"] as const,
  detail: (id: number) => [...adminPlushieKeys.details(), id] as const,
};

export function useAdminPlushies(params: AdminPlushieListParams = {}) {
  return useQuery({
    queryKey: adminPlushieKeys.list(params),
    queryFn: () => fetchAdminPlushies(params),
  });
}

export function useAdminPlushie(id: number) {
  return useQuery({
    queryKey: adminPlushieKeys.detail(id),
    queryFn: () => fetchAdminPlushie(id),
    enabled: !!id && id > 0,
  });
}

export function useCreateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminPlushieCreatePayload) => createAdminPlushie(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      toast.success("Peluche creado exitosamente");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; name?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.name?.[0] ||
        "Error al crear el peluche";
      toast.error(message);
    },
  });
}

export function useUpdateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminPlushieUpdatePayload }) =>
      updateAdminPlushie(id, data),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche actualizado exitosamente");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; name?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.name?.[0] ||
        "Error al actualizar el peluche";
      toast.error(message);
    },
  });
}

export function useDeleteAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminPlushie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      toast.success("Peluche eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar el peluche");
    },
  });
}

export function useActivateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activateAdminPlushie(id),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche activado");
    },
    onError: () => {
      toast.error("Error al activar el peluche");
    },
  });
}

export function useDeactivateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateAdminPlushie(id),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche desactivado");
    },
    onError: () => {
      toast.error("Error al desactivar el peluche");
    },
  });
}
