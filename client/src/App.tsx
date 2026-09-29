import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { ProductDetailsPage } from './pages/public/ProductDetailsPage';
import { CartPage } from './pages/public/CartPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import OrderConfirmationPage from './pages/public/OrderConfirmationPage';
import CategoriesPage from './pages/public/CategoriesPage';
import OffersPage from './pages/public/OffersPage';
import BestSellersPage from './pages/public/BestSellersPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';

// Customer Account Pages
import AccountDashboardPage from './pages/account/AccountDashboardPage';
import MyOrdersPage from './pages/account/MyOrdersPage';
import OrderDetailsPage from './pages/account/OrderDetailsPage';
import WishlistPage from './pages/account/WishlistPage';
import MyReviewsPage from './pages/account/MyReviewsPage';
import AddressesPage from './pages/account/AddressesPage';
import SettingsPage from './pages/account/SettingsPage';

// Admin Panel Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminAddEditProductPage from './pages/admin/AdminAddEditProductPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from './pages/admin/AdminOrderDetailsPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminHealthPage from './pages/admin/AdminHealthPage';
import AdminBugsPage from './pages/admin/AdminBugsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* 1. Public Storefront Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/bestsellers" element={<BestSellersPage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                  <Route path="/order-confirmed/:id" element={<OrderConfirmationPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                </Route>

                {/* 2. Customer Portal Routes */}
                <Route path="/account" element={<CustomerLayout />}>
                  <Route index element={<AccountDashboardPage />} />
                  <Route path="orders" element={<MyOrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailsPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="reviews" element={<MyReviewsPage />} />
                  <Route path="addresses" element={<AddressesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* 3. Admin Control Panel Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminAddEditProductPage />} />
                  <Route path="products/:id/edit" element={<AdminAddEditProductPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="returns" element={<AdminReturnsPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="health" element={<AdminHealthPage />} />
                  <Route path="bugs" element={<AdminBugsPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                </Route>

                {/* 4. Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
