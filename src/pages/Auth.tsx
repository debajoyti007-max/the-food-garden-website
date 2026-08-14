import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { STORE_NAME } from '../lib/business'

export default function Auth() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(phone, pin)
    setLoading(false)
    if (res.ok) {
      navigate('/')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', padding: '1.5rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '20px', color: '#fafaf9', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
      <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: '0 0 0.25rem' }}>Sign In to {STORE_NAME}</h1>
      <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: '0 0 1.5rem' }}>
        Enter phone number & 4-digit PIN to track orders & save table history.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Phone Number:</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>4-Digit PIN:</label>
          <input
            type="password"
            maxLength={4}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', letterSpacing: '0.3em' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#18181b',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          {loading ? '⏳ Signing In...' : 'Sign In ➔'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#18181b', borderRadius: '8px', fontSize: '0.75rem', color: '#71717a', textAlign: 'left' }}>
        💡 <b>Staff Fast Access PINs:</b><br />
        • Kitchen Staff: PIN <code>9999</code><br />
        • Delivery Rider: PIN <code>8888</code><br />
        • Admin: PIN <code>7777</code>
      </div>
    </div>
  )
}
