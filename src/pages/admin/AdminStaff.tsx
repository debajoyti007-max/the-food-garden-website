import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../../components/Toast'
import type { UserRole } from '../../types'

interface Profile {
  id: string
  phone: string
  name: string
  role: UserRole
  is_blocked: boolean
  created_at: string
}

const ROLE_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',          icon: '🛡️', color: '#a78bfa', bg: '#3b0764' },
  seller:   { label: 'Kitchen Staff',  icon: '👨‍🍳', color: '#f59e0b', bg: '#78350f' },
  rider:    { label: 'Delivery Rider', icon: '🛵', color: '#22c55e', bg: '#14532d' },
  customer: { label: 'Customer',       icon: '👤', color: '#a1a1aa', bg: '#27272a' },
}

// Super admin cannot be demoted
const SUPER_ADMIN_PHONES = ['7001045147']

export default function AdminStaff() {
  const { setUserRole, resetUserPin, blockUser } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [pinResetId, setPinResetId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')

  // New staff form
  const [form, setForm] = useState({ name: '', phone: '', pin: '', role: 'seller' as UserRole })
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoaded(true)
    setLoading(false)
  }

  const handleRoleChange = async (profile: Profile, role: UserRole) => {
    if (SUPER_ADMIN_PHONES.includes(profile.phone) && role !== 'admin') {
      showToast('Owner account cannot be demoted!', '🛡️')
      return
    }
    const ok = await setUserRole(profile.id, role)
    if (ok) setUsers((p) => p.map((u) => u.id === profile.id ? { ...u, role } : u))
  }

  const handleBlock = async (profile: Profile) => {
    if (SUPER_ADMIN_PHONES.includes(profile.phone)) {
      showToast('Owner account cannot be blocked!', '🛡️')
      return
    }
    const ok = await blockUser(profile.id, !profile.is_blocked)
    if (ok) setUsers((p) => p.map((u) => u.id === profile.id ? { ...u, is_blocked: !u.is_blocked } : u))
  }

  const handlePinReset = async () => {
    if (!pinResetId || newPin.length < 4) { showToast('Enter 4-digit PIN', '⚠️'); return }
    const ok = await resetUserPin(pinResetId, newPin)
    if (ok) { setPinResetId(null); setNewPin('') }
  }

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPhone = form.phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) { showToast('Enter valid phone', '⚠️'); return }
    if (form.pin.length < 4) { showToast('PIN must be 4 digits', '⚠️'); return }

    setCreating(true)
    const { error } = await supabase.from('profiles').insert({
      phone: cleanPhone, name: form.name.trim(), pin: form.pin, role: form.role,
    })
    setCreating(false)

    if (error) {
      showToast(error.message.includes('duplicate') ? 'Phone already registered!' : 'Failed to create account', '❌')
      return
    }
    showToast(`${ROLE_CFG[form.role].label} account created!`, '✅')
    setForm({ name: '', phone: '', pin: '', role: 'seller' })
    loadUsers()
  }

  const filtered = users.filter((u) => {
    const roleOk = filterRole === 'all' || u.role === filterRole
    const q = search.toLowerCase()
    const searchOk = !q || u.name?.toLowerCase().includes(q) || u.phone.includes(q)
    return roleOk && searchOk
  })

  const counts: Record<string, number> = { admin: 0, seller: 0, rider: 0, customer: 0 }
  users.forEach((u) => { if (counts[u.role] !== undefined) counts[u.role]++ })

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>👥 Staff & User Manager</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Create accounts, assign roles, reset PINs, block users</span>
        </div>
        <Link to="/admin" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Role Guide Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {Object.entries(ROLE_CFG).map(([key, cfg]) => (
          <div key={key} style={{ background: '#1c1917', border: `1px solid ${cfg.color}22`, borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>{cfg.icon}</div>
            <div style={{ color: cfg.color, fontWeight: 800, fontSize: '0.8rem' }}>{cfg.label}</div>
            <div style={{ color: '#52525b', fontSize: '0.7rem', marginTop: '2px' }}>
              {loaded ? `${counts[key]} accounts` : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Staff Form ─────────────────────────── */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.95rem', color: '#fafaf9', margin: '0 0 0.85rem', fontWeight: 800 }}>➕ Create New Staff Account</h2>
        <form onSubmit={createAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Full Name</label>
            <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Raju Chef" style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Phone Number</label>
            <input required type="tel" maxLength={10} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="10-digit" style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>4-Digit PIN</label>
            <input required type="password" maxLength={4} value={form.pin} onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value }))} placeholder="••••" style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Role</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.85rem' }}>
              <option value="seller">👨‍🍳 Kitchen Staff</option>
              <option value="rider">🛵 Delivery Rider</option>
              <option value="admin">🛡️ Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" disabled={creating} style={{ width: '100%', padding: '0.55rem', background: creating ? '#78350f' : '#f59e0b', color: '#18181b', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}>
              {creating ? '⏳...' : '✅ Create'}
            </button>
          </div>
        </form>
      </div>

      {/* ── PIN Reset Modal ─────────────────────────────── */}
      {pinResetId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1c1917', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.5rem', width: '280px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔑</div>
            <h3 style={{ color: '#fafaf9', margin: '0 0 0.75rem', fontSize: '1rem' }}>Reset PIN</h3>
            <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New 4-digit PIN" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '1.1rem', letterSpacing: '0.3em', marginBottom: '0.75rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setPinResetId(null); setNewPin('') }} style={{ flex: 1, padding: '0.55rem', background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={handlePinReset} style={{ flex: 1, padding: '0.55rem', background: '#f59e0b', color: '#18181b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>Save PIN</button>
            </div>
          </div>
        </div>
      )}

      {/* ── User List ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'admin', 'seller', 'rider', 'customer'].map((r) => (
            <button key={r} onClick={() => setFilterRole(r)} style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', border: filterRole === r ? '1.5px solid #f59e0b' : '1px solid #3f3f46', background: filterRole === r ? '#f59e0b' : '#1c1917', color: filterRole === r ? '#18181b' : '#a1a1aa', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
              {r === 'all' ? `All (${users.length})` : `${ROLE_CFG[r]?.icon} ${ROLE_CFG[r]?.label} (${counts[r] || 0})`}
            </button>
          ))}
        </div>
        <button onClick={loadUsers} disabled={loading} style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
          {loading ? '⏳' : loaded ? '🔄 Refresh' : '📋 Load All Users'}
        </button>
      </div>

      {loaded && (
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by name or phone..." style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.85rem', marginBottom: '0.75rem' }} />
      )}

      {loaded && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#52525b' }}>No users found.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map((u) => {
          const cfg = ROLE_CFG[u.role] || ROLE_CFG.customer
          const isSuperAdmin = SUPER_ADMIN_PHONES.includes(u.phone)
          return (
            <div key={u.id} style={{ background: '#1c1917', border: u.is_blocked ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span style={{ fontSize: '1.6rem' }}>{cfg.icon}</span>
                <div>
                  <strong style={{ color: '#fafaf9', fontSize: '0.9rem' }}>
                    {u.name}
                    {isSuperAdmin && <span style={{ fontSize: '0.65rem', background: '#7c3aed', color: '#e9d5ff', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 900 }}>OWNER</span>}
                    {u.is_blocked && <span style={{ fontSize: '0.65rem', background: '#991b1b', color: '#fca5a5', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>BLOCKED</span>}
                  </strong>
                  <span style={{ color: '#a1a1aa', fontSize: '0.72rem', display: 'block' }}>📱 {u.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Role Selector */}
                {!isSuperAdmin ? (
                  <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value as UserRole)} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.color, fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                    <option value="customer">👤 Customer</option>
                    <option value="rider">🛵 Rider</option>
                    <option value="seller">👨‍🍳 Kitchen</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                ) : (
                  <span style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#3b0764', border: '1px solid #7c3aed', color: '#a78bfa', fontWeight: 800, fontSize: '0.72rem' }}>🛡️ Admin</span>
                )}

                {/* PIN Reset */}
                <button onClick={() => { setPinResetId(u.id); setNewPin('') }} style={{ padding: '0.3rem 0.55rem', background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }} title="Reset PIN">
                  🔑
                </button>

                {/* Block/Unblock */}
                {!isSuperAdmin && (
                  <button onClick={() => handleBlock(u)} style={{ padding: '0.3rem 0.55rem', background: u.is_blocked ? '#14532d' : '#450a0a', border: `1px solid ${u.is_blocked ? '#16a34a' : '#991b1b'}`, color: u.is_blocked ? '#bbf7d0' : '#fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }} title={u.is_blocked ? 'Unblock' : 'Block'}>
                    {u.is_blocked ? '✅' : '🚫'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
