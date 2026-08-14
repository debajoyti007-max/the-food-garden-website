import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS, STORE_NAME } from '../lib/business'
import FoodDetailModal from '../components/FoodDetailModal'
import type { MenuItem, Portion } from '../types'

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

  const cartItem = cart.find((c) => c.productId === item.id && c.portion === portion)
  const cartQty = cartItem ? cartItem.qty : 0

  return (
    <article
      className="food-card"
      style={{
        background: '#1c1917',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      {/* Food Photo Container */}
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
            className="food-img-hover"
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3.5rem' }}>
            {item.emoji}
          </div>
        )}

        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(18, 18, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#f59e0b',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          {item.category}
        </span>

        <span
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            color: '#fafaf9',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          🔍 View Details
        </span>
      </div>

      {/* Food Content */}
      <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div
            onClick={() => onOpenDetail(item)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem', cursor: 'pointer' }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fafaf9', fontWeight: 800, lineHeight: 1.3 }}>
              {lang === 'bn' ? item.bnName : item.name}
            </h3>
            <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
          </div>

          {item.description && (
            <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0 0 0.85rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
          )}
        </div>

        <div>
          {/* Portion Selector Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {(['C', 'B', 'A'] as Portion[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPortion(p)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.2rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: portion === p ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: portion === p ? '#f59e0b' : '#27272a',
                  color: portion === p ? '#18181b' : '#a1a1aa',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p === 'C' ? 'Half' : p === 'B' ? 'Full' : 'Family'} · ₹{priceMap[p]}
              </button>
            ))}
          </div>

          {/* Price & Add to Order Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#a1a1aa', display: 'block' }}>{PORTION_LABELS[portion][lang]}</span>
              <strong style={{ fontSize: '1.3rem', color: '#f59e0b', fontWeight: 900 }}>₹{currentPrice}</strong>
            </div>

            {cartQty > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#27272a', border: '1.5px solid #f59e0b', borderRadius: '10px', padding: '3px 8px' }}>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty - 1)}
                  style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', width: '22px', height: '22px' }}
                >
                  -
                </button>
                <span style={{ fontWeight: 900, color: '#fafaf9', fontSize: '0.9rem', minWidth: '18px', textAlign: 'center' }}>
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty + 1)}
                  style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', width: '22px', height: '22px' }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(item, portion)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#18181b',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                  transition: 'transform 0.15s ease',
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

export default function Shop() {
  const { menu, addToCart, lang } = useStore()
  const [selectedCat, setSelectedCat] = useState('All')
  const [search, setSearch] = useState('')
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
      return catOk && searchOk
    })
  }, [menu, selectedCat, search])

  return (
    <div className="page shop-page" style={{ paddingBottom: '3rem' }}>
      {/* 🚀 Hero Banner */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,20,0.5) 0%, rgba(18,18,20,0.96) 100%), url(/tfg-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px',
          padding: '3.5rem 1.5rem 2.5rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#18181b',
            padding: '4px 14px',
            borderRadius: '20px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
          }}
        >
          🌿 Garden Dining & Cafe Experience
        </span>

        <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', color: '#fafaf9', margin: '0.85rem 0 0.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          {STORE_NAME}
        </h1>

        <p style={{ fontSize: '1rem', color: '#d6d3d1', maxWidth: '640px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          Indulge in sizzling charcoal kebabs, Dum Biryani, and refreshing mocktails in cozy wooden garden cottages along Nandakumar–Digha Road.
        </p>

        {/* Interactive 3-Mode Switcher */}
        <div style={{ display: 'inline-flex', background: 'rgba(24, 24, 27, 0.9)', backdropFilter: 'blur(16px)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', gap: '4px', maxWidth: '100%', overflowX: 'auto' }}>
          {[
            { mode: 'dine_in' as const, label: '🏛️ Cottage Dine-In', tag: 'Table QR' },
            { mode: 'takeaway' as const, label: '🚗 Highway Takeaway', tag: 'Digha Pickup' },
            { mode: 'delivery' as const, label: '🏡 Home Delivery', tag: '30-45m' },
          ].map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => setActiveHeroMode(m.mode)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                border: activeHeroMode === m.mode ? '1.5px solid #f59e0b' : 'none',
                background: activeHeroMode === m.mode ? '#f59e0b' : 'transparent',
                color: activeHeroMode === m.mode ? '#18181b' : '#a1a1aa',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: '0.68rem', marginLeft: '0.35rem', opacity: 0.85 }}>({m.tag})</span>
            </button>
          ))}
        </div>
      </section>

      {/* 🔍 Search & Category Chips */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'bn' ? '🔍 বিরিয়ানি, কাবাব, পাস্তা, বার্গার খুঁজুন...' : '🔍 Search Dum Biryani, Tandoori Kebabs, Pasta, Mocktails...'}
          style={{
            width: '100%',
            padding: '0.85rem 1.1rem',
            borderRadius: '16px',
            background: '#1c1917',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            color: '#fafaf9',
            fontSize: '0.95rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        />

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCat(c)}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '24px',
                border: selectedCat === c ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedCat === c ? '#f59e0b' : '#1c1917',
                color: selectedCat === c ? '#18181b' : '#d6d3d1',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: selectedCat === c ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 🍲 Food Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            onAdd={(it, portion) => addToCart(it.id, portion)}
            onOpenDetail={(it) => setSelectedItemForModal(it)}
          />
        ))}
      </div>

      {/* 🔍 Food Quick-View Popup Modal */}
      {selectedItemForModal && (
        <FoodDetailModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
        />
      )}
    </div>
  )
}
