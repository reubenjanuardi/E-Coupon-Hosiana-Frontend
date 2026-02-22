import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Search, Check } from "lucide-react";
import { api } from "../api/client";
import { createOrder } from "../api/admin";

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Wilayah {
    id: number;
    nama_wilayah: string;
}

interface Gereja {
    id: number;
    nama_gereja: string;
}

interface AvailableBook {
    id: string;       // bookCode from API
    name: string;
    available: boolean;
    price: number;
}

export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerWhatsApp: "",
        asalPembeli: "UMUM",
        wilayahId: "",
        gerejaId: "",
        uniqueCode: 0,
    });

    const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
    const [churchList, setChurchList] = useState<Gereja[]>([]);
    const [loadingWilayah, setLoadingWilayah] = useState(false);
    const [loadingChurch, setLoadingChurch] = useState(false);

    // Coupon Book Selector State — cursor-based infinite scroll (matches CouponSelector)
    const ITEMS_PER_PAGE = 30;
    const [books, setBooks] = useState<AvailableBook[]>([]);
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [bookSearch, setBookSearch] = useState("");
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

    const PRICE_PER_BOOK = 100000;
    const totalAmount = selectedBooks.length * PRICE_PER_BOOK;
    const payabyleAmount = totalAmount + Number(formData.uniqueCode);

    const fetchBooks = useCallback(async (reset = false, cursor: string | null = null, search = "") => {
        try {
            setLoadingBooks(true);
            const response = await api.get("/coupons/books", {
                params: { limit: ITEMS_PER_PAGE, cursor, search, available: true },
            });
            const { data, nextCursor: newNextCursor } = response.data;
            setBooks(prev => (reset ? data : [...prev, ...data]));
            setNextCursor(newNextCursor);
            setHasMore(!!newNextCursor);
        } catch (err) {
            console.error("Failed to fetch books:", err);
        } finally {
            setLoadingBooks(false);
        }
    }, []);

    // Reset + load on open or search change (debounced)
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            fetchBooks(true, null, bookSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [isOpen, bookSearch, fetchBooks]);

    useEffect(() => {
        if (isOpen) fetchWilayah();
    }, [isOpen]);

    useEffect(() => {
        if (formData.wilayahId) {
            fetchChurches(formData.wilayahId);
        } else {
            setChurchList([]);
        }
    }, [formData.wilayahId]);

    const fetchWilayah = async () => {
        try {
            setLoadingWilayah(true);
            const res = await api.get("/public/wilayah");
            setWilayahList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingWilayah(false);
        }
    };

    const fetchChurches = async (id: string) => {
        try {
            setLoadingChurch(true);
            const res = await api.get(`/public/wilayah/${id}/gereja`);
            setChurchList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChurch(false);
        }
    };

    // Infinite scroll handler (same as CouponSelector)
    const handleBookScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingBooks && hasMore) {
            fetchBooks(false, nextCursor, bookSearch);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleBook = (code: string) => {
        setSelectedBooks(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBooks.length === 0) {
            alert("Please select at least one coupon book.");
            return;
        }
        setLoading(true);
        try {
            await createOrder({
                customerName: formData.customerName,
                customerWhatsApp: formData.customerWhatsApp,
                asalPembeli: formData.asalPembeli,
                wilayahId: formData.wilayahId ? Number(formData.wilayahId) : undefined,
                gerejaId: formData.gerejaId ? Number(formData.gerejaId) : undefined,
                bookCount: selectedBooks.length,
                selectedBooks,
                totalAmount,
                uniqueCode: Number(formData.uniqueCode),
                payabyleAmount,
            });
            onSuccess();
            onClose();
            // Reset
            setSelectedBooks([]);
            setFormData({ customerName: "", customerWhatsApp: "", asalPembeli: "UMUM", wilayahId: "", gerejaId: "", uniqueCode: 0 });
        } catch (err) {
            alert("Failed to create order");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-semibold">Create New Order</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-5">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">WhatsApp</label>
                            <input
                                name="customerWhatsApp"
                                value={formData.customerWhatsApp}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Origin</label>
                            <select
                                name="asalPembeli"
                                value={formData.asalPembeli}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                            >
                                <option value="UMUM">UMUM</option>
                                <option value="GPIB">GPIB</option>
                            </select>
                        </div>

                        {formData.asalPembeli === 'GPIB' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Wilayah</label>
                                    <select
                                        name="wilayahId"
                                        value={formData.wilayahId}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                        disabled={loadingWilayah}
                                    >
                                        <option value="">Select Wilayah</option>
                                        {wilayahList.map(w => (
                                            <option key={w.id} value={w.id}>{w.nama_wilayah}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gereja</label>
                                    <select
                                        name="gerejaId"
                                        value={formData.gerejaId}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                        disabled={!formData.wilayahId || loadingChurch}
                                    >
                                        <option value="">Select Gereja</option>
                                        {churchList.map(g => (
                                            <option key={g.id} value={g.id}>{g.nama_gereja}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Coupon Book Selection */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Select Coupon Books</h4>
                            {selectedBooks.length > 0 && (
                                <span className="text-sm text-blue-600 font-semibold">
                                    {selectedBooks.length} selected
                                </span>
                            )}
                        </div>

                        <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search book code..."
                                value={bookSearch}
                                onChange={e => setBookSearch(e.target.value)}
                                className="w-full border rounded pl-8 pr-3 py-2 text-sm"
                            />
                        </div>

                        <div className="border rounded h-48 overflow-y-auto bg-gray-50" onScroll={handleBookScroll}>
                            {books.length === 0 && !loadingBooks ? (
                                <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                                    No available books found
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {books.map(book => {
                                        const isSelected = selectedBooks.includes(book.id);
                                        return (
                                            <div
                                                key={book.id}
                                                onClick={() => toggleBook(book.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer select-none border transition-all ${
                                                    isSelected
                                                        ? "bg-blue-50 border-blue-400 text-blue-800"
                                                        : "bg-white border-gray-200 hover:border-blue-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"}`}>
                                                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-sm font-mono">{book.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">Rp 100.000</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {selectedBooks.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {selectedBooks.map(code => (
                                    <span
                                        key={code}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-mono"
                                    >
                                        {code}
                                        <button
                                            type="button"
                                            onClick={() => toggleBook(code)}
                                            className="hover:text-blue-600 ml-0.5"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Unique Code</label>
                            <input
                                type="number"
                                name="uniqueCode"
                                value={formData.uniqueCode}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Book Count</label>
                            <input
                                value={selectedBooks.length}
                                readOnly
                                className="w-full border rounded p-2 bg-gray-50 text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Amount</label>
                            <input
                                value={`Rp ${totalAmount.toLocaleString("id-ID")}`}
                                readOnly
                                className="w-full border rounded p-2 bg-gray-50 text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Payable Amount</label>
                            <input
                                value={`Rp ${payabyleAmount.toLocaleString("id-ID")}`}
                                readOnly
                                className="w-full border rounded p-2 bg-gray-50 text-gray-600 font-semibold"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedBooks.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Create Order ({selectedBooks.length} books)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
