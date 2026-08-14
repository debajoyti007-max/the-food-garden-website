import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatOrderId } from '../lib/business'
import { printOrderInvoice } from '../lib/printOrder'

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#38bdf8',
  cooking:   '#fb923c',
  ready:     '#a855f7',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ Pending',
  confirmed: '✅ Confirmed',
  cooking:   '👨‍🍳 Cooking',
  ready:     '🍽️ Ready',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
}

export default function Orders() {
  const { orders } = useStore()
  const { user } = useAuth()

  // Double-safety: filter by current user's phone (belt + suspenders)
  const myOrders = user
    ? orders.filter((o) => o.phone === user.phone || o.userId === user.id)
    : []

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', margin: 0 }}>
          📋 My Orders
        </h1>
        <Link to="/track" style={{ background: '#1c1917', border: '1px solid #3f3f46', color: '#f59e0b', padding: '0.4rem 0.85rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
          📍 Track Live →
        </Link>
      </div>

      {myOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#1c1917', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
          <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>No orders yet! Place your first order.</p>
          <Link to="/" style={{ background: '#f59e0b', color: '#18181b', padding: '0.6rem 1.2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 900, fontSize: '0.9rem' }}>
            Browse Menu →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {myOrders.map((o) => {
            const statusColor = STATUS_COLOR[o.status] || '#a1a1aa'
            const isActive = ['pending', 'confirmed', 'cooking', 'ready'].includes(o.status)

            return (
              <div key={o.id} style={{ background: '#1c1917', border: `1px solid ${isActive ? statusColor + '44' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', padding: '1rem', boxShadow: isActive ? `0 0 12px ${statusColor}15` : 'none' }}>

                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#fafaf9' }}>#{formatOrderId(o.id)}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>
                      {new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                      {' · '}
                      {o.orderType === 'dine_in' ? '🏛️ Dine-In' : o.orderType === 'takeaway' ? '🚗 Takeaway' : '🏡 Delivery'}
                    </span>
                  </div>
                  <span style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: '12px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {STATUS_LABEL[o.status] || o.status.toUpperCase()}
                  </span>
                </div>

                {/* Items */}
                <div style={{ background: '#0d0d0f', borderRadius: '8px', padding: '0.55rem 0.75rem', margin: '0.5rem 0' }}>
                  {o.items.map((it) => (
                    <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d6d3d1', padding: '2px 0' }}>
                      <span>{it.emoji} {it.name} <span style={{ color: '#a1a1aa', fontSize: '0.72rem' }}>({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})</span> × {it.qty}</span>
                      <span style={{ color: '#f59e0b' }}>₹{it.unitPrice * it.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Payment info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.6rem' }}>
                  <span>
                    UTR: <code style={{ color: o.utrVerified ? '#22c55e' : '#f59e0b', fontSize: '0.78rem' }}>{o.utr || '—'}</code>
                    <span style={{ marginLeft: '6px', color: o.utrVerified ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                      {o.utrVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </span>
                  <strong style={{ color: '#fafaf9', fontSize: '0.95rem' }}>₹{o.total}</strong>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {isActive && (
                    <Link to="/track" style={{ flex: 1, textAlign: 'center', background: statusColor + '22', border: `1px solid ${statusColor}44`, color: statusColor, padding: '0.4rem 0.75rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 800 }}>
                      📍 Track Live
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => printOrderInvoice(o)}
                    style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    🧾 Receipt
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
