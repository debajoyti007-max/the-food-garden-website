import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserRole } from '../types'
import { showToast } from '../components/Toast'

interface AuthContextType {
  user: User | null
  login: (phone: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  register: (phone: string, pin: string, name: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tfg_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('tfg_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('tfg_user')
    }
  }, [user])

  const login = async (phone: string, pin: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return { ok: false, error: 'Enter valid 10-digit phone' }

    // Special quick role access for demo/testing or real accounts
    let role: UserRole = 'customer'
    let name = `Guest ${cleanPhone.slice(-4)}`

    if (cleanPhone.endsWith('9999') || pin === '9999') {
      role = 'seller'
      name = 'TFG Kitchen Manager'
    } else if (cleanPhone.endsWith('8888') || pin === '8888') {
      role = 'rider'
      name = 'TFG Delivery Rider'
    } else if (cleanPhone.endsWith('7777') || pin === '7777') {
      role = 'admin'
      name = 'TFG Admin'
    }

    const newUser: User = {
      id: `usr_${cleanPhone}`,
      phone: cleanPhone,
      name,
      role,
      createdAt: new Date().toISOString(),
    }

    setUser(newUser)
    showToast(`Welcome ${newUser.name}!`, '👋')
    return { ok: true }
  }

  const register = async (phone: string, pin: string, name: string) => {
    return login(phone, pin)
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('tfg_user')
    showToast('Logged out', '👋')
  }

  const switchRole = (role: UserRole) => {
    if (!user) return
    setUser({ ...user, role })
    showToast(`Switched mode to: ${role.toUpperCase()}`, '🔄')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
