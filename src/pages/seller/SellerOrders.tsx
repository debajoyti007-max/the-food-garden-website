import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { formatOrderId } from '../../lib/business'
import { printOrderInvoice } from '../../lib/printOrder'
import { orderStatusWhatsAppUrl, paymentVerifiedWhatsAppUrl } from '../../lib/whatsapp'
import { showToast } from '../../components/Toast'
import type { OrderStatus } from '../../types'

export default function SellerOrders() {
  const { orders, updateOrderStatus, verifyUtr, deleteOrder, lang } = useStore()
  const [filter, setFilter] = useState<'all' | 'utr' | 'cooking' | 'ready' | 'done' | 'cancelled'>('cooking')
  const [search, setSearch] = useState('')

  const filtered = orders.filter((o) => {
    // Search query
    const q = search.trim().toLowerCase()
    const searchOk = !q || o.id.toLowerCase().includes(q) || o.phone.includes(q) || o.userName.toLowerCase().includes(q) || (o.tableNo && o.tableNo.toLowerCase().includes(q))
    if (!searchOk) return false

    if (filter === 'utr') return !o.utrVerified && o.status !== 'cancelled'
    if (filter === 'cooking') return o.status === 'cooking' || (o.status === 'confirmed' && o.utrVerified) || o.status === 'pending'
    if (filter === 'ready') return o.status === 'ready'
    if (filter === 'done') return o.status === 'delivered'
    if (filter === 'cancelled') return o.status === 'cancelled'
    return true
  })

  const handleVerify = async (o: any) => {
    await verifyUtr(o.id, true)
    await updateOrderStatus(o.id, 'cooking')
    window.open(paymentVerifiedWhatsAppUrl(o, lang), '_blank')
    showToast('Payment Verified & Sent to Cooking!', '👨‍🍳')
  }

  const handleStatus = async (id: string, status: OrderStatus, o: any) => {
    await updateOrderStatus(id, status)
    window.open(orderStatusWhatsAppUrl(o, status), '_blank')
    showToast(`Order marked as ${status.toUpperCase()}!`, '✅')
  }

  const handlePurgeTrash = async () => {
    const cancelled = orders.filter((o) => o.status === 'cancelled')
    if (cancelled.length === 0) return
    if (!confirm(`Permanently delete all ${cancelled.length} cancelled orders?`)) return
    await Promise.allSettled(cancelled.map((o) => deleteOrder(o.id)))
    showToast('All cancelled orders purged!', '🗑️')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.3rem', color: '#f59e0b', margin: 0 }}>📋 Live Kitchen KOT Display</h1>
        <Link to="/seller" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search Order ID, Phone, Table, or Customer Name..."
        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', marginBottom: '0.75rem' }}
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px', marginBottom: '1rem' }}>
        {[
          { id: 'cooking', label: '👨‍🍳 In Kitchen / Cooking', count: orders.filter((o) => o.status === 'cooking' || (o.status === 'confirmed' && o.utrVerified) || o.status === 'pending').length },
          { id: 'utr', label: '⏳ Verify UTR', count: orders.filter((o) => !o.utrVerified && o.status !== 'cancelled').length },
          { id: 'ready', label: '🍽️ Ready to Serve', count: orders.filter((o) => o.status === 'ready').length },
          { id: 'done', label: '✅ Delivered', count: orders.filter((o) => o.status === 'delivered').length },
          { id: 'cancelled', label: '❌ Trash', count: orders.filter((o) => o.status === 'cancelled').length },
          { id: 'all', label: '🌐 All' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '20px',
              border: filter === tab.id ? '1.5px solid #f59e0b' : '1px solid #3f3f46',
              background: filter === tab.id ? '#f59e0b' : '#27272a',
              color: filter === tab.id ? '#18181b' : '#d6d3d1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
          </button>
        ))}
      </div>

      {filter === 'cancelled' && filtered.length > 0 && (
        <div style={{ background: '#7f1d1d', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>Clean all cancelled orders from database:</span>
          <button type="button" onClick={handlePurgeTrash} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            🗑️ Purge All Cancelled
          </button>
        </div>
      )}

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#27272a', borderRadius: '16px' }}>
          <p style={{ color: '#a1a1aa' }}>No orders in this tab.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((o) => (
            <div key={o.id} style={{ background: '#27272a', border: '1.5px solid #3f3f46', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #3f3f46', paddingBottom: '0.6rem', marginBottom: '0.6rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#fafaf9' }}>#{formatOrderId(o.id)}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, display: 'block' }}>
                    {o.orderType === 'dine_in' ? `🏛️ Dine-In (${o.tableNo})` : o.orderType === 'takeaway' ? '🚗 Highway Car Pickup' : `🏡 Delivery (${o.address})`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Customer: {o.userName} ({o.phone})</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#22c55e', display: 'block' }}>₹{o.total}</strong>
                  <span style={{ fontSize: '0.72rem', color: o.utrVerified ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                    {o.utrVerified ? '✓ UTR Verified' : `UTR: ${o.utr} (Pending)`}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ margin: '0.6rem 0', background: '#18181b', borderRadius: '10px', padding: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem', fontWeight: 700 }}>KITCHEN PREPARATION LIST:</span>
                {o.items.map((it) => (
                  <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '2px 0', color: '#fafaf9' }}>
                    <span>{it.emoji} <b>{it.name}</b> ({it.portion})</span>
                    <strong style={{ color: '#f59e0b' }}>× {it.qty}</strong>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {!o.utrVerified && (
                  <button type="button" onClick={() => handleVerify(o)} style={{ flex: 1, padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✓ Verify UTR & Start Cooking
                  </button>
                )}

                {o.status !== 'ready' && o.status !== 'delivered' && (
                  <button type="button" onClick={() => handleStatus(o.id, 'ready', o)} style={{ flex: 1, padding: '0.5rem', background: '#d97706', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                    🍽️ Mark Ready to Serve
                  </button>
                )}

                {o.status === 'ready' && (
                  <button type="button" onClick={() => handleStatus(o.id, 'delivered', o)} style={{ flex: 1, padding: '0.5rem', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✅ Mark Served / Delivered
                  </button>
                )}

                <button type="button" onClick={() => printOrderInvoice(o)} style={{ padding: '0.5rem 0.8rem', background: '#3f3f46', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  🧾 Print KOT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
