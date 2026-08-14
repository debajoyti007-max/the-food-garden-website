import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { STORE_NAME } from '../lib/business'

type Mode = 'login' | 'register'

export default function Auth() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res =
      mode === 'login'
        ? await login(phone, pin)
        : await register(phone, pin, name)

    setLoading(false)

    if (!res.ok) {
      setError(res.error || 'Something went wrong')
      return
    }

    navigate('/')
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#1c1917',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '2rem',
          color: '#fafaf9',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '2rem',
              margin: '0 auto 0.75rem',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
            }}
          >
            🍽️
          </div>
          <h1 style={{ fontSize: '1.3rem', color: '#f59e0b', margin: 0, fontWeight: 900 }}>
            {STORE_NAME}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.25rem 0 0' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#27272a',
            borderRadius: '10px',
            padding: '3px',
            marginBottom: '1.25rem',
          }}
        >
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: mode === m ? '#f59e0b' : 'transparent',
                color: mode === m ? '#18181b' : '#a1a1aa',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? '🔑 Sign In' : '✨ Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Name — register only */}
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: '#d6d3d1', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Das"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  background: '#121214',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  color: '#fafaf9',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          )}

          {/* Phone */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#d6d3d1', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '10px',
                background: '#121214',
                border: '1.5px solid rgba(255, 255, 255, 0.08)',
                color: '#fafaf9',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* PIN */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#d6d3d1', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
              4-Digit PIN
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '10px',
                background: '#121214',
                border: '1.5px solid rgba(255, 255, 255, 0.08)',
                color: '#fafaf9',
                fontSize: '1.2rem',
                letterSpacing: '0.5em',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.82rem',
                color: '#fca5a5',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              padding: '0.85rem',
              background: loading
                ? '#78350f'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#18181b',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              transition: 'opacity 0.2s',
            }}
          >
            {loading
              ? '⏳ Please wait...'
              : mode === 'login'
              ? 'Sign In  ➔'
              : 'Create Account  ➔'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#52525b', marginTop: '1.25rem' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
          >
            {mode === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
