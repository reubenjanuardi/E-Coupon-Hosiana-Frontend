import { api } from "./client";

/**
 * Verification API Response Types
 */
export interface VerificationResponse {
  type: "BOOK" | "COUPON";
  code: string;
  status: "pending_payment" | "pending_verification" | "verified" | "merge" | "sent" | "available" | "void" | string;
  bookCode: string;
  owner: {
    name: string;
    phone: string;
  } | null;
}

export interface VerificationError {
  error: string;
}

/**
 * Verify a coupon book or individual coupon code
 * @param code - BUKU-00001 or KPN-00007 format
 * @returns Verification data with status and owner information
 */
export async function verifyCoupon(code: string): Promise<VerificationResponse> {
  const { data } = await api.get<VerificationResponse>(`/verification/${code}`);
  return data;
}
