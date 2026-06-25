import api from "@/lib/axios";
import type { Order, OrderCreatePayload } from "@/types/api";

export async function createOrder(payload: OrderCreatePayload): Promise<Order> {
  const { data } = await api.post<Order>("/api/orders/", payload);
  return data;
}
