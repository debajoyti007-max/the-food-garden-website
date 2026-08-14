import { useAuth } from '../context/AuthContext'
import { STORE_NAME } from '../lib/business'

export default function Profile() {
  const { user, logout, switchRole } = useAuth()

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#fafaf9' }}>
        <h2>You are not signed in.</h2>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '20px', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f59e0b', color: '#18181b', fontSize: '2rem', display: 'grid', placeItems: 'center', margin: '0 auto 0.75rem', fontWeight: 800 }}>
          {user.name[0] || 'U'}
        </div>
        <h2 style={{ margin: '0 0 0.25rem', color: '#fafaf9' }}>{user.name}</h2>
        <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
          Role: {user.role}
        </span>
        <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0.25rem 0 1.25rem' }}>Phone: {user.phone}</p>

        {/* Role switcher for testing */}
        <div style={{ borderTop: '1px solid #3f3f46', paddingTop: '1rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '0.5rem' }}>SWITCH APP MODE:</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button type="button" onClick={() => switchRole('customer')} style={{ padding: '0.4rem', borderRadius: '6px', background: user.role === 'customer' ? '#f59e0b' : '#18181b', color: user.role === 'customer' ? '#18181b' : '#d6d3d1', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Customer</button>
            <button type="button" onClick={() => switchRole('seller')} style={{ padding: '0.4rem', borderRadius: '6px', background: user.role === 'seller' ? '#f59e0b' : '#18181b', color: user.role === 'seller' ? '#18181b' : '#d6d3d1', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>👨‍🍳 Kitchen</button>
            <button type="button" onClick={() => switchRole('rider')} style={{ padding: '0.4rem', borderRadius: '6px', background: user.role === 'rider' ? '#f59e0b' : '#18181b', color: user.role === 'rider' ? '#18181b' : '#d6d3d1', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>🛵 Rider</button>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', fontWeight: 700, cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
