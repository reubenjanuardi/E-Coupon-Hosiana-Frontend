import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stepper } from "../components/order/Stepper";
import { BuyerForm, type BuyerData } from "../components/order/BuyerForm";
import { CouponSelector } from "../components/order/CouponSelector";
import { PaymentPanel } from "../components/order/PaymentPanel";
import { ThankYouScreen } from "../components/order/ThankYouScreen";
import { AlertDialog } from "../components/ui/AlertDialog";
import { createOrder, cancelOrder } from "../api/orders";
import { uploadPaymentEvidence } from "../api/payments";

interface OrderInfo {
  orderId: string;
  totalAmount: number;
  payableAmount: number;
  uniqueCode: number;
  bookCount: number;
  expiresAt: string;
}

const STEPS = ["Data Pembeli", "Pilih Kupon", "Pembayaran"];

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [buyerData, setBuyerData] = useState<BuyerData>({
    fullName: "",
    whatsapp: "",
    origin: "GPIB",
  });
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleBuyerSubmit = (data: BuyerData) => {
    setBuyerData(data);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCouponSelection = (ids: string[]) => {
    setSelectedCoupons(ids);
  };

  const handleCouponSubmit = async () => {
    if (selectedCoupons.length === 0) {
      setOrderError("Pilih minimal 1 buku kupon untuk melanjutkan.");
      return;
    }

    setIsCreatingOrder(true);
    setOrderError(null);
    setPaymentError(null);

    try {
      const payload = {
        selectedBooks: selectedCoupons,
        customer: {
          namaLengkap: buyerData.fullName,
          nomorWhatsApp: buyerData.whatsapp,
          asalPembeli: buyerData.origin,
          wilayahId: buyerData.origin === "GPIB" && buyerData.wilayah ? Number(buyerData.wilayah) : undefined,
          gerejaId: buyerData.origin === "GPIB" && buyerData.church ? Number(buyerData.church) : undefined,
        },
      };

      const response = await createOrder(payload);
      const order = response.data ?? response;
      const data = order.data ?? order;


      // Redirect to dynamic payment page
      navigate(`/payment/${data.orderId}?token=${data.paymentToken}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gagal membuat order. Coba lagi.";
      setOrderError(message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSubmit = async (file: File) => {
    if (!orderInfo) return;

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      await uploadPaymentEvidence(orderInfo.orderId, file);
      setCompletedOrderId(orderInfo.orderId);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gagal mengunggah bukti pembayaran. Coba lagi.";
      setPaymentError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/");
      return;
    }
    // If on payment step, show confirmation dialog before cancelling
    // Note: Step 3 is now external, so this logic might be redundant if we don't use step 3 anymore.
    // However, if we keep the steps array for visual consistency, we just stop at step 2.
    if (currentStep === 3 && orderInfo) {
      setShowCancelDialog(true);
      return;
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmCancel = async () => {
    if (!orderInfo) return;

    setIsCancelling(true);
    try {
      await cancelOrder(orderInfo.orderId);
      setOrderInfo(null);
      setSelectedCoupons([]);
      setPaymentError(null);
      setShowCancelDialog(false);
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      setShowCancelDialog(false);
      // Even if API fails, still navigate back (order will be cancelled by timeout anyway)
      setOrderInfo(null);
      setSelectedCoupons([]);
      setCurrentStep(2);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOrderExpired = () => {
    setOrderInfo(null);
    setPaymentError(null);
    alert("Waktu pembayaran telah habis. Pesanan Anda dibatalkan. Silakan coba lagi.");
    navigate("/");
  };

  // Render Success Screen
  if (currentStep === 4 && completedOrderId) {
    return <ThankYouScreen orderId={completedOrderId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Pemesanan Kupon</h1>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <Stepper currentStep={currentStep} steps={STEPS} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <BuyerForm initialData={buyerData} onNext={handleBuyerSubmit} onBack={handleBack} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CouponSelector selectedCoupons={selectedCoupons} onSelectionChange={handleCouponSelection} onBack={handleBack} onNext={handleCouponSubmit} isLoadingNext={isCreatingOrder} />
            {orderError && <p className="mt-4 text-sm text-red-600">{orderError}</p>}
          </div>
        )}

        {currentStep === 3 && orderInfo && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <PaymentPanel
              orderId={orderInfo.orderId}
              baseAmount={orderInfo.totalAmount}
              payableAmount={orderInfo.payableAmount}
              uniqueCode={orderInfo.uniqueCode}
              bookCount={orderInfo.bookCount}
              expiresAt={orderInfo.expiresAt}
              onBack={handleBack}
              onSubmit={handlePaymentSubmit}
              onExpired={handleOrderExpired}
              isSubmitting={isSubmitting}
              errorMessage={paymentError}
            />
          </div>
        )}
      </main>

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

export default OrderPage;
