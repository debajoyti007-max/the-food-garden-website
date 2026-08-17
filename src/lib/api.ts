import { supabase } from './supabase'
import type { MenuItem, Order, OrderStatus } from '../types'
import { SEED_MENU } from '../data/seed'

// ── Products ────────────────────────────────────────────────────────────────
export async function fetchProductsApi(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      // Auto-seed Supabase in background so rows exist for future updates
      void seedDatabaseWithMenu(SEED_MENU)
      return SEED_MENU
    }

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
      isVeg: d.is_veg ?? false,
      imageUrl: d.image_url || null,
      archived: d.archived ?? false,
      description: d.description || '',
    }))
  } catch {
    return SEED_MENU
  }
}

export async function upsertProductApi(item: MenuItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').upsert({
      id: item.id,
      name: item.name,
      bn_name: item.bnName,
      emoji: item.emoji,
      category: item.category,
      unit: item.unit,
      p_a: item.pA,
      p_b: item.pB,
      p_c: item.pC,
      in_stock: item.inStock,
      is_veg: item.isVeg ?? false,
      image_url: item.imageUrl || null,
      archived: item.archived ?? false,
    })
    if (error) {
      console.error('[TFG] upsertProductApi failed:', error.message, error.code, error.details)
    }
    return !error
  } catch (err) {
    console.error('[TFG] upsertProductApi exception:', err)
    return false
  }
}

async function seedDatabaseWithMenu(items: MenuItem[]) {
  try {
    const rows = items.map((it) => ({
      id: it.id,
      name: it.name,
      bn_name: it.bnName,
      emoji: it.emoji,
      category: it.category,
      unit: it.unit,
      p_a: it.pA,
      p_b: it.pB,
      p_c: it.pC,
      in_stock: it.inStock,
      is_veg: it.isVeg ?? false,
      image_url: it.imageUrl || null,
      archived: it.archived ?? false,
    }))
    await supabase.from('products').upsert(rows)
  } catch {
    // Fail silently if table not created yet
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
    // Ensure all products exist in Supabase so foreign key constraint in order_items never fails
    void seedDatabaseWithMenu(SEED_MENU)

    const { error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId || null,
      user_name: order.userName,
      phone: order.phone,
      order_type: order.orderType,
      table_no: order.tableNo || null,
      address: order.address || null,
      total: order.total,
      advance_amount: order.advanceAmount,
      discount_amount: order.discountAmount || 0,
      utr: order.utr || null,
      utr_verified: false,
      status: order.status,
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
      if (itemErr) {
        console.warn('Order items insert error, rolling back order header:', itemErr)
        // Rollback orphan order row so database never stores incomplete/broken orders
        await supabase.from('orders').delete().eq('id', order.id)
        return false
      }
    }

    return true
  } catch (err) {
    console.warn('createOrderApi exception, cleaning up:', err)
    try {
      await supabase.from('orders').delete().eq('id', order.id)
    } catch {}
    return false
  }
}

export async function fetchOrdersApi(filter?: { userId?: string; phone?: string }): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (filter?.userId || filter?.phone) {
      const clauses: string[] = []
      if (filter.userId) clauses.push(`user_id.eq.${filter.userId}`)
      if (filter.phone) clauses.push(`phone.eq.${filter.phone}`)
      query = query.or(clauses.join(','))
    }

    const { data: ordersData, error } = await query

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
      .update({ status })
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
        // When verified: go straight to 'cooking' so kitchen gets the KOT immediately
        // When unverified/rejected: back to 'pending'
        status: verified ? 'cooking' : 'pending',
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

// ── Coupons with Smart Rate Limiting ─────────────────────────────────────────
let couponAttempts: { count: number; lockedUntil: number } = { count: 0, lockedUntil: 0 }

export async function validateCouponApi(
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; discount: number; message: string }> {
  const now = Date.now()
  if (couponAttempts.lockedUntil > now) {
    const secondsLeft = Math.ceil((couponAttempts.lockedUntil - now) / 1000)
    return { valid: false, discount: 0, message: `⏳ Too many attempts. Try again in ${secondsLeft}s.` }
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('valid', true)
      .single()

    if (error || !data) {
      couponAttempts.count += 1
      if (couponAttempts.count >= 4) {
        couponAttempts = { count: 0, lockedUntil: Date.now() + 60 * 1000 } // 60s cooldown
      }
      return { valid: false, discount: 0, message: '❌ Invalid or expired coupon code.' }
    }

    // Success -> reset cooldown
    couponAttempts = { count: 0, lockedUntil: 0 }

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
