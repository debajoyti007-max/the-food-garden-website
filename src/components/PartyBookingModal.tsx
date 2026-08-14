import { useState } from 'react'
import { SUPPORT_WHATSAPP } from '../lib/business'
import { showToast } from './Toast'

export default function PartyBookingModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('10')
  const [date, setDate] = useState('')
  const [eventType, setEventType] = useState('Birthday Party')

  const handleBooking = () => {
    if (!name || !phone || !date) {
      showToast('Please fill in Name, Phone and Date', '⚠️', 'error')
      return
    }

    const text = encodeURIComponent(
      `🎉 New Party / Table Booking Inquiry for The Food Garden:\n\nName: ${name}\nPhone: ${phone}\nEvent: ${eventType}\nGuests: ${guests} Persons\nDate & Time: ${date}\n\nPlease confirm availability!`
    )
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`, '_blank')
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#18181b', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '1.5rem', width: 'min(440px, 94vw)', color: '#fafaf9' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem' }}>🎉 Table & Party Booking</h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a8a29e', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#a8a29e', margin: '0 0 1rem', lineHeight: 1.5 }}>
          Book garden cottages for Birthday Parties, Family Get-Togethers, or Private Dining in advance.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Your Name:</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sen" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Phone Number:</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Event Type:</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}>
                <option value="Birthday Party">Birthday Party</option>
                <option value="Family Dining">Family Dining</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Corporate / Group">Corporate Group</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>No. of Guests:</label>
              <input type="number" value={guests} onChange={e => setGuests(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#d6d3d1', display: 'block', marginBottom: '0.25rem' }}>Date & Preferred Time:</label>
            <input type="text" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. Tomorrow 8:00 PM" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }} />
          </div>

          <button type="button" onClick={handleBooking} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', color: '#18181b', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
            📲 Send Booking Inquiry on WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
