import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/admin";
import type { DashboardStats } from "../api/admin";
import { BookOpen, CheckCircle, Clock, CreditCard } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8">Loading stats...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-red-500">Failed to load stats.</div>;
    }

    const cards = [
        {
            label: "Available Books",
            value: stats.availableBooks,
            icon: BookOpen,
            color: "bg-blue-500",
        },
        {
            label: "Sold Books",
            value: stats.soldBooks,
            icon: CheckCircle,
            color: "bg-green-500",
        },
        {
            label: "Pending Verification",
            value: stats.pendingVerificationOrders,
            icon: Clock,
            color: "bg-orange-500",
        },
        {
            label: "Pending Payment",
            value: stats.pendingPaymentOrders,
            icon: CreditCard,
            color: "bg-yellow-500",
        },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-6 rounded-lg shadow-md flex items-center">
                        <div className={`p-4 rounded-full ${card.color} text-white mr-4`}>
                            <card.icon size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
