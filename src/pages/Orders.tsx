import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatOrderId, GOOGLE_MAPS_REVIEW_URL } from '../lib/business'
import { printOrderInvoice } from '../lib/printOrder'

const STATUS_COLOR: Record<string, string> = {
  pending:      '#f59e0b',
  advance_paid: '#eab308',
  confirmed:    '#38bdf8',
  cooking:      '#fb923c',
  ready:        '#a855f7',
  delivered:    '#22c55e',
  cancelled:    '#ef4444',
  refunded:     '#a1a1aa',
}

const STATUS_LABEL: Record<string, string> = {
  pending:      '⏳ Verifying Payment',
  advance_paid: '⚡ Advance Paid',
  confirmed:    '✅ Confirmed',
  cooking:      '👨‍🍳 Cooking in Kitchen',
  ready:        '🍽️ Ready to Serve',
  delivered:    '✅ Delivered / Served',
  cancelled:    '❌ Cancelled',
  refunded:     '↩️ Refunded',
}

const QUICK_TAGS = ['Delicious Biryani 🍗', 'Crispy Kebabs 🔥', 'Hot & Fresh ♨️', 'Fast Service ⚡', 'Polite Staff 🌟']

export default function Orders() {
  const { orders, reorder, cancelOrder, rateOrder } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ratingModalOrderId, setRatingModalOrderId] = useState<string | null>(null)
  const [selectedStars, setSelectedStars] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  // Filter strictly by current user or guest session
  const myOrders = useMemo(() => {
    if (user) {
      return orders.filter((o) => o.phone === user.phone || o.userId === user.id)
    }
    try {
      const guestIds: string[] = JSON.parse(localStorage.getItem('tfg_guest_orders') || '[]')
      return orders.filter((o) => guestIds.includes(o.id))
    } catch {
      return []
    }
  }, [orders, user])

  const handleReorder = (o: any) => {
    reorder(o)
    navigate('/cart')
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    await cancelOrder(orderId)
  }

  const openRatingModal = (orderId: string, currentRating?: number) => {
    setRatingModalOrderId(orderId)
    setSelectedStars(currentRating || 5)
    setSelectedTags([])
    setReviewNote('')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSaveRating = async () => {
    if (!ratingModalOrderId) return
    setSubmittingRating(true)
    await rateOrder(ratingModalOrderId, selectedStars, reviewNote, selectedTags)
    setSubmittingRating(false)
    setRatingModalOrderId(null)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', margin: 0 }}>
          📋 My Orders ({myOrders.length})
        </h1>
        <Link to="/track" style={{ background: '#1c1917', border: '1px solid #3f3f46', color: '#f59e0b', padding: '0.4rem 0.85rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
          📍 Track Live →
        </Link>
      </div>

      {myOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#1c1917', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
          <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>No orders yet! Try our Charcoal Kebabs or Kolkata Dum Biryani.</p>
          <Link to="/" style={{ background: '#f59e0b', color: '#18181b', padding: '0.6rem 1.2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 900, fontSize: '0.9rem' }}>
            Browse Menu →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {myOrders.map((o) => {
            const statusColor = STATUS_COLOR[o.status] || '#a1a1aa'
            const isActive = ['pending', 'confirmed', 'cooking', 'ready'].includes(o.status)
            const canCancel = o.status === 'pending'
            const isDelivered = o.status === 'delivered'

            return (
              <div key={o.id} style={{ background: '#1c1917', border: `1px solid ${isActive ? statusColor + '44' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '1rem', boxShadow: isActive ? `0 0 12px ${statusColor}15` : 'none' }}>

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

                {/* Items Breakdown */}
                <div style={{ background: '#0d0d0f', borderRadius: '10px', padding: '0.6rem 0.8rem', margin: '0.5rem 0' }}>
                  {o.items.map((it) => (
                    <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d6d3d1', padding: '2px 0' }}>
                      <span>{it.emoji} {it.name} <span style={{ color: '#a1a1aa', fontSize: '0.72rem' }}>({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})</span> × {it.qty}</span>
                      <span style={{ color: '#f59e0b' }}>₹{it.unitPrice * it.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Payment & Total info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.6rem' }}>
                  <span>
                    UTR: <code style={{ color: o.utrVerified ? '#22c55e' : '#f59e0b', fontSize: '0.78rem' }}>{o.utr || '—'}</code>
                    <span style={{ marginLeft: '6px', color: o.utrVerified ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                      {o.utrVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </span>
                  <strong style={{ color: '#fafaf9', fontSize: '0.95rem' }}>Total: ₹{o.total}</strong>
                </div>

                {/* Existing Rating Badge if rated */}
                {o.rating && (
                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', padding: '0.35rem 0.65rem', marginBottom: '0.6rem', fontSize: '0.78rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{'⭐'.repeat(o.rating)}</span>
                    <span style={{ color: '#d6d3d1' }}>"{o.review || 'Great food & experience!'}"</span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* 1-Tap Reorder Button */}
                  <button
                    type="button"
                    onClick={() => handleReorder(o)}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#18181b', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    🔄 Reorder
                  </button>

                  {/* Rate Food Button (Delivered orders) */}
                  {isDelivered && (
                    <button
                      type="button"
                      onClick={() => openRatingModal(o.id, o.rating)}
                      style={{ background: '#27272a', border: '1px solid #eab308', color: '#fde047', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {o.rating ? '⭐ Edit Rating' : '⭐ Rate Food'}
                    </button>
                  )}

                  {/* Live Track Button */}
                  {isActive && (
                    <Link
                      to={`/track?id=${o.id}`}
                      style={{ background: statusColor + '22', border: `1px solid ${statusColor}44`, color: statusColor, padding: '0.4rem 0.75rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 800 }}
                    >
                      📍 Track Live
                    </Link>
                  )}

                  {/* Customer Self-Cancel Button */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(o.id)}
                      style={{ background: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ❌ Cancel
                    </button>
                  )}

                  {/* Receipt Button */}
                  <button
                    type="button"
                    onClick={() => printOrderInvoice(o)}
                    style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}
                  >
                    🧾 Bill
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ⭐ Interactive Star Rating Modal */}
      {ratingModalOrderId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ background: '#1c1917', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '24px', padding: '1.75rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f59e0b', fontSize: '1.2rem', textAlign: 'center', fontWeight: 900 }}>
              ⭐ Rate Your Food Experience
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 1.25rem' }}>
              How was your meal from The Food Garden?
            </p>

            {/* Stars Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2.2rem',
                    cursor: 'pointer',
                    transform: selectedStars >= star ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    filter: selectedStars >= star ? 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' : 'grayscale(1) opacity(0.3)',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Quick Feedback Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {QUICK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '16px',
                      border: active ? '1px solid #f59e0b' : '1px solid #3f3f46',
                      background: active ? '#78350f' : '#27272a',
                      color: active ? '#fef3c7' : '#d6d3d1',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>

            {/* Review Note */}
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add an optional comment (e.g. delicious spices, perfect packaging)..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '10px',
                background: '#121214',
                border: '1px solid #3f3f46',
                color: '#fff',
                fontSize: '0.85rem',
                marginBottom: selectedStars === 5 ? '0.75rem' : '1.25rem',
                outline: 'none',
                resize: 'none',
              }}
            />

            {/* 🌟 5-Star Google Maps Review Prompt */}
            {selectedStars === 5 && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px dashed #f59e0b',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#fef3c7' }}>
                  <strong>Love our food?</strong> Help travelers find us on Google!
                </div>
                <a
                  href={GOOGLE_MAPS_REVIEW_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#f59e0b',
                    color: '#18181b',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⭐ Post on Google
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRatingModalOrderId(null)}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRating}
                onClick={handleSaveRating}
                style={{ flex: 2, padding: '0.7rem', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#18181b', fontWeight: 900, cursor: submittingRating ? 'not-allowed' : 'pointer' }}
              >
                {submittingRating ? 'Saving...' : 'Submit Rating ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
