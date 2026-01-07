import React, { useState, useEffect, useCallback } from "react";
import { Search, X, ShoppingBag, AlertCircle, Loader2, Lock } from "lucide-react";
import { clsx } from "clsx";
import axios from "axios";
import { api } from "../../api/client";
import { useRef } from "react";

export interface CouponBook {
  id: string;
  name: string;
  available: boolean;
  isLocked?: boolean;
  lockedBy?: string | null;
  price: number;
}

interface CouponSelectorProps {
  selectedCoupons: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBack: () => void;
  onNext: () => void;
  isLoadingNext?: boolean;
}

const ITEMS_PER_PAGE = 30;

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("couponSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("couponSessionId", sessionId);
  }
  return sessionId;
};

export const CouponSelector: React.FC<CouponSelectorProps> = ({ selectedCoupons, onSelectionChange, onBack, onNext, isLoadingNext = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [coupons, setCoupons] = useState<CouponBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sessionId] = useState(getSessionId());
  const [lockingBooks, setLockingBooks] = useState<Set<string>>(new Set());
  const selectedRef = useRef<string[]>(selectedCoupons);

  // Log session ID for debugging
  useEffect(() => {
    console.log("🔑 Coupon Selector Session ID:", sessionId);
  }, [sessionId]);

  // Keep a ref of current selections for unload handlers
  useEffect(() => {
    selectedRef.current = selectedCoupons;
  }, [selectedCoupons]);

  const fetchCoupons = useCallback(async (reset = false, cursor: string | null = null, search = "") => {
    try {
      setLoading(true);
      const response = await api.get("/coupons/books", {
        params: {
          limit: ITEMS_PER_PAGE,
          cursor,
          search,
          available: true,
        },
      });

      const { data, nextCursor: newNextCursor } = response.data;

      setCoupons((prev) => (reset ? data : [...prev, ...data]));
      setNextCursor(newNextCursor);
      setHasMore(!!newNextCursor);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons(true, null, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchCoupons]);

  // Cleanup: Unlock all books when component unmounts (only runs once on unmount)
  useEffect(() => {
    return () => {
      // Get current selected coupons from the closure
      const currentSelected = selectedCoupons;
      if (currentSelected.length > 0) {
        api
          .post("/coupons/books/unlock-bulk", {
            sessionId,
            bookCodes: currentSelected,
          })
          .catch((error) => console.error("Failed to unlock books on unmount:", error));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Warn user before leaving page if there are selected coupons
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentSelected = selectedRef.current;
      if (currentSelected.length > 0) {
        const payload = JSON.stringify({
          sessionId,
          bookCodes: currentSelected,
        });
        const url = `${api.defaults.baseURL ?? ""}/coupons/books/unlock-bulk`;
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        }

        e.preventDefault();
        const message = "Anda memiliki buku kupon yang dipilih. Jika Anda meninggalkan halaman ini, proses pemesanan akan hilang dan pilihan Anda akan dibatalkan.";
        e.returnValue = message; // For most browsers
        return message; // For some older browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionId]);

  // Lock/Unlock handler
  const toggleCoupon = async (id: string) => {
    const isSelected = selectedCoupons.includes(id);

    if (!isSelected) {
      // Locking
      setLockingBooks((prev) => new Set(prev).add(id));
      try {
        const response = await api.post(`/coupons/books/${id}/lock`, { sessionId });
        console.log(`✓ Locked book ${id}:`, response.data);
        const newSelection = [...selectedCoupons, id];
        onSelectionChange(newSelection);
      } catch (error) {
        console.error(`✗ Failed to lock book ${id}:`, error);
        // Optionally show error toast
      } finally {
        setLockingBooks((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      // Unlocking
      try {
        console.log(`Attempting to unlock book ${id} with sessionId:`, sessionId);
        const response = await api.post(`/coupons/books/${id}/unlock`, { sessionId });
        console.log(`✓ Unlocked book ${id}:`, response.data);
        onSelectionChange(selectedCoupons.filter((c) => c !== id));
      } catch (error) {
        console.error(`✗ Failed to unlock book ${id}:`, error);
        // Show error to user - the book might be locked by another session
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          alert("不能解锁: 此书可能已被其他用户锁定或您的会话已过期。请尝试刷新页面。");
        }
      }
    }
  };

  const removeCoupon = async (id: string) => {
    try {
      await api.post(`/coupons/books/${id}/unlock`, { sessionId });
      onSelectionChange(selectedCoupons.filter((c) => c !== id));
    } catch (error) {
      console.error("Failed to unlock book:", error);
    }
  };

  const clearAll = async () => {
    if (selectedCoupons.length > 0) {
      try {
        await api.post("/coupons/books/unlock-bulk", {
          sessionId,
          bookCodes: selectedCoupons,
        });
        onSelectionChange([]);
      } catch (error) {
        console.error("Failed to clear selections:", error);
      }
    }
  };

  // Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && hasMore) {
      fetchCoupons(false, nextCursor, searchTerm);
    }
  };

  const selectedCount = selectedCoupons.length;
  const totalPrice = selectedCount * 100000; // Assuming flat price

  // Helper to get name (from loaded coupons or formatted ID)
  const getCouponName = (id: string) => {
    const found = coupons.find((c) => c.id === id);
    if (found) return found.name;
    return `Buku Kupon #${id.replace("BUKU-", "")}`;
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-blue-900">Informasi Pemesanan</h4>
          <p className="text-sm text-blue-700 mt-1">1 Buku terdiri dari 10 lembar kupon. Harga per buku adalah Rp 100.000.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Cari nomor buku..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Coupon List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex justify-between items-center">
          <span>Daftar Buku Kupon</span>
          <span className="text-xs text-gray-500">Menampilkan {coupons.length} buku</span>
        </div>

        <div className="h-80 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" onScroll={handleScroll}>
          {coupons.length > 0 ? (
            <>
              {coupons.map((coupon) => {
                const isSelected = selectedCoupons.includes(coupon.id);
                const isLocking = lockingBooks.has(coupon.id);
                const isDisabled = !coupon.available || (coupon.isLocked && coupon.lockedBy !== sessionId);

                return (
                  <div
                    key={coupon.id}
                    onClick={() => !isDisabled && toggleCoupon(coupon.id)}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none relative",
                      isDisabled && "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed",
                      !isDisabled && isSelected ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400 bg-white", isLocking && "opacity-50")}>
                        {isSelected && !isLocking && <CheckIcon className="text-white" size={14} />}
                        {isLocking && <Loader2 className="text-blue-600 animate-spin" size={14} />}
                      </div>
                      <div>
                        <p className={clsx("font-medium", isDisabled && "text-gray-500")}>{coupon.name}</p>
                        {coupon.isLocked && coupon.lockedBy !== sessionId ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Lock size={12} className="text-orange-600" />
                            <span className="text-xs text-orange-600 font-medium">Sedang dipilih pengguna lain</span>
                          </div>
                        ) : !coupon.available ? (
                          <span className="text-xs text-red-500 font-medium">Tidak Tersedia</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Rp {coupon.price.toLocaleString("id-ID")}</span>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">{loading ? <Loader2 className="animate-spin mx-auto mb-2" /> : "Tidak ada buku kupon yang ditemukan"}</div>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <ShoppingBag size={18} />
              {selectedCount} Buku Dipilih
            </h3>
            <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Hapus Semua
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto mb-4">
            {selectedCoupons.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                {getCouponName(id)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCoupon(id);
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Total Estimasi</p>
              <p className="text-lg font-bold text-blue-600">Rp {totalPrice.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Kembali
        </button>
        <button
          onClick={onNext}
          disabled={selectedCount === 0 || isLoadingNext}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoadingNext ? "Memproses pesanan..." : "Pesan & Lanjut Pembayaran"}
        </button>
      </div>
    </div>
  );
};

const CheckIcon = ({ className, size }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
