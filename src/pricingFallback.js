/**
 * Offline/loading fallback pricing constants.
 *
 * These are used ONLY when the live catalog (GET /api/services/catalog) has
 * not yet loaded or is unreachable. The live catalog from the backend
 * (services/pricingCatalog.js) always takes precedence once fetched.
 *
 * IMPORTANT: If you update prices in petclub-backend/services/pricingCatalog.js,
 * update the matching values here too so the fallback stays consistent.
 */

export const PLATFORM_DISCOUNT     = 150; // ₹150 — matches pricingCatalog.PLATFORM_DISCOUNT
export const PLATFORM_DISCOUNT_USD = 10;  // $10  — matches pricingCatalog.PLATFORM_DISCOUNT_USD

export const GROOMING_PACKAGES = [
  { name: "Essential Bath+",   prices: { Small: 800,  Medium: 900,  Large: 1000, Cat: 1000 }, prices_usd: { Small: 65,  Medium: 80,  Large: 100, Cat: 75  }, icon: "🛁", desc: "Premium shampoo · Blow dry · FREE ear cleaning & nail trim · 45–60 min" },
  { name: "Premium Bath+",     prices: { Small: 2000, Medium: 2200, Large: 2500, Cat: 2000 }, prices_usd: { Small: 95,  Medium: 115, Large: 145, Cat: 110 }, icon: "✨", desc: "Plus Puppy shampoo · Premium blow dry · FREE ear cleaning & nail trim" },
  { name: "Complete Makeover", prices: { Small: 1700, Medium: 1750, Large: 1800, Cat: 1500 }, prices_usd: { Small: 85,  Medium: 110, Large: 140, Cat: 100 }, icon: "💆", desc: "Full groom · Premium shampoo · Nail trim + grind · Deshedding · 1.5–2 hrs" },
  { name: "Luxury Makeover",   prices: { Small: 3000, Medium: 3100, Large: 3200, Cat: 3000 }, prices_usd: { Small: 135, Medium: 165, Large: 210, Cat: 145 }, icon: "👑", desc: "Premium spa · Plus Puppy shampoo · Coat-specific care · Salon-quality finish" },
  { name: "Trim & Style",      prices: { Small: 1300, Medium: 1400, Large: 1500, Cat: 1300 }, prices_usd: { Small: 70,  Medium: 90,  Large: 115, Cat: 80  }, icon: "✂️", desc: "Haircut any size · Dog or cat" },
  { name: "Care Combo",        prices: { Small: 500,  Medium: 500,  Large: 500,  Cat: 500  }, prices_usd: { Small: 40,  Medium: 40,  Large: 40,  Cat: 40  }, icon: "💅", desc: "Nails + ear cleaning + face trim" },
  { name: "Puppy Dry Spa",     prices: { Small: 600,  Medium: 600,  Large: 600,  Cat: 600  }, prices_usd: { Small: 45,  Medium: 45,  Large: 45,  Cat: 45  }, icon: "🐾", desc: "Gentle dry bath for tiny puppies" },
  { name: "Puppy Wet Bath",    prices: { Small: 800,  Medium: 800,  Large: 900,  Cat: 800  }, prices_usd: { Small: 55,  Medium: 55,  Large: 65,  Cat: 55  }, icon: "🐶", desc: "Gentle wet bath for puppies" },
];

export const PET_SIZES = [
  { id: "Small",  label: "Small",  sub: "Up to 10 kg" },
  { id: "Medium", label: "Medium", sub: "10 – 20 kg"  },
  { id: "Large",  label: "Large",  sub: "20 kg+"      },
  { id: "Cat",    label: "Cat",    sub: "All breeds"  },
];

export const GROOMING_ADDONS = [
  { id: "dematting",  label: "De-matting",            price: 550, price_usd: 35, desc: "Long-haired breeds — Shih Tzu, Golden" },
  { id: "tick_flea",  label: "Tick & Flea Treatment", price: 750, price_usd: 40, desc: "Medicated treatment" },
  { id: "anal_gland", label: "Anal Gland Expression", price: 300, price_usd: 25, desc: "Hygienic value-add" },
];

export const TRAINING_PACKAGES = [
  { name: "Consultation Session",          price: 650,   price_usd: 100, icon: "💬", desc: "60 min temperament & behaviour assessment" },
  { name: "Puppy Basics",                  price: 650,   price_usd: 95,  icon: "🐶", desc: "Gentle first sessions for pups under 6 months" },
  { name: "Leash Training",                price: 800,   price_usd: 110, icon: "🦮", desc: "Per session — walking & heel training" },
  { name: "Behavioural Modification",      price: 1500,  price_usd: 175, icon: "🧠", desc: "Per session — anxiety, aggression, reactivity" },
  { name: "Agility Training",              price: 1500,  price_usd: 165, icon: "⚡", desc: "Per session — obstacle & agility course" },
  { name: "Advanced Obedience",            price: 1800,  price_usd: 185, icon: "🏆", desc: "Per session — off-leash & complex commands" },
  { name: "Basic Obedience (10 Sessions)", price: 10000, price_usd: 900, icon: "🎓", desc: "Full package — sit, stay, recall & leash basics" },
];

export const WALKING_PACKAGES = [
  { name: "30-min Walk",             price: 250,  price_usd: 25,  icon: "🦮", desc: "GPS-tracked 30-minute walk, solo" },
  { name: "60-min Walk",             price: 400,  price_usd: 45,  icon: "🐕", desc: "GPS-tracked 60-minute walk, solo" },
  { name: "5-Walk Weekly Pack",      price: 1600, price_usd: 110, icon: "📅", desc: "5 x 30-min walks, Mon–Fri" },
  { name: "Monthly Pack (22 Walks)", price: 5500, price_usd: 420, icon: "🏆", desc: "22 daily walks — best value per walk" },
];

export const BOARDING_PACKAGES = [
  { name: "Overnight Stay",         price: 800,  price_usd: 65,  icon: "🌙", desc: "1 night · cage-free home · updates sent" },
  { name: "Weekend Stay",           price: 1400, price_usd: 120, icon: "📅", desc: "Fri eve to Sun eve · 2 nights" },
  { name: "5-Night Stay",           price: 3200, price_usd: 290, icon: "🏠", desc: "5 nights · daily photo updates" },
  { name: "Weekly Stay (7 Nights)", price: 4200, price_usd: 385, icon: "⭐", desc: "7 nights · best rate · holiday special" },
];
