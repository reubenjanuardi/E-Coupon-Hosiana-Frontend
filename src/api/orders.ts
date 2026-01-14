import { api } from "./client";

export async function createOrder(payload: any) {
  const res = await api.post("/orders", payload);
  return res.data;
}

export async function cancelOrder(orderId: string) {
  const res = await api.post(`/orders/${orderId}/cancel`);
  return res.data;
}
