import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, type OrderDetail } from "../api/admin";
import { ArrowLeft, ExternalLink, Calendar, CreditCard, User, MapPin, MessageCircle } from "lucide-react";

export default function AdminOrderDetail() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);
        getOrderById(orderId)
            .then((res) => setOrder(res.data))
            .catch((err) => {
                console.error(err);
                setError("Failed to load order details");
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (error || !order) return <div className="p-8 text-center text-red-600">{error || "Order not found"}</div>;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header / Back Button */}
            <div className="mb-6 flex items-center gap-4">
                <button 
                    onClick={() => navigate("/admin/orders")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Orders
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Customer & Order Info */}
                <div className="space-y-6">
                    {/* Order Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-blue-600" />
                            Order Summary
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-uppercase text-gray-500 font-semibold tracking-wider">Order ID</label>
                                <div className="font-mono text-lg font-medium text-gray-900">{order.orderId}</div>
                            </div>
                            <div>
                                <label className="text-xs text-uppercase text-gray-500 font-semibold tracking-wider">Status</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full 
                                        ${order.status === 'verified' ? 'bg-green-100 text-green-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-uppercase text-gray-500 font-semibold tracking-wider">Created At</label>
                                <div className="text-gray-700 flex items-center gap-2 mt-1">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(order.createdAt).toLocaleString('id-ID', {
                                        dateStyle: 'full', timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={18} className="text-purple-600" />
                            Customer Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Full Name</label>
                                <div className="text-gray-900 font-medium text-lg">{order.customer.namaLengkap}</div>
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-500 font-medium">WhatsApp</label>
                                <a 
                                    href={`https://wa.me/62${order.customer.nomorWhatsApp.replace(/^0/, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mt-1 w-fit group"
                                >
                                    <MessageCircle size={16} />
                                    {order.customer.nomorWhatsApp}
                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-medium">Origin (Asal Gereja/Wilayah)</label>
                                <div className="flex items-start gap-2 mt-1 text-gray-700">
                                    <MapPin size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="font-medium">{order.customer.asalPembeli}</div>
                                        {order.customer.asalPembeli === "GPIB" && (
                                            <div className="text-sm text-gray-500">
                                                {order.customer.gereja?.nama_gereja} - {order.customer.wilayah?.nama_wilayah}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment & Items */}
                <div className="space-y-6">
                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Total Bill</span>
                            <span className="text-xl font-bold text-gray-900">Rp {order.payabyleAmount.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="mt-4">
                            <label className="text-xs text-gray-500 font-medium block mb-2">Payment Evidence</label>
                            {order.payments && order.payments.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {order.payments.map((p) => (
                                        <a 
                                            key={p.id} 
                                            href={p.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="block group relative overflow-hidden rounded-lg border border-gray-200 aspect-video bg-gray-50 hover:border-blue-300 transition-all"
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
                                                <span className="text-white text-xs font-medium flex items-center gap-1">
                                                    View Image <ExternalLink size={10} />
                                                </span>
                                            </div>
                                            {/* We might want to show a thumbnail if the backend supported it, for now just a placeholder or the actual image if renderable */}
                                            <img src={p.fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded text-center">
                                    No payment evidence uploaded yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Coupon Books</h3>
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Book Code</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {order.couponBooks.map((book) => (
                                        <tr key={book.id}>
                                            <td className="px-4 py-2 text-sm font-mono text-gray-900">{book.bookCode}</td>
                                            <td className="px-4 py-2 text-sm text-right">
                                                {/* Since the book status might be 'sold' or 'booked', let's just show it nicely */}
                                                <span className="text-gray-600 text-xs">{book.status || 'Active'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 text-right text-sm text-gray-500">
                            Total: <span className="font-medium text-gray-900">{order.couponBooks.length} Books</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
