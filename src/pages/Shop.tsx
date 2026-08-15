import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS, STORE_NAME } from '../lib/business'
import FoodDetailModal from '../components/FoodDetailModal'
import type { MenuItem, Portion } from '../types'

// ─── Serving Size Hints ───────────────────────────────────────────────────────
const SERVING_HINTS: Record<Portion, string> = {
  C: 'Serves 1',
  B: 'Serves 1–2',
  A: 'Serves 3–4',
}

// ─── Smart isVeg fallback ─────────────────────────────────────────────────────
function getIsVeg(item: MenuItem): boolean {
  if (typeof item.isVeg === 'boolean') return item.isVeg
  const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'egg', 'fish', 'prawn', 'kebab', 'keema', 'meat', 'lamb']
  const lower = (item.name + ' ' + item.category).toLowerCase()
  return !NON_VEG_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Veg / Non-Veg Badge ─────────────────────────────────────────────────────
function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      style={{ display: 'inline-block', flexShrink: 0 }}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      {isVeg ? (
        <span className="veg-badge" />
      ) : (
        <span className="non-veg-badge" />
      )}
    </span>
  )
}

// ─── Food Card ────────────────────────────────────────────────────────────────
function FoodCard({
  item,
  onAdd,
  onOpenDetail,
}: {
  item: MenuItem
  onAdd: (item: MenuItem, portion: Portion) => void
  onOpenDetail: (item: MenuItem) => void
}) {
  const [portion, setPortion] = useState<Portion>('B')
  const { cart, updateCartQty, lang } = useStore()

  const priceMap: Record<Portion, number> = { A: item.pA, B: item.pB, C: item.pC }
  const currentPrice = priceMap[portion]
  const itemIsVeg = getIsVeg(item)

  const cartItem = cart.find((c) => c.productId === item.id && c.portion === portion)
  const cartQty = cartItem ? cartItem.qty : 0

  return (
    <article
      className="food-card"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        position: 'relative',
      }}
    >
      {/* Food Photo */}
      <div
        onClick={() => onOpenDetail(item)}
        style={{
          position: 'relative',
          height: '185px',
          width: '100%',
          overflow: 'hidden',
          background: '#09090b',
          cursor: 'pointer',
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            className="food-img-hover"
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3.5rem' }}>
            {item.emoji}
          </div>
        )}

        {/* Category Tag */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(14,14,16,0.88)',
            backdropFilter: 'blur(8px)',
            color: 'var(--primary)',
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          {item.category}
        </span>

        {/* Veg/Non-Veg Badge – top right */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(14,14,16,0.85)',
            backdropFilter: 'blur(8px)',
            padding: '4px 6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <VegBadge isVeg={itemIsVeg} />
        </span>

        {/* View Details hint */}
        <span
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            color: 'var(--text-primary)',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          🔍 Details
        </span>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          {/* Name + emoji */}
          <div
            onClick={() => onOpenDetail(item)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem', cursor: 'pointer' }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.3 }}>
              {lang === 'bn' ? item.bnName : item.name}
            </h3>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.emoji}</span>
          </div>

          {item.description && (
            <p className="text-clamp-2" style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: '0', lineHeight: 1.45 }}>
              {item.description}
            </p>
          )}
        </div>

        <div>
          {/* Portion Selector Pills with serving hints */}
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
            {(['C', 'B', 'A'] as Portion[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPortion(p)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.15rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: portion === p ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                  background: portion === p ? 'var(--primary)' : 'var(--surface-2)',
                  color: portion === p ? '#111' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                <span style={{ display: 'block' }}>
                  {p === 'C' ? 'Half' : p === 'B' ? 'Full' : 'Family'}
                </span>
                <span style={{ display: 'block', fontSize: '0.62rem', opacity: 0.85, fontWeight: 600 }}>
                  {SERVING_HINTS[p]}
                </span>
                <span style={{ display: 'block', marginTop: '1px' }}>₹{priceMap[p]}</span>
              </button>
            ))}
          </div>

          {/* Price & Add to Cart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                {PORTION_LABELS[portion][lang]}
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 900 }}>₹{currentPrice}</strong>
            </div>

            {cartQty > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-2)', border: '1.5px solid var(--primary)', borderRadius: '10px', padding: '4px 10px' }}>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty - 1)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', width: '22px', height: '22px', display: 'grid', placeItems: 'center' }}
                >
                  −
                </button>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: '18px', textAlign: 'center' }}>
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty + 1)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', width: '22px', height: '22px', display: 'grid', placeItems: 'center' }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(item, portion)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  border: 'none',
                  color: '#111',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-primary)',
                  transition: 'all 0.15s ease',
                }}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Shop Page ────────────────────────────────────────────────────────────────
export default function Shop() {
  const { menu, addToCart, lang } = useStore()
  const [selectedCat, setSelectedCat] = useState('All')
  const [search, setSearch] = useState('')
  const [vegOnly, setVegOnly] = useState(false)
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null)
  const [activeHeroMode, setActiveHeroMode] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')

  const categories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category))
    return ['All', ...Array.from(set)]
  }, [menu])

  const filtered = useMemo(() => {
    return menu.filter((m) => {
      const catOk = selectedCat === 'All' || m.category === selectedCat
      const q = search.trim().toLowerCase()
      const searchOk =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.bnName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      const vegOk = !vegOnly || getIsVeg(m)
      return catOk && searchOk && vegOk
    })
  }, [menu, selectedCat, search, vegOnly])

  return (
    <div className="page shop-page">

      {/* ═══ Hero Banner ═══════════════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(14,14,16,0.45) 0%, rgba(14,14,16,0.97) 100%), url(/tfg-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px',
          padding: '3.5rem 1.5rem 2.5rem',
          textAlign: 'center',
          border: '1px solid var(--border)',
          marginBottom: '1.25rem',
          boxShadow: '0 20px 48px rgba(0,0,0,0.65)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient warm halo overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.12), transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Open Now beacon */}
        <div style={{ marginBottom: '0.85rem' }}>
          <span className="open-beacon">
            <span className="open-beacon-dot" />
            Open Now · 11:00 AM – 12:00 AM Midnight
          </span>
        </div>

        {/* Garden label */}
        <span
          style={{
            fontSize: '0.75rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: '#111',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'inline-block',
            boxShadow: 'var(--shadow-primary)',
            marginBottom: '0.85rem',
          }}
        >
          🌿 Garden Dining & Cafe Experience
        </span>

        <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', color: 'var(--text-primary)', margin: '0 0 0.5rem', fontWeight: 900, letterSpacing: '-0.025em' }}>
          {STORE_NAME}
        </h1>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
          Sizzling charcoal kebabs · Dum Biryani · Café mocktails in cozy wooden cottages along Nandakumar–Digha Road.
        </p>

        {/* 3-Mode Switcher */}
        <div style={{ display: 'inline-flex', background: 'rgba(14,14,16,0.9)', backdropFilter: 'blur(16px)', padding: '4px', borderRadius: '18px', border: '1px solid var(--border-strong)', gap: '4px', maxWidth: '100%', overflowX: 'auto' }}>
          {[
            { mode: 'dine_in' as const, label: '🏛️ Cottage Dine-In', tag: 'Table QR' },
            { mode: 'takeaway' as const, label: '🚗 Highway Takeaway', tag: 'Digha Pickup' },
            { mode: 'delivery' as const, label: '🏡 Home Delivery', tag: '30–45m' },
          ].map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => setActiveHeroMode(m.mode)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '14px',
                border: activeHeroMode === m.mode ? '1.5px solid var(--primary)' : 'none',
                background: activeHeroMode === m.mode ? 'var(--primary)' : 'transparent',
                color: activeHeroMode === m.mode ? '#111' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s var(--ease-out)',
                fontFamily: 'inherit',
              }}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: '0.66rem', marginLeft: '0.3rem', opacity: 0.8 }}>({m.tag})</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ Sticky Search + Category Bar ══════════════════════════════════ */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 80,
          background: 'rgba(14,14,16,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          padding: '0.65rem 1rem 0.6rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Search bar */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'bn' ? '🔍 বিরিয়ানি, কাবাব, পাস্তা, মকটেল খুঁজুন...' : '🔍 Search Biryani, Kebabs, Pasta, Mocktails...'}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '14px',
            background: 'var(--surface)',
            border: '1.5px solid var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: '0.55rem',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
        />

        {/* Category filter chips + Veg toggle */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px', alignItems: 'center' }}>
          {/* Veg-Only Toggle first */}
          <button
            type="button"
            onClick={() => setVegOnly((v) => !v)}
            className={`veg-toggle${vegOnly ? ' active' : ''}`}
          >
            <span className={vegOnly ? 'veg-badge' : 'veg-badge'} style={{ width: '14px', height: '14px', border: `2px solid ${vegOnly ? 'var(--veg-color)' : 'var(--text-muted)'}` }}>
              <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: vegOnly ? 'var(--veg-color)' : 'var(--text-muted)' }} />
            </span>
            🌱 Veg Only
          </button>

          {/* Category chips */}
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCat(c)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                border: selectedCat === c ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                background: selectedCat === c ? 'var(--primary)' : 'var(--surface)',
                color: selectedCat === c ? '#111' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s var(--ease-out)',
                boxShadow: selectedCat === c ? 'var(--shadow-primary)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Food Grid ══════════════════════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🍽️</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {vegOnly ? 'No vegetarian items match your search.' : 'No items found. Try a different search.'}
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setSelectedCat('All'); setVegOnly(false) }}
            style={{ marginTop: '0.85rem', padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#111', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem', fontWeight: 600 }}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            {vegOnly && <span style={{ color: 'var(--veg-color)' }}> · Veg Only 🌱</span>}
            {selectedCat !== 'All' && <span> in <strong style={{ color: 'var(--text-secondary)' }}>{selectedCat}</strong></span>}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.15rem' }}>
            {filtered.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onAdd={(it, portion) => addToCart(it.id, portion)}
                onOpenDetail={(it) => setSelectedItemForModal(it)}
              />
            ))}
          </div>
        </>
      )}

      {/* Food Quick-View Modal */}
      {selectedItemForModal && (
        <FoodDetailModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
        />
      )}
    </div>
  )
}
