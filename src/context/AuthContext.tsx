import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserRole } from '../types'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'

// ✅ Super Admin Protection — Owner's phone is ALWAYS admin, cannot be demoted
const SUPER_ADMIN_PHONES = ['7001045147']

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (phone: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  register: (phone: string, pin: string, name: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  setUserRole: (userId: string, role: UserRole) => Promise<boolean>
  resetUserPin: (userId: string, newPin: string) => Promise<boolean>
  blockUser: (userId: string, blocked: boolean) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

function ensureAdminRole(phone: string, role: UserRole): UserRole {
  return SUPER_ADMIN_PHONES.includes(phone) ? 'admin' : role
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tfg_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('tfg_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('tfg_user')
    }
  }, [user])

  // Real-time role/block updates from Supabase
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any
          if (updated.is_blocked) {
            setUser(null)
            showToast('Your account has been suspended. Contact support.', '🚫')
            return
          }
          const newRole = ensureAdminRole(updated.phone, updated.role as UserRole)
          setUser((prev) => prev ? { ...prev, name: updated.name, role: newRole } : prev)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const login = async (phone: string, pin: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone number' }
    if (pin.length < 4) return { ok: false, error: 'PIN must be 4 digits' }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .single()

      if (error || !data) {
        setLoading(false)
        return { ok: false, error: 'Account not found. Please register first.' }
      }

      if (data.is_blocked) {
        setLoading(false)
        return { ok: false, error: 'Your account is suspended. Contact The Food Garden.' }
      }

      if (data.pin !== pin) {
        setLoading(false)
        return { ok: false, error: 'Incorrect PIN. Please try again.' }
      }

      const role = ensureAdminRole(cleanPhone, (data.role as UserRole) || 'customer')
      const loggedInUser: User = {
        id: data.id,
        phone: data.phone,
        name: data.name || `User ${cleanPhone.slice(-4)}`,
        role,
        createdAt: data.created_at,
      }

      setUser(loggedInUser)
      showToast(`Welcome back, ${loggedInUser.name}!`, '👋')
      setLoading(false)
      return { ok: true }
    } catch {
      setLoading(false)
      return { ok: false, error: 'Connection error. Check internet and try again.' }
    }
  }

  const register = async (phone: string, pin: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone number' }
    if (pin.length < 4) return { ok: false, error: 'PIN must be 4 digits' }
    if (!name.trim()) return { ok: false, error: 'Please enter your name' }

    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .single()

      if (existing) {
        setLoading(false)
        return { ok: false, error: 'Account already exists with this number. Sign in instead.' }
      }

      // Auto-assign admin role for owner's phone
      const role = ensureAdminRole(cleanPhone, 'customer')

      const { data, error } = await supabase
        .from('profiles')
        .insert({ phone: cleanPhone, pin, name: name.trim(), role })
        .select()
        .single()

      if (error || !data) {
        setLoading(false)
        return { ok: false, error: 'Registration failed. Try again.' }
      }

      const newUser: User = {
        id: data.id,
        phone: data.phone,
        name: data.name,
        role: data.role as UserRole,
        createdAt: data.created_at,
      }

      setUser(newUser)
      showToast(`Welcome to The Food Garden, ${newUser.name}!`, '🎉')
      setLoading(false)
      return { ok: true }
    } catch {
      setLoading(false)
      return { ok: false, error: 'Connection error. Check internet and try again.' }
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('tfg_user')
    showToast('Signed out successfully', '👋')
  }

  // Admin-only: change any user's role
  const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) showToast('Role updated successfully!', '✅')
    return !error
  }

  // Admin/Seller: reset any user's PIN
  const resetUserPin = async (userId: string, newPin: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ pin: newPin }).eq('id', userId)
    if (!error) showToast('PIN reset successfully!', '🔑')
    return !error
  }

  // Admin: block or unblock a user
  const blockUser = async (userId: string, blocked: boolean): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', userId)
    if (!error) showToast(blocked ? 'User account blocked' : 'User account restored', blocked ? '🚫' : '✅')
    return !error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUserRole, resetUserPin, blockUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
