export type Portion = 'A' | 'B' | 'C' // A: Family/Jumbo, B: Full Plate, C: Half Plate
export type Lang = 'en' | 'bn'
export type UserRole = 'customer' | 'seller' | 'rider' | 'admin'
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'pending' | 'advance_paid' | 'confirmed' | 'cooking' | 'ready' | 'delivered' | 'cancelled' | 'refunded'
export type DeliverySlot = 'morning' | 'evening' | 'instant'

export interface User {
  id: string
  phone: string
  name: string
  email?: string
  role: UserRole
  createdAt?: string
}

export interface MenuItem {
  id: string
  name: string
  bnName: string
  emoji: string
  category: string
  unit: string
  pA: number // Family / Jumbo Pack
  pB: number // Full Plate
  pC: number // Half Plate / Regular
  inStock: boolean
  stockQty?: number
  imageUrl?: string
  archived?: boolean
  description?: string
}

export interface CartItem {
  productId: string
  portion: Portion
  qty: number
}

export interface OrderItem {
  productId: string
  name: string
  bnName?: string
  portion: Portion
  qty: number
  unitPrice: number
  emoji: string
}

export interface Order {
  id: string
  userId?: string
  userName: string
  phone: string
  orderType: OrderType
  tableNo?: string
  address: string
  pin?: string
  geoLat?: number
  geoLng?: number
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discountAmount: number
  total: number
  advanceAmount: number
  utr: string
  utrVerified: boolean
  status: OrderStatus
  deliverySlot?: DeliverySlot
  createdAt: string
  updatedAt?: string
}

export interface Address {
  id?: number
  user_id?: string
  label: string
  address: string
  phone: string
  pin: string
  is_default: boolean
}

export interface Coupon {
  code: string
  discount_type: 'flat' | 'percent'
  discount_value: number
  min_order: number
  valid: boolean
  discount?: number
  message?: string
}

export interface DailyReport {
  id?: number
  report_date: string
  total_orders: number
  total_revenue: number
  total_cancelled: number
  mandi_cost: number
  delivery_cost: number
  profit: number
}

export interface DeliveryZone {
  pin_prefix: string
  zone: string
  fee: number
  eta_hours: string
}

export interface AppNotification {
  id: string
  userId?: string
  title: string
  message: string
  sender: string
  createdAt: string
}
