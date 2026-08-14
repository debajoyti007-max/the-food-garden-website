import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { STORE_NAME, STORE_TAGLINE, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../lib/business'
import Toast from './Toast'
import PartyBookingModal from './PartyBookingModal'
import DynamicIsland from './DynamicIsland'

export default function Layout() {
  const { user } = useAuth()
  const { cartCount, lang, setLang } = useStore()
  const [partyModal, setPartyModal] = useState(false)

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: '#121214', color: '#fafaf9', position: 'relative' }}>
      <Toast />

      {/* 🏝️ Dynamic Island Pill */}
      <DynamicIsland />

      {/* Top Notification Strip */}
      <div
        className="top-banner"
        style={{
          background: '#18181b',
          borderBottom: '1px solid #27272a',
          padding: '0.45rem 1.25rem',
          fontSize: '0.8rem',
          color: '#a1a1aa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '42px', // Room for Dynamic Island
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#f59e0b' }}>📍</span>
          <span>Bhabanipur, Nandakumar–Digha Highway</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setPartyModal(true)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#18181b',
              border: 'none',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            🎉 Party / Table Booking
          </button>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#27272a', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                background: lang === 'en' ? '#f59e0b' : 'transparent',
                color: lang === 'en' ? '#18181b' : '#a1a1aa',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              style={{
                background: lang === 'bn' ? '#f59e0b' : 'transparent',
                color: lang === 'bn' ? '#18181b' : '#a1a1aa',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            >
              বাং
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className="site-header"
        style={{
          background: 'rgba(24, 24, 27, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0.75rem 1.25rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
              }}
            >
              🍽️
            </div>
            <div>
              <strong style={{ fontSize: '1.2rem', color: '#fafaf9', display: 'block', letterSpacing: '-0.02em', fontWeight: 800 }}>
                {STORE_NAME}
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.02em' }}>
                {STORE_TAGLINE}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? '#f59e0b' : '#d6d3d1',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'color 0.2s',
              })}
            >
              {lang === 'bn' ? 'মেনু' : 'Menu'}
            </NavLink>
            <NavLink
              to="/track"
              style={({ isActive }) => ({
                color: isActive ? '#f59e0b' : '#d6d3d1',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'color 0.2s',
              })}
            >
              {lang === 'bn' ? 'অর্ডার ট্র্যাক' : 'Live Track'}
            </NavLink>
            <NavLink
              to="/orders"
              style={({ isActive }) => ({
                color: isActive ? '#f59e0b' : '#d6d3d1',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'color 0.2s',
              })}
            >
              {lang === 'bn' ? 'অর্ডার হিস্টোরি' : 'History'}
            </NavLink>
            <NavLink
              to="/cart"
              style={({ isActive }) => ({
                color: isActive ? '#f59e0b' : '#d6d3d1',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                position: 'relative',
              })}
            >
              🛒 {lang === 'bn' ? 'কার্ট' : 'Cart'}
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-14px',
                    background: '#f59e0b',
                    color: '#18181b',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </NavLink>

            {user ? (
              <NavLink
                to="/profile"
                style={({ isActive }) => ({
                  color: isActive ? '#f59e0b' : '#d6d3d1',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                })}
              >
                👤 {user.name.split(' ')[0]}
              </NavLink>
            ) : (
              <NavLink
                to="/auth"
                style={{
                  background: '#27272a',
                  border: '1px solid #3f3f46',
                  color: '#fafaf9',
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                }}
              >
                {lang === 'bn' ? 'লগইন' : 'Sign In'}
              </NavLink>
            )}

            {/* Staff Quick Access based on role */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                style={{
                  background: '#3b0764',
                  border: '1px solid #7c3aed',
                  color: '#e9d5ff',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                🛡️ Admin Panel
              </NavLink>
            )}
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <NavLink
                to="/seller"
                style={{
                  background: '#78350f',
                  border: '1px solid #d97706',
                  color: '#fef3c7',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                👨‍🍳 Kitchen KOT
              </NavLink>
            )}
            {user?.role === 'rider' && (
              <NavLink
                to="/rider"
                style={{
                  background: '#14532d',
                  border: '1px solid #16a34a',
                  color: '#bbf7d0',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                }}
              >
                🛵 Rider View
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main style={{ minHeight: '80vh', padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* 💬 Floating WhatsApp Concierge Button */}
      <a
        href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('নমস্কার The Food Garden (TFG), আমি অর্ডার / টেবিল সম্পর্কে জানতে চাই!')}`}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 990,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#22c55e',
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          fontSize: '1.75rem',
          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
          textDecoration: 'none',
          transition: 'transform 0.2s ease',
        }}
      >
        💬
      </a>

      {/* Footer */}
      <footer
        style={{
          background: '#18181b',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem 1.25rem 5.5rem',
          color: '#a1a1aa',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ color: '#fafaf9', margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800 }}>🍽️ {STORE_NAME}</h3>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              Indulge in charcoal tandoori kebabs, authentic Kolkata Dum Biryani, and cafe mocktails in cozy wooden garden cottages.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fafaf9', margin: '0 0 0.5rem', fontWeight: 700 }}>📞 Contact & Booking</h4>
            <p style={{ margin: '0 0 0.3rem' }}>Phone: <a href={`tel:${SUPPORT_PHONE}`} style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700 }}>{SUPPORT_PHONE}</a></p>
            <p style={{ margin: '0 0 0.3rem' }}>WhatsApp: <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>Direct WhatsApp Chat</a></p>
            <p style={{ margin: 0 }}>Hours: 11:00 AM – 12:00 AM Midnight</p>
          </div>
          <div>
            <h4 style={{ color: '#fafaf9', margin: '0 0 0.5rem', fontWeight: 700 }}>📍 Location</h4>
            <p style={{ margin: '0 0 0.5rem' }}>Bhabanipur, Nandakumar to Digha Highway (NH 116B), Purba Medinipur.</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=The+Food+Garden+Family+Restaurant+and+Cafe+Bhabanipur"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.45rem 0.9rem',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#f59e0b',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>
      </footer>

      {/* 📱 Mobile Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-bar"
        style={{
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: 'rgba(18, 18, 20, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 999,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <NavLink to="/" end style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a1a1aa', fontSize: '0.72rem', fontWeight: 700, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>🍽️</span>
          <span>Menu</span>
        </NavLink>
        <NavLink to="/track" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a1a1aa', fontSize: '0.72rem', fontWeight: 700, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>📍</span>
          <span>Track</span>
        </NavLink>
        <NavLink to="/cart" style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a1a1aa', fontSize: '0.72rem', fontWeight: 700, gap: '2px', position: 'relative' })}>
          <span style={{ fontSize: '1.25rem' }}>🛒</span>
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                background: '#f59e0b',
                color: '#18181b',
                fontSize: '0.65rem',
                fontWeight: 900,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {cartCount}
            </span>
          )}
          <span>Cart</span>
        </NavLink>
        <NavLink to={user ? '/profile' : '/auth'} style={({ isActive }) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: isActive ? '#f59e0b' : '#a1a1aa', fontSize: '0.72rem', fontWeight: 700, gap: '2px' })}>
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </NavLink>
      </nav>

      {/* Party / Event Booking Modal */}
      {partyModal && <PartyBookingModal onClose={() => setPartyModal(false)} />}
    </div>
  )
}
