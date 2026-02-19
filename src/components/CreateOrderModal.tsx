import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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

export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerWhatsApp: "",
        asalPembeli: "UMUM", // GPIB | UMUM
        wilayahId: "",
        gerejaId: "",
        bookCount: 1,
        totalAmount: 100000, // Default 1 book
        uniqueCode: 0,
        payabyleAmount: 100000,
    });

    const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
    const [churchList, setChurchList] = useState<Gereja[]>([]);
    const [loadingWilayah, setLoadingWilayah] = useState(false);
    const [loadingChurch, setLoadingChurch] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchWilayah();
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.wilayahId) {
            fetchChurches(formData.wilayahId);
        } else {
            setChurchList([]);
        }
    }, [formData.wilayahId]);

    // Calculate amounts when bookCount changes
    useEffect(() => {
        const count = Number(formData.bookCount);
        const price = 100000;
        const total = count * price;
        setFormData(prev => ({
            ...prev,
            totalAmount: total,
            payabyleAmount: total + Number(prev.uniqueCode)
        }));
    }, [formData.bookCount]);

    // Recalculate payable when uniqueCode changes
    useEffect(() => {
         setFormData(prev => ({
            ...prev,
            payabyleAmount: Number(prev.totalAmount) + Number(prev.uniqueCode)
        }));
    }, [formData.uniqueCode]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createOrder({
                ...formData,
                bookCount: Number(formData.bookCount),
                totalAmount: Number(formData.totalAmount),
                uniqueCode: Number(formData.uniqueCode),
                payabyleAmount: Number(formData.payabyleAmount),
                wilayahId: formData.wilayahId ? Number(formData.wilayahId) : undefined,
                gerejaId: formData.gerejaId ? Number(formData.gerejaId) : undefined,
            });
            onSuccess();
            onClose();
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Create New Order</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                        
                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h4 className="font-medium mb-2">Order Details</h4>
                        </div>

                        <div>
                             <label className="block text-sm font-medium mb-1">Book Count</label>
                             <input 
                                type="number"
                                name="bookCount"
                                value={formData.bookCount}
                                onChange={handleChange}
                                min="1"
                                className="w-full border rounded p-2"
                                required
                             />
                        </div>

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
                             <label className="block text-sm font-medium mb-1">Total Amount</label>
                             <input 
                                type="number"
                                name="totalAmount"
                                value={formData.totalAmount}
                                className="w-full border rounded p-2 bg-gray-50"
                                readOnly
                             />
                        </div>

                        <div>
                             <label className="block text-sm font-medium mb-1">Payable Amount</label>
                             <input 
                                type="number"
                                name="payabyleAmount"
                                value={formData.payabyleAmount}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                             />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Create Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
