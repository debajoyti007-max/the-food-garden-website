export const STORE_NAME = 'The Food Garden'
export const STORE_NAME_BN = 'দ্যা ফুড গার্ডেন'
export const STORE_TAGLINE = 'Family Restaurant & Garden Cafe'
export const STORE_TAGLINE_BN = 'ফ্যামিলি রেস্টুরেন্ট ও ক্যাফে'

export const SUPPORT_PHONE = '+917001045147'
export const SUPPORT_WHATSAPP = '917001045147'
export const STORE_ADDRESS = 'Bhabanipur, Nandakumar - Digha Highway Road, Purba Medinipur, WB'
export const STORE_HOURS = '11:00 AM – 12:00 AM Midnight'

// 0% Gateway Fee direct UPI
export const UPI_ID = '7001045147@upi'
export const UPI_BANK = 'State Bank of India'
export const UPI_QR_SRC = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D7001045147%40upi%26pn%3DThe%2520Food%2520Garden%26cu%3DINR'

export const MIN_ORDER_AMOUNT = 200
export const DELIVERY_WINDOW = '30–45 mins'
export const DELIVERY_WINDOW_BN = '৩০–৪৫ মিনিট'
export const ADVANCE_PERCENT = 0.5

export const PORTION_LABELS: Record<'A' | 'B' | 'C', { en: string; bn: string }> = {
  A: { en: 'Family / Jumbo', bn: 'ফ্যামিলি / জাম্বো' },
  B: { en: 'Full Plate', bn: 'ফুল প্লেট' },
  C: { en: 'Half Plate', bn: 'হাফ প্লেট' },
}

export function formatOrderId(id: string): string {
  if (!id) return ''
  return id.replace(/^ord[-_]?/i, '').slice(0, 8).toUpperCase()
}
