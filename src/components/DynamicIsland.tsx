import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { formatOrderId } from '../lib/business'

export default function DynamicIsland() {
  const { cartCount, cartTotal, orders } = useStore()
  const { user } = useAuth()
  const location = useLocation()
  const [justAdded, setJustAdded] = useState(false)

  // Find latest active order that belongs to the current user
  const activeOrder = orders.find((o) => {
    const isOwner = user ? (o.phone === user.phone || o.userId === user.id) : true
    const isActive = o.status !== 'delivered' && o.status !== 'cancelled'
    return isOwner && isActive
  })

  useEffect(() => {
    if (cartCount > 0) {
      setJustAdded(true)
      const timer = setTimeout(() => setJustAdded(false), 2200)
      return () => clearTimeout(timer)
    }
  }, [cartCount])

  // Don't show inside cart, checkout, or auth to avoid distraction
  if (location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname === '/auth') {
    return null
  }

  // Only render Dynamic Island when there is an active order or active cart items
  if (!activeOrder && cartCount === 0) {
    return null
  }

  return (
    <div
      className="dynamic-island-container"
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        className={`dynamic-island ${justAdded ? 'island-pulse' : ''}`}
        style={{
          background: 'rgba(18, 18, 20, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '26px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.15)',
          color: '#fafaf9',
          padding: '0.45rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          userSelect: 'none',
          maxWidth: 'min(92vw, 420px)',
          transition: 'all 0.3s ease',
        }}
      >
        {activeOrder ? (
          // 🛵 Live Order Tracking Pill
          <Link
            to={`/track?id=${activeOrder.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: '#fafaf9', width: '100%' }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f59e0b', color: '#18181b', display: 'grid', placeItems: 'center', fontSize: '0.85rem', fontWeight: 900 }}>
              👨‍🍳
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.02em' }}>
                LIVE ORDER #{formatOrderId(activeOrder.id)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                {activeOrder.status === 'pending'
                  ? 'Verifying payment...'
                  : activeOrder.status === 'cooking'
                  ? 'Cooking fresh in kitchen 🔥'
                  : 'Ready to Serve 🍽️'}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#27272a', padding: '2px 8px', borderRadius: '12px', color: '#fafaf9', fontWeight: 700 }}>
              Track ➔
            </span>
          </Link>
        ) : (
          // 🛒 Active Cart Floating Pill
          <Link
            to="/cart"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#fafaf9', width: '100%' }}
          >
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: '1.2rem' }}>🛒</span>
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  background: '#f59e0b',
                  color: '#18181b',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {cartCount}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fafaf9' }}>{cartCount} Items</span>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800, marginLeft: '0.35rem' }}>· ₹{cartTotal}</span>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#18181b',
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: '0.75rem',
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
              }}
            >
              Order ➔
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
