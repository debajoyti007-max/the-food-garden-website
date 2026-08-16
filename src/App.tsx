import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import type { UserRole } from './types'
import Layout from './components/Layout'

// Pages
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import TrackOrder from './pages/TrackOrder'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Auth from './pages/Auth'

// Seller (Kitchen Staff + Admin)
import SellerHome from './pages/seller/SellerHome'
import SellerOrders from './pages/seller/SellerOrders'
import SellerProducts from './pages/seller/SellerProducts'

// Rider (Delivery + Seller + Admin)
import RiderView from './pages/rider/RiderView'

// Admin-only
import AdminHome from './pages/admin/AdminHome'
import AdminStaff from './pages/admin/AdminStaff'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminUsers from './pages/admin/AdminUsers'

// ─── Role-Based Route Guard ─────────────────────────────────────────────────
function RequireRole({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color: '#f59e0b', textAlign: 'center', padding: '3rem', fontSize: '1.2rem' }}>⏳ Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  if (!allow.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color: '#f59e0b', textAlign: 'center', padding: '3rem' }}>⏳ Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

// ─── Route Map ───────────────────────────────────────────────────────────────
// 👤 CUSTOMER  → public pages + /orders + /profile
// 🛵 RIDER     → customer pages + /rider
// 👨‍🍳 SELLER    → customer pages + /rider + /seller + /seller/orders + /seller/products
// 🛡️ ADMIN     → EVERYTHING + /admin + /admin/staff

function HomeRoute() {
  const { user } = useAuth()
  if (user?.role === 'rider') return <Navigate to="/rider" replace />
  return <Shop />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>

        {/* ═══════════════════════════════════════════════════
            PUBLIC — All visitors (no login required)
        ═══════════════════════════════════════════════════ */}
        <Route index element={<HomeRoute />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="orders/success/:id" element={<OrderSuccess />} />
        <Route path="auth" element={<Auth />} />

        {/* ═══════════════════════════════════════════════════
            CUSTOMER + above — Requires login
        ═══════════════════════════════════════════════════ */}
        <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />

        {/* ═══════════════════════════════════════════════════
            RIDER — rider + seller + admin
            Powers: See delivery orders, Google Maps, mark delivered
        ═══════════════════════════════════════════════════ */}
        <Route
          path="rider"
          element={
            <RequireRole allow={['rider', 'seller', 'admin']}>
              <RiderView />
            </RequireRole>
          }
        />

        {/* ═══════════════════════════════════════════════════
            SELLER / KITCHEN — seller + admin
            Powers: View orders, verify UTR, mark cooking→ready, KOT print
        ═══════════════════════════════════════════════════ */}
        <Route
          path="seller"
          element={
            <RequireRole allow={['seller', 'admin']}>
              <SellerHome />
            </RequireRole>
          }
        />
        <Route
          path="seller/orders"
          element={
            <RequireRole allow={['seller', 'admin']}>
              <SellerOrders />
            </RequireRole>
          }
        />
        <Route
          path="seller/products"
          element={
            <RequireRole allow={['seller', 'admin']}>
              <SellerProducts />
            </RequireRole>
          }
        />

        {/* ═══════════════════════════════════════════════════
            ADMIN ONLY — admin only
            Powers: All + create/demote staff, block users, role management
        ═══════════════════════════════════════════════════ */}
        <Route
          path="admin"
          element={
            <RequireRole allow={['admin']}>
              <AdminHome />
            </RequireRole>
          }
        />
        <Route
          path="admin/staff"
          element={
            <RequireRole allow={['admin']}>
              <AdminStaff />
            </RequireRole>
          }
        />
        <Route
          path="admin/coupons"
          element={
            <RequireRole allow={['admin']}>
              <AdminCoupons />
            </RequireRole>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRole allow={['admin']}>
              <AdminUsers />
            </RequireRole>
          }
        />

      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
