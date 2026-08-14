import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  text: string
  icon?: string
  type?: 'success' | 'error' | 'info'
}

let toastListener: ((toast: ToastMessage) => void) | null = null

export function showToast(text: string, icon = '🍽️', type: 'success' | 'error' | 'info' = 'success') {
  if (toastListener) {
    toastListener({ id: Math.random().toString(), text, icon, type })
  }
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListener = (t) => {
      setToasts((prev) => [...prev.slice(-3), t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    return () => {
      toastListener = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={{
            background: t.type === 'error' ? '#991b1b' : '#18181b',
            color: '#ffffff',
            border: '1.5px solid #f59e0b',
            borderRadius: '12px',
            padding: '0.75rem 1.1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <span>{t.icon}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
