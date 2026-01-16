import { Link, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
    const location = useLocation();

    // Exact match for dashboard, startswith for orders subpages if any
    const isActive = (path: string) => {
        if (path === "/admin") return location.pathname === "/admin";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">E-Kupon Admin</h1>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <Link
                        to="/admin"
                        className={`block px-4 py-2 rounded-md transition-colors ${isActive("/admin") && location.pathname === "/admin"
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/orders"
                        className={`block px-4 py-2 rounded-md transition-colors ${isActive("/admin/orders")
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Orders
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">Back to Website</Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
