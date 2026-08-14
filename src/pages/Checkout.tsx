import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { ADVANCE_PERCENT, STORE_NAME, UPI_BANK, UPI_ID, UPI_QR_SRC } from '../lib/business'
import { showToast } from '../components/Toast'
import type { OrderType } from '../types'

export default function Checkout() {
  const { user } = useAuth()
  const { cart, cartTotal, placeOrder, validateCoupon, lang } = useStore()
  const navigate = useNavigate()

  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [tableNo, setTableNo] = useState('Cottage 1')
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState('')
  const [utr, setUtr] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  const deliveryFee = orderType === 'delivery' ? 30 : 0
  const finalTotal = Math.max(0, cartTotal + deliveryFee - discount)
  const advancePayable = Math.ceil(finalTotal * ADVANCE_PERCENT)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    const res = await validateCoupon(couponCode, cartTotal)
    if (res && res.valid && res.discount) {
      setDiscount(res.discount)
      setCouponMessage(res.message || 'Coupon applied!')
      showToast('Coupon Applied!', '🎟️')
    } else {
      setDiscount(0)
      setCouponMessage('❌ Invalid or expired coupon code')
      showToast('Invalid coupon', '❌', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      showToast('Please enter Name and Phone number', '⚠️', 'error')
      return
    }

    if (orderType === 'delivery' && !address.trim()) {
      showToast('Please enter delivery address', '⚠️', 'error')
      return
    }

    if (!utr.trim() || utr.trim().length < 8) {
      showToast('Please enter valid 12-digit UPI UTR number', '⚠️', 'error')
      return
    }

    setLoading(true)
    try {
      const order = await placeOrder({
        userId: user?.id,
        userName: name.trim(),
        phone: phone.trim(),
        orderType,
        tableNo: orderType === 'dine_in' ? tableNo : undefined,
        address: orderType === 'delivery' ? address.trim() : (orderType === 'takeaway' ? 'Highway Car Takeaway' : `Table: ${tableNo}`),
        deliveryFee,
        discountAmount: discount,
        utr: utr.trim(),
      })

      navigate(`/orders/success/${order.id}`)
    } catch {
      showToast('Failed to place order', '❌', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h1 style={{ fontSize: '1.4rem', color: '#fafaf9', marginBottom: '1rem' }}>
        🍽️ Complete Your Food Order
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* 1. Dining Mode Switcher */}
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
            1. Select Order Type:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { type: 'dine_in' as OrderType, label: '🏛️ Dine-In', sub: 'Cottage / Table' },
              { type: 'takeaway' as OrderType, label: '🚗 Takeaway', sub: 'Highway Pickup' },
              { type: 'delivery' as OrderType, label: '🏡 Delivery', sub: 'Home 30-45m' },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setOrderType(opt.type)}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: '10px',
                  border: orderType === opt.type ? '2px solid #f59e0b' : '1px solid #3f3f46',
                  background: orderType === opt.type ? '#f59e0b' : '#18181b',
                  color: orderType === opt.type ? '#18181b' : '#d6d3d1',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{opt.label}</strong>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{opt.sub}</span>
              </button>
            ))}
          </div>

          {orderType === 'dine_in' && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.35rem' }}>Select Table / Cottage Number:</label>
              <select value={tableNo} onChange={(e) => setTableNo(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}>
                <option value="Garden Cottage 1">🌿 Garden Cottage 1</option>
                <option value="Garden Cottage 2">🌿 Garden Cottage 2</option>
                <option value="Garden Cottage 3">🌿 Garden Cottage 3</option>
                <option value="AC Family Hall - Table 4">❄️ AC Family Hall - Table 4</option>
                <option value="AC Family Hall - Table 5">❄️ AC Family Hall - Table 5</option>
                <option value="Outdoor Lawn - Table 6">🌳 Outdoor Lawn - Table 6</option>
              </select>
            </div>
          )}
        </div>

        {/* 2. Customer Details */}
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
            2. Customer Details:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Your Name:</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Suman Roy" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Phone Number:</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }} />
            </div>
          </div>

          {orderType === 'delivery' && (
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Delivery Address in Bhabanipur / Nandakumar:</label>
              <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / Village, Landmark, Nandakumar" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }} />
            </div>
          )}
        </div>

        {/* 3. Promo Coupon */}
        <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            🎟️ Apply Promo Coupon:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Try: TFG50 or WELCOME10" style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', fontWeight: 700 }} />
            <button type="button" onClick={handleApplyCoupon} style={{ padding: '0.6rem 1.1rem', background: '#f59e0b', color: '#18181b', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
              Apply
            </button>
          </div>
          {couponMessage && <p style={{ fontSize: '0.82rem', color: discount > 0 ? '#22c55e' : '#ef4444', margin: '0.4rem 0 0', fontWeight: 600 }}>{couponMessage}</p>}
        </div>

        {/* 4. 1-Tap UPI Advance Payment */}
        <div style={{ background: '#27272a', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '1.25rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            ⚡ 4. 1-Tap Advance Payment (50% Advance):
          </label>
          <p style={{ fontSize: '0.85rem', color: '#d6d3d1', margin: '0 0 1rem', lineHeight: 1.4 }}>
            Pay 50% advance (₹{advancePayable}) directly to {STORE_NAME}'s bank account. Balance ₹{finalTotal - advancePayable} payable on food arrival!
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <img src={UPI_QR_SRC} alt="UPI QR" style={{ width: '130px', height: '130px', borderRadius: '10px', background: '#fff', padding: '4px' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block' }}>RESTAURANT UPI ID:</span>
              <code style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 800, display: 'block', margin: '2px 0 6px' }}>{UPI_ID}</code>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Bank: {UPI_BANK}</span>
            </div>
          </div>

          {/* ⚡ 1-Tap UPI App Buttons */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              ⚡ 1-Tap Quick Pay on Mobile App:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <a href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${advancePayable}&cu=INR&tn=TFG+Food+Advance`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <span style={{ color: '#0f9d58' }}>●</span> GPay
              </a>
              <a href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${advancePayable}&cu=INR&tn=TFG+Food+Advance`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <span style={{ color: '#5f259f' }}>●</span> PhonePe
              </a>
              <a href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${advancePayable}&cu=INR&tn=TFG+Food+Advance`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <span style={{ color: '#00baf2' }}>●</span> Paytm
              </a>
              <a href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${advancePayable}&cu=INR&tn=TFG+Food+Advance`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', background: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', color: '#18181b', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem' }}>
                ⚡ Pay ₹{advancePayable}
              </a>
            </div>
          </div>

          {/* UTR Input */}
          <div>
            <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>
              Enter 12-Digit UPI UTR / Transaction ID (from GPay/PhonePe):
            </label>
            <input type="text" required value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 419204918231" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1.5px solid #f59e0b', color: '#fff', fontWeight: 700 }} />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#18181b',
            padding: '0.95rem',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
          }}
        >
          {loading ? '⏳ Placing Food Order...' : `🚀 Confirm & Place Order (₹${finalTotal})`}
        </button>
      </form>
    </div>
  )
}
