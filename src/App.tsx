import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.tsx";
import OrderPage from "./pages/OrderPage.tsx";
import VerificationPage from "./pages/VerificationPage.tsx";
import AdminLayout from "./components/AdminLayout.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";

// Placeholder components for missing pages
const PaymentPage = () => <div className="p-8 text-center text-2xl">Payment Page (Coming Soon)</div>;

function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage onOrder={() => navigate("/order")} onVerify={() => navigate("/verify")} onAdmin={() => navigate("/admin")} />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/payment/:orderId" element={<PaymentPage />} />
      <Route path="/verify" element={<VerificationPage />} />
      <Route path="/verify/:couponCode" element={<VerificationPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
