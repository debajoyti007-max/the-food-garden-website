import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { STORE_NAME } from '../lib/business'
import type { UserRole } from '../types'

type Mode = 'login' | 'register' | 'forgot'

function roleRedirect(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'seller') return '/seller'
  if (role === 'rider') return '/rider'
  return '/'
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px',
  background: '#0d0d0f', border: '1.5px solid rgba(255,255,255,0.08)',
  color: '#fafaf9', fontSize: '0.95rem', outline: 'none',
}

export default function Auth() {
  const { user, loading, login, register, resetPin } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [name, setName] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // If already logged in → redirect to role page
  if (!loading && user) return <Navigate to={roleRedirect(user.role)} replace />

  const cleanPhone = phone.replace(/\D/g, '')
  const phoneValid = cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)
  const pinValid = pin.length === 4 && !/\D/.test(pin)

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setInfo('')
    setPin(''); setConfirmPin('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setInfo('')

    if (!phoneValid) { setError('Enter a valid 10-digit mobile number (starts with 6–9)'); return }
    if (!pinValid) { setError('PIN must be exactly 4 digits (0–9 only)'); return }

    // Register extra validation
    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your full name'); return }
      if (pin !== confirmPin) { setError('PINs do not match. Please re-enter'); return }
    }

    // Forgot PIN extra validation
    if (mode === 'forgot') {
      if (pin !== confirmPin) { setError('PINs do not match. Please re-enter'); return }
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const res = await login(cleanPhone, pin)
        if (!res.ok) { setError(res.error || 'Login failed'); return }
        navigate(roleRedirect(res.user!.role))

      } else if (mode === 'register') {
        const res = await register(cleanPhone, pin, name.trim())
        if (!res.ok) { setError(res.error || 'Registration failed'); return }
        navigate(roleRedirect(res.user!.role))

      } else if (mode === 'forgot') {
        const res = await resetPin(cleanPhone, pin)
        if (!res.ok) { setError(res.error || 'Reset failed'); return }
        setInfo('✅ PIN reset successful! Sign in with your new PIN.')
        switchMode('login')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#1c1917', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fafaf9' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'grid', placeItems: 'center', fontSize: '2rem', margin: '0 auto 0.75rem', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>
            🍽️
          </div>
          <h1 style={{ fontSize: '1.3rem', color: '#f59e0b', margin: 0, fontWeight: 900 }}>{STORE_NAME}</h1>
          <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0.2rem 0 0' }}>
            {mode === 'login' && 'Sign in with phone & 4-digit PIN'}
            {mode === 'register' && 'Create your account — takes 10 seconds'}
            {mode === 'forgot' && 'Reset your PIN — verified by your phone number'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', background: '#121214', borderRadius: '10px', padding: '3px', marginBottom: '1.25rem', gap: '2px' }}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: mode === m ? '#f59e0b' : 'transparent', color: mode === m ? '#18181b' : '#71717a', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s' }}>
              {m === 'login' ? '🔑 Sign In' : '✨ Register'}
            </button>
          ))}
        </div>

        {/* Info Banner */}
        {info && (
          <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#86efac', marginBottom: '1rem' }}>
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Name — register only */}
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '5px', fontWeight: 700 }}>Full Name</label>
              <input style={INPUT_STYLE} type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Das" autoComplete="name" />
            </div>
          )}

          {/* Phone */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
              Mobile Number
            </label>
            <input
              style={{ ...INPUT_STYLE, border: `1.5px solid ${cleanPhone.length > 0 ? (phoneValid ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.08)'}` }}
              type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile (starts with 6–9)" maxLength={10} autoComplete="tel" inputMode="numeric"
            />
            {cleanPhone.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: phoneValid ? '#22c55e' : '#ef4444', marginTop: '3px', display: 'block' }}>
                {phoneValid ? '✅ Valid Indian mobile number' : '❌ Must be 10 digits, starting 6–9'}
              </span>
            )}
          </div>

          {/* PIN */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 700 }}>
                {mode === 'forgot' ? 'New 4-Digit PIN' : '4-Digit PIN'}
              </label>
              <button type="button" onClick={() => setShowPin(!showPin)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.75rem' }}>
                {showPin ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>
            <input
              style={{ ...INPUT_STYLE, letterSpacing: showPin ? '0.1em' : '0.5em', fontSize: showPin ? '0.95rem' : '1.1rem' }}
              type={showPin ? 'text' : 'password'} required inputMode="numeric" maxLength={4}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Confirm PIN — register/forgot */}
          {(mode === 'register' || mode === 'forgot') && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '5px', fontWeight: 700 }}>Confirm PIN</label>
              <input
                style={{ ...INPUT_STYLE, border: `1.5px solid ${confirmPin.length === 4 ? (confirmPin === pin ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.08)'}`, letterSpacing: '0.5em', fontSize: '1.1rem' }}
                type="password" required inputMode="numeric" maxLength={4}
                value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••" autoComplete="new-password"
              />
              {confirmPin.length === 4 && confirmPin !== pin && (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '3px', display: 'block' }}>❌ PINs don't match</span>
              )}
            </div>
          )}

          {/* Forgot PIN link */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-0.3rem' }}>
              <button type="button" onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                Forgot PIN? Reset it →
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.82rem', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={busy} style={{ padding: '0.85rem', background: busy ? '#78350f' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#18181b', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '1rem', cursor: busy ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.25)', marginTop: '0.25rem' }}>
            {busy ? '⏳ Please wait...'
              : mode === 'login' ? 'Sign In  ➔'
              : mode === 'register' ? 'Create Account  ➔'
              : 'Reset My PIN  ➔'}
          </button>

          {/* Forgot mode back link */}
          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.78rem', textAlign: 'center' }}>
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#3f3f46', marginTop: '1.25rem' }}>
          Your PIN is stored securely. TFG staff can reset it if needed.
        </p>
      </div>
    </div>
  )
}
