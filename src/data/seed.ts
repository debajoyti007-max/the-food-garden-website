import type { MenuItem } from '../types'

export const SEED_MENU: MenuItem[] = [
  // 🍗 BIRYANI & RICE
  {
    id: 'tfg-1',
    name: 'Special Chicken Dum Biryani',
    bnName: 'স্পেশাল চিকেন দম বিরিয়ানি',
    emoji: '🍗',
    category: 'Biryani & Rice',
    unit: 'plate',
    pA: 380, // Family Pack (2 Chicken + 2 Eggs + 2 Alu)
    pB: 220, // Full Plate (1 Big Chicken + Egg + Alu)
    pC: 140, // Half Plate
    inStock: true,
    imageUrl: '/tfg-biryani.jpg',
    description: 'Aromatic long-grain basmati rice cooked on dum with succulent chicken, egg, and spiced potato.',
  },
  {
    id: 'tfg-2',
    name: 'Mutton Kacchi Dum Biryani',
    bnName: 'মাটন কাচ্চি বিরিয়ানি',
    emoji: '🍖',
    category: 'Biryani & Rice',
    unit: 'plate',
    pA: 560,
    pB: 340,
    pC: 220,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop',
    description: 'Tender marinated mutton cooked with fragranced rice, potatoes, and boiled eggs.',
  },
  {
    id: 'tfg-3',
    name: 'Chicken Fried Rice & Chilli Chicken Combo',
    bnName: 'ফ্রাইড রাইস ও চিলি চিকেন কম্বো',
    emoji: '🍚',
    category: 'Biryani & Rice',
    unit: 'box',
    pA: 420,
    pB: 260,
    pC: 180,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
    description: 'Wok-tossed egg chicken fried rice served with hot garlic chilli chicken.',
  },

  // 🍢 TANDOORI & KEBABS
  {
    id: 'tfg-4',
    name: 'Tandoori Chicken (Charcoal Grilled)',
    bnName: 'তন্দুরি চিকেন (চারকোল গ্রিল্ড)',
    emoji: '🍗',
    category: 'Tandoori & Starters',
    unit: 'portion',
    pA: 440, // Full (4 pcs)
    pB: 240, // Half (2 pcs)
    pC: 130, // Quarter (1 pc)
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop',
    description: 'Chicken roasted in a clay oven marinated in yogurt and traditional spices.',
  },
  {
    id: 'tfg-5',
    name: 'Chicken Reshmi Malai Kebab',
    bnName: 'চিকেন রেশমি কাবাব',
    emoji: '🍢',
    category: 'Tandoori & Starters',
    unit: 'portion',
    pA: 380, // 8 pcs
    pB: 220, // 4 pcs
    pC: 120,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
    description: 'Melt-in-mouth chicken chunks marinated in cream, cashew paste, and mild herbs.',
  },
  {
    id: 'tfg-6',
    name: 'Crispy Chilli Baby Corn',
    bnName: 'চিলি বেবিকর্ন',
    emoji: '🌽',
    category: 'Tandoori & Starters',
    unit: 'portion',
    pA: 280,
    pB: 180,
    pC: 110,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
    description: 'Crispy fried golden baby corns tossed in spicy Indo-Chinese chilli sauce.',
  },

  // 🍝 CAFE & CONTINENTAL
  {
    id: 'tfg-7',
    name: 'Creamy White Sauce Chicken Pasta',
    bnName: 'হোয়াইট সস চিকেন পাস্তা',
    emoji: '🍝',
    category: 'Cafe & Continental',
    unit: 'bowl',
    pA: 320,
    pB: 220,
    pC: 160,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281696?w=600&auto=format&fit=crop',
    description: 'Rich cheesy Alfredo pasta with roasted garlic, herbs, and chicken chunks.',
  },
  {
    id: 'tfg-8',
    name: 'Crispy Double Chicken Cheese Burger',
    bnName: 'ক্রিস্পি ডাবল চিকেন বার্গার',
    emoji: '🍔',
    category: 'Cafe & Continental',
    unit: 'meal',
    pA: 260, // With Fries + Coke
    pB: 170, // With Fries
    pC: 110, // Burger only
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
    description: 'Golden fried crispy chicken patty topped with melted cheese and spicy mayo.',
  },

  // 🍛 MAIN COURSE & BREADS
  {
    id: 'tfg-9',
    name: 'Butter Chicken Masala',
    bnName: 'বাটার চিকেন মসলা',
    emoji: '🍛',
    category: 'Main Course',
    unit: 'handi',
    pA: 420, // Full Handi
    pB: 260, // Half Handi
    pC: 150,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop',
    description: 'Smoked tandoori chicken cooked in rich velvety butter and tomato gravy.',
  },
  {
    id: 'tfg-10',
    name: 'Butter Garlic Naan',
    bnName: 'বাটার গার্লিক নান',
    emoji: '🫓',
    category: 'Main Course',
    unit: 'pc',
    pA: 90,
    pB: 60,
    pC: 45,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop',
    description: 'Fresh clay-oven flatbread brushed with melted butter and fresh roasted garlic.',
  },

  // ☕ MOCKTAILS & CAFE DRINKS
  {
    id: 'tfg-11',
    name: 'Blue Lagoon Refresher Mocktail',
    bnName: 'ব্লু লেগুন মকটেল',
    emoji: '🍹',
    category: 'Cafe & Drinks',
    unit: 'glass',
    pA: 180,
    pB: 120,
    pC: 80,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop',
    description: 'Chilled citrus and blue curacao mocktail garnished with fresh mint and lemon.',
  },
  {
    id: 'tfg-12',
    name: 'Garden Special Matka Tandoori Chai',
    bnName: 'তন্দুরি মাটির ভাঁড়ের চা',
    emoji: '☕',
    category: 'Cafe & Drinks',
    unit: 'cup',
    pA: 80,
    pB: 50,
    pC: 30,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop',
    description: 'Smoky spiced milk tea served hot in a traditional roasted clay kulhad.',
  },
]
