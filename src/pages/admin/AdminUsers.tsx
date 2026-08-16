import { useEffect, useState, useMemo } from 'react'
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
  last_active_at: string | null
  order_count?: number
}

const ROLE_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',          icon: '🛡️', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  seller:   { label: 'Kitchen Staff',  icon: '👨‍🍳', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  rider:    { label: 'Delivery Rider', icon: '🛵', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  customer: { label: 'Customer',       icon: '👤', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)' },
}

const SUPER_ADMIN_PHONES = ['8170859653']

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function AdminUsers() {
  const { blockUser, setUserRole } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all') // all | active | blocked
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('last_active_at', { ascending: false, nullsFirst: false })
    setUsers((data as Profile[]) || [])

    // Load order counts per user phone
    const { data: orders } = await supabase
      .from('orders')
      .select('phone, status')
      .eq('status', 'delivered')
    if (orders) {
      const counts: Record<string, number> = {}
      orders.forEach((o: any) => { counts[o.phone] = (counts[o.phone] || 0) + 1 })
      setOrderCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => { void loadUsers() }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search)
      const matchRole = filterRole === 'all' || u.role === filterRole
      const matchStatus = filterStatus === 'all' ||
        (filterStatus === 'blocked' && u.is_blocked) ||
        (filterStatus === 'active' && !u.is_blocked)
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, filterRole, filterStatus])

  const stats = useMemo(() => ({
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    staff: users.filter(u => u.role !== 'customer').length,
    blocked: users.filter(u => u.is_blocked).length,
  }), [users])

  const handleBlock = async (u: Profile) => {
    if (SUPER_ADMIN_PHONES.includes(u.phone)) { showToast('Cannot block Super Admin!', '🛡️'); return }
    const ok = await blockUser(u.id, !u.is_blocked)
    if (ok) setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_blocked: !u.is_blocked } : p))
  }

  const handleRoleChange = async (u: Profile, role: UserRole) => {
    if (SUPER_ADMIN_PHONES.includes(u.phone)) { showToast('Cannot change Super Admin role!', '🛡️'); return }
    const ok = await setUserRole(u.id, role)
    if (ok) setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role } : p))
  }

  const pill = (label: string, color: string, bg: string) => (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: bg, color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← Admin</Link>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>🗂️ Customer & User Management</h1>
        <button onClick={loadUsers} style={{ marginLeft: 'auto', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 700 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Users', value: stats.total, icon: '👥', color: 'var(--primary)' },
          { label: 'Customers', value: stats.customers, icon: '👤', color: '#a1a1aa' },
          { label: 'Staff', value: stats.staff, icon: '👨‍🍳', color: '#f59e0b' },
          { label: 'Blocked', value: stats.blocked, icon: '🚫', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem 0.85rem', background: 'var(--surface-2)', border: '1.5px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }}
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ padding: '0.6rem 0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.83rem', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="seller">Kitchen Staff</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.6rem 0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.83rem', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Count */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', fontWeight: 600 }}>
        Showing {filtered.length} of {users.length} users
      </p>

      {/* User List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>⏳ Loading users...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {filtered.map(u => {
            const cfg = ROLE_CFG[u.role] || ROLE_CFG.customer
            const isSuper = SUPER_ADMIN_PHONES.includes(u.phone)
            const orders = orderCounts[u.phone] || 0
            return (
              <div key={u.id} style={{
                background: u.is_blocked ? 'rgba(239,68,68,0.05)' : 'var(--surface)',
                border: `1px solid ${u.is_blocked ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}33`, display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {cfg.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{u.name}</strong>
                    {isSuper && pill('⭐ Super Admin', '#f59e0b', 'rgba(245,158,11,0.12)')}
                    {u.is_blocked && pill('🚫 Blocked', '#ef4444', 'rgba(239,68,68,0.12)')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    📱 {u.phone} · {pill(cfg.label, cfg.color, cfg.bg)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-faint)', marginTop: '3px' }}>
                    🕐 Active {timeAgo(u.last_active_at)} · ✅ {orders} delivered orders
                  </div>
                </div>

                {/* Actions */}
                {!isSuper && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Role Change */}
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                      style={{ padding: '0.35rem 0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <option value="customer">👤 Customer</option>
                      <option value="seller">👨‍🍳 Kitchen</option>
                      <option value="rider">🛵 Rider</option>
                      <option value="admin">🛡️ Admin</option>
                    </select>

                    {/* Block / Unblock */}
                    <button
                      onClick={() => handleBlock(u)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: u.is_blocked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                        color: u.is_blocked ? 'var(--garden-green-light)' : '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.is_blocked ? '✅ Unblock' : '🚫 Block'}
                    </button>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/91${u.phone}?text=${encodeURIComponent(`Namaste ${u.name}, The Food Garden (TFG) team here! 🌿`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', background: 'rgba(37,211,102,0.12)', color: '#25d366', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(37,211,102,0.25)' }}
                    >
                      💬 WA
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
