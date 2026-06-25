import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminOrders,
  fetchAdminOrder,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from "@/services/admin-orders";
import type { AdminOrderListParams } from "@/services/admin-orders";

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (params: AdminOrderListParams) => [...adminOrderKeys.lists(), params] as const,
  details: () => [...adminOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...adminOrderKeys.details(), id] as const,
};

export function useAdminOrders(params: AdminOrderListParams = {}) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => fetchAdminOrders(params),
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => fetchAdminOrder(id),
    enabled: !!id && id > 0,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateAdminOrderStatus(id, { status }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(order.id) });
      toast.success("Estado del pedido actualizado");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err?.response?.data?.detail ||
        "Error al actualizar el estado del pedido";
      toast.error(message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.details() });
      toast.success("Pedido eliminado");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err?.response?.data?.detail ||
        "Error al eliminar el pedido";
      toast.error(message);
    },
  });
}
