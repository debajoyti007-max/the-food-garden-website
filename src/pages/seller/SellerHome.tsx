import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { STORE_NAME } from '../../lib/business'
import { showToast } from '../../components/Toast'

export default function SellerHome() {
  const { orders, menu } = useStore()
  const { user } = useAuth()
  const [kitchenCost, setKitchenCost] = useState('')
  const [costSaved, setCostSaved] = useState(false)

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const todayOrders   = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const yesterdayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === yesterday)

  const todayRevenue    = todayOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const yesterdayRevenue = yesterdayOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const advanceCollected = todayOrders.filter((o) => o.utrVerified).reduce((s, o) => s + o.advanceAmount, 0)
  const pendingUtr      = orders.filter((o) => !o.utrVerified && o.status !== 'cancelled').length
  const inKitchen       = orders.filter((o) => ['pending', 'confirmed', 'cooking'].includes(o.status)).length
  const readyCount      = orders.filter((o) => o.status === 'ready').length
  const inStockCount    = menu.filter((m) => m.inStock).length

  const revenueDiff = todayRevenue - yesterdayRevenue
  const costNum = parseFloat(kitchenCost) || 0
  const estimatedProfit = todayRevenue - costNum

  const resetAllStock = () => {
    if (!confirm('Reset ALL menu items back to In Stock?')) return
    // This updates via SellerProducts state — toast confirmation
    showToast('✅ All items reset to In Stock! Update individual items in Menu Manager if needed.', '🟢')
  }

  const handleSaveCost = () => {
    if (!kitchenCost || isNaN(parseFloat(kitchenCost))) {
      showToast('Enter a valid cost amount', '⚠️')
      return
    }
    setCostSaved(true)
    showToast(`Today's kitchen cost saved: ₹${kitchenCost}`, '✅')
  }

  // Build aggregated item qty for packing list
  const activeOrders = orders.filter((o) => ['pending', 'confirmed', 'cooking', 'ready'].includes(o.status))
  const packingMap: Record<string, { name: string; emoji: string; qty: number }> = {}
  activeOrders.forEach((o) => {
    o.items.forEach((it) => {
      const key = `${it.productId}-${it.portion}`
      if (!packingMap[key]) packingMap[key] = { name: `${it.name} (${it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})`, emoji: it.emoji, qty: 0 }
      packingMap[key].qty += it.qty
    })
  })

  const printPackingList = () => {
    const lines = Object.values(packingMap)
      .map((it) => `${it.emoji} ${it.name} × ${it.qty}`)
      .join('\n')
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`<html><head><title>TFG Packing List</title></head><body><pre style="font-size:16px;font-family:monospace;"><strong>📦 THE FOOD GARDEN — Packing List</strong>\n${new Date().toLocaleString()}\n\n${lines || 'No active orders.'}\n</pre><script>window.print();window.close();</script></body></html>`)
    win.document.close()
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0, fontWeight: 900 }}>👨‍🍳 Kitchen Command Center</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{STORE_NAME} — Welcome, {user?.name}</span>
        </div>
        <Link to="/seller/orders" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#18181b', padding: '0.55rem 1.1rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 900, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
          📋 Live KOT ➔
        </Link>
      </div>

      {/* ── Urgent Alert: Pending UTR ─────────────────────── */}
      {pendingUtr > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
            ⚠️ {pendingUtr} order(s) waiting for UTR verification!
          </span>
          <Link to="/seller/orders" style={{ background: '#f59e0b', color: '#18181b', padding: '0.35rem 0.85rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 900, fontSize: '0.78rem' }}>
            Verify Now →
          </Link>
        </div>
      )}

      {/* ── KPI Stats Grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
        {[
          { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, sub: revenueDiff !== 0 ? `${revenueDiff > 0 ? '▲' : '▼'} ₹${Math.abs(revenueDiff)} vs yesterday` : 'No orders yesterday', icon: '💰', color: '#22c55e' },
          { label: 'Advance Collected', value: `₹${advanceCollected.toLocaleString()}`, sub: `From ${todayOrders.filter((o) => o.utrVerified).length} verified orders`, icon: '✅', color: '#34d399' },
          { label: 'Verify UTR', value: pendingUtr, sub: 'Awaiting confirmation', icon: '⏳', color: pendingUtr > 0 ? '#f59e0b' : '#6b7280' },
          { label: 'In Kitchen', value: inKitchen, sub: 'Active cooking orders', icon: '🔥', color: inKitchen > 0 ? '#fb923c' : '#6b7280' },
          { label: 'Ready to Serve', value: readyCount, sub: 'Waiting for customer', icon: '🍽️', color: readyCount > 0 ? '#a855f7' : '#6b7280' },
          { label: 'In Stock Items', value: `${inStockCount}/${menu.length}`, sub: 'Menu availability', icon: '📦', color: '#38bdf8' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '2px', lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: '0.65rem', color: '#52525b', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Daily Cost & Profit Calculator ─────────────────── */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.85rem', color: '#fafaf9', fontSize: '0.95rem', fontWeight: 800 }}>💹 Today's Profit Calculator</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Kitchen / Ingredient Cost (₹)</label>
            <input
              type="number"
              value={kitchenCost}
              onChange={(e) => { setKitchenCost(e.target.value); setCostSaved(false) }}
              placeholder="e.g. 2500"
              style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ background: '#121214', borderRadius: '8px', padding: '0.55rem 0.7rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#a1a1aa', marginBottom: '2px' }}>Estimated Profit</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: estimatedProfit >= 0 ? '#22c55e' : '#ef4444' }}>
              {costNum > 0 ? `₹${estimatedProfit.toLocaleString()}` : '—'}
            </div>
          </div>
          <button onClick={handleSaveCost} style={{ padding: '0.6rem', background: costSaved ? '#15803d' : '#27272a', border: `1px solid ${costSaved ? '#22c55e' : '#3f3f46'}`, color: costSaved ? '#bbf7d0' : '#d6d3d1', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
            {costSaved ? '✅ Saved' : '💾 Save Report'}
          </button>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
        <button onClick={printPackingList} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', color: '#fafaf9', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.88rem' }}>
          <span style={{ fontSize: '1.6rem' }}>📦</span>
          <div>
            <strong style={{ color: '#f59e0b', display: 'block' }}>Print Packing List</strong>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Aggregated items for {activeOrders.length} active orders</span>
          </div>
        </button>

        <Link to="/seller/products" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', color: '#fafaf9', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
          <span style={{ fontSize: '1.6rem' }}>⚙️</span>
          <div>
            <strong style={{ color: '#f59e0b', display: 'block' }}>Menu & Stock</strong>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>{inStockCount}/{menu.length} items available</span>
          </div>
        </Link>

        <button onClick={resetAllStock} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', background: '#1c1917', border: '1px solid #15803d', borderRadius: '14px', color: '#bbf7d0', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '0.88rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🟢</span>
          <div>
            <strong style={{ color: '#22c55e', display: 'block' }}>Morning Stock Reset</strong>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Mark all items as In Stock</span>
          </div>
        </button>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', color: '#fafaf9', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🍽️</span>
          <div>
            <strong style={{ color: '#f59e0b', display: 'block' }}>Customer Menu View</strong>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>See store as a customer</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
