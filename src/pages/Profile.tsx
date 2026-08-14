import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { showToast } from '../components/Toast'

const ROLE_BADGE: Record<string, { label: string; icon: string; color: string }> = {
  admin:    { label: 'Admin',          icon: '🛡️', color: '#a78bfa' },
  seller:   { label: 'Kitchen Staff',  icon: '👨‍🍳', color: '#f59e0b' },
  rider:    { label: 'Delivery Rider', icon: '🛵', color: '#22c55e' },
  customer: { label: 'Customer',       icon: '👤', color: '#a1a1aa' },
}

export default function Profile() {
  const { user, logout, updateOwnName, updateOwnPin } = useAuth()
  const { orders, lang } = useStore()

  // Change Name state
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)

  // Change PIN state
  const [editingPin, setEditingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#fafaf9' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
      <h2 style={{ color: '#f59e0b' }}>You are not signed in</h2>
      <Link to="/auth" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.65rem 1.5rem', background: '#f59e0b', color: '#18181b', borderRadius: '10px', fontWeight: 800, textDecoration: 'none' }}>
        Sign In / Register
      </Link>
    </div>
  )

  const badge = ROLE_BADGE[user.role] || ROLE_BADGE.customer
  const myOrders = orders.filter((o) => o.phone === user.phone || o.userId === user.id)
  const totalSpend = myOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      showToast('Name cannot be blank', '⚠️')
      return
    }
    setSavingName(true)
    const res = await updateOwnName(nameInput.trim())
    setSavingName(false)
    if (res.ok) setEditingName(false)
  }

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin.length !== 4 || /\D/.test(newPin)) {
      showToast('PIN must be exactly 4 digits', '⚠️')
      return
    }
    if (newPin !== confirmPin) {
      showToast('PINs do not match', '⚠️')
      return
    }
    setSavingPin(true)
    const res = await updateOwnPin(newPin)
    setSavingPin(false)
    if (res.ok) {
      setNewPin('')
      setConfirmPin('')
      setEditingPin(false)
    }
  }

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>

      {/* Profile Card */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', textAlign: 'center', marginBottom: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#18181b', fontSize: '2rem', display: 'grid', placeItems: 'center', margin: '0 auto 0.85rem', fontWeight: 900, boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>

        {editingName ? (
          <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your full name"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', background: '#121214', border: '1px solid #f59e0b', color: '#fff', fontSize: '0.9rem' }}
            />
            <button
              type="submit"
              disabled={savingName}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', background: '#f59e0b', color: '#18181b', border: 'none', fontWeight: 800, cursor: 'pointer' }}
            >
              {savingName ? '...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', background: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', cursor: 'pointer' }}
            >
              ✕
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ margin: 0, color: '#fafaf9', fontSize: '1.3rem', fontWeight: 900 }}>{user.name}</h2>
            <button
              type="button"
              onClick={() => {
                setNameInput(user.name)
                setEditingName(true)
              }}
              style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '0.85rem' }}
              title="Edit Name"
            >
              ✏️
            </button>
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#27272a', border: `1px solid ${badge.color}33`, borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', color: badge.color, fontWeight: 800, marginBottom: '0.5rem' }}>
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </div>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>📱 +91 {user.phone}</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
        {[
          { label: 'Total Orders', value: myOrders.length, icon: '📋' },
          { label: 'Total Spend', value: `₹${totalSpend.toLocaleString()}`, icon: '💰' },
          { label: 'Completed', value: myOrders.filter((o) => o.status === 'delivered').length, icon: '✅' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Security & PIN Settings */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: '#fafaf9', fontSize: '0.92rem', display: 'block' }}>🔑 Account Security PIN</strong>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Used for quick 4-digit sign in</span>
          </div>
          <button
            type="button"
            onClick={() => setEditingPin(!editingPin)}
            style={{ padding: '0.4rem 0.85rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
          >
            {editingPin ? 'Cancel' : 'Change PIN'}
          </button>
        </div>

        {editingPin && (
          <form onSubmit={handleSavePin} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>New 4-Digit PIN</label>
              <input
                type="password"
                required
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '1.1rem', letterSpacing: '0.4em' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Confirm New PIN</label>
              <input
                type="password"
                required
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '1.1rem', letterSpacing: '0.4em' }}
              />
            </div>
            <button
              type="submit"
              disabled={savingPin}
              style={{ padding: '0.65rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#18181b', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {savingPin ? '⏳ Saving PIN...' : 'Update PIN'}
            </button>
          </form>
        )}
      </div>

      {/* Quick Links based on role */}
      {(user.role === 'admin' || user.role === 'seller') && (
        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Staff Quick Access</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#27272a', border: '1px solid #7c3aed', borderRadius: '10px', textDecoration: 'none', color: '#e9d5ff', fontWeight: 700, fontSize: '0.9rem' }}>
                🛡️ Admin Dashboard
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin/staff" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '10px', textDecoration: 'none', color: '#fafaf9', fontWeight: 700, fontSize: '0.9rem' }}>
                👥 Manage Staff & Roles
              </Link>
            )}
            <Link to="/seller/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#27272a', border: '1px solid #d97706', borderRadius: '10px', textDecoration: 'none', color: '#fef3c7', fontWeight: 700, fontSize: '0.9rem' }}>
              📋 Kitchen KOT — Live Orders
            </Link>
            <Link to="/seller/products" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '10px', textDecoration: 'none', color: '#fafaf9', fontWeight: 700, fontSize: '0.9rem' }}>
              🍽️ Menu & Stock Manager
            </Link>
          </div>
        </div>
      )}

      {user.role === 'rider' && (
        <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
          <Link to="/rider" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#14532d', border: '1px solid #16a34a', borderRadius: '10px', textDecoration: 'none', color: '#bbf7d0', fontWeight: 700, fontSize: '0.9rem' }}>
            🛵 Open Rider Delivery View
          </Link>
        </div>
      )}

      {/* Order History Link */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
        <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '10px', textDecoration: 'none', color: '#fafaf9', fontWeight: 700, fontSize: '0.9rem' }}>
          📦 {lang === 'bn' ? 'আমার অর্ডার হিস্টোরি' : 'My Order History'}
        </Link>
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={logout}
        style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}
      >
        Sign Out
      </button>
    </div>
  )
}
