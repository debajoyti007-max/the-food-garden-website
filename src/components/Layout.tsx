import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { STORE_NAME, STORE_TAGLINE, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../lib/business'
import Toast from './Toast'
import PartyBookingModal from './PartyBookingModal'

export default function Layout() {
  const { user, logout, switchRole } = useAuth()
  const { cartCount, lang, setLang } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [partyModal, setPartyModal] = useState(false)

  return (
    <div className="app-shell">
      <Toast />

      {/* Top Highlight Strip */}
      <div className="top-banner" style={{ background: '#1c1917', borderBottom: '1px solid #292524', padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#a8a29e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#f59e0b' }}>📍</span>
          <span>Bhabanipur, Nandakumar–Digha Highway Road (Open 11 AM – 12 AM)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button type="button" onClick={() => setPartyModal(true)} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
            🎉 Party / Table Booking
          </button>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button type="button" onClick={() => setLang('en')} style={{ background: lang === 'en' ? '#f59e0b' : 'transparent', color: lang === 'en' ? '#18181b' : '#a8a29e', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>EN</button>
            <button type="button" onClick={() => setLang('bn')} style={{ background: lang === 'bn' ? '#f59e0b' : 'transparent', color: lang === 'bn' ? '#18181b' : '#a8a29e', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>বাং</button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header" style={{ background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, zIndex: 100, padding: '0.75rem 1.25rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'grid', placeItems: 'center', fontSize: '1.4rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              🍽️
            </div>
            <div>
              <strong style={{ fontSize: '1.15rem', color: '#fafaf9', display: 'block', letterSpacing: '-0.02em' }}>{STORE_NAME}</strong>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>{STORE_TAGLINE}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <NavLink to="/" style={({ isActive }) => ({ color: isActive ? '#f59e0b' : '#d6d3d1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' })}>
              {lang === 'bn' ? 'মেনু' : 'Menu'}
            </NavLink>
            <NavLink to="/track" style={({ isActive }) => ({ color: isActive ? '#f59e0b' : '#d6d3d1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' })}>
              {lang === 'bn' ? 'অর্ডার ট্র্যাক' : 'Live Track'}
            </NavLink>
            <NavLink to="/cart" style={({ isActive }) => ({ color: isActive ? '#f59e0b' : '#d6d3d1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', position: 'relative' })}>
              🛒 {lang === 'bn' ? 'কার্ট' : 'Cart'}
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#f59e0b', color: '#18181b', fontSize: '0.7rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                  {cartCount}
                </span>
              )}
            </NavLink>

            {user ? (
              <NavLink to="/profile" style={({ isActive }) => ({ color: isActive ? '#f59e0b' : '#d6d3d1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' })}>
                👤 {user.name.split(' ')[0]}
              </NavLink>
            ) : (
              <NavLink to="/auth" style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#fafaf9', padding: '0.45rem 0.9rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                {lang === 'bn' ? 'লগইন' : 'Sign In'}
              </NavLink>
            )}

            {/* Quick Kitchen / Rider Switcher for owner */}
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <NavLink to="/seller" style={{ background: '#78350f', border: '1px solid #d97706', color: '#fef3c7', padding: '0.35rem 0.75rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
                👨‍🍳 Kitchen
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main style={{ minHeight: '80vh', padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: '#18181b', borderTop: '1px solid #27272a', padding: '2.5rem 1.25rem 5rem', color: '#a8a29e', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ color: '#fafaf9', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>🍽️ {STORE_NAME}</h3>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              Enjoy fresh charcoal tandoori kebabs, authentic Dum Biryani, and cafe mocktails in cozy wooden garden cottages.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fafaf9', margin: '0 0 0.5rem' }}>📞 Contact & Booking</h4>
            <p style={{ margin: '0 0 0.3rem' }}>Phone: <a href={`tel:${SUPPORT_PHONE}`} style={{ color: '#f59e0b', textDecoration: 'none' }}>{SUPPORT_PHONE}</a></p>
            <p style={{ margin: '0 0 0.3rem' }}>WhatsApp: <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} style={{ color: '#22c55e', textDecoration: 'none' }}>Chat on WhatsApp</a></p>
            <p style={{ margin: 0 }}>Hours: 11:00 AM – 12:00 AM Midnight</p>
          </div>
          <div>
            <h4 style={{ color: '#fafaf9', margin: '0 0 0.5rem' }}>📍 Location</h4>
            <p style={{ margin: '0 0 0.5rem' }}>Bhabanipur, Nandakumar to Digha Highway (NH 116B), Purba Medinipur.</p>
            <a href="https://www.google.com/maps/search/?api=1&query=The+Food+Garden+Family+Restaurant+and+Cafe+Bhabanipur" target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.4rem 0.8rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>
      </footer>

      {/* 📱 Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar" style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'rgba(24, 24, 27, 0.96)', backdropFilter: 'blur(16px)', borderTop: '1px solid #27272a', zIndex: 999, alignItems: 'center', justifyContent: 'space-around' }}>
        <NavLink to="/" end style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a8a29e', fontSize: '0.72rem', fontWeight: 600, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>🍽️</span>
          <span>Menu</span>
        </NavLink>
        <NavLink to="/track" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a8a29e', fontSize: '0.72rem', fontWeight: 600, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>📍</span>
          <span>Track</span>
        </NavLink>
        <NavLink to="/cart" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a8a29e', fontSize: '0.72rem', fontWeight: 600, gap: '2px', position: 'relative' })}>
          <span style={{ fontSize: '1.25rem' }}>🛒</span>
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#f59e0b', color: '#18181b', fontSize: '0.65rem', fontWeight: 800, width: '16px', height: '16px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
              {cartCount}
            </span>
          )}
          <span>Cart</span>
        </NavLink>
        <NavLink to={user ? '/profile' : '/auth'} style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a8a29e', fontSize: '0.72rem', fontWeight: 600, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </NavLink>
      </nav>

      {/* Party / Event Booking Modal */}
      {partyModal && <PartyBookingModal onClose={() => setPartyModal(false)} />}
    </div>
  )
}
