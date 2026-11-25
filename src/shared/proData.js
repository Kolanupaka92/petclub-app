// Author: Sai Kolanupaka
/* ── Helpers ── */
export const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || "—"; } };
export const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
export const rIcon  = r => ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Walker:"🦮", Boarding:"🏠", Admin:"🛡️", customer:"🐕" })[r] || "👤";
export const rColor = r => ({ Groomer:"from-violet-500 to-purple-600", Trainer:"from-blue-500 to-indigo-600", Vet:"from-emerald-500 to-teal-600", Walker:"from-green-500 to-emerald-600", Boarding:"from-amber-500 to-orange-500", Admin:"from-gray-700 to-gray-900" })[r] || "from-orange-500 to-amber-500";
export const rAccent= r => ({ Groomer:"#7c3aed", Trainer:"#2563eb", Vet:"#059669", Walker:"#16a34a", Boarding:"#d97706" })[r] || "#f97316";
export const sColor = s => ({
  completed:"bg-emerald-50 text-emerald-700 border-emerald-200", upcoming:"bg-blue-50 text-blue-700 border-blue-200",
  ongoing:"bg-orange-50 text-orange-700 border-orange-200", pending:"bg-amber-50 text-amber-700 border-amber-200",
  approved:"bg-emerald-50 text-emerald-700 border-emerald-200", rejected:"bg-red-50 text-red-600 border-red-200",
  active:"bg-emerald-50 text-emerald-700 border-emerald-200", suspended:"bg-red-50 text-red-600 border-red-200",
  // assignment_status values
  confirmed:"bg-emerald-50 text-emerald-700 border-emerald-200",
  on_the_way:"bg-orange-50 text-orange-700 border-orange-200",
  in_progress:"bg-blue-50 text-blue-700 border-blue-200",
  searching:"bg-amber-50 text-amber-700 border-amber-200",
  offered:"bg-violet-50 text-violet-700 border-violet-200",
  no_pros_available:"bg-red-50 text-red-600 border-red-200",
})[s] || "bg-gray-50 text-gray-600 border-gray-200";

export const aStatusLabel = s => ({
  confirmed: "✅ Confirmed", on_the_way: "🚗 On My Way", in_progress: "🔧 In Progress",
  searching: "🔍 Searching", completed: "✅ Completed", cancelled: "❌ Cancelled",
  no_pros_available: "⚠️ No Pros", offered: "📤 Offered",
})[s] || s?.replace(/_/g, ' ');

// Friendly label for a user's account role — used wherever u.role is rendered
// directly (e.g. "pending_role" → "Pending Signup" instead of the raw enum).
export const roleLabel = r => ({
  pending_role: "Pending Signup",
  customer:     "Customer",
  professional: "Professional",
  admin:        "Admin",
})[r] || r?.replace(/_/g, ' ');

// Detect country from phone and return appropriate ID types
export const getIdTypes = phone => {
  if (phone?.startsWith("+91")) return [
    { value:"aadhar",   label:"Aadhar Card",       hint:"12-digit Aadhar number" },
    { value:"pan",      label:"PAN Card",           hint:"10-character PAN (e.g. ABCDE1234F)" },
    { value:"passport", label:"Passport",           hint:"Passport number" },
    { value:"dl",       label:"Driving License",    hint:"DL number" },
  ];
  return [
    { value:"passport", label:"Passport",           hint:"US Passport number" },
    { value:"dl",       label:"Driver's License",   hint:"State DL number" },
    { value:"ssn_last", label:"SSN (last 4)",        hint:"Last 4 digits of SSN" },
    { value:"state_id", label:"State ID",            hint:"State-issued ID number" },
  ];
};

export const SVC_OPTS = {
  Groomer: [
    "Bath & Brush", "Full Groom", "Nail Trim & Filing", "Haircut / Styling",
    "De-shedding Treatment", "Herbal / Medicated Bath", "Spa & Aromatherapy",
    "Tick & Flea Treatment", "Ear Cleaning", "Teeth Brushing",
    "Paw Massage & Balm", "Puppy First Groom",
  ],
  Trainer: [
    "Puppy Basics (8–16 weeks)", "Basic Obedience", "Advanced Obedience",
    "Agility Training", "Behaviour Correction", "Leash & Walk Training",
    "Bite Inhibition", "Socialisation Classes", "Off-Leash Training",
    "Trick & Fun Training", "Separation Anxiety", "Guard / Protection Training",
  ],
  Vet: [
    // Wellness
    "General Check-up", "Annual Wellness Exam", "Puppy / Kitten Package", "Senior Pet Wellness",
    // Vaccines
    "Rabies Vaccination", "Distemper + Parvo (DHLPP)", "Bordetella (Kennel Cough)",
    "Leptospirosis Vaccine", "Influenza Vaccine",
    "Feline FVRCP Vaccine", "Feline Leukaemia (FeLV)",
    // Preventive
    "Deworming / Parasite Control", "Flea & Tick Prevention", "Heartworm Test & Prevention",
    // Procedures
    "Dental Cleaning", "Spay / Neuter", "Microchipping",
    "X-Ray & Diagnostics", "Blood Tests / Pathology", "Minor Surgery", "Emergency Care",
    // Consult
    "Nutrition & Diet Consult", "Dermatology / Skin", "Orthopaedics",
  ],
  Walker: [
    "30-Minute Walk", "60-Minute Walk",
    "5-Walk Weekly Pack", "Monthly Pack (22 Walks)",
    "Group Walk (up to 3 dogs)", "Puppy Walk (first-timers)",
    "Park Visit & Off-Leash Play", "Pickup & Drop-off",
  ],
  Boarding: [
    "Overnight Stay (1 night)", "Weekend Stay (2 nights)",
    "3-Night Stay", "5-Night Stay", "Weekly Stay (7 nights)",
    "Extended Stay (8+ nights)", "Daycare (no overnight)",
    "Holiday Special",
  ],
};

export const ROLE_CONFIG = {
  Groomer: {
    grad:    "from-violet-500 to-purple-600",
    accent:  "#7c3aed",
    bg:      "#f5f3ff",
    border:  "#ddd6fe",
    fields:  [
      { key:"experience", label:"Years of Experience", type:"select", opts:["<1 year","1–2 years","2–5 years","5–8 years","8+ years"] },
      { key:"langs",      label:"Languages Spoken",    type:"text",   placeholder:"e.g. Hindi, English" },
      { key:"service_areas", label:"Service Areas",    type:"text",   placeholder:"e.g. Andheri, Juhu, Versova" },
    ],
    pricing: { a:"Per session (Basic)",   b:"Full groom package",  c:"Premium / Spa" },
    bioHint: "Describe your grooming style, certifications, tools you use, and why pet parents love you…",
    extras:  [
      { key:"has_salon",   label:"I operate a salon / grooming studio" },
      { key:"home_visit",  label:"I do home visits" },
      { key:"mobile_van",  label:"I have a mobile grooming van" },
    ],
  },
  Trainer: {
    grad:    "from-blue-500 to-indigo-600",
    accent:  "#2563eb",
    bg:      "#eff6ff",
    border:  "#bfdbfe",
    fields:  [
      { key:"experience",   label:"Years of Experience",  type:"select", opts:["<1 year","1–2 years","2–5 years","5–8 years","8+ years"] },
      { key:"certification",label:"Certifications",        type:"text",   placeholder:"e.g. APDT, KPA-CTP, CDBC" },
      { key:"langs",        label:"Languages Spoken",      type:"text",   placeholder:"e.g. Hindi, English" },
      { key:"service_areas",label:"Training Locations",    type:"text",   placeholder:"e.g. Home visits, Parks, Studio" },
    ],
    pricing: { a:"Single session",  b:"4-session package", c:"Full course (8+ sessions)" },
    bioHint: "Describe your training philosophy, methods (positive reinforcement, clicker, etc.), breeds you specialise in…",
    extras:  [
      { key:"group_classes",  label:"I offer group classes" },
      { key:"home_visit",     label:"I do home visits" },
      { key:"board_train",    label:"I offer board & train" },
    ],
  },
  Vet: {
    grad:    "from-emerald-500 to-teal-600",
    accent:  "#059669",
    bg:      "#ecfdf5",
    border:  "#a7f3d0",
    fields:  [
      { key:"experience",     label:"Years of Experience",   type:"select", opts:["<1 year","1–2 years","2–5 years","5–8 years","8+ years"] },
      { key:"license_number", label:"Veterinary License No.", type:"text",   placeholder:"e.g. VCI-12345 or State DVM #" },
      { key:"clinic_name",    label:"Clinic / Hospital Name", type:"text",   placeholder:"e.g. PetCare Multi-Specialty Clinic" },
      { key:"langs",          label:"Languages Spoken",       type:"text",   placeholder:"e.g. Hindi, Telugu, English" },
      { key:"service_areas",  label:"Coverage Areas",         type:"text",   placeholder:"e.g. Banjara Hills, Jubilee Hills" },
    ],
    pricing: { a:"Basic consult",   b:"Full check-up + vaccination", c:"Emergency / Surgery (quote)" },
    bioHint: "Your specialisations, education, notable procedures, and what makes your practice stand out…",
    extras:  [
      { key:"home_visit",   label:"I do home / doorstep visits" },
      { key:"telemedicine", label:"I offer video / telemedicine consults" },
      { key:"24_7",         label:"24/7 emergency availability" },
    ],
  },
  Walker: {
    grad:    "from-green-500 to-emerald-600",
    accent:  "#16a34a",
    bg:      "#f0fdf4",
    border:  "#bbf7d0",
    fields:  [
      { key:"experience",    label:"Years of Experience", type:"select", opts:["<1 year","1–2 years","2–5 years","5–8 years","8+ years"] },
      { key:"langs",         label:"Languages Spoken",    type:"text",   placeholder:"e.g. Hindi, English" },
      { key:"service_areas", label:"Walking Areas",       type:"text",   placeholder:"e.g. Jubilee Hills, Banjara Hills" },
    ],
    pricing: { a:"30-min walk", b:"60-min walk", c:"Monthly pack" },
    bioHint: "Describe your walking experience, breeds you handle, routes covered, and what makes your walks safe and fun for dogs…",
    extras:  [
      { key:"group_walks",   label:"I offer group walks (multiple dogs)" },
      { key:"home_visit",    label:"I do pickup & drop-off" },
      { key:"has_insurance", label:"I have pet care insurance" },
    ],
  },
  Boarding: {
    grad:    "from-amber-500 to-orange-500",
    accent:  "#d97706",
    bg:      "#fffbeb",
    border:  "#fde68a",
    fields:  [
      { key:"experience",    label:"Years of Experience",  type:"select", opts:["<1 year","1–2 years","2–5 years","5–8 years","8+ years"] },
      { key:"langs",         label:"Languages Spoken",     type:"text",   placeholder:"e.g. Hindi, English" },
      { key:"service_areas", label:"Location / Locality",  type:"text",   placeholder:"e.g. Madhapur, Gachibowli" },
    ],
    pricing: { a:"Per night (1 pet)", b:"Per night (2 pets)", c:"Weekly rate" },
    bioHint: "Describe your home setup, cage-free policy, daily routine, pets of your own, outdoor space, and why your home is special for boarding…",
    extras:  [
      { key:"has_yard",       label:"I have a yard / outdoor space" },
      { key:"home_visit",     label:"I offer pickup & drop-off" },
      { key:"has_other_pets", label:"I have my own friendly pets at home" },
    ],
  },
};
