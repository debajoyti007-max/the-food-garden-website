import { supabase } from './supabase'
import type { MenuItem, Order, OrderStatus } from '../types'
import { SEED_MENU } from '../data/seed'

export async function fetchProductsApi(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true })
    if (error || !data || data.length === 0) {
      return SEED_MENU
    }
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      bnName: d.bn_name,
      emoji: d.emoji || '🍽️',
      category: d.category,
      unit: d.unit || 'plate',
      pA: Number(d.p_a),
      pB: Number(d.p_b),
      pC: Number(d.p_c),
      inStock: d.in_stock ?? true,
      imageUrl: d.image_url,
      archived: d.archived ?? false,
      description: d.description,
    }))
  } catch {
    return SEED_MENU
  }
}

export async function createOrderApi(order: Order): Promise<boolean> {
  try {
    const { error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId || null,
      user_name: order.userName,
      phone: order.phone,
      order_type: order.orderType,
      table_no: order.tableNo || null,
      address: order.address,
      total: order.total,
      advance_amount: order.advanceAmount,
      discount_amount: order.discountAmount,
      utr: order.utr,
      utr_verified: order.utrVerified,
      status: order.status,
    })

    if (orderErr) {
      console.warn('Supabase insert order error, saved locally:', orderErr)
      return false
    }

    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((it) => ({
        order_id: order.id,
        product_id: it.productId,
        name: it.name,
        portion: it.portion,
        qty: it.qty,
        unit_price: it.unitPrice,
        emoji: it.emoji,
      }))
      await supabase.from('order_items').insert(itemsToInsert)
    }

    return true
  } catch (err) {
    console.warn('API error, fallback to local storage:', err)
    return false
  }
}

export async function fetchOrdersApi(): Promise<Order[]> {
  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (error || !ordersData) return []

    return ordersData.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      userName: d.user_name,
      phone: d.phone,
      orderType: d.order_type || 'dine_in',
      tableNo: d.table_no,
      address: d.address,
      total: Number(d.total),
      advanceAmount: Number(d.advance_amount),
      deliveryFee: Number(d.delivery_fee || 0),
      discountAmount: Number(d.discount_amount || 0),
      subtotal: Number(d.total) - Number(d.delivery_fee || 0) + Number(d.discount_amount || 0),
      utr: d.utr,
      utrVerified: Boolean(d.utr_verified),
      status: d.status as OrderStatus,
      createdAt: d.created_at,
      items: (d.order_items || []).map((it: any) => ({
        productId: it.product_id,
        name: it.name,
        portion: it.portion,
        qty: Number(it.qty),
        unitPrice: Number(it.unit_price),
        emoji: it.emoji || '🍽️',
      })),
    }))
  } catch {
    return []
  }
}

export async function updateOrderStatusApi(orderId: string, status: OrderStatus): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

export async function verifyUtrApi(orderId: string, verified: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ utr_verified: verified, status: verified ? 'cooking' : 'pending' })
      .eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

export async function deleteOrderApi(orderId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

export async function validateCouponApi(code: string, orderTotal: number): Promise<{ valid: boolean; discount: number; message: string }> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('valid', true)
      .single()

    if (error || !data) return { valid: false, discount: 0, message: 'Invalid or expired coupon code.' }
    if (data.min_order > 0 && orderTotal < data.min_order) {
      return { valid: false, discount: 0, message: `Minimum order ₹${data.min_order} required for this coupon.` }
    }

    const discount = data.discount_type === 'flat'
      ? Math.min(data.discount_value, orderTotal)
      : Math.round((orderTotal * data.discount_value) / 100)

    return { valid: true, discount, message: `🎉 Coupon applied! You save ₹${discount}.` }
  } catch {
    return { valid: false, discount: 0, message: 'Could not validate coupon. Try again.' }
  }
}

