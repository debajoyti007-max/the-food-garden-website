import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatOrderId } from '../lib/business'
import { printOrderInvoice } from '../lib/printOrder'

export default function Orders() {
  const { orders } = useStore()

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', marginBottom: '1rem' }}>
        📋 Order History ({orders.length})
      </h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#27272a', borderRadius: '16px' }}>
          <p style={{ color: '#a1a1aa' }}>No orders placed yet.</p>
          <Link to="/" style={{ color: '#f59e0b', fontWeight: 700 }}>Browse Menu ➔</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {orders.map((o) => (
            <div key={o.id} style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#fafaf9' }}>#{formatOrderId(o.id)}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#a1a1aa', display: 'block' }}>
                    {new Date(o.createdAt).toLocaleString()} · {o.orderType.toUpperCase()}
                  </span>
                </div>
                <span style={{ background: o.status === 'delivered' ? '#15803d' : '#854d0e', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {o.status.toUpperCase()}
                </span>
              </div>

              <div style={{ margin: '0.5rem 0', borderTop: '1px solid #3f3f46', borderBottom: '1px solid #3f3f46', padding: '0.4rem 0' }}>
                {o.items.map((it) => (
                  <div key={`${it.productId}-${it.portion}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#d6d3d1' }}>
                    <span>{it.emoji} {it.name} ({it.portion}) × {it.qty}</span>
                    <span>₹{it.unitPrice * it.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Total: </span>
                  <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>₹{o.total}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => printOrderInvoice(o)}
                  style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🧾 Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
