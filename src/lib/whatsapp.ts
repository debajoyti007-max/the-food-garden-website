import type { Order } from '../types'
import { SUPPORT_WHATSAPP, formatOrderId } from './business'

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return SUPPORT_WHATSAPP
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.startsWith('0')) return `91${digits.slice(1)}`
  return digits.length > 0 ? digits : SUPPORT_WHATSAPP
}

export function customerOrderWhatsAppUrl(order: Order, lang: 'en' | 'bn') {
  const shortId = formatOrderId(order.id)
  const lines = [
    `🍽️ The Food Garden (TFG) - নতুন অর্ডার #${shortId}`,
    `নাম: ${order.userName}`,
    `ফোন: ${order.phone}`,
    order.orderType === 'dine_in'
      ? `🏛️ টেবিল: ${order.tableNo || 'Cottage'}`
      : order.orderType === 'takeaway'
        ? `🚗 হাইওয়ে কার পিকআপ`
        : `📍 ডেলিভারি ঠিকানা: ${order.address}`,
    `মোট: ₹${order.total} (অগ্রিম: ₹${order.advanceAmount})`,
    `UTR: ${order.utr}`,
    '',
    ...order.items.map(it => `• ${it.emoji} ${it.name} (${it.portion}) × ${it.qty} = ₹${it.unitPrice * it.qty}`),
  ]
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`
}

export function orderStatusWhatsAppUrl(order: Order, status: string) {
  const phone = formatWhatsAppPhone(order.phone)
  const shortId = formatOrderId(order.id)
  let statusText = ''

  if (status === 'cooking') statusText = '👨‍🍳 আপনার খাবার কিচেনে তৈরি হচ্ছে (Cooking Now)!'
  else if (status === 'ready') statusText = '🍽️ আপনার অর্ডার গরম ও রেডি (Ready to Serve / Pick up)!'
  else if (status === 'delivered') statusText = '✅ আপনার খাবার সফলভাবে পরিবেশন / ডেলিভারি করা হয়েছে! ধন্যবাদ!'
  else if (status === 'confirmed') statusText = '✅ আপনার অর্ডার ও পেমেন্ট কনফার্ম করা হয়েছে!'
  else if (status === 'cancelled') statusText = '❌ আপনার অর্ডারটি বাতিল করা হয়েছে।'

  const msg = encodeURIComponent(
    `নমস্কার ${order.userName},\nThe Food Garden (TFG) থেকে বলছি।\n\nঅর্ডার #${shortId}:\n${statusText}\n\nধন্যবাদ!`
  )
  return `https://wa.me/${phone}?text=${msg}`
}

export function paymentVerifiedWhatsAppUrl(order: Order, lang: 'en' | 'bn') {
  const phone = formatWhatsAppPhone(order.phone)
  const shortId = formatOrderId(order.id)
  const msg = encodeURIComponent(
    `✅ পেমেন্ট ভেরিফাইড!\nনমস্কার ${order.userName}, The Food Garden-এ আপনার অর্ডার #${shortId}-এর UTR (${order.utr}) সফলভাবে যাচাই করা হয়েছে। আপনার খাবার তৈরি হচ্ছে!`
  )
  return `https://wa.me/${phone}?text=${msg}`
}

// ── Admin New Order Alert (sends to TFG owner phone) ─────────────────────────
export function adminNewOrderAlertUrl(order: Order): string {
  const shortId = formatOrderId(order.id)
  const typeIcon = order.orderType === 'dine_in' ? '🏛️' : order.orderType === 'takeaway' ? '🚗' : '🏡'
  const location = order.orderType === 'dine_in'
    ? `Seating: ${order.tableNo || 'Dine-In'}`
    : order.orderType === 'takeaway'
      ? `Takeaway / Car Pickup`
      : `Delivery: ${order.address}`

  const itemLines = order.items.map(it =>
    `  • ${it.emoji} ${it.name} (${it.portion === 'A' ? 'Family' : it.portion === 'B' ? 'Full' : 'Half'}) × ${it.qty}`
  ).join('\n')

  const msg = encodeURIComponent(
    `🔔 *নতুন অর্ডার — TFG #${shortId}*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 ${order.userName} · 📱 ${order.phone}\n` +
    `${typeIcon} ${location}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `${itemLines}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💰 মোট: ₹${order.total} | অগ্রিম: ₹${order.advanceAmount}\n` +
    `🏦 UTR: ${order.utr}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `✅ চেক করুন: https://the-food-garden.vercel.app/seller/orders`
  )
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`
}
