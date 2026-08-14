import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { PORTION_LABELS, SUPPORT_WHATSAPP } from '../lib/business'

export default function Cart() {
  const { cart, menu, cartTotal, updateCartQty, removeFromCart, priceFor, lang } = useStore()

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#a1a1aa' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
        <h2 style={{ color: '#fafaf9', margin: '0 0 0.5rem' }}>Your order is empty</h2>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Browse our delicious menu and add food to your order.</p>
        <Link to="/" style={{ background: '#f59e0b', color: '#18181b', padding: '0.65rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 800 }}>
          Explore Menu ➔
        </Link>
      </div>
    )
  }

  const handleWhatsAppOrder = () => {
    const lines = cart.map((c) => {
      const p = menu.find((m) => m.id === c.productId)
      const name = p ? p.name : 'Food Item'
      const portion = PORTION_LABELS[c.portion].en
      const price = p ? priceFor(p, c.portion) * c.qty : 0
      return `• ${name} (${portion}) × ${c.qty} = ₹${price}`
    })

    const text = encodeURIComponent(
      `🍽️ The Food Garden (TFG) - Food Order Inquiry:\n\n${lines.join('\n')}\n\nTotal: ₹${cartTotal}\n\nPlease confirm availability!`
    )
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, '_blank')
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', marginBottom: '1rem' }}>
        🛒 {lang === 'bn' ? 'আপনার অর্ডার কার্ট' : 'Your Food Order'} ({cart.length} items)
      </h1>

      {/* Cart Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {cart.map((c) => {
          const item = menu.find((m) => m.id === c.productId)
          if (!item) return null
          const unitPrice = priceFor(item, c.portion)
          const totalItemPrice = unitPrice * c.qty

          return (
            <div
              key={`${c.productId}-${c.portion}`}
              style={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{item.emoji}</span>
                <div>
                  <strong style={{ color: '#fafaf9', fontSize: '0.95rem', display: 'block' }}>{item.name}</strong>
                  <span style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>
                    {PORTION_LABELS[c.portion].en} · ₹{unitPrice}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '2px 6px' }}>
                  <button
                    type="button"
                    onClick={() => updateCartQty(c.productId, c.portion, c.qty - 1)}
                    style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', width: '20px' }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, color: '#fafaf9', fontSize: '0.85rem' }}>{c.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(c.productId, c.portion, c.qty + 1)}
                    style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', width: '20px' }}
                  >
                    +
                  </button>
                </div>

                <strong style={{ color: '#fafaf9', fontSize: '0.95rem', minWidth: '50px', textAlign: 'right' }}>
                  ₹{totalItemPrice}
                </strong>

                <button
                  type="button"
                  onClick={() => removeFromCart(c.productId, c.portion)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bill Summary */}
      <div style={{ background: '#27272a', border: '1.5px solid #3f3f46', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#d6d3d1', fontSize: '0.9rem' }}>
          <span>Food Subtotal</span>
          <strong style={{ color: '#fafaf9' }}>₹{cartTotal}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#d6d3d1', fontSize: '0.9rem' }}>
          <span>Advance Payable (50%)</span>
          <strong style={{ color: '#f59e0b' }}>₹{Math.ceil(cartTotal * 0.5)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #3f3f46', paddingTop: '0.75rem', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          <strong style={{ color: '#fafaf9' }}>Total Bill</strong>
          <strong style={{ color: '#f59e0b' }}>₹{cartTotal}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Link
          to="/checkout"
          style={{
            display: 'block',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#18181b',
            padding: '0.85rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
          }}
        >
          Proceed to Checkout ➔
        </Link>

        <button
          type="button"
          onClick={handleWhatsAppOrder}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#14532d',
            border: '1px solid #22c55e',
            color: '#86efac',
            padding: '0.75rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <span>💬</span>
          <span>Order via WhatsApp Direct</span>
        </button>
      </div>
    </div>
  )
}
