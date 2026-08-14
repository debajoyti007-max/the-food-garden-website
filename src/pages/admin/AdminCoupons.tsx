import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { showToast } from '../../components/Toast'

interface Coupon {
  code: string
  discount_type: 'flat' | 'percent'
  discount_value: number
  min_order: number
  valid: boolean
  created_at?: string
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ code: '', discount_type: 'flat' as 'flat' | 'percent', discount_value: '', min_order: '' })
  const [creating, setCreating] = useState(false)

  const loadCoupons = async () => {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data as Coupon[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadCoupons() }, [])

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (!code) { showToast('Enter a coupon code', '⚠️'); return }
    if (!form.discount_value || isNaN(Number(form.discount_value))) { showToast('Enter a valid discount value', '⚠️'); return }

    setCreating(true)
    const { error } = await supabase.from('coupons').insert({
      code,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order) || 0,
      valid: true,
    })
    setCreating(false)

    if (error) {
      showToast(error.message.includes('duplicate') ? 'Coupon code already exists!' : 'Failed to create coupon', '❌')
      return
    }
    showToast(`Coupon ${code} created!`, '🏷️')
    setForm({ code: '', discount_type: 'flat', discount_value: '', min_order: '' })
    loadCoupons()
  }

  const toggleCoupon = async (code: string, current: boolean) => {
    const { error } = await supabase.from('coupons').update({ valid: !current }).eq('code', code)
    if (!error) {
      setCoupons((p) => p.map((c) => c.code === code ? { ...c, valid: !current } : c))
      showToast(`Coupon ${code} ${!current ? 'enabled' : 'disabled'}`, !current ? '✅' : '⏸️')
    }
  }

  const deleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return
    const { error } = await supabase.from('coupons').delete().eq('code', code)
    if (!error) {
      setCoupons((p) => p.filter((c) => c.code !== code))
      showToast(`Coupon ${code} deleted`, '🗑️')
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem', color: '#fafaf9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: 0 }}>🏷️ Promo Code Manager</h1>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Create and manage customer discount codes</span>
        </div>
        <Link to="/admin" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#d6d3d1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Dashboard
        </Link>
      </div>

      {/* Create Form */}
      <div style={{ background: '#1c1917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800 }}>➕ Create New Coupon</h2>
        <form onSubmit={createCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.65rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Code (e.g. TFG100)</label>
            <input required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="TFGSUMMER" style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#f59e0b', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.9rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Discount Type</label>
            <select value={form.discount_type} onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as 'flat' | 'percent' }))} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.85rem' }}>
              <option value="flat">₹ Flat Amount</option>
              <option value="percent">% Percentage</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>
              {form.discount_type === 'flat' ? 'Discount ₹' : 'Discount %'}
            </label>
            <input required type="number" value={form.discount_value} onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))} placeholder={form.discount_type === 'flat' ? '50' : '10'} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.9rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block', marginBottom: '3px' }}>Min. Order ₹</label>
            <input type="number" value={form.min_order} onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', background: '#121214', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" disabled={creating} style={{ width: '100%', padding: '0.55rem', background: creating ? '#78350f' : '#f59e0b', color: '#18181b', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem' }}>
              {creating ? '⏳...' : '✅ Create'}
            </button>
          </div>
        </form>
      </div>

      {/* Coupon List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Active Coupons ({coupons.length})</h2>
        <button onClick={loadCoupons} disabled={loading} style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      {coupons.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#52525b', background: '#1c1917', borderRadius: '12px' }}>
          No coupons yet. Create one above!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {coupons.map((c) => (
          <div key={c.code} style={{ background: '#1c1917', border: c.valid ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', opacity: c.valid ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🏷️</span>
              <div>
                <strong style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '0.05em' }}>{c.code}</strong>
                <span style={{ color: '#a1a1aa', fontSize: '0.75rem', display: 'block' }}>
                  {c.discount_type === 'flat' ? `₹${c.discount_value} off` : `${c.discount_value}% off`}
                  {c.min_order > 0 ? ` · Min order ₹${c.min_order}` : ''}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => toggleCoupon(c.code, c.valid)} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: c.valid ? '#15803d' : '#78350f', color: c.valid ? '#bbf7d0' : '#fef3c7', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                {c.valid ? '✅ Active' : '⏸️ Paused'}
              </button>
              <button onClick={() => deleteCoupon(c.code)} style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #991b1b', background: '#450a0a', color: '#fca5a5', fontSize: '0.75rem', cursor: 'pointer' }}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
