import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Coupon, Lang, MenuItem, Order, OrderStatus, Portion } from '../types'
import { SEED_MENU } from '../data/seed'
import { showToast } from '../components/Toast'
import { ADVANCE_PERCENT } from '../lib/business'
import {
  createOrderApi,
  deleteOrderApi,
  fetchOrdersApi,
  fetchProductsApi,
  updateOrderStatusApi,
  verifyUtrApi,
  validateCouponApi,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface StoreContextType {
  menu: MenuItem[]
  cart: CartItem[]
  orders: Order[]
  lang: Lang
  cartCount: number
  cartTotal: number
  setLang: (lang: Lang) => void
  addToCart: (productId: string, portion: Portion, qty?: number) => void
  updateCartQty: (productId: string, portion: Portion, qty: number) => void
  removeFromCart: (productId: string, portion: Portion) => void
  clearCart: () => void
  priceFor: (item: MenuItem | undefined, portion: Portion) => number
  placeOrder: (orderData: Partial<Order>) => Promise<Order>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  verifyUtr: (orderId: string, verified: boolean) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  validateCoupon: (code: string, orderTotal: number) => Promise<Coupon | null>
}

const StoreContext = createContext<StoreContextType | null>(null)

// Roles that can see ALL orders (kitchen staff)
const STAFF_ROLES = ['admin', 'seller', 'rider']

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('tfg_menu_v5')
      return saved ? JSON.parse(saved) : SEED_MENU
    } catch { return SEED_MENU }
  })

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      // Cart is per-user — clear if user mismatch
      const savedUserId = localStorage.getItem('tfg_cart_user')
      const savedCart = localStorage.getItem('tfg_cart')
      if (savedCart && savedUserId === (user?.id || 'guest')) return JSON.parse(savedCart)
      return []
    } catch { return [] }
  })

  // Orders: starts empty — loaded from Supabase based on role
  const [orders, setOrders] = useState<Order[]>([])

  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('tfg_lang') as Lang) || 'en' }
    catch { return 'en' }
  })

  const isStaff = user && STAFF_ROLES.includes(user.role)

  // ── Load orders based on role ─────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]) // Not logged in → no orders
      return
    }

    if (isStaff) {
      // Staff sees ALL orders
      const allOrders = await fetchOrdersApi()
      setOrders(allOrders || [])
    } else {
      // Customer sees ONLY their own orders (filtered by phone)
      const allOrders = await fetchOrdersApi()
      const myOrders = (allOrders || []).filter(
        (o) => o.phone === user.phone || o.userId === user.id
      )
      setOrders(myOrders)
    }
  }, [user?.id, user?.role])

  // ── Load products on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchProductsApi().then((data) => {
      if (data && data.length > 0) {
        setMenu(data)
        localStorage.setItem('tfg_menu_v5', JSON.stringify(data))
      }
    })
  }, [])

  // ── Load orders when user changes (login/logout/role change) ─────────────
  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // ── Clear orders on logout ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) setOrders([])
  }, [user])

  // ── Real-time subscription: refresh on any order change ──────────────────
  useEffect(() => {
    if (!user) return // No subscription for guests

    const channel = supabase
      .channel(`orders-rt-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, loadOrders])

  // ── Cart persistence per user ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('tfg_cart', JSON.stringify(cart))
    localStorage.setItem('tfg_cart_user', user?.id || 'guest')
  }, [cart, user?.id])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('tfg_lang', l)
  }

  const priceFor = (item: MenuItem | undefined, portion: Portion): number => {
    if (!item) return 0
    if (portion === 'A') return item.pA
    if (portion === 'B') return item.pB
    return item.pC
  }

  const addToCart = (productId: string, portion: Portion, qty = 1) => {
    const item = menu.find((m) => m.id === productId)
    if (!item || !item.inStock) return
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId && c.portion === portion)
      if (existing) {
        return prev.map((c) =>
          c.productId === productId && c.portion === portion ? { ...c, qty: c.qty + qty } : c,
        )
      }
      return [...prev, { productId, portion, qty }]
    })
    showToast(`${item.name} added to order!`, '🍽️')
  }

  const updateCartQty = (productId: string, portion: Portion, qty: number) => {
    if (qty <= 0) { removeFromCart(productId, portion); return }
    setCart((prev) =>
      prev.map((c) => (c.productId === productId && c.portion === portion ? { ...c, qty } : c)),
    )
  }

  const removeFromCart = (productId: string, portion: Portion) => {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.portion === portion)))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => {
    const p = menu.find((m) => m.id === c.productId)
    return s + (p ? priceFor(p, c.portion) * c.qty : 0)
  }, 0)

  const placeOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const orderItems = cart.map((c) => {
      const p = menu.find((m) => m.id === c.productId)!
      return {
        productId: c.productId,
        name: p.name,
        bnName: p.bnName,
        portion: c.portion,
        qty: c.qty,
        unitPrice: priceFor(p, c.portion),
        emoji: p.emoji,
      }
    })

    const subtotal = cartTotal
    const deliveryFee = orderData.orderType === 'delivery' ? orderData.deliveryFee || 30 : 0
    const discount = orderData.discountAmount || 0
    const total = Math.max(0, subtotal + deliveryFee - discount)
    const advanceAmount = Math.ceil(total * ADVANCE_PERCENT)

    const newOrder: Order = {
      id: `TFG-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: orderData.userId || user?.id,
      userName: orderData.userName || user?.name || 'Guest Customer',
      phone: orderData.phone || user?.phone || '',
      orderType: orderData.orderType || 'dine_in',
      tableNo: orderData.tableNo || '',
      address: orderData.address || '',
      pin: orderData.pin || '',
      items: orderItems,
      subtotal,
      deliveryFee,
      discountAmount: discount,
      total,
      advanceAmount,
      utr: orderData.utr || '',
      utrVerified: false,
      status: 'pending',
      deliverySlot: orderData.deliverySlot || 'instant',
      createdAt: new Date().toISOString(),
    }

    // Immediately add to local state (customer sees their own order right away)
    setOrders((prev) => [newOrder, ...prev])
    clearCart()
    await createOrderApi(newOrder)
    showToast('🎉 Order placed successfully!', '✅')
    return newOrder
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
    )
    await updateOrderStatusApi(orderId, status)
  }

  const verifyUtr = async (orderId: string, verified: boolean) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, utrVerified: verified, status: verified ? 'cooking' : o.status } : o,
      ),
    )
    await verifyUtrApi(orderId, verified)
  }

  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    await deleteOrderApi(orderId)
  }

  // ── Coupon validation — Supabase first, no hardcoded codes ───────────────
  const validateCoupon = async (code: string, orderTotal: number): Promise<Coupon | null> => {
    const result = await validateCouponApi(code, orderTotal)
    if (!result.valid) {
      showToast(result.message, '❌')
      return null
    }
    showToast(result.message, '🏷️')
    return {
      code: code.trim().toUpperCase(),
      discount_type: 'flat',
      discount_value: result.discount,
      min_order: 0,
      valid: true,
      discount: result.discount,
      message: result.message,
    }
  }

  return (
    <StoreContext.Provider
      value={{
        menu, cart, orders, lang, cartCount, cartTotal,
        setLang, addToCart, updateCartQty, removeFromCart, clearCart,
        priceFor, placeOrder, updateOrderStatus, verifyUtr, deleteOrder, validateCoupon,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
