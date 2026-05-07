import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Search, Copy, Check, ArrowLeft, QrCode } from "lucide-react";
import { verifyCoupon, type VerificationResponse } from "../api/verification";

/**
 * E-Coupon Verification Page
 *
 * Purpose: Public read-only verification for coupon books and individual coupons
 * No authentication required - fully public access
 *
 * Features:
 * - Verify BUKU-0001 (coupon books)
 * - Verify KPN-00007 (individual coupons)
 * - Auto-verify from URL parameter
 * - Input validation with regex
 * - Masked owner information for privacy
 * - Copy to clipboard functionality
 * - Mobile-first responsive design
 */

// Regex patterns for validation
const BOOK_PATTERN = /^BUKU-\d{4}$/;
const COUPON_PATTERN = /^KPN-\d{5}$/;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

function Button({ className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };

  return <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

/**
 * Status Badge Component
 * Shows visual indicator for coupon status
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, any> = {
    "verified": {
      label: "On Process",
      icon: AlertCircle,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    "merge": {
      label: "On Process",
      icon: AlertCircle,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    "sent": {
      label: "Kupon sudah dikirim",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
    },
    "pending_payment": {
      label: "Menunggu Pembayaran",
      icon: AlertCircle,
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
    },
    "pending_verification": {
      label: "Sedang Diverifikasi",
      icon: AlertCircle,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    "void": {
      label: "Tidak Berlaku",
      icon: XCircle,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
    },
    "available": {
      label: "Tersedia - Belum Ada Pemilik",
      icon: CheckCircle,
      bgColor: "bg-slate-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
      iconColor: "text-slate-600",
    },
  };

  const config = statusConfig[status.toLowerCase()] || {
    label: `Status: ${status}`,
    icon: AlertCircle,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    iconColor: "text-gray-600",
  };
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 ${config.bgColor} ${config.borderColor}`}>
      <Icon className={`size-6 ${config.iconColor}`} />
      <span className={`font-semibold text-lg ${config.textColor}`}>{config.label}</span>
    </div>
  );
};

/**
 * Verification Result Display Component
 * Shows detailed information after successful verification
 */
const VerificationResult: React.FC<{ result: VerificationResponse }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <StatusBadge status={result.status} />

      {/* Verification Details */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-200">
        {/* Type */}
        <div className="p-4">
          <div className="text-sm text-slate-600 mb-1">Tipe</div>
          <div className="text-lg font-semibold text-slate-900">{result.type === "BOOK" ? "Buku Kupon" : "Kupon Individual"}</div>
        </div>

        {/* Code being verified */}
        <div className="p-4">
          <div className="text-sm text-slate-600 mb-1">{result.type === "BOOK" ? "Nomor Buku" : "Nomor Kupon"}</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-blue-600">{result.code}</div>
            <button onClick={() => handleCopy(result.code)} className="p-2 hover:bg-slate-100 rounded-md transition-colors" title="Salin kode">
              {copied ? <Check className="size-5 text-green-600" /> : <Copy className="size-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Book code (if verifying individual coupon) */}
        {result.type === "COUPON" && (
          <div className="p-4">
            <div className="text-sm text-slate-600 mb-1">Dari Buku</div>
            <div className="text-lg font-semibold text-slate-900">{result.bookCode}</div>
          </div>
        )}

        {/* Owner Information (masked) - Hide if available/no owner */}
        {result.owner && (
          <div className="p-4 bg-slate-50">
            <div className="text-sm text-slate-600 mb-3 font-medium">Informasi Pemilik</div>
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="text-sm text-slate-600 w-24">Nama</div>
                <div className="text-sm font-medium text-slate-900">{result.owner.name}</div>
              </div>
              <div className="flex items-start">
                <div className="text-sm text-slate-600 w-24">WhatsApp</div>
                <div className="text-sm font-medium text-slate-900">{result.owner.phone}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Informasi Penting:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Data pemilik disembunyikan sebagian untuk privasi</li>
              <li>Status "Tersedia" berarti kupon belum dibeli/dimiliki</li>
              <li>Status "Menunggu Pembayaran" / "Sedang Diverifikasi" berarti kupon sedang dalam proses pembelian</li>
              <li>Status "On Process" berarti pesanan sedang dipersiapkan</li>
              <li>Status "Kupon sudah dikirim" berarti kupon sudah sah milik pembeli dan terdaftar untuk undian</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Verification Page Component
 */
const VerificationPage: React.FC = () => {
  const { couponCode } = useParams<{ couponCode?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  // Auto-verify if code provided in URL
  useEffect(() => {
    if (couponCode) {
      const upperCode = couponCode.toUpperCase().trim();
      setInputCode(upperCode);
      handleVerify(upperCode);
    }
  }, [couponCode]);

  /**
   * Validate input format
   * Must match either BUKU-00001 or KPN-00007 pattern
   */
  const isValidFormat = (code: string): boolean => {
    return BOOK_PATTERN.test(code) || COUPON_PATTERN.test(code);
  };

  /**
   * Handle input change with auto-uppercase transform
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().trim();
    setInputCode(value);
    setError(null);
    setResult(null);
  };

  /**
   * Handle verification request
   */
  const handleVerify = async (code?: string) => {
    const codeToVerify = code || inputCode;

    // Validate format before API call
    if (!isValidFormat(codeToVerify)) {
      setError("Format kode tidak valid. Gunakan format BUKU-00001 atau KPN-00007");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyCoupon(codeToVerify);
      setResult(data);
    } catch (err: any) {
      // Handle API errors
      if (err.response?.status === 404 || err.response?.data?.error) {
        setError(err.response?.data?.error || "Kode tidak ditemukan dalam sistem");
      } else if (err.response?.status >= 500) {
        setError("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
      } else {
        setError("Gagal melakukan verifikasi. Periksa koneksi internet Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  /**
   * Reset form to initial state
   */
  const handleReset = () => {
    setInputCode("");
    setError(null);
    setResult(null);
    navigate("/verify", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-100 rounded-md transition-colors" title="Kembali ke beranda">
              <ArrowLeft className="size-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Verifikasi E-Kupon</h1>
              <p className="text-sm text-slate-600">Sistem Verifikasi Publik - Baca Saja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Search className="size-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Cara Verifikasi Kupon</h2>
              <p className="text-slate-600 mb-4">Masukkan nomor buku atau nomor kupon untuk memverifikasi status dan keaslian.</p>
            </div>
          </div>

          {/* Format Examples */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Masukkan Nomor Buku dengan format:</div>
              <div className="font-mono text-lg font-bold text-blue-600">BUKU-0001</div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="text-sm font-medium text-slate-700 mb-1">Atau Nomor Kupon dengan format:</div>
              <div className="font-mono text-lg font-bold text-blue-600">KPN-00007</div>
            </div>
            <div className="border-t border-slate-200 pt-3 flex items-start gap-2">
              <AlertCircle className="size-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-600">Pastikan format huruf dan angka sesuai. Sistem akan otomatis mengubah ke huruf kapital.</p>
            </div>
          </div>

          {/* QR Code Hint */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <QrCode className="size-5" />
            <span>Anda juga dapat memindai QR Code pada kupon untuk verifikasi otomatis</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <label htmlFor="coupon-input" className="block text-sm font-medium text-slate-700 mb-2">
            Nomor Buku atau Kupon
          </label>
          <div className="flex gap-3">
            <input
              id="coupon-input"
              type="text"
              value={inputCode}
              onChange={handleInputChange}
              placeholder="Contoh: BUKU-0001 atau KPN-00007"
              className="w-full min-w-0 flex-1 px-4 h-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              disabled={isLoading}
              autoFocus
            />
            <Button type="submit" disabled={!inputCode || isLoading || !isValidFormat(inputCode)} className="px-3 sm:px-6">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Verifikasi...</span>
                </>
              ) : (
                <>
                  <Search className="size-5 sm:mr-2" />
                  <span className="hidden sm:inline">Verifikasi</span>
                </>
              )}
            </Button>
          </div>

          {/* Format validation hint */}
          {inputCode && !isValidFormat(inputCode) && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="size-4" />
              Format belum sesuai. Gunakan BUKU-0001 atau KPN-00007
            </p>
          )}
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <XCircle className="size-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Verifikasi Gagal</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {result && (
          <div>
            <VerificationResult result={result} />

            {/* Reset Button */}
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={handleReset}>
                Verifikasi Kode Lain
              </Button>
            </div>
          </div>
        )}

        {/* Help Section - Only show when no result */}
        {!result && !error && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-slate-900 mb-3">Butuh Bantuan?</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• Pastikan nomor yang dimasukkan sesuai dengan yang tertera pada kupon</p>
              <p>• Periksa ejaan dan format (BUKU-##### atau KPN-#####)</p>
              <p>• Jika masalah berlanjut, hubungi panitia melalui WhatsApp</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-600">Sistem Verifikasi E-Kupon • Akses Publik • Data Dilindungi</p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
