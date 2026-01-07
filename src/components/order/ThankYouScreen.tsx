import React from "react";
import { CheckCircle2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ThankYouScreenProps {
  orderId: string;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ orderId }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto mt-10 text-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-600 w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
        <p className="text-gray-600 mb-6">Pesanan Anda telah kami terima.</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Order ID</p>
          <p className="text-xl font-mono font-bold text-gray-900 select-all">{orderId}</p>
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-8">
          <p>
            Pembayaran Anda akan diverifikasi maksimal <span className="font-semibold text-gray-900">1x24 jam</span>.
          </p>
          <p>Kupon akan dikirim melalui WhatsApp setelah pembayaran terverifikasi.</p>
        </div>

        <button onClick={() => navigate("/")} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          <Home size={18} />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};
