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
        wilayahId?: number;
        gerejaId?: number;
        wilayah?: { nama_wilayah: string };
        gereja?: { nama_gereja: string };
    };
    payments?: { id: string; fileUrl: string; uploadedAt: string }[];
    isChurchOrder: boolean;
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

export interface OrderDetail extends AdminOrder {
    couponBooks: {
        id: string;
        bookCode: string;
        status: string;
    }[];
}

export const getOrderById = async (orderId: string) => {
    const response = await api.get<{ data: OrderDetail }>(`/admin/orders/${orderId}`);
    return response.data;
};

// New Endpoints

export const mergeOrderPdfs = async (orderId: string) => {
    // ResponseType 'blob' is crucial for PDF downloads
    const response = await api.post(`/admin/orders/${orderId}/merge-pdf`, {}, { responseType: 'blob' });
    return response.data; // Blob
};

export const markOrderSent = async (orderId: string) => {
    const response = await api.post(`/admin/orders/${orderId}/mark-sent`);
    return response.data;
};

export const getWhatsAppMessage = async (orderId: string) => {
    const response = await api.get<{ data: { phoneNumber: string; message: string } }>(`/admin/orders/${orderId}/whatsapp-message`);
    return response.data;
};

// Superadmin CRUD
export const createOrder = async (data: any) => {
    const response = await api.post("/admin/orders", data);
    return response.data;
};

export const updateOrder = async (orderId: string, data: any) => {
    const response = await api.put(`/admin/orders/${orderId}`, data);
    return response.data;
};

export const deleteOrder = async (orderId: string) => {
    const response = await api.delete(`/admin/orders/${orderId}`);
    return response.data;
};

export const toggleChurchOrder = async (orderId: string) => {
    const response = await api.patch(`/admin/orders/${orderId}/toggle-church`);
    return response.data;
};
