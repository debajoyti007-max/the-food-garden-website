import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { ADVANCE_PERCENT, STORE_NAME, UPI_BANK, UPI_ID, UPI_QR_SRC } from '../lib/business'
import { showToast } from '../components/Toast'
import type { OrderType } from '../types'

// Detect mobile device for adaptive UPI payment UI
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// 1-tap copy UPI button
function CopyUpiButton({ upiId }: { upiId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId)
    } catch {
      // fallback for older browsers
      const el = document.createElement('input')
      el.value = upiId
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`copy-btn${copied ? ' copied' : ''}`}
    >
      {copied ? '✓ Copied!' : '📋 Copy UPI ID'}
    </button>
  )
}

// DINING SEATING ZONES (No rigid table numbers needed)
const DINING_ZONES = [
  '🌿 Open Garden / Lawn',
  '❄️ AC Family Hall',
  '🛖 Private Cottage',
  '🛎️ Counter / Self-Service',
]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '0.68rem 0.85rem',
  borderRadius: '10px',
  background: 'rgba(0,0,0,0.28)',
  border: '1.5px solid var(--border-strong)',
  color: 'var(--text-primary)',
  fontSize: '0.93rem',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '0.28rem',
  fontWeight: 600,
}

export default function Checkout() {
  const { user } = useAuth()
  const { cart, cartTotal, orders, placeOrder, validateCoupon, addresses, saveAddress, lang } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()

  // Auto-detect table from URL QR code (?table=cottage1 or ?table=Garden+Cottage+1)
  const tableFromUrl = searchParams.get('table')

  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [seatingZone, setSeatingZone] = useState(DINING_ZONES[0])
  const [seatingNote, setSeatingNote] = useState('')
  const [takeawayNote, setTakeawayNote] = useState('')
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(addresses[0]?.address || '')
  const [addressLabel, setAddressLabel] = useState('Home')
  const [saveThisAddress, setSaveThisAddress] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'advance' | 'full'>('advance')
  const [utr, setUtr] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart')
    }
  }, [cart.length, navigate])

  if (cart.length === 0) {
    return null
  }

  const deliveryFee = orderType === 'delivery' ? 30 : 0
  const finalTotal = Math.max(0, cartTotal + deliveryFee - discount)
  const advancePayable = Math.ceil(finalTotal * ADVANCE_PERCENT)
  const payableNow = paymentMode === 'full' ? finalTotal : advancePayable
  const balanceDue = finalTotal - payableNow

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${payableNow}&cu=INR&tn=TFG+Food+${paymentMode === 'full' ? 'Payment' : 'Advance'}`
  const dynamicQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(UPI_ID)}%26pn%3D${encodeURIComponent(STORE_NAME)}%26am%3D${payableNow}%26cu%3DINR`

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
      showToast('Invalid coupon', '❌')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return // Anti double-click guard

    if (!name.trim() || !phone.trim()) {
      showToast('Please enter Name and Phone number', '⚠️')
      return
    }

    if (orderType === 'delivery' && !address.trim()) {
      showToast('Please enter delivery address', '⚠️')
      return
    }

    if (!utr.trim() || utr.trim().length < 6) {
      showToast('Please enter valid UPI UTR / Transaction reference', '⚠️')
      return
    }

    // 🛡️ Duplicate UTR Check
    const cleanUtr = utr.trim().toUpperCase()
    const duplicateUtrOrder = orders.find(
      (o) => o.utr && o.utr.trim().toUpperCase() === cleanUtr && o.status !== 'cancelled'
    )
    if (duplicateUtrOrder) {
      showToast('⚠️ This UTR has already been submitted for another order. Please enter your new transaction UTR.', '🚫')
      return
    }

    setLoading(true)
    try {
      if (orderType === 'delivery' && saveThisAddress && address.trim()) {
        saveAddress({
          label: addressLabel.trim() || 'Saved Address',
          address: address.trim(),
          phone: phone.trim(),
          pin: '721648',
          is_default: false,
        })
      }

      const diningLocation = seatingNote.trim()
        ? `${seatingZone} (${seatingNote.trim()})`
        : seatingZone

      const order = await placeOrder({
        userId: user?.id,
        userName: name.trim(),
        phone: phone.trim(),
        orderType,
        tableNo: orderType === 'dine_in' ? diningLocation : undefined,
        address:
          orderType === 'delivery'
            ? address.trim()
            : orderType === 'takeaway'
            ? (takeawayNote.trim() ? `Takeaway: ${takeawayNote.trim()}` : 'Highway Car / Counter Takeaway')
            : diningLocation,
        deliveryFee,
        discountAmount: discount,
        advanceAmount: payableNow,
        utr: utr.trim(),
      })

      navigate(`/orders/success/${order.id}`)
    } catch {
      showToast('Failed to place order', '❌')
    } finally {
      setLoading(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '1.25rem',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--primary)',
    fontWeight: 800,
    display: 'block',
    marginBottom: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* Table QR Auto-Detected Banner */}
      {tableFromUrl && (
        <div
          style={{
            background: 'rgba(22,163,74,0.14)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '14px',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            color: 'var(--garden-green-light)',
            fontWeight: 700,
          }}
        >
          <span>✅</span>
          <span>Seating zone auto-detected: <strong>{tableFromUrl}</strong></span>
        </div>
      )}

      <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '1.25rem', fontWeight: 900 }}>
        🍽️ Complete Your Food Order
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* ═══ 1. Order Type ══════════════════════════════════════════════ */}
        <div style={panelStyle}>
          <span style={sectionLabelStyle}>1. Select Order Type</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { type: 'dine_in' as OrderType, label: '🏛️ Dine-In', sub: 'Garden / AC / Cabin' },
              { type: 'takeaway' as OrderType, label: '🚗 Takeaway', sub: 'Car / Highway Pickup' },
              { type: 'delivery' as OrderType, label: '🏡 Delivery', sub: 'Home 30–45m' },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setOrderType(opt.type)}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  border: orderType === opt.type ? '2px solid var(--primary)' : '1px solid var(--border-strong)',
                  background: orderType === opt.type ? 'var(--primary)' : 'var(--surface-2)',
                  color: orderType === opt.type ? '#111' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                }}
              >
                <strong style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800 }}>{opt.label}</strong>
                <span style={{ fontSize: '0.70rem', opacity: 0.85 }}>{opt.sub}</span>
              </button>
            ))}
          </div>

          {orderType === 'dine_in' && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={LABEL_STYLE}>Choose Seating Area:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                  {DINING_ZONES.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSeatingZone(zone)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: '10px',
                        border: seatingZone === zone ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                        background: seatingZone === zone ? 'rgba(245,158,11,0.15)' : 'var(--surface-2)',
                        color: seatingZone === zone ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>Seating Note (Optional):</label>
                <input
                  type="text"
                  value={seatingNote}
                  onChange={(e) => setSeatingNote(e.target.value)}
                  placeholder="e.g. Near fountain, 2nd cottage, sitting on lawn"
                  style={INPUT_STYLE}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                />
              </div>
            </div>
          )}

          {orderType === 'takeaway' && (
            <div style={{ marginTop: '1rem' }}>
              <label style={LABEL_STYLE}>Car / Pickup Details (Optional):</label>
              <input
                type="text"
                value={takeawayNote}
                onChange={(e) => setTakeawayNote(e.target.value)}
                placeholder="e.g. White Swift WB-32... or 'Will pick at counter'"
                style={INPUT_STYLE}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                🚗 Traveling on highway? Enter vehicle number and we'll deliver food to your car!
              </span>
            </div>
          )}
        </div>

        {/* ═══ 2. Customer Details ════════════════════════════════════════ */}
        <div style={panelStyle}>
          <span style={sectionLabelStyle}>2. Customer Details</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={LABEL_STYLE}>Your Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suman Roy"
                style={INPUT_STYLE}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phone Number:</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                style={INPUT_STYLE}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              />
            </div>
          </div>

          {orderType === 'delivery' && (
            <div style={{ marginTop: '0.85rem' }}>
              {addresses.length > 0 && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <span style={{ ...LABEL_STYLE, marginBottom: '0.4rem' }}>1-Tap Saved Address:</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {addresses.map((a, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAddress(a.address)}
                        style={{
                          padding: '0.32rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          border: address === a.address ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                          background: address === a.address ? 'rgba(245,158,11,0.15)' : 'var(--surface-2)',
                          color: address === a.address ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: address === a.address ? 800 : 500,
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label style={LABEL_STYLE}>Delivery Address (Bhabanipur / Nandakumar):</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Village, Landmark, Nandakumar"
                style={INPUT_STYLE}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="saveAddr"
                  checked={saveThisAddress}
                  onChange={(e) => setSaveThisAddress(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                />
                <label htmlFor="saveAddr" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Save for 1-tap future orders
                </label>
                {saveThisAddress && (
                  <input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    placeholder="Label (Home / Office)"
                    style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: '0.74rem', width: '120px', fontFamily: 'inherit' }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ 3. Promo Coupon ════════════════════════════════════════════ */}
        <div style={panelStyle}>
          <span style={sectionLabelStyle}>🎟️ Apply Promo Coupon</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code..."
              style={{ ...INPUT_STYLE, fontWeight: 700, letterSpacing: '0.05em' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              style={{ padding: '0 1.1rem', background: 'var(--primary)', color: '#111', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p style={{ fontSize: '0.82rem', color: discount > 0 ? 'var(--garden-green-light)' : '#ef4444', margin: '0.4rem 0 0', fontWeight: 600 }}>
              {couponMessage}
            </p>
          )}
        </div>

        {/* ═══ 4. UPI Payment (Device-Adaptive) ══════════════════════════ */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px solid rgba(245,158,11,0.45)',
            borderRadius: '20px',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle warm glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '20px 20px 0 0' }} />

          <span style={sectionLabelStyle}>
            ⚡ 4. Select Payment Amount & Pay UPI
          </span>

          {/* Compact 2-way toggle for Advance vs Full payment */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.4rem',
              marginBottom: '0.9rem',
              background: 'var(--surface-2)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
            }}
          >
            <button
              type="button"
              onClick={() => setPaymentMode('advance')}
              style={{
                padding: '0.55rem 0.4rem',
                borderRadius: '8px',
                border: 'none',
                background: paymentMode === 'advance' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'transparent',
                color: paymentMode === 'advance' ? '#111' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.80rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontFamily: 'inherit',
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              <span>⚡ 50% Advance</span>
              <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '2px' }}>₹{advancePayable}</strong>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('full')}
              style={{
                padding: '0.55rem 0.4rem',
                borderRadius: '8px',
                border: 'none',
                background: paymentMode === 'full' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'transparent',
                color: paymentMode === 'full' ? '#fff' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.80rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                fontFamily: 'inherit',
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              <span>💎 100% Full Bill</span>
              <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '2px' }}>₹{finalTotal}</strong>
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem', lineHeight: 1.45 }}>
            {paymentMode === 'full' ? (
              <span>
                Pay <strong style={{ color: 'var(--garden-green-light)' }}>100% Full Bill (₹{finalTotal})</strong> now · <span style={{ color: 'var(--garden-green-light)', fontWeight: 700 }}>Zero cash needed on arrival! 🎉</span>
              </span>
            ) : (
              <span>
                Pay <strong style={{ color: 'var(--primary)' }}>50% Advance (₹{advancePayable})</strong> now · Balance <strong>₹{balanceDue}</strong> on food arrival.
              </span>
            )}
          </p>

          {/* UPI ID row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: '12px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>UPI ID · {UPI_BANK}</span>
              <code style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 900, letterSpacing: '0.02em' }}>{UPI_ID}</code>
            </div>
            <CopyUpiButton upiId={UPI_ID} />
          </div>

          {/* ── MOBILE: Deep-link UPI App buttons ── */}
          {isMobile ? (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                ⚡ Tap to Pay via App:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Google Pay', dot: '#0f9d58', short: 'GPay' },
                  { label: 'PhonePe', dot: '#5f259f', short: 'PhonePe' },
                  { label: 'Paytm', dot: '#00baf2', short: 'Paytm' },
                ].map((app) => (
                  <a
                    key={app.label}
                    href={upiDeepLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = app.dot }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: app.dot, flexShrink: 0 }} />
                    {app.short}
                  </a>
                ))}
                <a
                  href={upiDeepLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem',
                    background: paymentMode === 'full' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: paymentMode === 'full' ? '#fff' : '#111',
                    textDecoration: 'none',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    boxShadow: 'var(--shadow-primary)',
                  }}
                >
                  ⚡ Pay ₹{payableNow}
                </a>
              </div>
            </div>
          ) : (
            /* ── DESKTOP: Show QR code to scan ── */
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: '#fff',
                  padding: '6px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  flexShrink: 0,
                }}
              >
                <img src={dynamicQrSrc} alt="UPI QR Code" style={{ width: '140px', height: '140px', display: 'block', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 0.6rem' }}>
                  Scan with <strong style={{ color: 'var(--text-primary)' }}>GPay / PhonePe / Paytm</strong> or any UPI app on your phone camera.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['📱 Google Pay', '📱 PhonePe', '📱 Paytm', '📱 BHIM'].map((app) => (
                    <span
                      key={app}
                      style={{ padding: '0.28rem 0.65rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UTR Input */}
          <div>
            <label style={{ ...LABEL_STYLE, color: 'var(--text-secondary)' }}>
              Enter UPI UTR / Transaction ID (12 digits — from GPay/PhonePe/Paytm):
            </label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="e.g. 419204918231"
              style={{ ...INPUT_STYLE, border: '1.5px solid rgba(245,158,11,0.5)', fontWeight: 700, letterSpacing: '0.08em', fontSize: '1rem' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; e.currentTarget.style.boxShadow = 'none' }}
              maxLength={12}
              inputMode="numeric"
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', margin: '0.35rem 0 0' }}>
              Find UTR in: GPay → Transaction → Reference ID · PhonePe → History → UPI Ref No.
            </p>
          </div>
        </div>

        {/* ═══ 5. Bill Summary ════════════════════════════════════════════ */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.1rem',
          }}
        >
          <span style={{ ...sectionLabelStyle, marginBottom: '0.75rem' }}>5. Bill Summary</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Food Subtotal</span>
              <strong style={{ color: 'var(--text-primary)' }}>₹{cartTotal}</strong>
            </div>
            {deliveryFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{deliveryFee}</strong>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🎟️ Coupon Discount</span>
                <strong style={{ color: 'var(--garden-green-light)' }}>− ₹{discount}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.55rem', marginTop: '0.2rem', fontSize: '1rem' }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 900 }}>Total Bill</strong>
              <strong style={{ color: 'var(--primary)', fontWeight: 900 }}>₹{finalTotal}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: paymentMode === 'full' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.1)',
                borderRadius: '10px',
                padding: '0.55rem 0.75rem',
                border: `1px solid ${paymentMode === 'full' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.25)'}`,
              }}
            >
              <span style={{ color: paymentMode === 'full' ? 'var(--garden-green-light)' : 'var(--primary)', fontWeight: 700 }}>
                {paymentMode === 'full' ? '💎 Pay Now (100% Full Payment)' : '⚡ Pay Now (50% Advance)'}
              </span>
              <strong style={{ color: paymentMode === 'full' ? 'var(--garden-green-light)' : 'var(--primary)', fontWeight: 900 }}>
                ₹{payableNow}
              </strong>
            </div>
            {balanceDue > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
                <span>Balance Due on Delivery / Table:</span>
                <strong style={{ color: 'var(--text-secondary)' }}>₹{balanceDue}</strong>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--garden-green-light)', textAlign: 'center', fontWeight: 700, padding: '0.1rem 0' }}>
                ✓ Zero cash payment needed on arrival!
              </div>
            )}
          </div>
        </div>

        {/* ═══ Submit ═════════════════════════════════════════════════════ */}
        <button
          type="submit"
          disabled={loading}
          className="btn-order"
          style={{
            background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: loading ? 'var(--text-muted)' : '#111',
            padding: '1rem',
            borderRadius: '16px',
            border: 'none',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : 'var(--shadow-primary)',
            transition: 'all 0.25s ease',
            width: '100%',
          }}
        >
          {loading ? '⏳ Placing Food Order...' : `🚀 Confirm & Place Order — Pay ₹${payableNow}`}
        </button>
      </form>
    </div>
  )
}
