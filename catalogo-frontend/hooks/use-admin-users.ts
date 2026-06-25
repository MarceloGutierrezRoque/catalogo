import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminUsers,
  fetchAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/services/admin-users";
import type { AdminUserListParams } from "@/services/admin-users";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (params: AdminUserListParams) => [...adminUserKeys.lists(), params] as const,
  details: () => [...adminUserKeys.all, "detail"] as const,
  detail: (id: number) => [...adminUserKeys.details(), id] as const,
};

export function useAdminUsers(params: AdminUserListParams = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
  });
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => fetchAdminUser(id),
    enabled: !!id && id > 0,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createAdminUser(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      toast.success(`Usuario "${user.username}" creado exitosamente`);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; username?: string[]; email?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        "Error al crear el usuario";
      toast.error(message);
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdatePayload }) =>
      updateAdminUser(id, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(user.id) });
      toast.success(`Usuario "${user.username}" actualizado`);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; username?: string[]; email?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        "Error al actualizar el usuario";
      toast.error(message);
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      toast.success("Usuario desactivado");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err?.response?.data?.detail ||
        "Error al desactivar el usuario";
      toast.error(message);
    },
  });
}
