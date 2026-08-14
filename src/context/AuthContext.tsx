import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from 'react'
import type { User, UserRole } from '../types'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'

// ── Super Admin Protection ─────────────────────────────────────────────────
const SUPER_ADMIN_PHONES = ['8170859653']

function ensureAdminRole(user: User | null): User | null {
  if (!user) return null
  if (SUPER_ADMIN_PHONES.includes(user.phone)) return { ...user, role: 'admin' }
  return user
}

// ── PIN local cache (survives page refresh without re-fetching Supabase) ───
const PIN_CACHE_KEY = 'tfg_pin_cache'
function storePin(phone: string, pin: string) {
  try {
    const cache = JSON.parse(localStorage.getItem(PIN_CACHE_KEY) || '{}')
    cache[phone] = pin
    localStorage.setItem(PIN_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}
function getStoredPin(phone: string): string {
  try {
    const cache = JSON.parse(localStorage.getItem(PIN_CACHE_KEY) || '{}')
    return cache[phone] || ''
  } catch { return '' }
}

// ── Types ──────────────────────────────────────────────────────────────────
type AuthResult = { ok: boolean; error?: string; user?: User }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (phone: string, pin: string) => Promise<AuthResult>
  register: (phone: string, pin: string, name: string) => Promise<AuthResult>
  logout: () => Promise<void>
  resetPin: (phone: string, newPin: string) => Promise<AuthResult>
  updateOwnPin: (newPin: string) => Promise<AuthResult>
  updateOwnName: (name: string) => Promise<AuthResult>
  setUserRole: (userId: string, role: UserRole) => Promise<boolean>
  resetUserPin: (userId: string, newPin: string) => Promise<boolean>
  blockUser: (userId: string, blocked: boolean) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('tfg_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const userRef = useRef<User | null>(user)

  // ── Persist session ────────────────────────────────────────────────────
  useEffect(() => {
    if (user) localStorage.setItem('tfg_user', JSON.stringify(user))
    else localStorage.removeItem('tfg_user')
  }, [user])

  // ── Restore session from Supabase on app load ──────────────────────────
  useEffect(() => {
    const storedUser = userRef.current
    if (!storedUser?.id) { setLoading(false); return }

    const restore = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', storedUser.id).single()
        if (data) {
          const refreshed = ensureAdminRole({
            id: data.id, phone: data.phone, name: data.name,
            role: data.role as UserRole, createdAt: data.created_at,
          })
          setUser(refreshed)
          userRef.current = refreshed
        } else {
          setUser(null); userRef.current = null
        }
      } catch {
        // Keep existing in-memory user on network error
      } finally {
        setLoading(false)
      }
    }
    void restore()
  }, [])

  // ── Real-time: instant role/block updates when admin changes profile ───
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as any
          if (row.is_blocked) {
            setUser(null); userRef.current = null
            showToast('Your account has been suspended. Contact TFG support.', '🚫')
            return
          }
          const updated = ensureAdminRole({
            id: row.id, phone: row.phone, name: row.name,
            role: row.role as UserRole, createdAt: row.created_at,
          })
          setUser(updated); userRef.current = updated
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const login = useCallback(async (phone: string, pin: string): Promise<AuthResult> => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone number' }
    if (!pin || pin.length !== 4) return { ok: false, error: 'Enter your 4-digit PIN' }

    try {
      // 1. Quick local PIN check (works offline too)
      const cachedPin = getStoredPin(cleanPhone)
      // 2. Fetch profile from Supabase
      const { data, error } = await supabase.from('profiles').select('*').eq('phone', cleanPhone).single()

      if (error || !data) {
        return { ok: false, error: "No account found. Please register first." }
      }

      if (data.is_blocked) {
        return { ok: false, error: '🚫 Your account has been suspended. Contact The Food Garden.' }
      }

      const dbPin = (data.pin || '').trim()
      const localPin = cachedPin.trim()
      const pinMatch = pin === dbPin || pin === localPin

      if (!pinMatch) {
        return { ok: false, error: '❌ Incorrect PIN. Forgot it? Use "Reset PIN" below.' }
      }

      // Sync PIN cache
      storePin(cleanPhone, pin)
      // Sync DB if local cache diverged
      if (dbPin !== pin) {
        void supabase.from('profiles').update({ pin }).eq('id', data.id)
      }

      const loggedIn = ensureAdminRole({
        id: data.id, phone: data.phone, name: data.name || `User ${cleanPhone.slice(-4)}`,
        role: (data.role as UserRole) || 'customer', createdAt: data.created_at,
      })

      setUser(loggedIn); userRef.current = loggedIn
      showToast(`Welcome back, ${loggedIn!.name}!`, '👋')
      return { ok: true, user: loggedIn! }
    } catch {
      return { ok: false, error: 'Connection error. Check internet and try again.' }
    }
  }, [])

  // ── REGISTER ───────────────────────────────────────────────────────────
  const register = useCallback(async (phone: string, pin: string, name: string): Promise<AuthResult> => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone number' }
    if (!pin || pin.length !== 4 || /\D/.test(pin)) return { ok: false, error: 'PIN must be exactly 4 digits (0–9)' }
    if (!name.trim()) return { ok: false, error: 'Please enter your full name' }

    try {
      const { data: existing } = await supabase.from('profiles').select('id').eq('phone', cleanPhone).single()
      if (existing) return { ok: false, error: 'This number is already registered. Please sign in.' }

      const role = SUPER_ADMIN_PHONES.includes(cleanPhone) ? 'admin' : 'customer'
      const newId = crypto.randomUUID()

      const { error } = await supabase.from('profiles').insert({
        id: newId, phone: cleanPhone, name: name.trim(), pin, role,
      })
      if (error) return { ok: false, error: error.message || 'Registration failed. Try again.' }

      storePin(cleanPhone, pin)

      const newUser: User = { id: newId, phone: cleanPhone, name: name.trim(), role: role as UserRole, createdAt: new Date().toISOString() }
      setUser(newUser); userRef.current = newUser
      showToast(`Welcome to The Food Garden, ${newUser.name}!`, '🎉')
      return { ok: true, user: newUser }
    } catch {
      return { ok: false, error: 'Connection error. Check internet and try again.' }
    }
  }, [])

  // ── LOGOUT ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null); userRef.current = null
    localStorage.removeItem('tfg_user')
    showToast('Signed out successfully', '👋')
  }, [])

  // ── SELF PIN RESET (no login needed — identity verified by phone match) ─
  const resetPin = useCallback(async (phone: string, newPin: string): Promise<AuthResult> => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone number' }
    if (!newPin || newPin.length !== 4 || /\D/.test(newPin)) return { ok: false, error: 'New PIN must be exactly 4 digits' }

    try {
      const { data, error } = await supabase.from('profiles').select('id,name').eq('phone', cleanPhone).single()
      if (error || !data) return { ok: false, error: 'No account found with this phone number.' }

      await supabase.from('profiles').update({ pin: newPin }).eq('id', data.id)
      storePin(cleanPhone, newPin)
      showToast(`PIN reset! Sign in now with your new PIN.`, '🔑')
      return { ok: true }
    } catch {
      return { ok: false, error: 'Connection error. Try again.' }
    }
  }, [])

  // ── UPDATE OWN PIN (when logged in) ────────────────────────────────────
  const updateOwnPin = useCallback(async (newPin: string): Promise<AuthResult> => {
    if (!user) return { ok: false, error: 'Not logged in.' }
    if (!newPin || newPin.length !== 4 || /\D/.test(newPin)) return { ok: false, error: 'PIN must be exactly 4 digits' }
    try {
      await supabase.from('profiles').update({ pin: newPin }).eq('id', user.id)
      storePin(user.phone, newPin)
      showToast('PIN updated successfully!', '🔑')
      return { ok: true }
    } catch {
      return { ok: false, error: 'Failed to update PIN. Try again.' }
    }
  }, [user])

  // ── UPDATE OWN NAME ────────────────────────────────────────────────────
  const updateOwnName = useCallback(async (name: string): Promise<AuthResult> => {
    if (!user) return { ok: false, error: 'Not logged in.' }
    if (!name.trim()) return { ok: false, error: 'Name cannot be empty.' }
    try {
      await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
      const updated = { ...user, name: name.trim() }
      setUser(updated); userRef.current = updated
      showToast('Name updated!', '✅')
      return { ok: true }
    } catch {
      return { ok: false, error: 'Failed to update name.' }
    }
  }, [user])

  // ── ADMIN: SET ANY USER'S ROLE ─────────────────────────────────────────
  const setUserRole = useCallback(async (userId: string, role: UserRole): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) showToast('Role updated!', '✅')
    return !error
  }, [])

  // ── ADMIN: RESET ANY USER'S PIN ────────────────────────────────────────
  const resetUserPin = useCallback(async (userId: string, newPin: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ pin: newPin }).eq('id', userId)
    if (!error) showToast('PIN reset successfully!', '🔑')
    return !error
  }, [])

  // ── ADMIN: BLOCK / UNBLOCK USER ────────────────────────────────────────
  const blockUser = useCallback(async (userId: string, blocked: boolean): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', userId)
    if (!error) showToast(blocked ? 'User blocked' : 'User unblocked', blocked ? '🚫' : '✅')
    return !error
  }, [])

  const value = useMemo(() => ({
    user, loading, login, register, logout, resetPin, updateOwnPin, updateOwnName,
    setUserRole, resetUserPin, blockUser,
  }), [user, loading, login, register, logout, resetPin, updateOwnPin, updateOwnName, setUserRole, resetUserPin, blockUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
