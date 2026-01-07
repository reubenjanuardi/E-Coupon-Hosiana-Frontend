import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { api } from "../../api/client";

export interface BuyerData {
  fullName: string;
  whatsapp: string;
  origin: "GPIB" | "UMUM";
  wilayah?: string;
  church?: string;
}

interface BuyerFormProps {
  initialData: BuyerData;
  onNext: (data: BuyerData) => void;
  onBack: () => void;
}

interface Wilayah {
  id: number;
  nama_wilayah: string;
}

interface Gereja {
  id: number;
  nama_gereja: string;
}

export const BuyerForm: React.FC<BuyerFormProps> = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState<BuyerData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof BuyerData, string>>>({});
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [availableChurches, setAvailableChurches] = useState<Gereja[]>([]);
  const [loadingWilayah, setLoadingWilayah] = useState(false);
  const [loadingChurches, setLoadingChurches] = useState(false);

  // Fetch Wilayah on mount
  useEffect(() => {
    const fetchWilayah = async () => {
      try {
        setLoadingWilayah(true);
        const response = await api.get("/public/wilayah");
        setWilayahList(response.data);
      } catch (error) {
        console.error("Failed to fetch wilayah:", error);
      } finally {
        setLoadingWilayah(false);
      }
    };

    fetchWilayah();
  }, []);

  // Fetch Churches when Wilayah changes
  useEffect(() => {
    const fetchChurches = async () => {
      if (!formData.wilayah) {
        setAvailableChurches([]);
        return;
      }

      try {
        setLoadingChurches(true);
        const response = await api.get(`/public/wilayah/${formData.wilayah}/gereja`);
        setAvailableChurches(response.data);
      } catch (error) {
        console.error("Failed to fetch churches:", error);
        setAvailableChurches([]);
      } finally {
        setLoadingChurches(false);
      }
    };

    fetchChurches();
  }, [formData.wilayah]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BuyerData, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Nama lengkap wajib diisi";

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "Nomor WhatsApp wajib diisi";
    } else if (!/^\d+$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "Nomor WhatsApp harus berupa angka";
    } else if (formData.whatsapp.length < 9) {
      newErrors.whatsapp = "Nomor WhatsApp tidak valid";
    }

    if (formData.origin === "GPIB") {
      if (!formData.wilayah) newErrors.wilayah = "Wilayah wajib dipilih";
      if (!formData.church) newErrors.church = "Gereja wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  const handleChange = (field: keyof BuyerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Reset church if wilayah changes
    if (field === "wilayah") {
      setFormData((prev) => ({ ...prev, wilayah: value, church: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto mt-8">
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className={clsx("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors", errors.fullName ? "border-red-500 bg-red-50" : "border-gray-300")}
            placeholder="Masukkan nama lengkap Anda"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
        </div>

        {/* WhatsApp */}
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
            Nomor WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            className={clsx("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors", errors.whatsapp ? "border-red-500 bg-red-50" : "border-gray-300")}
            placeholder="08xxxxxxxxxx"
          />
          {errors.whatsapp && <p className="mt-1 text-sm text-red-500">{errors.whatsapp}</p>}
        </div>

        {/* Origin Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asal Pembeli <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleChange("origin", "GPIB")}
              className={clsx(
                "py-2 px-4 border rounded-lg text-sm font-medium transition-all",
                formData.origin === "GPIB" ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              Warga GPIB
            </button>
            <button
              type="button"
              onClick={() => handleChange("origin", "UMUM")}
              className={clsx(
                "py-2 px-4 border rounded-lg text-sm font-medium transition-all",
                formData.origin === "UMUM" ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              Umum
            </button>
          </div>
        </div>

        {/* Conditional Fields for GPIB */}
        {formData.origin === "GPIB" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label htmlFor="wilayah" className="block text-sm font-medium text-gray-700 mb-1">
                Wilayah Mupel <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="wilayah"
                  value={formData.wilayah || ""}
                  onChange={(e) => handleChange("wilayah", e.target.value)}
                  disabled={loadingWilayah}
                  className={clsx(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400",
                    errors.wilayah ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Pilih Wilayah</option>
                  {wilayahList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama_wilayah}
                    </option>
                  ))}
                </select>
                {loadingWilayah && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              {errors.wilayah && <p className="mt-1 text-sm text-red-500">{errors.wilayah}</p>}
            </div>

            <div>
              <label htmlFor="church" className="block text-sm font-medium text-gray-700 mb-1">
                Asal Gereja <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="church"
                  value={formData.church || ""}
                  onChange={(e) => handleChange("church", e.target.value)}
                  disabled={!formData.wilayah || loadingChurches}
                  className={clsx(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400",
                    errors.church ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Pilih Gereja</option>
                  {availableChurches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_gereja}
                    </option>
                  ))}
                </select>
                {loadingChurches && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              {errors.church && <p className="mt-1 text-sm text-red-500">{errors.church}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onBack} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Kembali
        </button>
        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm">
          Lanjut Pilih Kupon
        </button>
      </div>
    </form>
  );
};
