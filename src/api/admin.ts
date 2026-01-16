import { api } from "./client";

export interface DashboardStats {
    availableBooks: number;
    soldBooks: number;
    pendingVerificationOrders: number;
    pendingPaymentOrders: number;
}

export interface AdminOrder {
    orderId: string;
    payabyleAmount: number; // Matches DB typo
    uniqueCode: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: {
        namaLengkap: string;
        nomorWhatsApp: string;
        asalPembeli: string;
        wilayah?: { nama_wilayah: string };
        gereja?: { nama_gereja: string };
    };
    payments?: { id: string; fileUrl: string; uploadedAt: string }[];
}

export interface OrderListResponse {
    data: AdminOrder[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const getDashboardStats = async () => {
    const response = await api.get<{ data: DashboardStats }>("/admin/stats");
    return response.data.data;
};

export const getOrders = async (params: { page: number; limit: number; status?: string; search?: string; sort?: string }) => {
    const response = await api.get<OrderListResponse>("/admin/orders", { params });
    return response.data;
};

export const verifyOrder = async (orderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/verify`);
    return response.data;
};

export const rejectOrder = async (orderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/reject`);
    return response.data;
};
