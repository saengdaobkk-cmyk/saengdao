import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import App from "./App.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Collection from "./pages/Collection.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import TermCollection from "./pages/TermCollection.jsx";
import TermDirectory from "./pages/TermDirectory.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirm from "./pages/OrderConfirm.jsx";
import Account from "./pages/Account.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminCollections, { CategoryManager, TermManager } from "./pages/admin/AdminCollections.jsx";
import AdminNav from "./pages/admin/AdminNav.jsx";
import AdminSlides from "./pages/admin/AdminSlides.jsx";
import AdminContent from "./pages/admin/AdminContent.jsx";
import AdminIntegrations from "./pages/admin/AdminIntegrations.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminCoupons from "./pages/admin/AdminCoupons.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              {/* หน้าร้าน */}
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="books" element={<Collection />} />
                <Route path="books/:id" element={<BookDetail />} />
              <Route path="publishers" element={<TermDirectory type="PUBLISHER" />} />
              <Route path="authors" element={<TermDirectory type="AUTHOR" />} />
              <Route path="translators" element={<TermDirectory type="TRANSLATOR" />} />
              <Route path="publisher/:slug" element={<TermCollection type="PUBLISHER" />} />
              <Route path="author/:slug" element={<TermCollection type="AUTHOR" />} />
              <Route path="translator/:slug" element={<TermCollection type="TRANSLATOR" />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders/:id" element={<OrderConfirm />} />
              <Route path="account" element={<Account />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              </Route>

              {/* หลังร้าน — login แยกจากลูกค้า + layout แยกเอกเทศ */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="collections" element={<AdminCollections />}>
                  <Route index element={<CategoryManager />} />
                  <Route path="publishers" element={<TermManager type="PUBLISHER" />} />
                  <Route path="authors" element={<TermManager type="AUTHOR" />} />
                  <Route path="translators" element={<TermManager type="TRANSLATOR" />} />
                </Route>
                <Route path="pages" element={<AdminNav />} />
                <Route path="slides" element={<AdminSlides />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
