import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS, STORE_NAME, STORE_TAGLINE } from '../lib/business'
import type { MenuItem, Portion } from '../types'

function FoodCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, portion: Portion) => void }) {
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
        background: '#27272a',
        border: '1px solid #3f3f46',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Food Photo Container */}
      <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden', background: '#1c1917' }}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3.5rem' }}>
            {item.emoji}
          </div>
        )}
        <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(24, 24, 27, 0.85)', backdropFilter: 'blur(8px)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
          {item.category}
        </span>
      </div>

      {/* Food Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fafaf9', fontWeight: 700, lineHeight: 1.3 }}>
              {lang === 'bn' ? item.bnName : item.name}
            </h3>
            <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
          </div>
          {item.description && (
            <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0 0 0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                  padding: '0.35rem 0.2rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: portion === p ? '1.5px solid #f59e0b' : '1px solid #3f3f46',
                  background: portion === p ? '#f59e0b' : '#18181b',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #3f3f46', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>{PORTION_LABELS[portion][lang]}</span>
              <strong style={{ fontSize: '1.25rem', color: '#f59e0b', fontWeight: 800 }}>₹{currentPrice}</strong>
            </div>

            {cartQty > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#18181b', border: '1px solid #f59e0b', borderRadius: '8px', padding: '2px 6px' }}>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty - 1)}
                  style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', width: '24px', height: '24px' }}
                >
                  -
                </button>
                <span style={{ fontWeight: 800, color: '#fafaf9', fontSize: '0.9rem', minWidth: '16px', textAlign: 'center' }}>
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQty(item.id, portion, cartQty + 1)}
                  style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', width: '24px', height: '24px' }}
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
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
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
    <div className="page shop-page" style={{ paddingBottom: '2rem' }}>
      {/* 🚀 Hero Banner */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(24,24,27,0.7) 0%, rgba(24,24,27,0.95) 100%), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '20px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          border: '1px solid #3f3f46',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ fontSize: '0.85rem', background: '#f59e0b', color: '#18181b', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          🌿 Garden Dining & Cafe
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fafaf9', margin: '0.75rem 0 0.5rem', fontWeight: 900 }}>
          {STORE_NAME}
        </h1>
        <p style={{ fontSize: '1rem', color: '#d6d3d1', maxWidth: '600px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
          Delicious Dum Biryani, Charcoal Tandoori Kebabs & Chilled Mocktails on Nandakumar-Digha Road.
        </p>

        {/* 3 Quick Order Mode Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
            🏛️ Garden Cottages
          </span>
          <span style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
            🚗 Highway Car Pickup
          </span>
          <span style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
            🏡 30m Local Delivery
          </span>
        </div>
      </section>

      {/* 🔍 Search & Category Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'bn' ? '🔍 বিরিয়ানি, কাবাব, পাস্তা, বার্গার খুঁজুন...' : '🔍 Search Biryani, Kebabs, Pasta, Burgers, Drinks...'}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: '#27272a',
            border: '1.5px solid #3f3f46',
            color: '#fafaf9',
            fontSize: '0.95rem',
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
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: selectedCat === c ? '1.5px solid #f59e0b' : '1px solid #3f3f46',
                background: selectedCat === c ? '#f59e0b' : '#27272a',
                color: selectedCat === c ? '#18181b' : '#d6d3d1',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
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
          />
        ))}
      </div>
    </div>
  )
}
