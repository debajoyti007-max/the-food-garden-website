import { useStore } from '../../context/StoreContext'
import { formatOrderId } from '../../lib/business'
import { showToast } from '../../components/Toast'

export default function RiderView() {
  const { orders, updateOrderStatus } = useStore()
  const deliveryOrders = orders.filter((o) => o.orderType === 'delivery' && o.status !== 'delivered' && o.status !== 'cancelled')

  const handleDeliver = async (id: string) => {
    await updateOrderStatus(id, 'delivered')
    showToast('Delivery completed!', '✅')
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
        🛵 Rider Active Deliveries ({deliveryOrders.length})
      </h1>

      {deliveryOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#27272a', borderRadius: '16px' }}>
          <p style={{ color: '#a1a1aa' }}>No active home deliveries right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deliveryOrders.map((o) => {
            const balance = Math.max(0, o.total - o.advanceAmount)
            const mapQuery = encodeURIComponent(o.address)

            return (
              <div key={o.id} style={{ background: '#27272a', border: '1.5px solid #3f3f46', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#fafaf9' }}>#{formatOrderId(o.id)}</strong>
                  <span style={{ background: '#f59e0b', color: '#18181b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {o.status.toUpperCase()}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', color: '#fafaf9' }}>
                  👤 <b>{o.userName}</b> (<a href={`tel:${o.phone}`} style={{ color: '#f59e0b' }}>{o.phone}</a>)
                </p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#d6d3d1' }}>
                  📍 {o.address}
                </p>

                {balance > 0 && (
                  <div style={{ background: '#7f1d1d', padding: '0.4rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', color: '#fca5a5', fontWeight: 700, fontSize: '0.85rem' }}>
                    💰 Collect Cash Balance: ₹{balance}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, padding: '0.65rem', background: '#3b82f6', color: '#fff', borderRadius: '8px', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    🗺️ Open Maps
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeliver(o.id)}
                    style={{ flex: 1, padding: '0.65rem', background: '#16a34a', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    ✓ Mark Delivered
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
