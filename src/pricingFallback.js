// Author: Sai Kolanupaka
/**
 * Offline/loading fallback pricing constants.
 *
 * Used ONLY when the live catalog (GET /api/services/catalog) has not yet
 * loaded or is unreachable. The live catalog from the backend always takes
 * precedence once fetched.
 *
 * USD prices benchmarked against Rover, Wag!, Barkbus, PetSmart, VetCo,
 * and Banfield (June 2026 US market rates).
 *
 * IMPORTANT: Keep in sync with petclub-backend/services/pricingCatalog.js.
 */

export const PLATFORM_DISCOUNT     = 150; // ₹150 — matches pricingCatalog.PLATFORM_DISCOUNT
export const PLATFORM_DISCOUNT_USD = 10;  // $10  — matches pricingCatalog.PLATFORM_DISCOUNT_USD

export const GROOMING_PACKAGES = [
  { name: "Essential Bath+",   prices: { Small: 800,  Medium: 900,  Large: 1000, Cat: 1000 }, prices_usd: { Small: 72,  Medium: 88,  Large: 110, Cat: 82  }, icon: "🛁", desc: "Premium shampoo · Blow dry · FREE ear cleaning & nail trim · 45–60 min" },
  { name: "Premium Bath+",     prices: { Small: 2000, Medium: 2200, Large: 2500, Cat: 2000 }, prices_usd: { Small: 95,  Medium: 115, Large: 145, Cat: 110 }, icon: "✨", desc: "Plus Puppy shampoo · Premium blow dry · FREE ear cleaning & nail trim" },
  { name: "Complete Makeover", prices: { Small: 1700, Medium: 1750, Large: 1800, Cat: 1500 }, prices_usd: { Small: 95,  Medium: 118, Large: 155, Cat: 108 }, icon: "💆", desc: "Full groom · Premium shampoo · Nail trim + grind · Deshedding · 1.5–2 hrs" },
  { name: "Luxury Makeover",   prices: { Small: 3000, Medium: 3100, Large: 3200, Cat: 3000 }, prices_usd: { Small: 135, Medium: 165, Large: 210, Cat: 145 }, icon: "👑", desc: "Premium spa · Plus Puppy shampoo · Coat-specific care · Salon-quality finish" },
  { name: "Trim & Style",      prices: { Small: 1300, Medium: 1400, Large: 1500, Cat: 1300 }, prices_usd: { Small: 72,  Medium: 92,  Large: 118, Cat: 82  }, icon: "✂️", desc: "Haircut any size · Dog or cat" },
  { name: "Care Combo",        prices: { Small: 500,  Medium: 500,  Large: 500,  Cat: 500  }, prices_usd: { Small: 45,  Medium: 45,  Large: 45,  Cat: 45  }, icon: "💅", desc: "Nails + ear cleaning + face trim" },
  { name: "Puppy Dry Spa",     prices: { Small: 600,  Medium: 600,  Large: 600,  Cat: 600  }, prices_usd: { Small: 48,  Medium: 48,  Large: 48,  Cat: 48  }, icon: "🐾", desc: "Gentle dry bath for tiny puppies" },
  { name: "Puppy Wet Bath",    prices: { Small: 800,  Medium: 800,  Large: 900,  Cat: 800  }, prices_usd: { Small: 65,  Medium: 65,  Large: 75,  Cat: 65  }, icon: "🐶", desc: "Gentle wet bath for puppies" },
];

export const PET_SIZES = [
  { id: "Small",  label: "Small",  sub: "Up to 10 kg" },
  { id: "Medium", label: "Medium", sub: "10 – 20 kg"  },
  { id: "Large",  label: "Large",  sub: "20 kg+"      },
  { id: "Cat",    label: "Cat",    sub: "All breeds"  },
];

export const GROOMING_ADDONS = [
  { id: "dematting",  label: "De-matting",            price: 550, price_usd: 40, desc: "Long-haired breeds — Shih Tzu, Golden" },
  { id: "tick_flea",  label: "Tick & Flea Treatment", price: 750, price_usd: 40, desc: "Medicated treatment" },
  { id: "anal_gland", label: "Anal Gland Expression", price: 300, price_usd: 30, desc: "Hygienic value-add" },
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
  { name: "30-min Walk",             price: 250,  price_usd: 28,  icon: "🦮", desc: "GPS-tracked 30-minute walk, solo" },
  { name: "60-min Walk",             price: 400,  price_usd: 48,  icon: "🐕", desc: "GPS-tracked 60-minute walk, solo" },
  { name: "5-Walk Weekly Pack",      price: 1600, price_usd: 125, icon: "📅", desc: "5 x 30-min walks, Mon–Fri" },
  { name: "Monthly Pack (22 Walks)", price: 5500, price_usd: 460, icon: "🏆", desc: "22 daily walks — best value per walk" },
];

export const BOARDING_PACKAGES = [
  { name: "Overnight Stay",         price: 800,  price_usd: 68,  icon: "🌙", desc: "1 night · cage-free home · updates sent" },
  { name: "Weekend Stay",           price: 1400, price_usd: 130, icon: "📅", desc: "Fri eve to Sun eve · 2 nights" },
  { name: "5-Night Stay",           price: 3200, price_usd: 310, icon: "🏠", desc: "5 nights · daily photo updates" },
  { name: "Weekly Stay (7 Nights)", price: 4200, price_usd: 420, icon: "⭐", desc: "7 nights · best rate · holiday special" },
];

// Clinic rate + $40–60 in-home house-call premium (VetCo/Banfield baseline, June 2026)
export const VET_PACKAGES = [
  { name: "General Check-up", price: 1000, price_usd: 120, icon: "🩺", desc: "Full physical examination at your home" },
  { name: "Vaccination",       price: 1200, price_usd: 110, icon: "💉", desc: "Vaccine administered at home (includes house call)" },
  { name: "Deworming",         price: 700,  price_usd: 95,  icon: "💊", desc: "Oral/injectable deworming treatment at your home" },
  { name: "Dental Care",       price: 3500, price_usd: 280, icon: "🦷", desc: "Basic dental assessment and cleaning" },
];

// Surgery and Emergency Care are not in VET_PACKAGES — quoted on-site after assessment
export const VET_QUOTED_ON_SITE = new Set(["Surgery", "Emergency Care"]);
