import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS } from '../lib/business'
import type { MenuItem, Portion } from '../types'

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
          background: '#18181b',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '24px',
          overflow: 'hidden',
          width: 'min(460px, 94vw)',
          color: '#fafaf9',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Container */}
        <div style={{ position: 'relative', height: '240px', width: '100%', background: '#09090b' }}>
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
                    padding: '0.6rem 0.3rem',
                    borderRadius: '10px',
                    border: portion === p ? '2px solid #f59e0b' : '1px solid #3f3f46',
                    background: portion === p ? '#f59e0b' : '#27272a',
                    color: portion === p ? '#18181b' : '#fafaf9',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>
                    {p === 'C' ? 'Half' : p === 'B' ? 'Full' : 'Family'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 700 }}>₹{priceMap[p]}</span>
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
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: '#18181b',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
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
