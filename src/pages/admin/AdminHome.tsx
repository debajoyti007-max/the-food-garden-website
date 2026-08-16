import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function AdminHome() {
  const { orders } = useStore()
  const { user } = useAuth()

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'cooking').length
  const totalOrders = orders.length

  const stats = [
    { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, icon: '💰', color: '#22c55e' },
    { label: "Today's Orders", value: todayOrders.length, icon: '📋', color: '#f59e0b' },
    { label: 'Active Orders', value: pendingOrders, icon: '🔥', color: '#ef4444' },
    { label: 'Total Orders', value: totalOrders, icon: '📊', color: '#a78bfa' },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#f59e0b', margin: 0, fontWeight: 900 }}>
          🛡️ Admin Dashboard
        </h1>
        <p style={{ color: '#a1a1aa', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
          Welcome, <strong style={{ color: '#fafaf9' }}>{user?.name}</strong> — Full access to restaurant operations
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#1c1917',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Admin Control Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {[
          { to: '/seller/orders', icon: '📋', title: 'Live Kitchen Orders', desc: 'Verify UTR, update status & print KOT' },
          { to: '/admin/staff', icon: '👥', title: 'Staff Accounts', desc: 'Create/manage kitchen & rider roles' },
          { to: '/admin/users', icon: '🗂️', title: 'Customer List', desc: 'View, search, block all registered users' },
          { to: '/seller/products', icon: '🍽️', title: 'Menu & Stock', desc: 'Edit prices and dish availability' },
          { to: '/seller', icon: '📊', title: 'Kitchen Analytics', desc: 'Daily revenue, cost & packing lists' },
          { to: '/admin/coupons', icon: '🏷️', title: 'Promo Coupons', desc: 'Create & manage discount codes' },
          { to: '/track', icon: '📍', title: 'Live Order Tracker', desc: 'Track customer orders in real time' },
          { to: '/orders', icon: '⭐', title: 'Ratings & Reviews', desc: 'See all customer food star ratings' },
        ].map((item) => (
          <Link
            key={item.to + item.title}
            to={item.to}
            style={{
              background: '#1c1917',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              textDecoration: 'none',
              color: '#fafaf9',
              display: 'block',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <strong style={{ color: '#f59e0b', display: 'block', fontSize: '0.95rem', fontWeight: 800 }}>{item.title}</strong>
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
