import React, { useState, useEffect } from "react";
import { X, Loader2, Upload, CheckCircle2, ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { updateOrder } from "../api/admin";
import { uploadPaymentEvidence } from "../api/payments";
import type { AdminOrder } from "../api/admin";

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    order: AdminOrder | null;
}

interface Wilayah {
    id: number;
    nama_wilayah: string;
}

interface Gereja {
    id: number;
    nama_gereja: string;
}

export default function EditOrderModal({ isOpen, onClose, onSuccess, order }: EditOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerWhatsApp: "",
        asalPembeli: "UMUM", // GPIB | UMUM
        wilayahId: "",
        gerejaId: "",
        status: "",
    });

    const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
    const [churchList, setChurchList] = useState<Gereja[]>([]);
    const [loadingWilayah, setLoadingWilayah] = useState(false);
    const [loadingChurch, setLoadingChurch] = useState(false);

    // Payment evidence
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [uploadingEvidence, setUploadingEvidence] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            // Populate form data from order
            setFormData({
                customerName: order.customer.namaLengkap,
                customerWhatsApp: order.customer.nomorWhatsApp,
                asalPembeli: order.customer.asalPembeli,
                wilayahId: order.customer.wilayahId ? String(order.customer.wilayahId) : "",
                gerejaId: order.customer.gerejaId ? String(order.customer.gerejaId) : "",
                status: order.status,
            });
            setEvidenceFile(null);
            fetchWilayah();
        }
    }, [isOpen, order]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;
        
        setLoading(true);
        try {
            // 1. Update order details
            await updateOrder(order.orderId, {
                status: formData.status,
                customerName: formData.customerName,
                customerWhatsApp: formData.customerWhatsApp,
                asalPembeli: formData.asalPembeli,
                wilayahId: formData.asalPembeli === 'GPIB' && formData.wilayahId ? Number(formData.wilayahId) : null,
                gerejaId: formData.asalPembeli === 'GPIB' && formData.gerejaId ? Number(formData.gerejaId) : null,
            });

            // 2. Upload evidence if a file was selected
            if (evidenceFile) {
                setUploadingEvidence(true);
                try {
                    await uploadPaymentEvidence(order.orderId, evidenceFile);
                } catch (uploadErr) {
                    console.error("Evidence upload failed:", uploadErr);
                    alert("Order updated, but evidence upload failed. Please try uploading it again.");
                } finally {
                    setUploadingEvidence(false);
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            alert("Failed to update order");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Edit Order: {order.orderId}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="block text-sm font-medium mb-1">Status</label>
                             <select 
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border rounded p-2 bg-yellow-50"
                             >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="pending_verification">Pending Verification</option>
                                <option value="verified">Verified</option>
                                <option value="MERGED">MERGED (PDF Generated)</option>
                                <option value="SENT">SENT (Done)</option>
                                <option value="cancelled">Cancelled</option>
                             </select>
                        </div>
                        
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

                    {/* Payment Evidence */}
                    <div className="col-span-2 border-t pt-4">
                        <label className="block text-sm font-medium mb-2">Payment Evidence</label>

                        {/* Existing evidence */}
                        {order.payments && order.payments.length > 0 && (
                            <div className="mb-3 space-y-1">
                                <p className="text-xs text-gray-500 mb-1">Existing uploads:</p>
                                {order.payments.map(p => (
                                    <a
                                        key={p.id}
                                        href={p.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                    >
                                        <ExternalLink size={13} />
                                        {new Date(p.uploadedAt).toLocaleString()}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Upload new evidence */}
                        <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => setEvidenceFile(e.target.files?.[0] ?? null)}
                            />
                            {evidenceFile ? (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 size={16} />
                                    <span className="text-sm font-medium">{evidenceFile.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Upload size={20} className="mb-1" />
                                    <span className="text-xs">Upload new evidence (JPG, PNG, PDF)</span>
                                </div>
                            )}
                        </label>
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
                            disabled={loading || uploadingEvidence}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                        >
                            {(loading || uploadingEvidence) && <Loader2 className="animate-spin" size={16} />}
                            {uploadingEvidence ? "Uploading Evidence..." : "Update Order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
