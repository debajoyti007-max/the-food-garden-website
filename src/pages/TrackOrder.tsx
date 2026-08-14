import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatOrderId } from '../lib/business'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: '⏳ Verifying Payment', color: '#f59e0b', bg: '#78350f' },
  advance_paid: { label: '⚡ Advance Paid',      color: '#eab308', bg: '#713f12' },
  confirmed:    { label: '✅ Order Confirmed',   color: '#38bdf8', bg: '#0369a1' },
  cooking:      { label: '👨‍🍳 Cooking in Kitchen', color: '#fb923c', bg: '#9a3412' },
  ready:        { label: '🍽️ Ready to Serve',     color: '#a855f7', bg: '#581c87' },
  delivered:    { label: '✅ Delivered / Served',  color: '#22c55e', bg: '#14532d' },
  cancelled:    { label: '❌ Cancelled',          color: '#ef4444', bg: '#7f1d1d' },
  refunded:     { label: '↩️ Refunded',           color: '#a1a1aa', bg: '#27272a' },
}

export default function TrackOrder() {
  const { orders } = useStore()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('id') || searchParams.get('phone') || ''

  const [searchId, setSearchId] = useState(initialQuery)
  const [queriedOrder, setQueriedOrder] = useState<Order | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // 1. Check in local store orders first
  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const localMatch = searchId.trim()
    ? activeOrders.find(
        (o) =>
          o.id.toLowerCase().includes(searchId.trim().toLowerCase()) ||
          o.phone.includes(searchId.trim())
      )
    : activeOrders[0]

  const matched = queriedOrder || localMatch

  // 2. Direct Supabase Search for guest / other device orders
  const handleSearch = async (queryText?: string) => {
    const q = (queryText || searchId).trim()
    if (!q) return

    setSearching(true)
    setSearchError('')

    try {
      // Search by ID or Phone in Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.ilike.%${q}%,phone.eq.${q}`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        if (!localMatch) {
          setSearchError(`No order found matching "${q}". Check order ID or phone number.`)
          setQueriedOrder(null)
        }
      } else {
        const d = data[0]
        const fetchedOrder: Order = {
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
          items: (d.order_items || []).map((it: any) => ({
            productId: it.product_id,
            name: it.name,
            portion: it.portion,
            qty: Number(it.qty),
            unitPrice: Number(it.unit_price),
            emoji: it.emoji || '🍽️',
          })),
        }
        setQueriedOrder(fetchedOrder)
      }
    } catch {
      if (!localMatch) setSearchError('Error connecting to tracking system.')
    } finally {
      setSearching(false)
    }
  }

  // Auto search on mount if URL parameter was supplied
  useEffect(() => {
    if (initialQuery) {
      void handleSearch(initialQuery)
    }
  }, [initialQuery])

  // Real-time live status updates for the currently tracked order
  useEffect(() => {
    if (!matched?.id) return

    const channel = supabase
      .channel(`live-track-${matched.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${matched.id}` },
        (payload) => {
          const row = payload.new as any
          setQueriedOrder((prev) => {
            if (!prev || prev.id !== row.id) return prev
            return {
              ...prev,
              status: row.status as OrderStatus,
              utrVerified: Boolean(row.utr_verified),
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matched?.id])

  const statusInfo = matched ? STATUS_MAP[matched.status] || STATUS_MAP.pending : null

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', marginBottom: '0.5rem' }}>
        📍 Live Food Order Tracking
      </h1>
      <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
        Track your Biryani, Kebabs & Mocktails live from kitchen cooking to table / doorstep delivery.
      </p>

      {/* Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSearch()
        }}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}
      >
        <input
          type="text"
          value={searchId}
          onChange={(e) => {
            setSearchId(e.target.value)
            setSearchError('')
          }}
          placeholder="Enter Order ID (e.g. 123456) or Mobile Number..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: '#1c1917',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#18181b',
            border: 'none',
            fontWeight: 800,
            cursor: searching ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {searching ? '⏳' : 'Track'}
        </button>
      </form>

      {searchError && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#fca5a5', marginBottom: '1.25rem' }}>
          ⚠️ {searchError}
        </div>
      )}

      {matched ? (
        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {matched.orderType === 'dine_in' ? '🏛️ Dine-In Order' : matched.orderType === 'takeaway' ? '🚗 Takeaway Order' : '🏡 Delivery Order'}
              </span>
              <strong style={{ fontSize: '1.3rem', display: 'block', color: '#fafaf9', marginTop: '2px' }}>
                #{formatOrderId(matched.id)}
              </strong>
              {matched.tableNo && (
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block' }}>
                  Table: {matched.tableNo}
                </span>
              )}
            </div>
            {statusInfo && (
              <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                {statusInfo.label}
              </span>
            )}
          </div>

          {/* Stepper Progression */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
            {[
              {
                step: '1. Order Received & Payment Verification',
                icon: '📝',
                done: matched.utrVerified || matched.status !== 'pending',
                active: matched.status === 'pending',
                detail: matched.utrVerified ? `Verified UTR: ${matched.utr}` : `UTR ${matched.utr || 'Pending'} under review`,
              },
              {
                step: '2. Chef Cooking in Kitchen',
                icon: '👨‍🍳',
                done: ['cooking', 'ready', 'delivered'].includes(matched.status),
                active: matched.status === 'cooking',
                detail: 'Fresh ingredients on tandoor / charcoal wok',
              },
              {
                step: '3. Food Hot & Ready for Serving / Dispatch',
                icon: '🍽️',
                done: ['ready', 'delivered'].includes(matched.status),
                active: matched.status === 'ready',
                detail: 'Plated hot and garnished',
              },
              {
                step: '4. Delivered / Served at Table',
                icon: '✅',
                done: matched.status === 'delivered',
                active: matched.status === 'delivered',
                detail: 'Bon Appétit from The Food Garden!',
              },
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: s.done ? '#f59e0b' : s.active ? '#d97706' : '#27272a',
                    color: s.done || s.active ? '#18181b' : '#71717a',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: s.active ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <strong style={{ color: s.done || s.active ? '#fafaf9' : '#71717a', fontSize: '0.9rem', display: 'block' }}>
                    {s.step}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: s.active ? '#f59e0b' : '#a1a1aa' }}>
                    {s.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Items Summary */}
          <div style={{ background: '#121214', borderRadius: '12px', padding: '1rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase' }}>
                ORDER ITEMS ({matched.items.length}):
              </span>
              <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800 }}>
                Total: ₹{matched.total}
              </span>
            </div>
            {matched.items.map((it) => (
              <div
                key={`${it.productId}-${it.portion}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  padding: '4px 0',
                  color: '#d6d3d1',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span>
                  {it.emoji} {it.name}{' '}
                  <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    ({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})
                  </span>{' '}
                  × {it.qty}
                </span>
                <span style={{ color: '#fafaf9', fontWeight: 700 }}>₹{it.unitPrice * it.qty}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#1c1917', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>Enter your Order ID or registered mobile number above to track your order live.</p>
          <Link to="/" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>
            Browse Menu ➔
          </Link>
        </div>
      )}
    </div>
  )
}
