import { api } from "./client";

export async function getQris(orderId: string) {
  const res = await api.get(`/payments/qris/${orderId}`);
  return res.data;
}

export async function uploadPaymentEvidence(orderId: string, file: File) {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("file", file);

  const res = await api.post("/payments/evidence", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}
