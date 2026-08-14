import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { STORE_NAME, formatOrderId } from '../lib/business'
import { printOrderInvoice } from '../lib/printOrder'
import { customerOrderWhatsAppUrl } from '../lib/whatsapp'

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const { orders, lang } = useStore()
  const order = orders.find((o) => o.id === id)

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#fafaf9' }}>
        <h2>Order Placed!</h2>
        <Link to="/" style={{ color: '#f59e0b' }}>Return to Menu</Link>
      </div>
    )
  }

  const shortId = formatOrderId(order.id)

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center', padding: '2rem 1rem', color: '#fafaf9' }}>
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#15803d', display: 'grid', placeItems: 'center', fontSize: '2.5rem', margin: '0 auto 1rem', boxShadow: '0 6px 20px rgba(21, 128, 61, 0.4)' }}>
        ✓
      </div>
      <h1 style={{ fontSize: '1.6rem', color: '#f59e0b', margin: '0 0 0.25rem' }}>Order Placed Successfully!</h1>
      <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        Order #{shortId} has been sent to {STORE_NAME}'s kitchen.
      </p>

      {/* Details Box */}
      <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #3f3f46', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
          <span>Customer: <b>{order.userName}</b></span>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>{order.orderType === 'dine_in' ? `Dine-In (${order.tableNo})` : order.orderType === 'takeaway' ? 'Highway Takeaway' : 'Delivery'}</span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          {order.items.map((it) => (
            <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0', color: '#d6d3d1' }}>
              <span>{it.emoji} {it.name} ({it.portion}) × {it.qty}</span>
              <strong>₹{it.unitPrice * it.qty}</strong>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #3f3f46', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
          <span>Total Paid Advance:</span>
          <strong style={{ color: '#22c55e' }}>₹{order.advanceAmount} (UTR: {order.utr})</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href={customerOrderWhatsAppUrl(order, lang)}
          target="_blank"
          rel="noreferrer"
          style={{ background: '#16a34a', color: '#fff', padding: '0.65rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}
        >
          📲 Send Order to Restaurant WhatsApp
        </a>
        <button
          type="button"
          onClick={() => printOrderInvoice(order)}
          style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#fafaf9', padding: '0.65rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
        >
          🧾 Print Bill Receipt
        </button>
      </div>
    </div>
  )
}
