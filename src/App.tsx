import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/Layout'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import TrackOrder from './pages/TrackOrder'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import SellerHome from './pages/seller/SellerHome'
import SellerOrders from './pages/seller/SellerOrders'
import SellerProducts from './pages/seller/SellerProducts'
import RiderView from './pages/rider/RiderView'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Shop />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="track" element={<TrackOrder />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/success/:id" element={<OrderSuccess />} />
              <Route path="profile" element={<Profile />} />
              <Route path="auth" element={<Auth />} />
              <Route path="seller" element={<SellerHome />} />
              <Route path="seller/orders" element={<SellerOrders />} />
              <Route path="seller/products" element={<SellerProducts />} />
              <Route path="rider" element={<RiderView />} />
            </Route>
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
