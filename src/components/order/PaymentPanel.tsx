import React, { useEffect, useMemo, useState } from "react";
import { Upload, CreditCard, QrCode, Loader2, CheckCircle2, AlertTriangle, Info, Copy, Clock } from "lucide-react";
import QRCode from "qrcode";
import { clsx } from "clsx";
import { getQris } from "../../api/payments";

interface PaymentPanelProps {
  orderId: string;
  baseAmount: number;
  payableAmount: number;
  uniqueCode: number;
  bookCount: number;
  expiresAt: string;
  onBack: () => void;
  onSubmit: (paymentProof: File) => void;
  onExpired: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

type PaymentMethod = "QRIS" | "TRANSFER";

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ orderId, baseAmount, payableAmount, uniqueCode, bookCount, expiresAt, onBack, onSubmit, onExpired, isSubmitting, errorMessage }) => {
  const [method, setMethod] = useState<PaymentMethod>("QRIS");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    const expiresTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresTime - now) / 1000));
  });

  const rekeningNumber = "0345 01 001 568 566";

  const finalAmount = useMemo(() => payableAmount ?? baseAmount, [payableAmount, baseAmount]);

  // Countdown timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          onExpired();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onExpired]);

  useEffect(() => {
    if (method !== "QRIS") {
      return;
    }

    const fetchQris = async () => {
      setIsGeneratingQr(true);
      setQrError(null);
      setQrCodeUrl("");

      try {
        const { qrisPayload } = await getQris(orderId);
        const url = await QRCode.toDataURL(qrisPayload, { width: 240, margin: 2 });
        setQrCodeUrl(url);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Gagal memuat QRIS";
        setQrError(message);
      } finally {
        setIsGeneratingQr(false);
      }
    };

    fetchQris();
  }, [method, orderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProof(file);
      setLocalError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!paymentProof) {
      setLocalError("Silakan pilih file bukti pembayaran terlebih dahulu.");
      return;
    }

    setLocalError(null);
    onSubmit(paymentProof);
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-6">
      {/* Countdown Timer */}
      <div
        className={clsx(
          "rounded-lg p-4 flex items-center justify-center gap-3 shadow-sm border",
          timeRemaining > 300
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : timeRemaining > 60
            ? "bg-orange-50 border-orange-200 text-orange-700"
            : "bg-red-50 border-red-200 text-red-700 animate-pulse"
        )}
      >
        <Clock className="size-5" />
        <div className="text-center">
          <p className="text-sm font-medium">Batas Waktu Pembayaran</p>
          <p className="text-2xl font-bold font-mono">{formatTime(timeRemaining)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Jumlah Buku</span>
          <span className="font-medium">{bookCount} Buku</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Harga Satuan</span>
          <span className="font-medium">Rp 100.000</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(baseAmount)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Kode Unik</span>
          <span className="font-semibold text-orange-600">{uniqueCode ?? 0}</span>
        </div>
        <div className="flex justify-between items-center pt-3">
          <span className="text-lg font-medium text-gray-900">Total Pembayaran</span>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{formatCurrency(finalAmount)}</p>
            <p className="text-xs text-gray-500">Gunakan nominal persis termasuk kode unik</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setMethod("QRIS")}
            className={clsx("flex flex-col items-center justify-center p-4 border rounded-lg transition-all", method === "QRIS" ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-gray-200 hover:bg-gray-50")}
          >
            <QrCode size={24} className="mb-2" />
            <span className="font-medium">QRIS</span>
          </button>
          <button
            onClick={() => setMethod("TRANSFER")}
            className={clsx("flex flex-col items-center justify-center p-4 border rounded-lg transition-all", method === "TRANSFER" ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-gray-200 hover:bg-gray-50")}
          >
            <CreditCard size={24} className="mb-2" />
            <span className="font-medium">Transfer Bank</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[250px] w-full">
          {method === "QRIS" ? (
            isGeneratingQr ? (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="animate-spin mb-3" size={32} />
                <p>Membuat kode QR...</p>
              </div>
            ) : qrError ? (
              <div className="text-center text-red-600">
                <p className="font-medium">Gagal memuat QRIS</p>
                <p className="text-sm text-red-500 mt-1">{qrError}</p>
              </div>
            ) : (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-3 rounded-lg shadow-sm inline-block mb-3">
                  <img src={qrCodeUrl} alt="QRIS Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Scan QRIS untuk membayar</p>
                <p className="text-xs text-gray-500 mt-1">Pastikan nominal sama: {formatCurrency(finalAmount)}</p>
              </div>
            )
          ) : (
            <div className="w-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Bank BRI</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-mono font-bold text-gray-900">{rekeningNumber}</p>
                  <button
                    onClick={async () => {
                      try {
                        // copy without spaces for convenience
                        await navigator.clipboard.writeText(rekeningNumber.replace(/\s+/g, ""));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        // fallback: create textarea
                        const ta = document.createElement("textarea");
                        ta.value = rekeningNumber.replace(/\s+/g, "");
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                          document.execCommand("copy");
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (e) {
                          // ignore
                        }
                        document.body.removeChild(ta);
                      }
                    }}
                    className="ml-4 inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 bg-white rounded hover:bg-gray-50 text-sm"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
                    <span className="select-none">{copied ? "Disalin" : "Salin"}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-1">a.n. GPIB HOSIANA (BRI PEG)</p>
              </div>
              <div className="flex items-start gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg text-sm">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Gunakan nominal persis</p>
                  <p>Transfer sesuai total di atas agar verifikasi cepat.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bukti Pembayaran</h3>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-xs h-40 mb-2 rounded overflow-hidden border border-gray-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={16} />
                  File terpilih: {paymentProof?.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">Klik untuk mengganti</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="mb-3 text-gray-400" size={32} />
                <p className="font-medium">Upload Bukti Pembayaran</p>
                <p className="text-xs mt-1">Format: JPG, PNG, HEIC, PDF (Max 10MB)</p>
              </div>
            )}
          </div>

          {!paymentProof && (
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>Mohon upload bukti pembayaran untuk memproses pesanan Anda.</p>
            </div>
          )}

          {localError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{localError}</div>}

          {errorMessage && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{errorMessage}</div>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={isSubmitting} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          Kembali
        </button>
        <button
          onClick={handleSubmit}
          disabled={!paymentProof || isSubmitting}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Mengunggah...
            </>
          ) : (
            "Konfirmasi Pembayaran"
          )}
        </button>
      </div>
    </div>
  );
};
