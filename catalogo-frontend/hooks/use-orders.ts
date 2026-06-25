import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrder } from "@/services/orders";
import type { OrderCreatePayload } from "@/types/api";

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload: OrderCreatePayload) => createOrder(payload),
    onError: (error: Error) => {
      const err = error as { response?: { data?: Record<string, string | string[]> } };
      const data = err?.response?.data;
      let message = "Error al crear el pedido. Intenta nuevamente.";
      if (data) {
        if (typeof data === "string") {
          message = data;
        } else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          message = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
        }
      }
      toast.error(message);
    },
  });
}
