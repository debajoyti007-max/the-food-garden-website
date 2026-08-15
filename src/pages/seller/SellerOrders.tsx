import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { formatOrderId } from '../../lib/business'
import { printOrderInvoice } from '../../lib/printOrder'
import { orderStatusWhatsAppUrl, paymentVerifiedWhatsAppUrl, formatWhatsAppPhone } from '../../lib/whatsapp'
import { showToast } from '../../components/Toast'
import type { OrderStatus } from '../../types'

// 🔔 Play audio chime when new order arrives
function playOrderChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.65)
  } catch {
    // Silently ignore if audio not available
  }
}

type FilterTab = 'active' | 'utr' | 'ready' | 'done' | 'cancelled' | 'all'

export default function SellerOrders() {
  const { orders, updateOrderStatus, verifyUtr, deleteOrder, lang } = useStore()
  const [filter, setFilter] = useState<FilterTab>('active')
  const [search, setSearch] = useState('')
  const prevOrderCount = useRef(orders.length)

  // 🔔 Sound alert on new incoming order
  useEffect(() => {
    if (orders.length > prevOrderCount.current) {
      const newPending = orders.filter((o) => o.status === 'pending')
      if (newPending.length > 0) {
        playOrderChime()
        showToast(`🔔 New Order Arrived! #${formatOrderId(newPending[0].id)}`, '🍽️')
      }
    }
    prevOrderCount.current = orders.length
  }, [orders.length])

  // Today filter
  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase()
    const searchOk =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.userName.toLowerCase().includes(q) ||
      (o.tableNo && o.tableNo.toLowerCase().includes(q)) ||
      o.utr.includes(q)
    if (!searchOk) return false

    if (filter === 'active')    return ['pending', 'confirmed', 'cooking'].includes(o.status)
    if (filter === 'utr')       return !o.utrVerified && o.status !== 'cancelled'
    if (filter === 'ready')     return o.status === 'ready'
    if (filter === 'done')      return o.status === 'delivered'
    if (filter === 'cancelled') return o.status === 'cancelled'
    return true
  })

  const tabCounts = {
    active:    orders.filter((o) => ['pending', 'confirmed', 'cooking'].includes(o.status)).length,
    utr:       orders.filter((o) => !o.utrVerified && o.status !== 'cancelled').length,
    ready:     orders.filter((o) => o.status === 'ready').length,
    done:      orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    all:       orders.length,
  }

  // Tab definitions with badge colors
  const tabs: { id: FilterTab; label: string; urgentColor?: string }[] = [
    { id: 'active',    label: `🔥 Active`,     urgentColor: tabCounts.active > 0 ? '#ef4444' : undefined },
    { id: 'utr',       label: `⏳ Verify UTR`,  urgentColor: tabCounts.utr > 0 ? '#f59e0b' : undefined },
    { id: 'ready',     label: `🍽️ Ready`,       urgentColor: tabCounts.ready > 0 ? '#22c55e' : undefined },
    { id: 'done',      label: `✅ Delivered` },
    { id: 'cancelled', label: `❌ Trash` },
    { id: 'all',       label: `🌐 All` },
  ]

  const handleVerify = async (o: any) => {
    await verifyUtr(o.id, true)
    try {
      window.open(paymentVerifiedWhatsAppUrl(o, lang), '_blank')
    } catch {}
    showToast('✅ UTR Verified — Order sent to Kitchen!', '👨‍🍳')
  }

  const handleStatus = async (o: any, status: OrderStatus) => {
    await updateOrderStatus(o.id, status)
    window.open(orderStatusWhatsAppUrl(o, status), '_blank')
    const labels: Record<string, string> = { ready: '🍽️ Ready to Serve!', delivered: '✅ Marked as Delivered!', cancelled: '❌ Order Cancelled!' }
    showToast(labels[status] || `Status: ${status}`, '📱')
  }

  const handleCancel = async (o: any) => {
    if (!confirm(`Cancel Order #${formatOrderId(o.id)} for ${o.userName}?`)) return
    await handleStatus(o, 'cancelled')
  }

  const handlePurgeTrash = async () => {
    const cancelled = orders.filter((o) => o.status === 'cancelled')
    if (cancelled.length === 0) return
    if (!confirm(`Permanently delete all ${cancelled.length} cancelled orders?`)) return
    await Promise.allSettled(cancelled.map((o) => deleteOrder(o.id)))
    showToast('All cancelled orders purged!', '🗑️')
  }

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr).then(() => showToast(`UTR Copied: ${utr}`, '📋'))
  }

  // Today revenue summary
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0)
  const todayAdvanceCollected = todayOrders
    .filter((o) => o.utrVerified)
    .reduce((s, o) => s + o.advanceAmount, 0)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', color: '#f59e0b', margin: 0, fontWeight: 900 }}>📋 Kitchen KOT Display</h1>
          <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
            Today: {todayOrders.length} orders · ₹{todayRevenue.toLocaleString()} revenue · ₹{todayAdvanceCollected.toLocaleString()} advance collected
          </span>
        </div>
        <Link to="/seller" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Alert Strip for urgent tabs */}
      {tabCounts.utr > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '10px', padding: '0.5rem 0.85rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#fbbf24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ <strong>{tabCounts.utr} order(s)</strong> waiting for UTR payment verification!</span>
          <button onClick={() => setFilter('utr')} style={{ background: '#f59e0b', color: '#18181b', border: 'none', borderRadius: '6px', padding: '3px 10px', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer' }}>Verify Now</button>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search by Order ID, Phone, Customer Name, or UTR..."
        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', marginBottom: '0.65rem', fontSize: '0.9rem' }}
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px', marginBottom: '1rem' }}>
        {tabs.map((tab) => {
          const count = tabCounts[tab.id]
          const isActive = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                border: isActive ? `1.5px solid ${tab.urgentColor || '#f59e0b'}` : '1px solid #3f3f46',
                background: isActive ? (tab.urgentColor || '#f59e0b') : '#1c1917',
                color: isActive ? '#18181b' : tab.urgentColor || '#d6d3d1',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  marginLeft: '0.35rem',
                  background: isActive ? 'rgba(0,0,0,0.25)' : (tab.urgentColor || '#f59e0b'),
                  color: isActive ? '#fff' : '#18181b',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Purge Trash Banner */}
      {filter === 'cancelled' && filtered.length > 0 && (
        <div style={{ background: '#450a0a', border: '1px solid #991b1b', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#fca5a5' }}>{filtered.length} cancelled order(s) taking up storage:</span>
          <button onClick={handlePurgeTrash} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
            🗑️ Purge All
          </button>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#1c1917', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {filter === 'active' ? '🎉' : filter === 'utr' ? '✅' : '📭'}
          </div>
          <p style={{ color: '#a1a1aa', margin: 0 }}>
            {filter === 'active' ? 'No active orders right now!' : filter === 'utr' ? 'All UTRs verified!' : 'No orders in this tab.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((o) => {
            const isUrgent = !o.utrVerified && o.status !== 'cancelled'
            const statusColor: Record<string, string> = {
              pending: '#f59e0b', confirmed: '#38bdf8', cooking: '#fb923c', ready: '#22c55e', delivered: '#6b7280', cancelled: '#ef4444',
            }
            const borderColor = isUrgent ? '#f59e0b' : (statusColor[o.status] || '#3f3f46')

            return (
              <div key={o.id} style={{ background: '#1c1917', border: `1.5px solid ${borderColor}40`, borderRadius: '18px', padding: '1.25rem', boxShadow: isUrgent ? '0 0 16px rgba(245,158,11,0.1)' : 'none' }}>

                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#fafaf9' }}>#{formatOrderId(o.id)}</strong>
                      <span style={{ background: statusColor[o.status] + '22', color: statusColor[o.status], border: `1px solid ${statusColor[o.status]}44`, borderRadius: '12px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        {o.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                      {o.orderType === 'dine_in' ? `🏛️ Cottage / Table ${o.tableNo || '—'}` : o.orderType === 'takeaway' ? '🚗 Highway Car Pickup' : `🏡 Delivery — ${o.address?.slice(0, 35) || '—'}`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.2rem', color: '#22c55e', display: 'block' }}>₹{o.total}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Advance: ₹{o.advanceAmount}</span>
                  </div>
                </div>

                {/* Customer Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#121214', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#fafaf9', fontSize: '0.88rem', fontWeight: 700 }}>{o.userName}</span>
                    <span style={{ color: '#a1a1aa', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{o.phone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a href={`tel:${o.phone}`} style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#22c55e', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                      📞 Call
                    </a>
                    <a href={`https://wa.me/${formatWhatsAppPhone(o.phone)}`} target="_blank" rel="noreferrer" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#22c55e', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {/* UTR Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>UTR:</span>
                    <code style={{ color: o.utrVerified ? '#22c55e' : '#f59e0b', fontSize: '0.82rem', fontWeight: 800 }}>{o.utr || '—'}</code>
                    {o.utr && (
                      <button onClick={() => copyUtr(o.utr)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.78rem', padding: '2px 6px' }} title="Copy UTR">
                        📋
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: o.utrVerified ? '#22c55e' : '#f59e0b' }}>
                    {o.utrVerified ? '✅ Verified' : '⚠️ Pending Verification'}
                  </span>
                </div>

                {/* Kitchen Prep List */}
                <div style={{ background: '#0d0d0f', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.85rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '0.4rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    🧑‍🍳 Kitchen Preparation Order:
                  </span>
                  {o.items.map((it) => (
                    <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#fafaf9', fontSize: '0.9rem' }}>
                        {it.emoji} <strong>{it.name}</strong>
                        <span style={{ color: '#a1a1aa', fontSize: '0.72rem', marginLeft: '4px' }}>
                          ({it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'})
                        </span>
                      </span>
                      <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>× {it.qty}</strong>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {/* Verify UTR */}
                  {!o.utrVerified && o.status !== 'cancelled' && (
                    <button onClick={() => handleVerify(o)} style={{ flex: '1 1 auto', minWidth: '140px', padding: '0.55rem 0.75rem', background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}>
                      ✅ Verify UTR & Cook
                    </button>
                  )}

                  {/* Mark Ready */}
                  {['cooking', 'confirmed', 'pending'].includes(o.status) && (
                    <button onClick={() => handleStatus(o, 'ready')} style={{ flex: '1 1 auto', minWidth: '140px', padding: '0.55rem 0.75rem', background: 'linear-gradient(135deg, #d97706, #b45309)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}>
                      🍽️ Mark Ready to Serve
                    </button>
                  )}

                  {/* Mark Delivered */}
                  {o.status === 'ready' && (
                    <button onClick={() => handleStatus(o, 'delivered')} style={{ flex: '1 1 auto', minWidth: '140px', padding: '0.55rem 0.75rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}>
                      🚀 Served / Delivered
                    </button>
                  )}

                  {/* Print KOT */}
                  <button onClick={() => printOrderInvoice(o)} style={{ padding: '0.55rem 0.85rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '10px', color: '#d6d3d1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    🧾 Print KOT
                  </button>

                  {/* Cancel */}
                  {!['delivered', 'cancelled'].includes(o.status) && (
                    <button onClick={() => handleCancel(o)} style={{ padding: '0.55rem 0.7rem', background: '#450a0a', border: '1px solid #991b1b', borderRadius: '10px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      ❌ Cancel
                    </button>
                  )}
                </div>

                {/* Order time */}
                <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: '#52525b', textAlign: 'right' }}>
                  🕐 {new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
