import { supabase } from './supabase'
import type { MenuItem, Order, OrderStatus } from '../types'
import { SEED_MENU } from '../data/seed'

// ── Products ────────────────────────────────────────────────────────────────
export async function fetchProductsApi(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true })
    if (error || !data || data.length === 0) return SEED_MENU
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      bnName: d.bn_name || d.name,
      emoji: d.emoji || '🍽️',
      category: d.category,
      unit: d.unit || 'plate',
      pA: Number(d.p_a) || 0,
      pB: Number(d.p_b) || 0,
      pC: Number(d.p_c) || 0,
      inStock: d.in_stock ?? true,
      imageUrl: d.image_url || null,
      archived: d.archived ?? false,
      description: d.description || '',
    }))
  } catch {
    return SEED_MENU
  }
}

export async function updateProductApi(
  id: string,
  updates: { p_a?: number; p_b?: number; p_c?: number; in_stock?: boolean; archived?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').update(updates).eq('id', id)
    return !error
  } catch {
    return false
  }
}

// ── Orders ───────────────────────────────────────────────────────────────────
export async function createOrderApi(order: Order): Promise<boolean> {
  try {
    const { error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId || null,
      user_name: order.userName,
      phone: order.phone,
      order_type: order.orderType,
      table_no: order.tableNo || null,
      address: order.address || null,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee || 0,
      discount_amount: order.discountAmount || 0,
      total: order.total,
      advance_amount: order.advanceAmount,
      utr: order.utr || null,
      utr_verified: false,
      status: order.status,
      delivery_slot: order.deliverySlot || 'instant',
      created_at: order.createdAt,
    })

    if (orderErr) {
      console.warn('Supabase insert order error:', orderErr)
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
        emoji: it.emoji || '🍽️',
      }))
      const { error: itemErr } = await supabase.from('order_items').insert(itemsToInsert)
      if (itemErr) console.warn('Order items insert error:', itemErr)
    }

    return true
  } catch (err) {
    console.warn('createOrderApi error:', err)
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
      tableNo: d.table_no || '',
      address: d.address || '',
      subtotal: Number(d.subtotal || 0),
      total: Number(d.total),
      advanceAmount: Number(d.advance_amount || 0),
      deliveryFee: Number(d.delivery_fee || 0),
      discountAmount: Number(d.discount_amount || 0),
      utr: d.utr || '',
      utrVerified: Boolean(d.utr_verified),
      status: d.status as OrderStatus,
      deliverySlot: d.delivery_slot || 'instant',
      createdAt: d.created_at,
      updatedAt: d.updated_at || null,
      items: (d.order_items || []).map((it: any) => ({
        productId: it.product_id,
        name: it.name,
        bnName: it.bn_name || it.name,
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
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

export async function verifyUtrApi(orderId: string, verified: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        utr_verified: verified,
        status: verified ? 'confirmed' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

export async function deleteOrderApi(orderId: string): Promise<boolean> {
  try {
    await supabase.from('order_items').delete().eq('order_id', orderId)
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

// ── Coupons ──────────────────────────────────────────────────────────────────
export async function validateCouponApi(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; discount: number; message: string }> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('valid', true)
      .single()

    if (error || !data) return { valid: false, discount: 0, message: '❌ Invalid or expired coupon code.' }
    if (data.min_order > 0 && orderTotal < data.min_order) {
      return { valid: false, discount: 0, message: `Minimum order ₹${data.min_order} required for this coupon.` }
    }

    const discount =
      data.discount_type === 'flat'
        ? Math.min(data.discount_value, orderTotal)
        : Math.round((orderTotal * data.discount_value) / 100)

    return { valid: true, discount, message: `🎉 ₹${discount} off applied!` }
  } catch {
    return { valid: false, discount: 0, message: '❌ Could not validate coupon. Try again.' }
  }
}

// ── Profiles (Admin staff management) ────────────────────────────────────────
export async function fetchAllProfilesApi() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, phone, name, role, is_blocked, created_at')
      .order('created_at', { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}
