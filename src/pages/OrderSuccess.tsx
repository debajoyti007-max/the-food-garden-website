import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { STORE_NAME, formatOrderId } from '../lib/business'
import { printOrderInvoice } from '../lib/printOrder'
import { customerOrderWhatsAppUrl } from '../lib/whatsapp'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const { orders, lang } = useStore()
  const [dbOrder, setDbOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  const localOrder = orders.find((o) => o.id === id)
  const order = localOrder || dbOrder

  useEffect(() => {
    if (!localOrder && id) {
      const fetchDirectOrder = async () => {
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', id)
            .single()

          if (!error && data) {
            setDbOrder({
              id: data.id,
              userId: data.user_id,
              userName: data.user_name,
              phone: data.phone,
              orderType: data.order_type || 'dine_in',
              tableNo: data.table_no || '',
              address: data.address || '',
              subtotal: Number(data.subtotal || 0),
              total: Number(data.total),
              advanceAmount: Number(data.advance_amount || 0),
              deliveryFee: Number(data.delivery_fee || 0),
              discountAmount: Number(data.discount_amount || 0),
              utr: data.utr || '',
              utrVerified: Boolean(data.utr_verified),
              status: data.status as OrderStatus,
              deliverySlot: data.delivery_slot || 'instant',
              createdAt: data.created_at,
              items: (data.order_items || []).map((it: any) => ({
                productId: it.product_id,
                name: it.name,
                portion: it.portion,
                qty: Number(it.qty),
                unitPrice: Number(it.unit_price),
                emoji: it.emoji || '🍽️',
              })),
            })
          }
        } finally {
          setLoading(false)
        }
      }
      void fetchDirectOrder()
    }
  }, [id, localOrder])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#f59e0b' }}>
        ⏳ Loading your order details...
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#fafaf9' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
        <h2>Order Confirmation</h2>
        <p style={{ color: '#a1a1aa' }}>Order #{id ? formatOrderId(id) : ''} has been placed.</p>
        <Link to="/" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>Return to Menu ➔</Link>
      </div>
    )
  }

  const shortId = formatOrderId(order.id)

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center', padding: '2rem 1rem', color: '#fafaf9' }}>
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#15803d', display: 'grid', placeItems: 'center', fontSize: '2.5rem', margin: '0 auto 1rem', boxShadow: '0 6px 20px rgba(21, 128, 61, 0.4)' }}>
        ✓
      </div>
      <h1 style={{ fontSize: '1.6rem', color: '#f59e0b', margin: '0 0 0.25rem' }}>Order Placed Successfully!</h1>
      <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        Order #{shortId} has been sent to {STORE_NAME}'s kitchen.
      </p>

      {/* Details Box */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
          <span>Customer: <b>{order.userName}</b></span>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>
            {order.orderType === 'dine_in' ? `🏛️ Dine-In (${order.tableNo})` : order.orderType === 'takeaway' ? '🚗 Highway Takeaway' : '🏡 Delivery'}
          </span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          {order.items.map((it) => (
            <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.3rem 0', color: '#d6d3d1' }}>
              <span>{it.emoji} {it.name} ({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'}) × {it.qty}</span>
              <strong>₹{it.unitPrice * it.qty}</strong>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
          <span>Total Advance Paid (50%):</span>
          <strong style={{ color: '#22c55e' }}>₹{order.advanceAmount} (UTR: {order.utr || 'Pending'})</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to={`/track?id=${order.id}`}
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#18181b', padding: '0.65rem 1.2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 900, fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
        >
          📍 Track Live Status
        </Link>
        <a
          href={customerOrderWhatsAppUrl(order, lang)}
          target="_blank"
          rel="noreferrer"
          style={{ background: '#16a34a', color: '#fff', padding: '0.65rem 1.1rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}
        >
          📲 WhatsApp Kitchen
        </a>
        <button
          type="button"
          onClick={() => printOrderInvoice(order)}
          style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#fafaf9', padding: '0.65rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
        >
          🧾 Print Receipt
        </button>
      </div>
    </div>
  )
}
