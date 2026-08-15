import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { showToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'

export default function SellerProducts() {
  const { menu, archiveProduct, lang } = useStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(menu)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [saving, setSaving] = useState<string | null>(null)

  const filtered = items.filter((it) => {
    const tabMatch = activeTab === 'archived' ? Boolean(it.archived) : !it.archived
    const q = search.toLowerCase()
    const searchMatch =
      !q ||
      it.name.toLowerCase().includes(q) ||
      it.bnName.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q)
    return tabMatch && searchMatch
  })

  const toggleStock = async (id: string) => {
    const item = items.find((it) => it.id === id)
    if (!item) return
    const next = !item.inStock

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, inStock: next } : it))
    )

    setSaving(id)
    const { error } = await supabase
      .from('products')
      .update({ in_stock: next })
      .eq('id', id)
    setSaving(null)

    if (error) {
      showToast(`Failed to update stock: ${error.message}`, '❌')
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, inStock: !next } : it))
      )
    } else {
      showToast(`${item.name} → ${next ? 'IN STOCK 🟢' : 'SOLD OUT 🔴'}`, next ? '🟢' : '🔴')
    }
  }

  const updatePrice = (id: string, field: 'pA' | 'pB' | 'pC', val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    )
  }

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

  const handleArchiveToggle = async (id: string, currentArchived: boolean) => {
    const next = !currentArchived
    const item = items.find((it) => it.id === id)
    if (!item) return

    if (next && !confirm(`Archive "${item.name}"? It will be hidden from the customer menu.`)) return

    setSaving(id)
    await archiveProduct(id, next)
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, archived: next } : it))
    )
    setSaving(null)
  }

  const activeCount = items.filter((i) => !i.archived).length
  const archivedCount = items.filter((i) => i.archived).length

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>🍽️ Menu & Stock Manager</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Live prices, instant stock toggles & smart archiving</span>
        </div>
        <Link to="/seller" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#1c1917', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'active' ? '#f59e0b' : 'transparent',
            color: activeTab === 'active' ? '#18181b' : '#a1a1aa',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          🍽️ Active Menu ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'archived' ? '#f59e0b' : 'transparent',
            color: activeTab === 'archived' ? '#18181b' : '#a1a1aa',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          📦 Archived / Hidden ({archivedCount})
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search dish to update price, stock or archive..."
        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: '#1c1917', border: '1.5px solid rgba(255,255,255,0.08)', color: '#fff', marginBottom: '1rem' }}
      />

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#1c1917', borderRadius: '16px', color: '#71717a' }}>
          No dishes found in this view.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map((it) => {
          const isSaving = saving === it.id
          const isArchived = Boolean(it.archived)

          return (
            <div
              key={it.id}
              style={{
                background: '#1c1917',
                border: isArchived ? '1px dashed #71717a' : it.inStock ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #ef4444',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: isSaving ? 0.6 : isArchived ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{it.emoji}</span>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#fafaf9' }}>{it.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block' }}>{it.category}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {/* Stock Toggle */}
                  {!isArchived && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => toggleStock(it.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: 'none',
                        background: it.inStock ? '#15803d' : '#991b1b',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSaving ? '⏳...' : it.inStock ? '🟢 In Stock' : '🔴 Sold Out'}
                    </button>
                  )}

                  {/* Smart Delete / Archive button */}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleArchiveToggle(it.id, isArchived)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #3f3f46',
                      background: isArchived ? '#1e3a8a' : '#27272a',
                      color: isArchived ? '#93c5fd' : '#a1a1aa',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={isArchived ? 'Restore to active menu' : 'Archive dish'}
                  >
                    {isArchived ? '🟢 Restore' : '📦 Archive'}
                  </button>
                </div>
              </div>

              {/* Price Edit Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '0.5rem', background: '#121214', padding: '0.6rem', borderRadius: '10px', alignItems: 'end' }}>
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
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => savePrice(it.id)}
                  style={{
                    padding: '0.45rem 0.65rem',
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
