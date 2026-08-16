import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { formatOrderId, STORE_NAME } from '../../lib/business'
import { formatWhatsAppPhone } from '../../lib/whatsapp'
import { showToast } from '../../components/Toast'
import type { Order, OrderStatus } from '../../types'

export default function RiderView() {
  const { orders, updateOrderStatus } = useStore()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Today's date
  const today = new Date().toDateString()

  // Filter deliveries
  const allDeliveries = orders.filter((o) => o.orderType === 'delivery')
  const activeDeliveries = allDeliveries.filter((o) => ['pending', 'confirmed', 'cooking', 'ready'].includes(o.status))
  const completedToday = allDeliveries.filter((o) => o.status === 'delivered' && new Date(o.createdAt).toDateString() === today)

  // Cash stats
  const pendingCashToCollect = activeDeliveries.reduce((sum, o) => sum + Math.max(0, o.total - o.advanceAmount), 0)
  const cashCollectedToday = completedToday.reduce((sum, o) => sum + Math.max(0, o.total - o.advanceAmount), 0)

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    const target = orders.find((o) => o.id === orderId)
    if (!target) return

    if (nextStatus === 'delivered') {
      if (!target.utrVerified) {
        showToast('⚠️ Payment not verified yet! Wait for kitchen confirmation.', '⚠️')
        return
      }
      if (target.status !== 'ready') {
        showToast('⚠️ Food is not ready yet! Wait for kitchen to mark "Ready".', '⚠️')
        return
      }
    }

    setUpdatingId(orderId)
    const ok = await updateOrderStatus(orderId, nextStatus)
    setUpdatingId(null)

    if (ok) {
      if (nextStatus === 'delivered') {
        showToast('Delivery marked as completed! 💰', '✅')
      } else {
        showToast('Order status updated!', '🛵')
      }
    }
  }

  const displayedOrders = activeTab === 'active' ? activeDeliveries : completedToday

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '4rem', color: '#fafaf9' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#34d399', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛵 Rider Delivery Terminal
          </h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
            Welcome, <b>{user?.name}</b> — Focus on safe & fast delivery
          </span>
        </div>
        <Link
          to="/profile"
          style={{ background: '#1c1917', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}
        >
          👤 Profile
        </Link>
      </div>

      {/* ── KPI Stats Grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>🛵</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>{activeDeliveries.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Active Trips</div>
        </div>

        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>💰</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>₹{pendingCashToCollect}</div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Pending Cash</div>
        </div>

        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>✅</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>{completedToday.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Delivered Today</div>
        </div>

        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>💵</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>₹{cashCollectedToday}</div>
          <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Cash Collected</div>
        </div>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#1c1917', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'active' ? '#10b981' : 'transparent',
            color: activeTab === 'active' ? '#18181b' : '#a1a1aa',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          🛵 Active Deliveries ({activeDeliveries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'completed' ? '#10b981' : 'transparent',
            color: activeTab === 'completed' ? '#18181b' : '#a1a1aa',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          ✅ Completed Today ({completedToday.length})
        </button>
      </div>

      {/* ── Order Cards ────────────────────────────────────── */}
      {displayedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#1c1917', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛵</div>
          <h3 style={{ color: '#fafaf9', margin: '0 0 0.25rem' }}>
            {activeTab === 'active' ? 'No active deliveries right now' : 'No deliveries completed today yet'}
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
            {activeTab === 'active' ? 'New home delivery orders will pop up here live.' : 'Your delivered trips will be logged here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedOrders.map((o) => {
            const balance = Math.max(0, o.total - o.advanceAmount)
            const isUpdating = updatingId === o.id
            const isReady = o.status === 'ready'
            const isVerified = Boolean(o.utrVerified)
            const canDeliver = isReady && isVerified
            const mapQuery = encodeURIComponent(`${o.address}, Nandakumar, Purba Medinipur, West Bengal 721648`)

            return (
              <div
                key={o.id}
                style={{
                  background: '#1c1917',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                }}
              >
                {/* Top Row: Order ID + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fafaf9' }}>
                      #{formatOrderId(o.id)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isReady ? 'rgba(168, 85, 247, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                      color: isReady ? '#c084fc' : '#fb923c',
                      border: `1px solid ${isReady ? 'rgba(168, 85, 247, 0.3)' : 'rgba(251, 146, 60, 0.3)'}`,
                    }}
                  >
                    {isReady ? '🍽️ Ready to Deliver' : o.status === 'cooking' ? '👨‍🍳 Cooking' : '⏳ Processing'}
                  </span>
                </div>

                {/* Customer Details */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fafaf9' }}>{o.userName}</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <a
                        href={`tel:${o.phone}`}
                        style={{
                          background: '#047857',
                          border: '1px solid #10b981',
                          color: '#d1fae5',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/${formatWhatsAppPhone(o.phone)}?text=${encodeURIComponent(
                          `নমস্কার ${o.userName}, The Food Garden থেকে আপনার ফুড অর্ডার #${formatOrderId(o.id)} নিয়ে রাইডার রওনা দিয়েছেন।`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#15803d',
                          border: '1px solid #22c55e',
                          color: '#bbf7d0',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>

                  <div style={{ background: '#121214', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>📍</span>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                          Delivery Destination:
                        </span>
                        <span style={{ fontSize: '0.88rem', color: '#fafaf9', fontWeight: 600 }}>{o.address}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#1e3a8a',
                        border: '1px solid #3b82f6',
                        color: '#bfdbfe',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      🗺️ GPS
                    </a>
                  </div>
                </div>

                {/* Items Checklist */}
                <div style={{ background: '#121214', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Food Items Checklist ({o.items.length}):
                  </span>
                  {o.items.map((it) => (
                    <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d6d3d1', padding: '2px 0' }}>
                      <span>
                        {it.emoji} {it.name} <span style={{ color: '#a1a1aa', fontSize: '0.72rem' }}>({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})</span>
                      </span>
                      <strong style={{ color: '#fafaf9' }}>× {it.qty}</strong>
                    </div>
                  ))}
                </div>

                {/* Cash Due Card */}
                <div
                  style={{
                    background: balance > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                    border: balance > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(34, 197, 94, 0.35)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: balance > 0 ? '#fca5a5' : '#86efac', display: 'block', fontWeight: 700 }}>
                      {balance > 0 ? '💰 CASH TO COLLECT AT DOORSTEP:' : '✅ FULLY PAID ONLINE'}
                    </span>
                    <strong style={{ fontSize: '1.2rem', color: balance > 0 ? '#ef4444' : '#22c55e' }}>
                      {balance > 0 ? `₹${balance}` : '₹0 Balance'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
                    Total: ₹{o.total} (Adv: ₹{o.advanceAmount})
                  </span>
                </div>

                {/* Readiness & Payment Status Banners */}
                {activeTab === 'active' && !canDeliver && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.78rem',
                      color: '#fef3c7',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>⚠️</span>
                    <span>
                      {!isVerified
                        ? 'Payment UTR is under verification by kitchen/manager.'
                        : 'Food is currently being prepared in kitchen. Wait for "Ready" status.'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                {activeTab === 'active' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '0.75rem',
                        background: '#2563eb',
                        color: '#fff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      🗺️ GPS Maps
                    </a>

                    <button
                      type="button"
                      disabled={isUpdating || !canDeliver}
                      onClick={() => handleStatusChange(o.id, 'delivered')}
                      style={{
                        padding: '0.75rem',
                        background: canDeliver
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : '#27272a',
                        color: canDeliver ? '#18181b' : '#71717a',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        cursor: canDeliver && !isUpdating ? 'pointer' : 'not-allowed',
                        boxShadow: canDeliver ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                        opacity: canDeliver ? 1 : 0.65,
                      }}
                      title={
                        !isVerified
                          ? 'Waiting for kitchen payment verification'
                          : !isReady
                          ? 'Waiting for food to be marked Ready by kitchen'
                          : 'Mark as delivered and collected'
                      }
                    >
                      {isUpdating
                        ? 'Saving...'
                        : canDeliver
                        ? '✓ Delivered & Paid'
                        : !isVerified
                        ? '⏳ Unverified Payment'
                        : '👨‍🍳 Cooking in Kitchen'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
