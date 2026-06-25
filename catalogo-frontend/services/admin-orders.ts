import api from "@/lib/axios";
import type { Order, PaginatedResponse } from "@/types/api";

export interface AdminOrderListParams {
  page?: number;
  status?: string;
  ordering?: string;
}

export async function fetchAdminOrders(
  params: AdminOrderListParams = {}
): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>("/api/admin/orders/", {
    params,
  });
  return data;
}

export async function fetchAdminOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/api/admin/orders/${id}/`);
  return data;
}

export async function updateAdminOrderStatus(
  id: number,
  payload: { status: string }
): Promise<Order> {
  const { data } = await api.patch<Order>(`/api/admin/orders/${id}/`, payload);
  return data;
}

export async function deleteAdminOrder(id: number): Promise<void> {
  await api.delete(`/api/admin/orders/${id}/`);
}
