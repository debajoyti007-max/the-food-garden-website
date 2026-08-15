import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS } from '../lib/business'
import type { MenuItem, Portion } from '../types'

const SERVING_HINTS: Record<Portion, string> = {
  C: 'Serves 1',
  B: 'Serves 1–2',
  A: 'Serves 3–4',
}

export default function FoodDetailModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [portion, setPortion] = useState<Portion>('B')
  const [notes, setNotes] = useState('')
  const { addToCart, lang } = useStore()

  const priceMap: Record<Portion, number> = { A: item.pA, B: item.pB, C: item.pC }
  const currentPrice = priceMap[portion]

  const handleAdd = () => {
    addToCart(item.id, portion)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="modal-pop"
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border-active)',
          borderRadius: '24px',
          overflow: 'hidden',
          width: 'min(460px, 94vw)',
          color: 'var(--text-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px var(--primary-glow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Container */}
        <div style={{ position: 'relative', height: '240px', width: '100%', background: '#09090b', overflow: 'hidden' }}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '4.5rem' }}>
              {item.emoji}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              color: '#fafaf9',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
          <span
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(24, 24, 27, 0.9)',
              backdropFilter: 'blur(8px)',
              color: '#f59e0b',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            🌿 Chef's Special
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fafaf9', margin: '0 0 2px', fontWeight: 800 }}>
                {lang === 'bn' ? item.bnName : item.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>{item.category}</span>
            </div>
            <strong style={{ fontSize: '1.4rem', color: '#f59e0b', fontWeight: 900 }}>₹{currentPrice}</strong>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 1rem' }}>
            {item.description}
          </p>

          {/* Portion Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#d6d3d1', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Select Serving Portion:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['C', 'B', 'A'] as Portion[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPortion(p)}
                  style={{
                    padding: '0.65rem 0.3rem',
                    borderRadius: '10px',
                    border: portion === p ? '2px solid var(--primary)' : '1px solid var(--border-strong)',
                    background: portion === p ? 'var(--primary)' : 'var(--surface-2)',
                    color: portion === p ? '#111' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    lineHeight: 1.25,
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800 }}>
                    {p === 'C' ? 'Half' : p === 'B' ? 'Full' : 'Family'}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8, fontWeight: 600, marginTop: '1px' }}>
                    {SERVING_HINTS[p]}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginTop: '2px' }}>₹{priceMap[p]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add to Order Button */}
          <button
            type="button"
            onClick={handleAdd}
            style={{
              width: '100%',
              padding: '0.88rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              border: 'none',
              color: '#111',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-primary-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-primary-lg)' }}
          >
            <span>+ Add to Order</span>
            <span>·</span>
            <span>₹{currentPrice} ({PORTION_LABELS[portion].en})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
