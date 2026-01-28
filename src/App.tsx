import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.tsx";
import OrderPage from "./pages/OrderPage.tsx";
import VerificationPage from "./pages/VerificationPage.tsx";
import AdminLayout from "./components/AdminLayout.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";
import AdminOrderDetail from "./pages/AdminOrderDetail.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { AuthProvider } from "./components/AuthProvider.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

import PaymentPage from "./pages/PaymentPage.tsx";

function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage onOrder={() => navigate("/order")} onVerify={() => navigate("/verify")} onAdmin={() => navigate("/admin")} />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/payment/:orderId" element={<PaymentPage />} />
      <Route path="/verify" element={<VerificationPage />} />
      <Route path="/verify/:couponCode" element={<VerificationPage />} />

      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
