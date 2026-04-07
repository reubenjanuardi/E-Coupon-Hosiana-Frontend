import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, verifyOrder, rejectOrder, deleteOrder, toggleChurchOrder } from "../api/admin";
import type { AdminOrder } from "../api/admin";
import { Check, X, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import CreateOrderModal from "../components/CreateOrderModal";
import EditOrderModal from "../components/EditOrderModal";

export default function AdminOrders() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [originFilter, setOriginFilter] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("desc");
    const [refreshKey, setRefreshKey] = useState(0); // to force reload

    const { user } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);

    useEffect(() => {
        setLoading(true);
        getOrders({
            page,
            limit: 10,
            status: statusFilter === "all" ? undefined : statusFilter,
            origin: originFilter === "all" ? undefined : originFilter,
            search,
            sort
        })
            .then((res) => {
                setOrders(res.data);
                setTotalPages(res.meta.totalPages);
            })
            .catch(err => {
                console.error(err);
                setOrders([]);
            })
            .finally(() => setLoading(false));
    }, [page, statusFilter, originFilter, search, sort, refreshKey]);

    const handleVerify = async (orderId: string) => {
        if (!confirm("Are you sure you want to verify this order?")) return;
        try {
            await verifyOrder(orderId);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert("Failed to verify");
            console.error(err);
        }
    };

    const handleReject = async (orderId: string) => {
        if (!confirm("WARNING: Determining this order as INVALID will CANCEL it and RELEASE the books back to stock. Are you sure?")) return;
        try {
            await rejectOrder(orderId);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert("Failed to reject");
            console.error(err);
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm("DANGER: This will PERMANENTLY DELETE the order and all related data. This action cannot be undone. Are you sure?")) return;
        try {
            await deleteOrder(orderId);
            setRefreshKey((k) => k + 1);
            alert("Order deleted successfully");
        } catch (err) {
            alert("Failed to delete order");
            console.error(err);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
                {user?.role === 'superadmin' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                    >
                        + Create Order
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex gap-4">
                    <select
                        className="border rounded px-3 py-2 bg-white"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Status</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="pending_verification">Pending Verification</option>
                        <option value="verified">Verified</option>
                        <option value="MERGED">Merged</option>
                        <option value="SENT">Sent</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        className="border rounded px-3 py-2 bg-white"
                        value={originFilter}
                        onChange={(e) => { setOriginFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Origins</option>
                        <option value="GPIB">GPIB (Church)</option>
                        <option value="UMUM">UMUM (General)</option>
                    </select>

                    <select
                        className="border rounded px-3 py-2 bg-white"
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID, Name, WA..."
                            className="pl-9 pr-4 py-2 border rounded w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setPage(1)} // Search on enter
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-4">No orders found.</td></tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.orderId}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                        <Link to={`/admin/orders/${order.orderId}`} className="text-blue-600 hover:underline">
                                            {order.orderId}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        Rp {order.payabyleAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium text-gray-900">{order.customer.namaLengkap}</div>
                                            {order.isChurchOrder && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                    CHURCH
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-gray-500 text-xs">{order.customer.nomorWhatsApp}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {order.customer.asalPembeli === "GPIB" ? (
                                            <>
                                                <div>{order.customer.wilayah?.nama_wilayah || '-'}</div>
                                                <div className="text-gray-500">{order.customer.gereja?.nama_gereja || '-'}</div>
                                            </>
                                        ) : "UMUM"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleString('id-ID', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'pending_verification' ? 'bg-orange-100 text-orange-800' :
                                  order.status === 'pending_payment' ? 'bg-gray-100 text-gray-800' :
                                  order.status === 'MERGED' ? 'bg-green-100 text-green-800' : // Light Green
                                  order.status === 'SENT' ? 'bg-green-600 text-white' : // Green (Darker for Sent)
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                                        {order.payments && order.payments.length > 0 ? (
                                            <a
                                                href={order.payments[0].fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                View <ExternalLink size={12} />
                                            </a>
                                        ) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2 items-center">
                                            {/* Church Order Toggle */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await toggleChurchOrder(order.orderId);
                                                        // Update local state based on response or just toggle
                                                        const newStatus = res.data.isChurchOrder; 
                                                        setOrders(orders.map(o => o.orderId === order.orderId ? { ...o, isChurchOrder: newStatus } : o));
                                                    } catch (err) {
                                                        console.error("Failed to update church order status", err);
                                                        alert("Failed to update status");
                                                    }
                                                }}
                                                className={`p-1 border rounded ml-1 ${order.isChurchOrder ? 'bg-purple-100 text-purple-800 border-purple-200' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                                title={order.isChurchOrder ? "Church Order" : "Mark as Church Order"}
                                            >
                                                <span className="font-bold text-xs px-1">{order.isChurchOrder ? 'CHURCH' : 'PRSNL'}</span>
                                            </button>

                                            {order.status === 'pending_verification' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerify(order.orderId)}
                                                        className="text-green-600 hover:text-green-900 p-1 border border-green-200 rounded hover:bg-green-50"
                                                        title="Verify (Valid)"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(order.orderId)}
                                                        className="text-red-600 hover:text-red-900 p-1 border border-red-200 rounded hover:bg-red-50"
                                                        title="Reject (Invalid)"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {user?.role === 'superadmin' && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingOrder(order)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 border border-blue-200 rounded hover:bg-blue-50 ml-2"
                                                        title="Edit (Superadmin)"
                                                    >
                                                        <span className="font-bold text-xs px-1">EDIT</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(order.orderId)}
                                                        className="text-red-600 hover:text-red-900 p-1 border border-red-200 rounded hover:bg-red-50 ml-1"
                                                        title="Delete (Superadmin)"
                                                    >
                                                        <span className="font-bold text-xs px-1">DEL</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <CreateOrderModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
            
            <EditOrderModal
                isOpen={!!editingOrder}
                onClose={() => setEditingOrder(null)}
                order={editingOrder}
                onSuccess={() => {
                    setEditingOrder(null);
                    setRefreshKey(prev => prev + 1);
                }}
            />
        </div>
    );
}
