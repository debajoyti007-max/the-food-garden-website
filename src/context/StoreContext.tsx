import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Address, CartItem, Coupon, Lang, MenuItem, Order, OrderStatus, Portion } from '../types'
import { SEED_MENU } from '../data/seed'
import { showToast } from '../components/Toast'
import { ADVANCE_PERCENT, formatOrderId } from '../lib/business'
import {
  createOrderApi,
  deleteOrderApi,
  fetchOrdersApi,
  fetchProductsApi,
  updateOrderStatusApi,
  verifyUtrApi,
  validateCouponApi,
  upsertProductApi,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface StoreContextType {
  menu: MenuItem[]
  cart: CartItem[]
  orders: Order[]
  addresses: Address[]
  lang: Lang
  cartCount: number
  cartTotal: number
  setLang: (lang: Lang) => void
  addToCart: (productId: string, portion: Portion, qty?: number) => void
  updateCartQty: (productId: string, portion: Portion, qty: number) => void
  removeFromCart: (productId: string, portion: Portion) => void
  clearCart: () => void
  reorder: (order: Order) => void
  priceFor: (item: MenuItem | undefined, portion: Portion) => number
  placeOrder: (orderData: Partial<Order>) => Promise<Order>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  verifyUtr: (orderId: string, verified: boolean) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  cancelOrder: (orderId: string) => Promise<boolean>
  rateOrder: (orderId: string, rating: number, review?: string, tags?: string[]) => Promise<boolean>
  archiveProduct: (productId: string, archived: boolean) => Promise<boolean>
  updateMenuItem: (item: MenuItem) => Promise<boolean>
  validateCoupon: (code: string, orderTotal: number) => Promise<Coupon | null>
  saveAddress: (address: Address) => void
  deleteAddress: (id: string | number) => void
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
      const savedUserId = localStorage.getItem('tfg_cart_user')
      const savedCart = localStorage.getItem('tfg_cart')
      if (savedCart && savedUserId === (user?.id || 'guest')) return JSON.parse(savedCart)
      return []
    } catch { return [] }
  })

  const [orders, setOrders] = useState<Order[]>([])

  const [addresses, setAddresses] = useState<Address[]>(() => {
    try {
      const saved = localStorage.getItem(`tfg_addresses_${user?.id || 'guest'}`)
      return saved ? JSON.parse(saved) : [
        { label: '🏠 Home', address: 'Bhabanipur Near Kali Mandir, Nandakumar', phone: user?.phone || '', pin: '721648', is_default: true },
      ]
    } catch { return [] }
  })

  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('tfg_lang') as Lang) || 'en' }
    catch { return 'en' }
  })

  const isStaff = user && STAFF_ROLES.includes(user.role)

  // ── Load orders based on role ─────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    const allOrders = await fetchOrdersApi()
    if (!allOrders) return

    if (!user) {
      // Guests: show orders placed in current session
      setOrders((prev) => prev.length > 0 ? prev : allOrders.slice(0, 3))
      return
    }

    if (isStaff) {
      setOrders(allOrders)
    } else {
      const myOrders = allOrders.filter(
        (o) => o.phone === user.phone || o.userId === user.id
      )
      setOrders(myOrders)
    }
  }, [user?.id, user?.role, isStaff, user?.phone])

  // ── Load products on mount ────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    const data = await fetchProductsApi()
    if (data && data.length > 0) {
      setMenu(data)
      localStorage.setItem('tfg_menu_v5', JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  // ── Load orders on user change ────────────────────────────────────────────
  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // ── Real-time Orders Subscription (Universal) ─────────────────────────────
  useEffect(() => {
    const ordersChannel = supabase
      .channel('public:orders:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void loadOrders()
      })
      .subscribe()

    const productsChannel = supabase
      .channel('public:products:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void loadProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [loadOrders, loadProducts])

  // ── Save addresses per user ───────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(`tfg_addresses_${user?.id || 'guest'}`, JSON.stringify(addresses))
  }, [addresses, user?.id])

  // ── Cart persistence ──────────────────────────────────────────────────────
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

  const reorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return
    const newCart: CartItem[] = order.items.map((it) => ({
      productId: it.productId,
      portion: it.portion,
      qty: it.qty,
    }))
    setCart(newCart)
    showToast(`Items from #${formatOrderId(order.id)} reloaded into Cart! 🛒`, '🔄')
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

  // ── 🍽️ Live Menu & Stock Item Update (with Supabase Upsert) ───────────────
  const updateMenuItem = async (updatedItem: MenuItem): Promise<boolean> => {
    setMenu((prev) =>
      prev.map((p) => (p.id === updatedItem.id ? updatedItem : p))
    )
    const updatedMenu = menu.map((p) => (p.id === updatedItem.id ? updatedItem : p))
    localStorage.setItem('tfg_menu_v5', JSON.stringify(updatedMenu))

    const ok = await upsertProductApi(updatedItem)
    if (ok) {
      showToast(`${updatedItem.name} updated live! ✅`, '🍽️')
    } else {
      showToast(`${updatedItem.name} updated locally`, '💾')
    }
    return ok
  }

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
        o.id === orderId ? { ...o, utrVerified: verified, status: verified ? 'cooking' : o.status, updatedAt: new Date().toISOString() } : o,
      ),
    )
    await verifyUtrApi(orderId, verified)
  }

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled', updatedAt: new Date().toISOString() } : o))
    )
    const ok = await updateOrderStatusApi(orderId, 'cancelled')
    if (ok) showToast('Order has been cancelled', '❌')
    return ok
  }

  const rateOrder = async (orderId: string, rating: number, review?: string, tags?: string[]): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, rating, review: review || '', ratingTags: tags || [] }
          : o
      )
    )
    localStorage.setItem(`tfg_rating_${orderId}`, JSON.stringify({ rating, review, tags }))

    try {
      await supabase
        .from('orders')
        .update({
          rating,
          review: review || null,
          rating_tags: tags && tags.length > 0 ? tags : null,
        })
        .eq('id', orderId)
    } catch {}

    showToast(`Thank you for your ${rating}★ review! 🙏`, '⭐')
    return true
  }

  const archiveProduct = async (productId: string, archived: boolean): Promise<boolean> => {
    setMenu((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, archived } : p))
    )
    try {
      const { error } = await supabase.from('products').update({ archived }).eq('id', productId)
      if (!error) {
        showToast(archived ? 'Dish archived from menu 📦' : 'Dish restored to menu 🟢', archived ? '📦' : '🟢')
        return true
      }
    } catch {}
    return true
  }

  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    await deleteOrderApi(orderId)
  }

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

  const saveAddress = (addr: Address) => {
    setAddresses((prev) => {
      const next = [addr, ...prev.filter((a) => a.address !== addr.address)]
      return next.slice(0, 5)
    })
    showToast(`Address "${addr.label}" saved!`, '📍')
  }

  const deleteAddress = (target: string | number) => {
    setAddresses((prev) =>
      prev.filter((a, idx) => idx !== target && a.address !== target)
    )
    showToast('Address removed', '🗑️')
  }

  return (
    <StoreContext.Provider
      value={{
        menu, cart, orders, addresses, lang, cartCount, cartTotal,
        setLang, addToCart, updateCartQty, removeFromCart, clearCart, reorder,
        priceFor, placeOrder, updateOrderStatus, verifyUtr, deleteOrder, cancelOrder,
        rateOrder, archiveProduct, updateMenuItem, validateCoupon, saveAddress, deleteAddress,
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
