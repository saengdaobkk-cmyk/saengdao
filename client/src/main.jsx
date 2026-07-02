import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirm from "./pages/OrderConfirm.jsx";
import Account from "./pages/Account.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminSlides from "./pages/admin/AdminSlides.jsx";
import AdminContent from "./pages/admin/AdminContent.jsx";
import AdminIntegrations from "./pages/admin/AdminIntegrations.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminCoupons from "./pages/admin/AdminCoupons.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* หน้าร้าน */}
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="books/:id" element={<BookDetail />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders/:id" element={<OrderConfirm />} />
              <Route path="account" element={<Account />} />
              </Route>

              {/* หลังร้าน — layout แยกเอกเทศ */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="slides" element={<AdminSlides />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
