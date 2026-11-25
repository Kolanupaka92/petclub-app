// Author: Sai Kolanupaka
/* ── helpers ── */
export const today = () => new Date().toISOString().split("T")[0];
export const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
export const daysUntil = s => Math.ceil((new Date(s) - Date.now()) / 864e5);
export const isDueSoon = (s, d) => { const n = daysUntil(s); return n >= 0 && n <= d; };
export const speciesEmoji = s => s === "cat" ? "🐈" : "🐕";
export const addDays = (dateStr, n) => { const d = new Date(dateStr || today()); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// HEALTH_RECORD_TYPES — used for pet health RECORDS only (not booking flow)
export const HEALTH_RECORD_TYPES = {
  grooming: ["Essential Bath+","Premium Bath+","Complete Makeover","Luxury Makeover","Trim & Style","Care Combo","Puppy Dry Spa","Puppy Wet Bath","De-matting","Tick & Flea Treatment","Anal Gland Expression","Puppy/Kitten First Groom","Herbal Bath","Spa Treatment"],
  training: ["Consultation Session","Puppy Basics","Basic Obedience","Behavioural Modification","Advanced Obedience","Leash Training","Agility Training"],
  food:     ["Dry Food","Wet Food","Raw Diet","Treats","Supplement"],
  vet:      ["General Check-up","Vaccination","Deworming","Dental Care","Surgery","Emergency Care"],
};

export const TAB_META = {
  grooming: { icon:"✂️", label:"Grooming", color:"blue" },
  training: { icon:"🐕‍🦺", label:"Training", color:"purple" },
  food:     { icon:"🍖", label:"Food",     color:"green" },
  vet:      { icon:"🏥", label:"Vet",      color:"rose" },
};

// Vaccine schedule — auto-calculates next due date on selection
// days = default interval until next dose after administration
export const VACCINE_SCHEDULE = [
  { name: "Rabies",                      days: 365, icon: "💉", species: ["dog","cat"], note: "Annual booster" },
  { name: "DHPP (Distemper · Parvo)",    days: 365, icon: "💉", species: ["dog"],       note: "Annual booster" },
  { name: "Bordetella (Kennel Cough)",   days: 180, icon: "💉", species: ["dog"],       note: "Every 6 months" },
  { name: "Leptospirosis",               days: 365, icon: "💉", species: ["dog"],       note: "Annual booster" },
  { name: "Lyme Disease",                days: 365, icon: "💉", species: ["dog"],       note: "Annual booster" },
  { name: "Canine Influenza (H3N2)",     days: 365, icon: "💉", species: ["dog"],       note: "Annual booster" },
  { name: "FVRCP (Cat Flu · Enteritis)", days: 365, icon: "💉", species: ["cat"],       note: "Annual booster" },
  { name: "FeLV (Feline Leukaemia)",     days: 365, icon: "💉", species: ["cat"],       note: "Annual booster" },
  { name: "Deworming",                   days: 90,  icon: "🪱", species: ["dog","cat"], note: "Every 3 months" },
  { name: "Flea & Tick Treatment",       days: 30,  icon: "🦟", species: ["dog","cat"], note: "Monthly" },
  { name: "Heartworm Prevention",        days: 30,  icon: "🩺", species: ["dog","cat"], note: "Monthly" },
];

export const SERVICES = [
  { id:"grooming", icon:"✂️",  label:"Grooming",   bg:"bg-blue-50",   tc:"text-blue-600",   desc:"Doorstep grooming",    role:"Groomer"  },
  { id:"walking",  icon:"🦮",  label:"Dog Walking", bg:"bg-green-50",  tc:"text-green-600",  desc:"GPS-tracked walks",    role:"Walker"   },
  { id:"training", icon:"🐕‍🦺", label:"Training",   bg:"bg-purple-50", tc:"text-purple-600", desc:"Certified trainers",   role:"Trainer"  },
  { id:"boarding", icon:"🏠",  label:"Boarding",   bg:"bg-amber-50",  tc:"text-amber-600",  desc:"Cage-free home stays", role:"Boarding" },
  { id:"vet",      icon:"🏥",  label:"Vet Care",   bg:"bg-rose-50",   tc:"text-rose-600",   desc:"In-home vet visits",   role:"Vet"      },
  { id:"food",     icon:"🍖",  label:"Pet Food",   bg:"bg-orange-50", tc:"text-orange-600", desc:"Free delivery",        role:null       },
];
