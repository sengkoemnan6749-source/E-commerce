import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/StoreContext';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import AdminLayout from '../admin/Components/AdminLayout';

// Customer Pages
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Wishlist from '../pages/Wishlist';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import OrderTracking from '../pages/OrderTracking';
import About from '../pages/About';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Account Pages
import AccountLayout from '../pages/Account/AccountLayout';
import AccountOverview from '../pages/Account';
import AccountProfile from '../pages/Account/Profile';
import AccountOrders from '../pages/Account/Orders';
import AccountAddresses from '../pages/Account/Addresses';
import AccountInvoices from '../pages/Account/Invoices';

// Admin Pages
import AdminDashboard from '../admin/Dashboard';
import AdminProducts from '../admin/Products';
import AdminCategories from '../admin/Categories';
import AdminOrders from '../admin/Orders';
import AdminCustomers from '../admin/Customers';

function CustomerRouteGuard({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/account" replace />;
  }
  return children;
}

function AdminRouteGuard({ children }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }
  if (!isAdmin && user?.role !== 'admin') {
    return <Navigate to="/account" replace />;
  }
  return children;
}

// Dedicated direct-access guard for TechTonicAdmin route requested by teacher
function TechTonicAdminDirectGuard({ children }) {
  const { user, isAuthenticated, isAdmin, loginAsAdmin } = useAuth();

  React.useEffect(() => {
    // If visitor is not yet authenticated as admin, automatically promote/login to TechTonicAdmin session
    if (!isAuthenticated || !isAdmin || user?.role !== 'admin') {
      if (typeof loginAsAdmin === 'function') {
        loginAsAdmin();
      }
    }
  }, [isAuthenticated, isAdmin, user, loginAsAdmin]);

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/about" element={<About />} />

        {/* Customer Account Routes */}
        <Route
          path="/account"
          element={
            <CustomerRouteGuard>
              <AccountLayout />
            </CustomerRouteGuard>
          }
        >
          <Route index element={<AccountOverview />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="invoices" element={<AccountInvoices />} />
        </Route>
      </Route>

      {/* Dedicated Big-Tech Account Portal (Like Xiaomi Account, Apple ID, Tesla) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dedicated TechTonicAdmin Direct Route (Teacher Requirement) */}
      <Route
        path="/TechTonicAdmin"
        element={
          <TechTonicAdminDirectGuard>
            <AdminLayout />
          </TechTonicAdminDirectGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      {/* Case-insensitive alias */}
      <Route path="/techtonicadmin/*" element={<Navigate to="/TechTonicAdmin" replace />} />

      {/* Standard Admin UI Routes - strictly guarded for role === 'admin' */}
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
