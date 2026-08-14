import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CartItem, Coupon, Lang, MenuItem, Order, OrderStatus, Portion } from '../types'
import { SEED_MENU } from '../data/seed'
import { showToast } from '../components/Toast'
import { ADVANCE_PERCENT } from '../lib/business'

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
  createCoupon: (coupon: Coupon) => Promise<boolean>
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('tfg_menu_v5')
      return saved ? JSON.parse(saved) : SEED_MENU
    } catch {
      return SEED_MENU
    }
  })

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('tfg_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('tfg_orders')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('tfg_lang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('tfg_lang', l)
  }

  useEffect(() => {
    localStorage.setItem('tfg_menu_v5', JSON.stringify(menu))
  }, [menu])

  useEffect(() => {
    localStorage.setItem('tfg_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('tfg_orders', JSON.stringify(orders))
  }, [orders])

  const priceFor = (item: MenuItem | undefined, portion: Portion): number => {
    if (!item) return 0
    if (portion === 'A') return item.pA
    if (portion === 'B') return item.pB
    return item.pC
  }

  const addToCart = (productId: string, portion: Portion, qty = 1) => {
    const item = menu.find(m => m.id === productId)
    if (!item || !item.inStock) return

    setCart(prev => {
      const existing = prev.find(c => c.productId === productId && c.portion === portion)
      if (existing) {
        return prev.map(c => c.productId === productId && c.portion === portion ? { ...c, qty: c.qty + qty } : c)
      }
      return [...prev, { productId, portion, qty }]
    })

    showToast(`${item.name} added to order!`, '🍽️')
  }

  const updateCartQty = (productId: string, portion: Portion, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, portion)
      return
    }
    setCart(prev => prev.map(c => c.productId === productId && c.portion === portion ? { ...c, qty } : c))
  }

  const removeFromCart = (productId: string, portion: Portion) => {
    setCart(prev => prev.filter(c => !(c.productId === productId && c.portion === portion)))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => {
    const p = menu.find(m => m.id === c.productId)
    return s + (p ? priceFor(p, c.portion) * c.qty : 0)
  }, 0)

  const placeOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const orderItems = cart.map(c => {
      const p = menu.find(m => m.id === c.productId)!
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
    const deliveryFee = orderData.orderType === 'delivery' ? (orderData.deliveryFee || 30) : 0
    const discount = orderData.discountAmount || 0
    const total = Math.max(0, subtotal + deliveryFee - discount)
    const advanceAmount = Math.ceil(total * ADVANCE_PERCENT)

    const newOrder: Order = {
      id: `TFG-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: orderData.userId,
      userName: orderData.userName || 'Guest Customer',
      phone: orderData.phone || '',
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

    setOrders(prev => [newOrder, ...prev])
    clearCart()
    showToast('🎉 Order placed successfully!', '✅')
    return newOrder
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  }

  const verifyUtr = async (orderId: string, verified: boolean) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, utrVerified: verified, status: verified ? 'confirmed' : o.status } : o))
  }

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const validateCoupon = async (code: string, orderTotal: number): Promise<Coupon | null> => {
    const clean = code.trim().toUpperCase()
    if (clean === 'TFG50') {
      return { code: 'TFG50', discount_type: 'flat', discount_value: 50, min_order: 300, valid: true, discount: 50, message: '✅ ₹50 Off Applied!' }
    }
    if (clean === 'WELCOME10') {
      const disc = Math.round(orderTotal * 0.1)
      return { code: 'WELCOME10', discount_type: 'percent', discount_value: 10, min_order: 200, valid: true, discount: disc, message: '✅ 10% Off Applied!' }
    }
    return null
  }

  const createCoupon = async (coupon: Coupon) => {
    return true
  }

  return (
    <StoreContext.Provider
      value={{
        menu,
        cart,
        orders,
        lang,
        cartCount,
        cartTotal,
        setLang,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        priceFor,
        placeOrder,
        updateOrderStatus,
        verifyUtr,
        deleteOrder,
        validateCoupon,
        createCoupon,
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
