import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, verifyOrder, rejectOrder } from "../api/admin";
import type { AdminOrder } from "../api/admin";
import { Check, X, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function AdminOrders() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("desc");
    const [refreshKey, setRefreshKey] = useState(0); // to force reload

    useEffect(() => {
        setLoading(true);
        getOrders({
            page,
            limit: 10,
            status: statusFilter === "all" ? undefined : statusFilter,
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
    }, [page, statusFilter, search, sort, refreshKey]);

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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Management</h2>

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
                        <option value="cancelled">Cancelled</option>
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
                                        <div className="font-medium text-gray-900">{order.customer.namaLengkap}</div>
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
                                ${order.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
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
                                        {order.status === 'pending_verification' && (
                                            <div className="flex gap-2">
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
                                            </div>
                                        )}
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
        </div>
    );
}
