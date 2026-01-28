import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { PaymentPanel } from "../components/order/PaymentPanel";
import { uploadPaymentEvidence } from "../api/payments";
import { ThankYouScreen } from "../components/order/ThankYouScreen";

import { Loader2 } from "lucide-react";
import { AlertDialog } from "../components/ui/AlertDialog";
import { cancelOrder } from "../api/orders";

// Types matching backend response
interface OrderData {
  orderId: string;
  totalAmount: number;
  payableAmount: number;
  payabyleAmount?: number; // Backend typo support
  uniqueCode: number;
  bookCount: number;
  expiresAt: string;
  status: string;
  paymentToken?: string;
  customer: {
    namaLengkap: string;
    nomorWhatsApp: string;
  };
}

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!orderId || !token) {
      setError("Link pembayaran tidak valid (ID atau Token hilang).");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        // Fetch order details from backend
        // Note: You might need to add a new API function for this if not exists
        // Converting this fetch to a direct fetch call for now or assume api/orders/:id exists
        // Using fetch directly to demonstrate flow, replace with api client if preferred
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/orders/${orderId}?token=${token}`);
        
        if (!response.ok) {
           if (response.status === 403) throw new Error("Akses ditolak. Token tidak valid.");
           if (response.status === 404) throw new Error("Pesanan tidak ditemukan.");
           throw new Error("Gagal memuat data pesanan.");
        }

        const data = await response.json();
        const orderData = data.order || data; // Handle likely wrapper
        
        // Normalize the typo field
        if (orderData.payabyleAmount && !orderData.payableAmount) {
            orderData.payableAmount = orderData.payabyleAmount;
        }

        if (orderData.status !== "pending_payment") {
           // Redirect or show specific status
           if (orderData.status === "verified" || orderData.status === "pending_verification") {
               setIsCompleted(true);
           }
        }

        setOrder(orderData);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  const handlePaymentSubmit = async (file: File) => {
    if (!order) return;

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      await uploadPaymentEvidence(order.orderId, file);
      // Re-fetch or just update local state
      setIsCompleted(true);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gagal mengunggah bukti pembayaran.";
      setPaymentError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      await cancelOrder(order.orderId);
      navigate("/");
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      // Even if API fails, still navigate back? Or show error? 
      // User wants "cancel order" so usually we try to cancel.
      // If it fails, maybe just go back to home anyway.
       navigate("/");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const handleExpired = () => {
    setError("Waktu pembayaran telah habis. Pesanan dibatalkan otomatis oleh sistem.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h1>
            <p className="text-gray-600">{error}</p>
            <button onClick={() => navigate("/")} className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-800 font-medium">
                Kembali ke Beranda
            </button>
        </div>
      </div>
    );
  }

  if (isCompleted && order) {
      return (
        <div className="min-h-screen bg-gray-50 pt-10">
             {/* Reuse ThankYouScreen or generic status message */}
            <ThankYouScreen orderId={order.orderId} />
        </div>
      );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Pembayaran Pesanan</h1>
        <p className="text-gray-500 text-sm mt-1">ID: {order.orderId}</p>
      </header>

      <PaymentPanel
        orderId={order.orderId}
        baseAmount={order.totalAmount}
        payableAmount={order.payableAmount} // Note: Check typo in backend response (payabyleAmount vs payableAmount)
        uniqueCode={order.uniqueCode}
        bookCount={order.bookCount}
        expiresAt={order.expiresAt}
        onBack={() => setShowCancelDialog(true)}
        onSubmit={handlePaymentSubmit}
        onExpired={handleExpired}
        isSubmitting={isSubmitting}
        errorMessage={paymentError}
      />

       {/* Cancel Order Confirmation Dialog */}
       <AlertDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Batalkan Pesanan?"
        description="Jika anda ingin kembali, maka order ini akan di cancel. Apakah anda ingin meneruskan?"
        cancelText="Tidak, Lanjutkan Bayar"
        confirmText="Ya, Batalkan Order"
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        variant="destructive"
      />
    </div>
  );
};

export default PaymentPage;
