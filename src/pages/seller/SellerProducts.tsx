import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { showToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

export default function SellerProducts() {
  const { menu, lang } = useStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(menu)
  const [saving, setSaving] = useState<string | null>(null) // tracks which item is saving

  const filtered = items.filter(
    (it) =>
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.bnName.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase()),
  )

  // ── Toggle stock ON/OFF → saves to Supabase immediately ──────────────────
  const toggleStock = async (id: string) => {
    const item = items.find((it) => it.id === id)
    if (!item) return
    const next = !item.inStock

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, inStock: next } : it)),
    )

    setSaving(id)
    const { error } = await supabase
      .from('products')
      .update({ in_stock: next })
      .eq('id', id)
    setSaving(null)

    if (error) {
      showToast(`Failed to update stock: ${error.message}`, '❌')
      // Revert on error
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, inStock: !next } : it)),
      )
    } else {
      showToast(`${item.name} → ${next ? 'IN STOCK 🟢' : 'SOLD OUT 🔴'}`, next ? '🟢' : '🔴')
    }
  }

  // ── Update price locally (live edit as you type) ──────────────────────────
  const updatePrice = (id: string, field: 'pA' | 'pB' | 'pC', val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    )
  }

  // ── Save prices to Supabase on blur/click ────────────────────────────────
  const savePrice = async (id: string) => {
    const item = items.find((it) => it.id === id)
    if (!item) return

    setSaving(id)
    const { error } = await supabase
      .from('products')
      .update({
        p_a: item.pA,
        p_b: item.pB,
        p_c: item.pC,
      })
      .eq('id', id)
    setSaving(null)

    if (error) {
      showToast(`Failed to save price: ${error.message}`, '❌')
    } else {
      showToast(`${item.name} prices saved! ✅`, '💾')
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>🍽️ Menu & Stock Manager</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Toggle sold out dishes · Edit prices (saves to Supabase)</span>
        </div>
        <Link to="/seller" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search dish to update price or stock..."
        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: '#1c1917', border: '1.5px solid rgba(255,255,255,0.08)', color: '#fff', marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map((it) => {
          const isSaving = saving === it.id
          return (
            <div
              key={it.id}
              style={{
                background: '#1c1917',
                border: it.inStock ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #ef4444',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: isSaving ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{it.emoji}</span>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#fafaf9' }}>{it.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block' }}>{it.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => toggleStock(it.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    border: 'none',
                    background: it.inStock ? '#15803d' : '#991b1b',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? '⏳ Saving...' : it.inStock ? '🟢 In Stock' : '🔴 Sold Out'}
                </button>
              </div>

              {/* Price Edit Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '0.5rem', background: '#121214', padding: '0.6rem', borderRadius: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Half Plate (₹):</label>
                  <input
                    type="number"
                    value={it.pC}
                    onChange={(e) => updatePrice(it.id, 'pC', Number(e.target.value))}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Full Plate (₹):</label>
                  <input
                    type="number"
                    value={it.pB}
                    onChange={(e) => updatePrice(it.id, 'pB', Number(e.target.value))}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#a1a1aa', display: 'block', marginBottom: '2px' }}>Family Pack (₹):</label>
                  <input
                    type="number"
                    value={it.pA}
                    onChange={(e) => updatePrice(it.id, 'pA', Number(e.target.value))}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem' }}
                  />
                </div>
                {/* Save Prices Button */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => savePrice(it.id)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    background: isSaving ? '#27272a' : '#f59e0b',
                    color: isSaving ? '#a1a1aa' : '#18181b',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    height: 'fit-content',
                    alignSelf: 'flex-end',
                  }}
                >
                  {isSaving ? '⏳' : '💾 Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
