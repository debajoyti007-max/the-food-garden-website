import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { showToast } from '../../components/Toast'

export default function SellerProducts() {
  const { menu, lang } = useStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(menu)

  const filtered = items.filter(
    (it) =>
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.bnName.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const next = !it.inStock
          showToast(`${it.name} is now ${next ? 'IN STOCK 🟢' : 'OUT OF STOCK 🔴'}`, next ? '🟢' : '🔴')
          return { ...it, inStock: next }
        }
        return it
      }),
    )
  }

  const updatePrice = (id: string, field: 'pA' | 'pB' | 'pC', val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>🍽️ Menu & Stock Manager</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Toggle sold out dishes or edit live prices</span>
        </div>
        <Link
          to="/seller"
          style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          ← Dashboard
        </Link>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search food dish to update price or stock..."
        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: '#1c1917', border: '1.5px solid rgba(255, 255, 255, 0.08)', color: '#fff', marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map((it) => (
          <div
            key={it.id}
            style={{
              background: '#1c1917',
              border: it.inStock ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #ef4444',
              borderRadius: '16px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>{it.emoji}</span>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#fafaf9' }}>{it.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>{it.category}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleStock(it.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: it.inStock ? '#15803d' : '#991b1b',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {it.inStock ? '🟢 In Stock' : '🔴 Sold Out'}
              </button>
            </div>

            {/* Price Edit Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#121214', padding: '0.6rem', borderRadius: '10px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Half (₹):</label>
                <input
                  type="number"
                  value={it.pC}
                  onChange={(e) => updatePrice(it.id, 'pC', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Full (₹):</label>
                <input
                  type="number"
                  value={it.pB}
                  onChange={(e) => updatePrice(it.id, 'pB', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Family (₹):</label>
                <input
                  type="number"
                  value={it.pA}
                  onChange={(e) => updatePrice(it.id, 'pA', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
