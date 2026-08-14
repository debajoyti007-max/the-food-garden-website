import type { Lang } from '../types'

export const translations = {
  en: {
    shop: 'Menu',
    cart: 'Cart',
    orders: 'Orders',
    track: 'Track',
    profile: 'Profile',
    seller: 'Kitchen',
    admin: 'Admin',
    search: 'Search food, biryani, starters, pasta...',
    all: 'All',
    addToCart: 'Add to Order',
    outOfStock: 'Unavailable',
    subtotal: 'Item Subtotal',
    delivery: 'Delivery Fee',
    total: 'Total Amount',
    advance: 'Advance Payable (50%)',
    placeOrder: 'Confirm & Place Order',
    dineIn: 'Dine-In (Table / Cottage)',
    takeaway: 'Highway Car Takeaway',
    homeDelivery: 'Home Delivery',
  },
  bn: {
    shop: 'মেনু',
    cart: 'কার্ট',
    orders: 'অর্ডার',
    track: 'ট্র্যাক',
    profile: 'প্রোফাইল',
    seller: 'কিচেন',
    admin: 'অ্যাডমিন',
    search: 'খাবার, বিরিয়ানি, কাবাব, পাস্তা খুঁজুন...',
    all: 'সব',
    addToCart: 'অর্ডারে যোগ করুন',
    outOfStock: 'বর্তমানে নেই',
    subtotal: 'খাবারের মোট মূল্য',
    delivery: 'ডেলিভারি চার্জ',
    total: 'সর্বমোট মূল্য',
    advance: 'অগ্রিম প্রদেয় (৫০%)',
    placeOrder: 'অর্ডার কনফার্ম করুন',
    dineIn: 'টেবিল / কটেজ ডাইনিং',
    takeaway: 'হাইওয়ে কার টেকঅ্যাওয়ে',
    homeDelivery: 'হোম ডেলিভারি',
  },
}

export function t(lang: Lang, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] || translations['en'][key] || key
}
