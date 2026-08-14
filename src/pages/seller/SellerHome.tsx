import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { STORE_NAME } from '../../lib/business'

export default function SellerHome() {
  const { orders } = useStore()

  const todayOrders = orders.filter((o) => o.status !== 'cancelled')
  const totalSales = todayOrders.reduce((s, o) => s + o.total, 0)
  const pendingUtr = orders.filter((o) => !o.utrVerified && o.status !== 'cancelled').length
  const inKitchen = orders.filter((o) => o.status === 'cooking' || o.status === 'confirmed').length
  const readyOrders = orders.filter((o) => o.status === 'ready').length

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>👨‍🍳 Kitchen Command Center</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{STORE_NAME} — Live Operations</span>
        </div>
        <Link to="/seller/orders" style={{ background: '#f59e0b', color: '#18181b', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.88rem' }}>
          📋 Live KOT Orders ➔
        </Link>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Today's Sales</span>
          <strong style={{ fontSize: '1.4rem', color: '#22c55e' }}>₹{totalSales}</strong>
        </div>
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Pending UTR</span>
          <strong style={{ fontSize: '1.4rem', color: '#f59e0b' }}>{pendingUtr}</strong>
        </div>
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Cooking Now</span>
          <strong style={{ fontSize: '1.4rem', color: '#38bdf8' }}>{inKitchen}</strong>
        </div>
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>Ready to Serve</span>
          <strong style={{ fontSize: '1.4rem', color: '#a855f7' }}>{readyOrders}</strong>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <Link to="/seller/orders" style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1.25rem', textDecoration: 'none', color: '#fafaf9' }}>
          <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.35rem' }}>📋</span>
          <strong style={{ display: 'block', color: '#f59e0b', fontSize: '1.05rem' }}>Kitchen Orders (KOT)</strong>
          <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Verify UTR, mark cooking, print receipts</span>
        </Link>
        <Link to="/" style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '1.25rem', textDecoration: 'none', color: '#fafaf9' }}>
          <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.35rem' }}>🍽️</span>
          <strong style={{ display: 'block', color: '#f59e0b', fontSize: '1.05rem' }}>Food Menu View</strong>
          <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Customer food ordering menu</span>
        </Link>
      </div>
    </div>
  )
}
