import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatOrderId } from '../lib/business'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'

// ─── Status Map ───────────────────────────────────────────────────────────────
const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: '⏳ Verifying Payment',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  advance_paid: { label: '⚡ Advance Paid',         color: '#eab308', bg: 'rgba(234,179,8,0.15)'   },
  confirmed:    { label: '✅ Order Confirmed',      color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  cooking:      { label: '👨‍🍳 Cooking in Kitchen',  color: '#fb923c', bg: 'rgba(251,146,60,0.14)'  },
  ready:        { label: '🍽️ Ready to Serve',       color: '#a855f7', bg: 'rgba(168,85,247,0.13)'  },
  delivered:    { label: '✅ Delivered / Served',   color: '#22c55e', bg: 'rgba(34,197,94,0.13)'   },
  cancelled:    { label: '❌ Cancelled',            color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  refunded:     { label: '↩️ Refunded',             color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)' },
}

// ─── 5-Stage Timeline config ──────────────────────────────────────────────────
type TsState = 'completed' | 'active' | 'pending'

interface TimelineStage {
  icon: string
  completedIcon: string
  label: string
  sublabel: (o: Order) => string
  state: (o: Order) => TsState
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    icon: '📝',
    completedIcon: '✓',
    label: 'Order Received & Payment',
    sublabel: (o) =>
      o.utrVerified
        ? `✓ UTR ${o.utr} verified by kitchen`
        : `UTR ${o.utr || '—'} under review (usually <5 min)`,
    state: (o) => {
      if (o.utrVerified || ['advance_paid', 'confirmed', 'cooking', 'ready', 'delivered'].includes(o.status))
        return 'completed'
      if (o.status === 'pending') return 'active'
      return 'pending'
    },
  },
  {
    icon: '🔥',
    completedIcon: '✓',
    label: 'Order Confirmed',
    sublabel: (o) =>
      ['confirmed', 'cooking', 'ready', 'delivered'].includes(o.status)
        ? 'Kitchen accepted your order'
        : 'Waiting for kitchen confirmation',
    state: (o) => {
      if (['cooking', 'ready', 'delivered'].includes(o.status)) return 'completed'
      if (o.status === 'confirmed' || o.status === 'advance_paid') return 'active'
      return 'pending'
    },
  },
  {
    icon: '👨‍🍳',
    completedIcon: '✓',
    label: 'Cooking Fresh in Kitchen',
    sublabel: (o) =>
      ['ready', 'delivered'].includes(o.status)
        ? 'Cooked and plated hot'
        : o.status === 'cooking'
        ? 'Sizzling on the tandoor / wok 🔥'
        : 'Queued in the kitchen',
    state: (o) => {
      if (['ready', 'delivered'].includes(o.status)) return 'completed'
      if (o.status === 'cooking') return 'active'
      return 'pending'
    },
  },
  {
    icon: '🍽️',
    completedIcon: '✓',
    label: 'Ready · Out for Delivery / Table Service',
    sublabel: (o) =>
      o.status === 'delivered'
        ? o.orderType === 'delivery'
          ? 'Handed to delivery rider'
          : 'Served at your table'
        : o.status === 'ready'
        ? o.orderType === 'delivery'
          ? '🛵 Rider picking up shortly...'
          : '🍽️ Coming to your table!'
        : 'Being prepared...',
    state: (o) => {
      if (o.status === 'delivered') return 'completed'
      if (o.status === 'ready') return 'active'
      return 'pending'
    },
  },
  {
    icon: '🎉',
    completedIcon: '🎉',
    label: 'Delivered — Enjoy Your Meal!',
    sublabel: (o) =>
      o.status === 'delivered'
        ? `Bon Appétit from The Food Garden! ⭐`
        : 'Almost there — we\'re nearly done!',
    state: (o) => {
      if (o.status === 'delivered') return 'completed'
      if (o.status === 'ready') return 'active'
      return 'pending'
    },
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrackOrder() {
  const { orders } = useStore()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('id') || searchParams.get('phone') || ''

  const [searchId, setSearchId] = useState(initialQuery)
  const [queriedOrder, setQueriedOrder] = useState<Order | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const localMatch = searchId.trim()
    ? activeOrders.find(
        (o) =>
          o.id.toLowerCase().includes(searchId.trim().toLowerCase()) ||
          o.phone.includes(searchId.trim())
      )
    : activeOrders[0]

  const matched = queriedOrder || localMatch

  // Direct Supabase search
  const handleSearch = async (queryText?: string) => {
    const q = (queryText || searchId).trim()
    if (!q) return

    setSearching(true)
    setSearchError('')

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.ilike.%${q}%,phone.eq.${q}`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        if (!localMatch) {
          setSearchError(`No order found for "${q}". Check your Order ID or phone number.`)
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

  // Auto search on mount if URL param was supplied
  useEffect(() => {
    if (initialQuery) void handleSearch(initialQuery)
  }, [initialQuery])

  // Real-time live updates
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

    return () => { supabase.removeChannel(channel) }
  }, [matched?.id])

  const statusInfo = matched ? STATUS_MAP[matched.status] ?? STATUS_MAP.pending : null

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', color: 'var(--text-primary)' }}>

      <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 900 }}>
        📍 Live Order Tracking
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        Track your Biryani, Kebabs & Mocktails live — from kitchen to table / doorstep.
      </p>

      {/* Search Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); void handleSearch() }}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}
      >
        <input
          type="text"
          value={searchId}
          onChange={(e) => { setSearchId(e.target.value); setSearchError('') }}
          placeholder="Order ID or registered mobile number..."
          style={{
            flex: 1,
            padding: '0.72rem 1rem',
            borderRadius: '12px',
            background: 'var(--surface)',
            border: '1.5px solid var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: '0.72rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#111',
            border: 'none',
            fontWeight: 800,
            cursor: searching ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            opacity: searching ? 0.7 : 1,
            boxShadow: 'var(--shadow-primary)',
            transition: 'opacity 0.15s ease',
          }}
        >
          {searching ? '⏳' : '🔍 Track'}
        </button>
      </form>

      {/* Error */}
      {searchError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#fca5a5', marginBottom: '1.25rem', fontWeight: 600 }}>
          ⚠️ {searchError}
        </div>
      )}

      {matched ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '22px',
            padding: '1.5rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          }}
        >
          {/* Order Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>
                {matched.orderType === 'dine_in' ? '🏛️ Dine-In Order' : matched.orderType === 'takeaway' ? '🚗 Takeaway Order' : '🏡 Delivery Order'}
              </span>
              <strong style={{ fontSize: '1.35rem', display: 'block', color: 'var(--text-primary)', letterSpacing: '-0.02em', fontWeight: 900 }}>
                #{formatOrderId(matched.id)}
              </strong>
              {matched.tableNo && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  📍 {matched.tableNo}
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', display: 'block', marginTop: '2px' }}>
                {new Date(matched.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
            {statusInfo && (
              <span
                style={{
                  background: statusInfo.bg,
                  color: statusInfo.color,
                  border: `1px solid ${statusInfo.color}44`,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusInfo.label}
              </span>
            )}
          </div>

          {/* ═══ 5-Stage Animated Timeline ════════════════════════════════ */}
          <div style={{ margin: '1.5rem 0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1.1rem' }}>
              Live Order Progress
            </span>

            <div className="order-timeline">
              {TIMELINE_STAGES.map((stage, idx) => {
                const tsState = stage.state(matched)
                const stateClass =
                  tsState === 'completed' ? 'ts-completed' :
                  tsState === 'active'    ? 'ts-active'    : ''

                return (
                  <div key={idx} className={`timeline-step ${stateClass}`}>
                    {/* Dot */}
                    <div className={`timeline-dot ${stateClass}`}>
                      {tsState === 'completed'
                        ? <span style={{ color: '#111', fontWeight: 900, fontSize: '0.9rem' }}>{stage.completedIcon}</span>
                        : tsState === 'active'
                        ? <span style={{ fontSize: '1.05rem' }}>{stage.icon}</span>
                        : <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{idx + 1}</span>
                      }
                    </div>

                    {/* Text */}
                    <div className="timeline-content">
                      <div className="timeline-label">{stage.label}</div>
                      <div className="timeline-sublabel">{stage.sublabel(matched)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: '14px',
              padding: '1rem',
              marginTop: '1rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Order Items ({matched.items.length})
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 900 }}>
                Total ₹{matched.total}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {matched.items.map((it) => (
                <div
                  key={`${it.productId}-${it.portion}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    padding: '0.3rem 0',
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span>
                    {it.emoji} {it.name}{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>
                      ({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})
                    </span>{' '}
                    × {it.qty}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{it.unitPrice * it.qty}</span>
                </div>
              ))}
            </div>

            {/* Payment status strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Advance Paid
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--garden-green-light)', fontWeight: 800 }}>
                ₹{matched.advanceAmount} ✓ {matched.utrVerified ? '(Verified)' : '(Pending)'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.65rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              🍽️ Back to Menu
            </Link>
            <Link
              to="/orders"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.65rem',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                borderRadius: '10px',
                color: '#111',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              📋 Order History
            </Link>
          </div>
        </div>
      ) : (
        /* Empty / No match state */
        <div className="empty-state" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '3rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.55 }}>
            Enter your Order ID or registered mobile number above to track your order live.
          </p>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            Browse Menu ➔
          </Link>
        </div>
      )}
    </div>
  )
}
