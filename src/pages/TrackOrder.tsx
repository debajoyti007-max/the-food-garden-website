import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { formatOrderId } from '../lib/business'

export default function TrackOrder() {
  const { orders } = useStore()
  const [searchId, setSearchId] = useState('')

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const matched = searchId.trim()
    ? activeOrders.find((o) => o.id.toLowerCase().includes(searchId.trim().toLowerCase()) || o.phone.includes(searchId.trim()))
    : activeOrders[0]

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', marginBottom: '0.5rem' }}>
        📍 Live Food Order Tracking
      </h1>
      <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
        Track your Biryani, Kebabs & Mocktails live from kitchen cooking to table / doorstep delivery.
      </p>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Enter Order ID (e.g. 123456) or Phone Number..."
          style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
        />
      </div>

      {matched ? (
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>Active Order</span>
              <strong style={{ fontSize: '1.2rem', display: 'block', color: '#fafaf9' }}>#{formatOrderId(matched.id)}</strong>
            </div>
            <span style={{ background: matched.status === 'delivered' ? '#15803d' : '#854d0e', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              {matched.status === 'pending' ? '⏳ Payment Verification' : matched.status === 'cooking' ? '👨‍🍳 Cooking in Kitchen' : matched.status === 'ready' ? '🍽️ Ready to Serve' : '✅ Delivered'}
            </span>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
            {[
              { step: 'Order Received & UTR Verified', icon: '📝', done: true },
              { step: 'Chef Cooking in Kitchen', icon: '👨‍🍳', done: matched.status === 'cooking' || matched.status === 'ready' || matched.status === 'delivered' },
              { step: 'Food Hot & Ready to Serve / Dispatch', icon: '🍽️', done: matched.status === 'ready' || matched.status === 'delivered' },
              { step: 'Delivered / Served on Table', icon: '✅', done: matched.status === 'delivered' },
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: s.done ? '#f59e0b' : '#3f3f46', color: s.done ? '#18181b' : '#a1a1aa', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 800 }}>
                  {s.icon}
                </div>
                <span style={{ color: s.done ? '#fafaf9' : '#71717a', fontWeight: s.done ? 700 : 400, fontSize: '0.9rem' }}>
                  {s.step}
                </span>
              </div>
            ))}
          </div>

          {/* Items Summary */}
          <div style={{ background: '#18181b', borderRadius: '10px', padding: '0.85rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '0.4rem' }}>ITEMS IN THIS ORDER:</span>
            {matched.items.map((it) => (
              <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '2px 0', color: '#d6d3d1' }}>
                <span>{it.emoji} {it.name} ({it.portion}) × {it.qty}</span>
                <span>₹{it.unitPrice * it.qty}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#27272a', borderRadius: '16px' }}>
          <p style={{ color: '#a1a1aa' }}>No active orders found.</p>
        </div>
      )}
    </div>
  )
}
