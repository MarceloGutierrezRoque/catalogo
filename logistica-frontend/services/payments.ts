import api from "@/lib/axios"
import type { CheckoutSessionRequest, CheckoutSessionResponse, Payment } from "@/types/api"

export function createCheckoutSession(data: CheckoutSessionRequest) {
  return api.post<CheckoutSessionResponse>("/payments/create-checkout-session/", data).then((r) => r.data)
}

export function getPayments() {
  return api.get<Payment[]>("/payments/").then((r) => r.data)
}

export function getPayment(id: number) {
  return api.get<Payment>(`/payments/${id}/`).then((r) => r.data)
}
