import { useState, useEffect, useRef } from "react";
import { api } from "./api.js";
import { AddressInput } from "./Login.jsx";
import { AddressPicker } from "./components/AddressPicker.jsx";
import { bufferPosition, saveTokenToGpsDb } from "./utils/gpsBuffer.js";

/* ── Helpers ── */
const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || "—"; } };
const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const rIcon  = r => ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Admin:"🛡️", customer:"🐕" })[r] || "👤";
const rColor = r => ({ Groomer:"from-violet-500 to-purple-600", Trainer:"from-blue-500 to-indigo-600", Vet:"from-emerald-500 to-teal-600", Admin:"from-gray-700 to-gray-900" })[r] || "from-orange-500 to-amber-500";
const rAccent= r => ({ Groomer:"#7c3aed", Trainer:"#2563eb", Vet:"#059669" })[r] || "#f97316";
const sColor = s => ({
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

const aStatusLabel = s => ({
  confirmed: "✅ Confirmed", on_the_way: "🚗 On My Way", in_progress: "🔧 In Progress",
  searching: "🔍 Searching", completed: "✅ Completed", cancelled: "❌ Cancelled",
  no_pros_available: "⚠️ No Pros", offered: "📤 Offered",
})[s] || s?.replace(/_/g, ' ');

// Detect country from phone and return appropriate ID types
const getIdTypes = phone => {
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

const SVC_OPTS = {
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
};

const ROLE_CONFIG = {
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
};

/* ── Shared UI ── */
const PawLogo = ({ sz = 36 }) => (
  <img src="/icon.svg" alt="PETclub" width={sz} height={sz} style={{ borderRadius: sz * 0.22 }} />
);

const Bdg = ({ text, cls = "" }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>{text}</span>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-2xl`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition">&times;</button>
      </div>
      <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const Inp = ({ label, hint, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white placeholder-gray-400" {...p} />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Sel = ({ label, opts, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white" {...p}>
      {opts.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Txta = ({ label, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none bg-white placeholder-gray-400" rows={3} {...p} />
  </div>
);

const Spinner = ({ full }) => (
  <div className={`flex items-center justify-center ${full ? "min-h-screen" : "py-16"}`}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"/>
      <span className="text-sm text-gray-400 font-medium">Loading…</span>
    </div>
  </div>
);

const EmptyState = ({ icon, title, desc }) => (
  <div className="text-center py-16 px-4">
    <div className="text-5xl mb-4">{icon}</div>
    <div className="font-bold text-gray-700 text-base mb-1">{title}</div>
    {desc && <div className="text-sm text-gray-400">{desc}</div>}
  </div>
);

const StatCard = ({ icon, label, value, sub, gradient, onClick }) => (
  <div onClick={onClick} className={`rounded-2xl p-4 ${gradient} text-white ${onClick ? "cursor-pointer hover:opacity-90 transition" : ""}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl font-extrabold tracking-tight">{value}</div>
    <div className="text-xs font-semibold opacity-80 mt-0.5">{label}</div>
    {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
  </div>
);

/* ── Photo uploader (reusable) ── */
const PhotoUpload = ({ value, onChange, label = "Upload photo", hint = "JPG / PNG · Max 5 MB" }) => {
  const fileRef = useRef(null);
  const handle = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("File too large — max 5 MB"); return; }
    const r = new FileReader();
    r.onload = ev => onChange(ev.target.result, f.name);
    r.readAsDataURL(f);
  };
  return (
    <div className="mb-4">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
          <img src={value} alt="upload" className="w-full h-32 object-cover"/>
          <button type="button" onClick={() => onChange(null, "")}
            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600">×</button>
          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Uploaded</div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:bg-gray-50 hover:border-orange-300 transition-all bg-white"
          onClick={() => fileRef.current?.click()}>
          <span className="text-3xl mb-2">📷</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-400 mt-1">{hint}</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handle}/>
        </label>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PROFESSIONAL ONBOARDING (4 steps)
══════════════════════════════════════════════ */
const ProfessionalOnboarding = ({ session, onComplete }) => {
  const subRole  = session.subRole || "Groomer";
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");

  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);
  // If sub_role is missing (null in DB), let user pick it on Step 1
  const [pickedRole, setPickedRole] = useState(subRole !== "Groomer" || session.subRole ? subRole : null);
  // Use pickedRole if the user changed it in step 1; fall back to session-derived subRole
  const effectiveRole = pickedRole || subRole;
  const cfg      = ROLE_CONFIG[effectiveRole] || ROLE_CONFIG.Groomer;
  const [addrMeta, setAddrMeta] = useState({ lat: null, lng: null, postalCode: "", city: "", state: "" });

  const [form, setForm] = useState({
    name: session.name || "", email: session.email || "", dob: "", gender: "Male",
    address: "", area: "", city: session.city || "", pincode: "",
    services: [], pet_types: [], bio: "", langs: "", service_areas: "", experience: "",
    certification: "", license_number: "", clinic_name: "",
    has_salon: false, home_visit: false, mobile_van: false,
    group_classes: false, board_train: false, telemedicine: false, "24_7": false,
    priceA: "", priceB: "", priceC: "",
    idType: idTypes[0]?.value || "passport", idNumber: "",
  });

  const [addrLoading, setAddrLoading] = useState(false);

  const sf  = k => e  => setForm(f => ({ ...f, [k]: e.target.value }));
  const stg = k => ()  => setForm(f => ({ ...f, [k]: !f[k] }));
  const toggleSvc     = s => setForm(f => ({ ...f, services:  f.services.includes(s)  ? f.services.filter(x => x !== s)  : [...f.services,  s] }));
  const togglePetType = t => setForm(f => ({ ...f, pet_types: f.pet_types.includes(t) ? f.pet_types.filter(x => x !== t) : [...f.pet_types, t] }));

  // Auto-fill city/area from pincode or ZIP code
  useEffect(() => {
    const pin = form.pincode.trim();
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      // India — 6-digit pincode
      setAddrLoading(true);
      fetch(`https://api.postalpincode.in/${pin}`)
        .then(r => r.json())
        .then(data => {
          const po = data?.[0]?.PostOffice?.[0];
          if (po) {
            setForm(f => ({
              ...f,
              area: po.Name || f.area,
              city: po.District || po.Division || f.city,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setAddrLoading(false));
    } else if (pin.length === 5 && /^\d{5}$/.test(pin)) {
      // US — 5-digit ZIP
      setAddrLoading(true);
      fetch(`https://api.zippopotam.us/us/${pin}`)
        .then(r => r.json())
        .then(data => {
          const place = data?.places?.[0];
          if (place) {
            setForm(f => ({
              ...f,
              city:  place['place name'] || f.city,
              area:  (place['state abbreviation'] ? `${place['state abbreviation']}` : '') || f.area,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setAddrLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode]);

  const STEPS = [
    { n:"Basic Info",      icon:"👤" },
    { n:"Pro Details",     icon:"🎯" },
    { n:"Government ID",   icon:"🪪" },
    { n:"Review",          icon:"✅" },
  ];

  const canNext = [
    !!(form.name.trim() && form.city.trim() && (pickedRole || session.subRole)),
    !!(form.services.length > 0 && form.experience && form.bio.trim()),
    !!(form.idNumber.trim()),
    true,
  ];

  const handleSubmit = async () => {
    setSaving(true);
    setSaveErr("");
    try {
      await api.updateMyProProfile({
        sub_role: pickedRole || subRole,    // always save sub_role so DB stays correct
        name: form.name, email: form.email, city: addrMeta.city || form.city, area: form.area,
        address: form.address, pincode: addrMeta.postalCode || form.pincode,
        address_lat: addrMeta.lat, address_lng: addrMeta.lng,
        address_postal_code: addrMeta.postalCode, address_state: addrMeta.state,
        bio: form.bio, experience: form.experience,
        services: form.services, pet_types: form.pet_types, service_areas: form.service_areas, langs: form.langs,
        certification: form.certification, license_number: form.license_number,
        clinic_name: form.clinic_name,
        price_basic: form.priceA, price_full: form.priceB, price_custom: form.priceC,
      });
      // ID upload is non-critical — errors are swallowed so profile always saves
      if (form.idNumber.trim()) {
        await api.uploadIdPhoto({
          docType: form.idType, docNumber: form.idNumber.trim(), docPhoto: idPhoto || undefined,
        }).catch(() => {});
      }
      setSaving(false);
      onComplete(); // only called after a successful save
    } catch (e) {
      setSaving(false);
      setSaveErr(e.message || "Failed to save profile. Please check your connection and try again.");
    }
  };

  const selectedIdType = idTypes.find(t => t.value === form.idType) || idTypes[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.grad} px-5 pt-safe-top pb-6`}>
        <div className="max-w-xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-6">
            <PawLogo sz={28}/>
            <div>
              <span className="font-extrabold text-white text-base">PETclub</span>
              <span className="text-xs text-white/70 ml-2">Professional Setup</span>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${i < step-1 ? "bg-white text-emerald-600" : i === step-1 ? "bg-white/20 border-2 border-white text-white" : "bg-white/10 text-white/40"}`}>
                    {i < step-1 ? "✓" : s.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${i === step-1 ? "text-white" : "text-white/40"}`}>{s.n}</span>
                </div>
                {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step-1 ? "bg-white" : "bg-white/20"}`}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Basic Information</h2>

            {/* Role picker — shown if sub_role wasn't set in DB */}
            {!session.subRole ? (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 mb-2">I am a… *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{id:"Groomer",icon:"✂️"},{id:"Trainer",icon:"🐕‍🦺"},{id:"Vet",icon:"🏥"}].map(r => (
                    <button key={r.id} type="button" onClick={() => setPickedRole(r.id)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${pickedRole === r.id ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <span className="text-xl">{r.icon}</span>{r.id}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-5">Registering as <strong className="text-orange-500">{pickedRole || subRole}</strong></p>
            )}
            <Inp label="Full Name *" placeholder="e.g. Arjun Kumar Mehta" value={form.name} onChange={sf("name")}/>
            <Inp label="Email Address" type="email" placeholder="you@gmail.com" value={form.email} onChange={sf("email")}/>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Date of Birth" type="date" max={new Date().toISOString().split("T")[0]} value={form.dob} onChange={sf("dob")}/>
              <Sel label="Gender" opts={["Male","Female","Other"]} value={form.gender} onChange={sf("gender")}/>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Address *</label>
              <AddressPicker
                value={form.address}
                onChange={({ address, lat, lng, postalCode, city, state }) => {
                  setForm(f => ({
                    ...f,
                    address,
                    pincode: postalCode || f.pincode,
                    city: city || f.city,
                  }));
                  setAddrMeta({ lat: lat || null, lng: lng || null, postalCode: postalCode || "", city: city || "", state: state || "" });
                }}
                placeholder="Start typing your address…"
                token={session.token}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Inp label="PIN / ZIP" placeholder={isIndia ? "500074" : "90210"} maxLength={6} value={form.pincode} onChange={sf("pincode")}/>
                {addrLoading && <div className="absolute right-3 top-9 w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/>}
                {!addrLoading && form.city && form.pincode.length >= 5 && <div className="absolute right-3 top-9 text-emerald-500 text-sm">✓</div>}
              </div>
              <Inp label="Area / Locality" placeholder="LB Nagar" value={form.area} onChange={sf("area")}/>
              <Inp label="City *" placeholder="Hyderabad" value={form.city} onChange={sf("city")}/>
            </div>
          </div>
        )}

        {/* ── STEP 2: Role-Specific Professional Details ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">
              {effectiveRole === "Groomer" ? "Grooming Profile" : effectiveRole === "Trainer" ? "Training Profile" : "Veterinary Profile"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">Services, expertise & pricing</p>

            {/* Services */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Services Offered * (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {(SVC_OPTS[effectiveRole] || []).map(s => (
                  <button key={s} type="button" onClick={() => toggleSvc(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.services.includes(s) ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={form.services.includes(s) ? { background: cfg.accent } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Animals / Pet Types Served */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">🐾 Animals You Work With (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {(effectiveRole === "Vet"
                  ? ["🐕 Dogs","🐈 Cats","🐦 Birds","🐇 Rabbits","🐹 Small Animals","🦎 Reptiles / Exotics","🐟 Fish / Aquatic"]
                  : ["🐕 Dogs","🐈 Cats","🐦 Birds","🐇 Small Animals (rabbits, guinea pigs…)","🦜 Exotic Pets"]
                ).map(t => (
                  <button key={t} type="button" onClick={() => togglePetType(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.pet_types.includes(t) ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={form.pet_types.includes(t) ? { background: cfg.accent } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Role-specific fields */}
            {cfg.fields.map(f => f.type === "select"
              ? <Sel key={f.key} label={f.label + " *"} opts={f.opts} value={form[f.key]} onChange={sf(f.key)}/>
              : <Inp key={f.key} label={f.label} placeholder={f.placeholder} value={form[f.key]} onChange={sf(f.key)}/>
            )}

            {/* Bio */}
            <Txta label={`About You / Bio *`} placeholder={cfg.bioHint} value={form.bio} onChange={sf("bio")} rows={4}/>

            {/* Pricing */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Pricing per session ({isIndia ? "₹" : "$"})</label>
              <div className="grid grid-cols-3 gap-2">
                <Inp label={cfg.pricing.a} type="number" placeholder={isIndia?"599":"29"} value={form.priceA} onChange={sf("priceA")}/>
                <Inp label={cfg.pricing.b} type="number" placeholder={isIndia?"999":"59"} value={form.priceB} onChange={sf("priceB")}/>
                <Inp label={cfg.pricing.c} type="number" placeholder={isIndia?"1499":"99"} value={form.priceC} onChange={sf("priceC")}/>
              </div>
            </div>

            {/* Extras / capabilities */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Additional capabilities</label>
              <div className="space-y-2">
                {cfg.extras.map(e => (
                  <label key={e.key} className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${form[e.key] ? "border-transparent" : "border-gray-300"}`}
                      style={form[e.key] ? { background: cfg.accent } : {}}
                      onClick={stg(e.key)}>
                      {form[e.key] && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">{e.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Government ID ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Government ID Verification</h2>
            <p className="text-sm text-gray-400 mb-5">
              Required to get verified on PETclub. Your ID is reviewed only by admins and never shared publicly.
            </p>

            {/* Country badge */}
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-5 ${isIndia ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"}`}>
              <span className="text-2xl">{isIndia ? "🇮🇳" : "🇺🇸"}</span>
              <div>
                <div className="text-xs font-bold text-gray-700">{isIndia ? "India — Accepted IDs" : "USA — Accepted IDs"}</div>
                <div className="text-xs text-gray-500">{isIndia ? "Aadhar, PAN, Passport, Driving License" : "Passport, Driver's License, State ID"}</div>
              </div>
            </div>

            <Sel label="ID Type *"
              opts={idTypes.map(t => ({ value: t.value, label: t.label }))}
              value={form.idType} onChange={sf("idType")}/>

            <Inp label={`${selectedIdType?.label} Number *`}
              placeholder={selectedIdType?.hint || "Enter ID number"}
              value={form.idNumber} onChange={sf("idNumber")}/>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Upload Photo of ID * (front side)</label>
              <PhotoUpload
                value={idPhoto}
                onChange={(base64) => setIdPhoto(base64)}
                label="Tap to upload ID photo"
                hint="Clear, readable photo · JPG / PNG · Max 5 MB"/>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">🔒</span>
              <span>Your ID is stored securely and used only for identity verification. It will never be shown to customers or other professionals.</span>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-5">Review & Submit</h2>

            {/* Profile card preview */}
            <div className={`bg-gradient-to-br ${cfg.grad} rounded-2xl p-5 text-white text-center mb-5`}>
              <div className="text-5xl mb-2">{rIcon(effectiveRole)}</div>
              <div className="font-bold text-xl">{form.name || "—"}</div>
              <div className="text-white/80 text-sm">{effectiveRole} · {form.city || "—"}</div>
              {form.experience && <div className="text-white/60 text-xs mt-1">{form.experience} experience</div>}
            </div>

            {/* Summary rows */}
            <div className="space-y-0 divide-y divide-gray-50 mb-5">
              {[
                ["📱", "Phone",      session.phone],
                ["📧", "Email",      form.email || "—"],
                ["📍", "City",       form.city || "—"],
                ["💼", "Experience", form.experience || "—"],
                ["🎯", "Services",   form.services.length ? `${form.services.slice(0,3).join(", ")}${form.services.length > 3 ? ` +${form.services.length-3} more` : ""}` : "—"],
                ["🪪", "ID Type",    selectedIdType?.label || "—"],
                ["🔢", "ID Number",  form.idNumber ? `${form.idNumber.slice(0,4)}••••` : "—"],
              ].map(([icon, l, v]) => (
                <div key={l} className="flex items-center gap-3 py-3 text-sm">
                  <span className="text-base w-6 shrink-0">{icon}</span>
                  <span className="text-gray-400 font-medium w-24 shrink-0">{l}</span>
                  <span className="font-semibold text-gray-700 truncate">{v}</span>
                </div>
              ))}
            </div>

            {/* Availability control highlight */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 mb-4">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">🟢</span>
                <div>
                  <strong className="block mb-1">Your schedule, your terms.</strong>
                  Take total control of your schedule. Toggle your status to <strong>Active</strong> or <strong>Offline</strong> with a single tap to instantly manage your local 70 km radius booking broadcasts — no calls, no back-and-forth.
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-5">
              <strong>⏳ What happens next?</strong><br/>
              Your profile will be reviewed within <strong>24–48 hours</strong>. We'll send you a confirmation by email and SMS once approved.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)}
              className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => canNext[step-1] && setStep(s => s+1)}
              className={`flex-1 font-bold py-3 rounded-2xl transition-all text-sm ${canNext[step-1] ? `bg-gradient-to-r ${cfg.grad} text-white shadow-sm hover:opacity-90` : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className={`flex-1 bg-gradient-to-r ${cfg.grad} text-white font-bold py-3 rounded-2xl shadow-sm hover:opacity-90 disabled:opacity-60 transition text-sm`}>
              {saving ? "Submitting…" : "Submit Profile 🐾"}
            </button>
          )}
        </div>
        {saveErr && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">
            <span>⚠️</span><span>{saveErr}</span>
          </div>
        )}
        {step === 3 && (
          <button onClick={() => setStep(4)} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 py-2 text-center transition-colors">
            Skip ID upload for now →
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PROFESSIONAL DASHBOARD
══════════════════════════════════════════════ */
/* ── Countdown Timer (Uber-style request expiry) ── */
const CountdownTimer = ({ deadline }) => {
  const getSecsLeft = () => Math.max(0, Math.floor((new Date(deadline) - Date.now()) / 1000));
  const [secs, setSecs] = useState(getSecsLeft);
  useEffect(() => {
    const t = setInterval(() => setSecs(getSecsLeft()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  if (secs <= 0) return <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">⏰ Expired</span>;
  const m = Math.floor(secs / 60), s = secs % 60, urgent = secs < 60;
  return (
    <span className={`font-mono font-bold text-sm px-2.5 py-1 rounded-full ${urgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"}`}>
      ⏱ {m}:{s.toString().padStart(2,"0")}
    </span>
  );
};

const ProfessionalDashboard = ({ session, onLogout }) => {
  const [view,      setView]      = useState("home");
  const [profile,   setProfile]   = useState(null);
  const [bookings,  setBookings]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [health,    setHealth]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [available, setAvailable] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [idModal,   setIdModal]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [idForm,    setIdForm]    = useState({ idType: "", idNumber: "", idPhoto: null });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState("");
  const [responding,   setResponding]   = useState({});
  const [earnings,     setEarnings]     = useState(null);  // { total, paid, pending, bookings[] }
  const [earningsLoad, setEarningsLoad] = useState(false);
  const [sharingLocId,    setSharingLocId]    = useState(null);  // bookingId being shared
  const [bgWarning,       setBgWarning]       = useState(false); // page-hidden warning
  const watchIdRef        = useRef(null);  // watchPosition ID
  const lastSentRef       = useRef(0);     // throttle: min 10s between sends
  const wakeLockRef       = useRef(null);  // Screen Wake Lock sentinel (keeps screen on during transit)
  const visCleanupRef     = useRef(null);  // visibilitychange cleanup fn — stored here, NOT on the numeric watchPosition ID

  // ── Screen Wake Lock helpers ────────────────────────────────────────────────
  // Keeps the provider's screen on so watchPosition keeps firing normally.
  // The Web Geolocation API runs in the main browser thread; when the screen
  // locks the OS suspends the thread (especially on iOS Safari). Holding a
  // wake lock is the only reliable PWA-based solution.
  //
  // Service workers CANNOT access navigator.geolocation — it is not in the SW
  // spec. Background Sync in the SW handles offline *buffering* (network drops),
  // not GPS suspension from screen lock.
  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator) || document.hidden) return; // API absent or screen already off
    try {
      if (wakeLockRef.current) return; // already held
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      // If the OS releases the lock (battery saver, incoming call, etc.) auto-reacquire
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        // Re-acquire only if we're still actively tracking
        if (watchIdRef.current !== null) acquireWakeLock();
      }, { once: true });
    } catch (e) {
      // NotAllowedError is expected when document is hidden; others are benign
      console.warn('[WakeLock] Could not acquire:', e.message);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // "On My Way" — notify customer + start continuous GPS watchPosition
  const startJourney = async (bookingId) => {
    if (!navigator.geolocation) { showToast("❌ GPS not available on this device."); return; }
    try {
      await api.startJourney(bookingId);
      showToast("🚗 Journey started! Customer has been notified.");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, assignment_status: 'on_the_way' } : b));
    } catch (e) { showToast("❌ " + (e.message || "Failed to start journey")); return; }
    startLocationSharing(bookingId);
  };

  // "Start Service" — transition on_the_way → in_progress when pro arrives
  const startService = async (bookingId) => {
    try {
      await api.updateBookingStatus(bookingId, 'in_progress');
      showToast("🔧 Service started! Good luck!");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'in_progress', assignment_status: 'in_progress' } : b));
    } catch (e) { showToast("❌ " + (e.message || "Failed to start service")); }
  };

  // "Mark Complete" — mark service done by professional
  const markComplete = async (bookingId) => {
    try {
      await api.updateBookingStatus(bookingId, 'completed');
      showToast("✅ Service marked as complete!");
      stopLocationSharing();
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed', assignment_status: 'completed' } : b));
    } catch (e) { showToast("❌ " + (e.message || "Failed to mark complete")); }
  };

  // watchPosition — fires continuously as device moves; throttled to max 1 send/10s
  // More reliable than setInterval on mobile (browser-native, lower battery drain)
  const startLocationSharing = (bookingId) => {
    if (!navigator.geolocation) return;

    // ── Clean up any previous watch + visibility listener ──────────────────
    if (visCleanupRef.current) {
      document.removeEventListener('visibilitychange', visCleanupRef.current);
      visCleanupRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setSharingLocId(bookingId);
    lastSentRef.current = 0;

    // Save auth token to IndexedDB now so the SW can use it during Background Sync
    saveTokenToGpsDb(localStorage.getItem('petclub_token')).catch(() => {});

    // Acquire wake lock — keeps screen on so watchPosition isn't suspended
    acquireWakeLock();

    // ── GPS watch ───────────────────────────────────────────────────────────
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 10000) return; // throttle: send max every 10s
        lastSentRef.current = now;
        api.updateLocation(bookingId, pos.coords.latitude, pos.coords.longitude)
          .catch(() => {
            // Network drop — buffer position in IndexedDB for SW Background Sync retry
            bufferPosition(bookingId, pos.coords.latitude, pos.coords.longitude).catch(() => {});
          });
      },
      (err) => {
        console.warn('[GPS watch error]', err.code, err.message);
        if (err.code === 1) showToast("⚠️ GPS permission denied — location sharing paused.");
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );

    // ── Visibility change handler ───────────────────────────────────────────
    // When the screen wakes back up: re-acquire wake lock + re-attach watch
    // (some browsers cancel watchPosition while the page is hidden)
    // NOTE: stored in visCleanupRef — NOT on the numeric watchPosition ID
    // (setting properties on primitives silently fails in JS non-strict mode)
    const onVisibility = () => {
      if (document.hidden) {
        setBgWarning(true);
      } else {
        setBgWarning(false);
        acquireWakeLock(); // re-acquire if OS released it while hidden
        // Re-attach the watch if the browser suspended it
        if (watchIdRef.current !== null) startLocationSharing(bookingId);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    visCleanupRef.current = onVisibility;
  };

  const stopLocationSharing = () => {
    // Remove visibility listener
    if (visCleanupRef.current) {
      document.removeEventListener('visibilitychange', visCleanupRef.current);
      visCleanupRef.current = null;
    }
    // Stop GPS watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Release wake lock — screen can sleep normally again
    releaseWakeLock();
    setSharingLocId(null);
    setBgWarning(false);
    showToast("📍 Location sharing stopped.");
  };

  // Clean up on unmount — runs when the pro navigates away mid-journey
  useEffect(() => () => {
    if (visCleanupRef.current)
      document.removeEventListener('visibilitychange', visCleanupRef.current);
    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
    releaseWakeLock();
  }, []);

  const subRole  = session.subRole || "Groomer";
  const cfg      = ROLE_CONFIG[subRole] || ROLE_CONFIG.Groomer;
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");
  const currencySymbol = isIndia ? "₹" : "$";

  const refreshRequests = () => api.getIncomingBookings().then(r => setRequests(r.bookings || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.getMyProProfile().catch(() => null),
      api.getBookings().catch(() => ({ bookings: [] })),
      api.getIncomingBookings().catch(() => ({ bookings: [] })),
      api.health().catch(() => null),
    ]).then(([profRes, bkRes, reqRes, healthRes]) => {
      if (profRes?.profile) { setProfile(profRes.profile); setAvailable(profRes.profile?.is_available ?? true); }
      setBookings(bkRes?.bookings || []);
      setRequests(reqRes?.bookings || []);
      if (healthRes) setHealth(healthRes);
    }).finally(() => setLoading(false));

    // Auto-refresh requests every 30 seconds (like Ola/Uber)
    const interval = setInterval(refreshRequests, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load earnings data lazily when the Earnings tab is first opened
  useEffect(() => {
    if (view !== 'earnings' || earnings !== null) return;
    setEarningsLoad(true);
    api.getEarnings().then(r => setEarnings(r.earnings || { total: 0, paid: 0, pending: 0, bookings: [] }))
      .catch(() => setEarnings({ total: 0, paid: 0, pending: 0, bookings: [] }))
      .finally(() => setEarningsLoad(false));
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleRespond = async (bookingId, action) => {
    setResponding(r => ({ ...r, [bookingId]: action }));
    try {
      const res = await api.respondBooking(bookingId, action);
      showToast(action === "accept" ? "✅ Booking accepted! Customer notified." : "❌ Request passed to next professional.");
      setRequests(prev => prev.filter(r => r.id !== bookingId));
      if (action === "accept") {
        api.getBookings().then(r => setBookings(r.bookings || [])).catch(() => {});
      }
    } catch (e) { showToast("❌ " + (e.message || "Failed")); }
    setResponding(r => { const n = {...r}; delete n[bookingId]; return n; });
  };

  const todayBk     = bookings.filter(b => { try { return new Date(b.scheduled_at).toDateString() === new Date().toDateString(); } catch { return false; } });
  const upcomingBk  = bookings.filter(b => ["upcoming","confirmed","on_the_way","in_progress"].includes(b.assignment_status || b.status));
  const completedBk = bookings.filter(b => b.status === "completed" || b.assignment_status === "completed");
  const activeRequests = requests.filter(r => new Date(r.response_deadline) > new Date());

  const isVerified  = profile?.verification_status === "approved";
  const grad        = rColor(subRole);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateMyProProfile(editForm);
      setProfile(p => ({ ...p, ...editForm }));
      setEditModal(false);
      showToast("✅ Profile updated!");
    } catch (e) { showToast("❌ " + e.message); }
    setSaving(false);
  };

  const saveId = async () => {
    setSaving(true);
    try {
      await api.uploadIdPhoto({ docType: idForm.idType, docNumber: idForm.idNumber, docPhoto: idForm.idPhoto });
      setIdModal(false);
      showToast("✅ ID uploaded — pending admin review");
    } catch (e) { showToast("❌ " + e.message); }
    setSaving(false);
  };

  const NAV = [
    { id:"home",     icon:"🏠", label:"Home" },
    { id:"requests", icon:"🔔", label:"Requests",  badge: activeRequests.length || null },
    { id:"bookings", icon:"📅", label:"Bookings" },
    { id:"earnings", icon:"💰", label:"Earnings" },
    { id:"profile",  icon:"👤", label:"Profile" },
  ];

  if (loading) return <Spinner full/>;

  const ProfileRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 font-medium">{label}</div>
        <div className="text-sm font-semibold text-gray-700 mt-0.5 break-words">{value || "—"}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 text-sm">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 text-white shrink-0 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <PawLogo sz={32}/>
            <div>
              <div className="font-extrabold text-orange-400 text-base">PETclub</div>
              <div className="text-xs text-gray-400">Professional Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === n.id ? "bg-orange-500 text-white shadow-sm" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-base">{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge ? <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{n.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className={`bg-gradient-to-br ${grad} rounded-xl p-4 mb-3 text-center`}>
            <div className="text-3xl mb-1">{rIcon(subRole)}</div>
            <div className="font-bold text-white text-sm truncate">{profile?.name || session.name || "Pro"}</div>
            <div className="text-white/70 text-xs">{subRole}</div>
            <div className={`mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isVerified ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
              {isVerified ? (available ? "🟢 Online" : "⏸ Offline") : "⏳ Pending"}
            </div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/5 transition">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 pb-24 md:pb-8 min-h-screen">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl">
            {toast}
          </div>
        )}

        {/* ── HOME ── */}
        {view === "home" && (
          <div className="max-w-2xl mx-auto">
            <div className={`bg-gradient-to-br ${grad} px-5 pt-8 pb-16`}>
              <div className="flex items-center justify-between mb-6 md:hidden">
                <div className="flex items-center gap-2"><PawLogo sz={28}/><span className="font-extrabold text-white">PETclub</span></div>
                <button onClick={onLogout} className="text-white/70 text-xs border border-white/20 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/20">{rIcon(subRole)}</div>
                <div className="flex-1">
                  <div className="text-white/70 text-sm font-medium">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋</div>
                  <div className="text-white text-2xl font-extrabold leading-tight mt-0.5">{(profile?.name || session.name || "Pro").split(" ")[0]}</div>
                  <div className="text-white/60 text-sm mt-0.5">{subRole} · {profile?.city || "Set your city"}</div>
                </div>
                {isVerified && (
                  <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-full border ${available ? "bg-emerald-500/80 border-emerald-400/40" : "bg-gray-500/60 border-white/10"}`}>
                    {available ? "🟢 Online" : "⏸ Offline"}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 -mt-8">
              {!isVerified ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">⏳</div>
                  <div>
                    <div className="font-bold text-amber-800 text-sm">Verification Under Review</div>
                    <div className="text-xs text-amber-700 mt-0.5">Your profile is being reviewed · Expected 24–48 hrs</div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-4 mb-4 shadow-sm border transition-colors ${available ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${available ? "bg-emerald-100" : "bg-gray-100"}`}>
                        {available ? "🟢" : "⏸"}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-sm ${available ? "text-emerald-800" : "text-gray-700"}`}>
                          {available ? "Online — Accepting Bookings" : "Offline — Not Accepting Bookings"}
                        </div>
                        <div className={`text-xs mt-0.5 ${available ? "text-emerald-600" : "text-gray-400"}`}>
                          {available ? "Customers can find & book you" : "You won't receive new requests"}
                        </div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={async () => {
                        const next = !available;
                        setAvailable(next); // optimistic
                        try {
                          await api.setAvailability(next);
                          showToast(next ? "🟢 You're now Online" : "⏸ You're now Offline");
                        } catch (e) {
                          setAvailable(!next); // revert on failure
                          showToast(e.message || "Failed to update availability", "error");
                        }
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none ${available ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${available ? "translate-x-7" : "translate-x-0"}`}/>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard icon="📅" label="Today"     value={todayBk.length}    gradient="bg-gradient-to-br from-blue-500 to-blue-600"/>
                <StatCard icon="✅" label="Completed" value={completedBk.length} gradient="bg-gradient-to-br from-emerald-500 to-teal-600"/>
                <StatCard icon="⭐" label="Rating"    value={profile?.rating ?? "—"} gradient="bg-gradient-to-br from-amber-500 to-orange-500"/>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Today's Schedule</h2>
                  <span className="text-xs text-gray-400 font-medium">{todayBk.length} appointment{todayBk.length !== 1 ? "s" : ""}</span>
                </div>
                {todayBk.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-3xl mb-2">📭</div>
                    <div className="text-sm text-gray-400">{isVerified ? "No appointments today!" : "Appears after verification."}</div>
                  </div>
                ) : todayBk.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg shrink-0">🐕</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                      <div className="text-xs text-gray-400">{fmtTime(b.scheduled_at)}</div>
                    </div>
                    <Bdg text={aStatusLabel(b.assignment_status || b.status)} cls={sColor(b.assignment_status || b.status)}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTS (Incoming offers — Uber/Ola style) ── */}
        {view === "requests" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-extrabold text-gray-800">Incoming Requests</h1>
              <button onClick={refreshRequests} className="text-xs font-semibold text-orange-500 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50 transition">🔄 Refresh</button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Accept or Reject within <strong>{health?.config?.booking_response_timeout_mins ?? 5} minutes</strong> — unanswered requests auto-pass to the next professional.</p>

            {activeRequests.length === 0 ? (
              <EmptyState icon="🔔" title="No incoming requests" desc="New booking requests will appear here. Refreshes every 30 sec automatically."/>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(bk => {
                  const svcIcon = ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥" })[bk.service_type] || "📋";
                  const pet = bk.pets;
                  const customer = bk.users;
                  const custFirstName = (customer?.name || "Customer").split(" ")[0];
                  const isAccepting = responding[bk.id] === "accept";
                  const isRejecting = responding[bk.id] === "reject";
                  const isBusy = !!(responding[bk.id]);
                  return (
                    <div key={bk.id} className="bg-white rounded-2xl border-2 border-orange-200 shadow-md overflow-hidden">
                      {/* Urgent banner */}
                      <div className="bg-orange-500 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-lg">{svcIcon}</span>
                          <span className="text-white font-bold text-sm">New Request!</span>
                        </div>
                        <CountdownTimer deadline={bk.response_deadline}/>
                      </div>

                      <div className="p-4">
                        {/* Service + Pet row */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-extrabold text-gray-800 text-base">{bk.service_name || bk.service_type || "Service"}</div>
                            {pet && (
                              <div className="text-sm text-gray-500 mt-0.5">🐾 {pet.name} {pet.breed ? `· ${pet.breed}` : ""} {pet.species ? `(${pet.species})` : ""}</div>
                            )}
                            {pet?.health_notes && (
                              <div className="mt-1.5 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-rose-700 mb-0.5">⚕️ Health Notes</p>
                                <p className="text-xs text-rose-800 leading-relaxed">{pet.health_notes}</p>
                              </div>
                            )}
                          </div>
                          {bk.provider_earnings && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-right">
                              <div className="text-xs text-emerald-600 font-medium">Your Earning</div>
                              <div className="font-extrabold text-emerald-700 text-base">{currencySymbol}{parseFloat(bk.provider_earnings).toFixed(2)}</div>
                              <div className="text-[10px] text-emerald-500">70% of booking</div>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>👤</span>
                            <span>{custFirstName} (Customer)</span>
                          </div>
                          {bk.scheduled_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>📅</span>
                              <span>{fmtDate(bk.scheduled_at)} at {fmtTime(bk.scheduled_at)}</span>
                            </div>
                          )}
                          {(bk.city || bk.address) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>📍</span>
                              <span>{[bk.address, bk.city].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                          {bk.notes && (
                            <div className="flex items-start gap-2 text-sm text-gray-500 italic">
                              <span>📝</span>
                              <span>"{bk.notes}"</span>
                            </div>
                          )}
                        </div>

                        {/* Accept / Reject buttons */}
                        <div className="flex gap-3">
                          <button
                            disabled={isBusy}
                            onClick={() => handleRespond(bk.id, "reject")}
                            className="flex-1 border-2 border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition disabled:opacity-50">
                            {isRejecting ? "Passing…" : "❌ Reject"}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleRespond(bk.id, "accept")}
                            className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-emerald-600 transition disabled:opacity-50 shadow-md">
                            {isAccepting ? "Accepting…" : "✅ Accept"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {view === "bookings" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">My Bookings</h1>
              <span className="text-sm text-gray-400">{bookings.length} total</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { l:"Upcoming",  v:upcomingBk.length,  c:"bg-blue-50 text-blue-700" },
                { l:"Today",     v:todayBk.length,     c:"bg-orange-50 text-orange-700" },
                { l:"Completed", v:completedBk.length, c:"bg-emerald-50 text-emerald-700" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center ${s.c}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
            {bookings.length === 0 ? <EmptyState icon="📅" title="No bookings yet" desc="They'll appear here after your profile is verified."/> : (
              <div className="space-y-3">
                {bookings.map(b => {
                  const isActive = ["confirmed","on_the_way","in_progress"].includes(b.assignment_status);
                  const isSharing = sharingLocId === b.id;
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} at ${fmtTime(b.scheduled_at)}` : "Date TBD"}</div>
                        </div>
                        <Bdg text={aStatusLabel(b.assignment_status || b.status)} cls={sColor(b.assignment_status || b.status)}/>
                      </div>
                      {(b.provider_earnings || b.amount) && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400 font-medium">
                            {(b.status === 'completed' || b.assignment_status === 'completed') ? 'Earned' : 'Expected earning'}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-emerald-600">
                              {currencySymbol}{parseFloat(b.provider_earnings || b.amount * 0.7 || 0).toFixed(2)}
                            </span>
                            {b.payout_status && (
                              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.payout_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {b.payout_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* ⚕️ Pet health notes — shown to assigned professional */}
                      {b.pets?.health_notes && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-2">
                          <p className="text-xs font-bold text-rose-700 mb-0.5">⚕️ {b.pets?.name || "Pet"} Health Notes</p>
                          <p className="text-xs text-rose-800 leading-relaxed">{b.pets.health_notes}</p>
                        </div>
                      )}
                      {/* 🗺️ Navigate to customer — shown when coords available */}
                      {(b.address_lat && b.address_lng) && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${b.address_lat},${b.address_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-blue-100 active:scale-[0.97] mb-2">
                          🗺️ Navigate to Customer
                        </a>
                      )}
                      {/* 🚗 On My Way + 📍 Location sharing */}
                      {isActive && (
                        b.assignment_status === 'confirmed' ? (
                          <button
                            onClick={() => startJourney(b.id)}
                            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                            🚗 I&apos;m On My Way — Start Journey
                          </button>
                        ) : b.assignment_status === 'on_the_way' ? (
                          <div className="space-y-2">
                            {isSharing ? (
                              <>
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                                  <span className="text-xs font-bold text-emerald-700">Live GPS — customer is tracking you</span>
                                </div>
                                {bgWarning && (
                                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold">
                                    ⚠️ App is in background — keep screen ON for GPS accuracy.
                                  </div>
                                )}
                                <button
                                  onClick={stopLocationSharing}
                                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-red-100 active:scale-[0.97]">
                                  ⏹ Stop Sharing Location
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-orange-700 flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-bounce"/>
                                  On my way — tap Resume to share GPS
                                </div>
                                <button
                                  onClick={() => startLocationSharing(b.id)}
                                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
                                  📍 Resume Location Sharing
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => startService(b.id)}
                              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                              🔧 I&apos;ve Arrived — Start Service
                            </button>
                          </div>
                        ) : b.assignment_status === 'in_progress' ? (
                          <div className="space-y-2">
                            {isSharing ? (
                              <>
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                                  <span className="text-xs font-bold text-blue-700">Service in progress — GPS live</span>
                                </div>
                                {bgWarning && (
                                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold">
                                    ⚠️ Keep screen ON for GPS accuracy.
                                  </div>
                                )}
                                <button
                                  onClick={stopLocationSharing}
                                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-red-100 active:scale-[0.97]">
                                  ⏹ Stop Sharing Location
                                </button>
                              </>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"/>
                                Service in progress
                              </div>
                            )}
                            <button
                              onClick={() => markComplete(b.id)}
                              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                              ✅ Mark Service Complete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startLocationSharing(b.id)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
                            📍 Share My Location with Customer
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {view === "earnings" && (
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
            <div className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white`}>
              <div className="text-sm font-semibold text-white/70 mb-1">My Earnings</div>
              {earningsLoad ? (
                <div className="flex items-center gap-2 text-white/60 text-sm"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Loading…</div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: "Total Earned",   val: earnings?.total   ?? 0, color: "bg-white/20" },
                    { label: "Paid Out",        val: earnings?.paid    ?? 0, color: "bg-emerald-500/40" },
                    { label: "Awaiting Payout", val: earnings?.pending ?? 0, color: "bg-amber-500/40" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`${color} rounded-xl p-3 text-center`}>
                      <div className="text-xs text-white/70 mb-1">{label}</div>
                      <div className="text-lg font-extrabold">{currencySymbol}{parseFloat(val).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/50 mt-3">Payouts are processed T+2 days after service completion.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Job History</h2>
                <span className="text-xs text-gray-400">{earnings?.bookings?.length ?? 0} bookings</span>
              </div>
              {earningsLoad ? (
                <div className="p-6 flex justify-center"><span className="w-6 h-6 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/></div>
              ) : !earnings?.bookings?.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No completed bookings yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {earnings.bookings.map(b => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{b.service_name || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-sm text-emerald-600">{currencySymbol}{parseFloat(b.provider_earnings || 0).toFixed(2)}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.payout_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.payout_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-xs text-orange-700 leading-relaxed">
              <strong>How it works:</strong> For every booking, PETclub facilitates payment and you receive <strong>70%</strong> of the service fee directly to your registered bank account. Payouts are processed T+2 business days after the service is marked complete.
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {view === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className={`bg-gradient-to-br ${grad} px-5 pt-8 pb-16`}>
              <div className="md:hidden flex items-center justify-between mb-4">
                <span className="font-bold text-white">My Profile</span>
                <button onClick={onLogout} className="text-white/70 text-xs border border-white/20 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 border-2 border-white/30 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-3">{rIcon(subRole)}</div>
                <h2 className="text-white text-xl font-extrabold">{profile?.name || session.name}</h2>
                <p className="text-white/70 text-sm mt-1">{subRole} · {profile?.city || "—"}</p>
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {profile?.rating > 0 && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">⭐ {profile.rating}</span>}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isVerified ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                    {isVerified ? "✅ Verified" : "⏳ Pending Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 -mt-8 pb-6 space-y-4">

              {/* ── Personal Info ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800">Personal Info</h3>
                  <button onClick={() => {
                    setEditForm({ name: profile?.name || session.name, email: profile?.email || "", city: profile?.city || "", langs: profile?.langs || "", service_areas: profile?.service_areas || "", bio: profile?.bio || "", experience: profile?.experience || "", certification: profile?.certification || "", license_number: profile?.license_number || "", clinic_name: profile?.clinic_name || "", price_basic: profile?.price_basic || "", price_full: profile?.price_full || "", price_custom: profile?.price_custom || "" });
                    setEditModal(true);
                  }} className="flex items-center gap-1 text-xs font-semibold text-orange-500 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50 transition">
                    ✏️ Edit
                  </button>
                </div>
                <ProfileRow icon="📱" label="Phone"      value={profile?.phone || session.phone}/>
                <ProfileRow icon="📧" label="Email"      value={profile?.email}/>
                <ProfileRow icon="📍" label="City"       value={profile?.city}/>
                <ProfileRow icon="🗣️" label="Languages"  value={profile?.langs}/>
              </div>

              {/* ── Professional Details (role-specific) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800">{subRole} Details</h3>
                </div>
                <ProfileRow icon="💼" label="Experience"   value={profile?.experience}/>
                {subRole === "Vet" && <>
                  <ProfileRow icon="🏥" label="Clinic"       value={profile?.clinic_name}/>
                  <ProfileRow icon="📋" label="License No."  value={profile?.license_number}/>
                </>}
                {subRole === "Trainer" && <ProfileRow icon="🎖️" label="Certifications" value={profile?.certification}/>}
                <ProfileRow icon="🌍" label="Service Areas" value={profile?.service_areas}/>
                {Array.isArray(profile?.pet_types) && profile.pet_types.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-50">
                    <div className="text-xs text-gray-400 font-medium mb-2">🐾 Animals I Work With</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.pet_types.map(t => (
                        <span key={t} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(profile?.services) && profile.services.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-50 last:border-0">
                    <div className="text-xs text-gray-400 font-medium mb-2">Services Offered</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.services.map(s => (
                        <span key={s} className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.accent }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.bio && (
                  <div className="px-5 py-3">
                    <div className="text-xs text-gray-400 font-medium mb-1.5">About</div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">"{profile.bio}"</p>
                  </div>
                )}
              </div>

              {/* ── Pricing ── */}
              {(profile?.price_basic || profile?.price_full || profile?.price_custom) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-3">Pricing</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: cfg.pricing.a, v: profile?.price_basic },
                      { l: cfg.pricing.b, v: profile?.price_full  },
                      { l: cfg.pricing.c, v: profile?.price_custom },
                    ].filter(p => p.v).map(p => (
                      <div key={p.l} className="rounded-xl p-3 text-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <div className="text-base font-extrabold" style={{ color: cfg.accent }}>{isIndia ? "₹" : "$"}{p.v}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{p.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Government ID ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800">Government ID</h3>
                  <button onClick={() => {
                    setIdForm({ idType: idTypes[0]?.value || "", idNumber: "", idPhoto: null });
                    setIdModal(true);
                  }} className="flex items-center gap-1 text-xs font-semibold text-blue-500 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition">
                    📷 Update ID
                  </button>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{isIndia ? "🇮🇳" : "🇺🇸"}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-600">{isIndia ? "India — Accepted IDs" : "USA — Accepted IDs"}</div>
                      <div className="text-xs text-gray-400">{isIndia ? "Aadhar, PAN, Passport, Driving License" : "Passport, Driver's License, State ID"}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${isVerified ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <span className="text-xl">{isVerified ? "✅" : "⏳"}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-700">{isVerified ? "ID Verified" : "ID Under Review"}</div>
                      <div className="text-xs text-gray-500">{isVerified ? "Your identity has been confirmed by the PETclub team." : "Usually reviewed within 24–48 hours of submission."}</div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={onLogout} className="w-full border-2 border-red-100 text-red-400 font-semibold py-3 rounded-2xl text-sm hover:bg-red-50 transition-colors">
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 flex shadow-nav safe-bottom">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors relative ${view === n.id ? "text-orange-500" : "text-gray-400"}`}>
            {view === n.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full"/>}
            <span className="relative">
              <span className="text-xl">{n.icon}</span>
              {n.badge ? <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{n.badge}</span> : null}
            </span>
            <span className="mt-0.5">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Edit Profile Modal */}
      {editModal && (
        <Modal title="Edit Profile" onClose={() => setEditModal(false)}>
          <Inp label="Full Name"    value={editForm.name||""}          onChange={e => setEditForm(f => ({...f, name:e.target.value}))}/>
          <Inp label="Email"        type="email" value={editForm.email||""} onChange={e => setEditForm(f => ({...f, email:e.target.value}))}/>
          <Inp label="City"         value={editForm.city||""}          onChange={e => setEditForm(f => ({...f, city:e.target.value}))}/>
          <Sel label="Experience"   opts={["<1 year","1–2 years","2–5 years","5–8 years","8+ years"]} value={editForm.experience||""} onChange={e => setEditForm(f => ({...f, experience:e.target.value}))}/>
          <Inp label="Languages"    placeholder="Hindi, English" value={editForm.langs||""} onChange={e => setEditForm(f => ({...f, langs:e.target.value}))}/>
          <Inp label="Service Areas" placeholder="Andheri, Juhu" value={editForm.service_areas||""} onChange={e => setEditForm(f => ({...f, service_areas:e.target.value}))}/>
          {subRole === "Vet" && <>
            <Inp label="Clinic Name"    value={editForm.clinic_name||""}    onChange={e => setEditForm(f => ({...f, clinic_name:e.target.value}))}/>
            <Inp label="License Number" value={editForm.license_number||""} onChange={e => setEditForm(f => ({...f, license_number:e.target.value}))}/>
          </>}
          {subRole === "Trainer" && <Inp label="Certifications" value={editForm.certification||""} onChange={e => setEditForm(f => ({...f, certification:e.target.value}))}/>}
          <Txta label="Bio / About Me" value={editForm.bio||""} onChange={e => setEditForm(f => ({...f, bio:e.target.value}))} rows={4}/>
          <div className="mt-4 mb-1">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Pricing ({isIndia ? "₹" : "$"} per session)</label>
            <div className="grid grid-cols-3 gap-2">
              <Inp label={cfg.pricing.a} type="number" placeholder={isIndia?"599":"29"}  value={editForm.price_basic||""}  onChange={e => setEditForm(f => ({...f, price_basic:e.target.value}))}/>
              <Inp label={cfg.pricing.b} type="number" placeholder={isIndia?"999":"59"}  value={editForm.price_full||""}   onChange={e => setEditForm(f => ({...f, price_full:e.target.value}))}/>
              <Inp label={cfg.pricing.c} type="number" placeholder={isIndia?"1499":"99"} value={editForm.price_custom||""} onChange={e => setEditForm(f => ({...f, price_custom:e.target.value}))}/>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 disabled:opacity-60 transition mt-2">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </Modal>
      )}

      {/* Update ID Modal */}
      {idModal && (
        <Modal title="Update Government ID" onClose={() => setIdModal(false)}>
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${isIndia ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"}`}>
            <span className="text-xl">{isIndia ? "🇮🇳" : "🇺🇸"}</span>
            <div className="text-xs text-gray-600 font-medium">{isIndia ? "Accepted: Aadhar, PAN, Passport, DL" : "Accepted: Passport, Driver's License, State ID"}</div>
          </div>
          <Sel label="ID Type" opts={idTypes.map(t => ({ value: t.value, label: t.label }))} value={idForm.idType} onChange={e => setIdForm(f => ({...f, idType:e.target.value}))}/>
          <Inp label="ID Number *" placeholder={idTypes.find(t => t.value === idForm.idType)?.hint || "Enter number"} value={idForm.idNumber} onChange={e => setIdForm(f => ({...f, idNumber:e.target.value}))}/>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-2">ID Photo (front side)</label>
            <PhotoUpload value={idForm.idPhoto} onChange={(b64) => setIdForm(f => ({...f, idPhoto:b64}))} label="Upload ID photo" hint="JPG / PNG · Max 5 MB"/>
          </div>
          <p className="text-xs text-gray-400 mb-4">🔒 Seen only by PETclub admins. Never shared publicly.</p>
          <button onClick={saveId} disabled={saving || !idForm.idNumber.trim()} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition">
            {saving ? "Uploading…" : "Submit ID"}
          </button>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════ */
const AdminDashboard = ({ session, onLogout }) => {
  const [view,       setView]       = useState("overview");
  const [stats,      setStats]      = useState(null);
  const [pending,    setPending]    = useState([]);
  const [users,      setUsers]      = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [rejectModal,setRejectModal]= useState(null);
  const [rejectReason,setRejectReason]=useState("");
  const [editUserModal, setEditUserModal] = useState(null); // { id, name, email, address, city, area, pincode }
  const [editUserForm,  setEditUserForm]  = useState({});
  const [editUserSaving,setEditUserSaving]= useState(false);
  const [toast,      setToast]      = useState({ msg:"", type:"success" });
  const [health,     setHealth]     = useState(null);
  const [dbAudit,    setDbAudit]    = useState(null);
  const [dbAuditLoading, setDbAuditLoading] = useState(false);
  const [dbCleanLoading, setDbCleanLoading] = useState(false);
  const isIndia      = session.phone?.startsWith("+91");
  const currencySymbol = isIndia ? "₹" : "$";

  /* ── Admin UX additions ── */
  const [confirmModal,   setConfirmModal]   = useState(null);   // { action, userId?, userName?, userIds?, count? }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedUsers,  setSelectedUsers]  = useState(new Set());
  const PAGE_SIZE  = 25;
  const [userPage,    setUserPage]    = useState(1);
  const [now,         setNow]         = useState(() => Date.now()); // drives live deletion countdowns
  const [rolePopover, setRolePopover] = useState(null);              // userId whose role dropdown is open

  useEffect(() => {
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getPendingVerifications().catch(() => ({ pending:[] })),
      api.getAdminUsers().catch(() => ({ users:[] })),
      api.getBookings().catch(() => ({ bookings:[] })),
      api.adminHealth().catch(() => null),
    ]).then(([statsRes, pendRes, usersRes, bkRes, healthRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      setPending(pendRes?.pending || []);
      setUsers(usersRes?.users || []);
      setBookings(bkRes?.bookings || []);
      if (healthRes) setHealth(healthRes);
    }).finally(() => setLoading(false));
  }, []);

  // ── Platform Status auto-refresh every 60 s ──────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      api.adminHealth().then(r => { if (r) setHealth(r); }).catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // Live tracking auto-refresh — poll every 15s when "live" tab is active
  useEffect(() => {
    if (view !== "live") return;
    const t = setInterval(() => {
      api.getBookings().then(r => setBookings(r.bookings || [])).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [view]);

  // Tick every 60s to keep deletion countdown timers accurate
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Reset pagination + selection when the user changes filters or search
  useEffect(() => {
    setUserPage(1);
    setSelectedUsers(new Set());
  }, [search, roleFilter]);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg:"", type:"success" }), 3500); };

  const approve = async id => {
    try {
      await api.verifyProfessional(id, "approve");
      setPending(l => l.filter(p => p.id !== id));
      showToast("✅ Professional approved and notified!");
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };
  const reject = async id => {
    try {
      await api.verifyProfessional(id, "reject", rejectReason);
      setPending(l => l.filter(p => p.id !== id));
      setRejectModal(null); setRejectReason("");
      showToast("Application rejected and applicant notified.");
    } catch (e) { showToast("❌ " + e.message, "error"); }
  };
  // Suspend routes through confirm modal for active→suspended; restore is instant
  const suspend = userId => {
    const u = users.find(u => u.id === userId);
    if (u?.is_active) {
      setConfirmModal({ action: "suspend", userId, userName: u.name || "this user" });
    } else {
      api.suspendUser(userId)
        .then(res => {
          setUsers(l => l.map(u => u.id === userId
            ? { ...u, is_active: res.is_active, suspended_at: res.suspended_at ?? u.suspended_at }
            : u));
          showToast("✅ User restored.");
        })
        .catch(() => showToast("❌ Failed to restore user.", "error"));
    }
  };

  // Delete always requires confirmation
  const deleteUser = userId => {
    const u = users.find(u => u.id === userId);
    setConfirmModal({ action: "delete", userId, userName: u?.name || "this user" });
  };

  /* ── Execute the action confirmed in the modal ── */
  const executeConfirm = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    const { action, userId, userIds } = confirmModal;
    try {
      if (action === "suspend") {
        const res = await api.suspendUser(userId);
        setUsers(l => l.map(u => u.id === userId
          ? { ...u, is_active: res.is_active, suspended_at: res.suspended_at ?? u.suspended_at }
          : u));
        showToast("⚠️ User suspended — will be deleted in 24 hrs.");
      } else if (action === "delete") {
        await api.deleteUser(userId);
        setUsers(l => l.filter(u => u.id !== userId));
        showToast("🗑️ User permanently deleted.");
      } else if (action === "bulk_suspend") {
        const ids = [...userIds];
        await Promise.allSettled(ids.map(id => api.suspendUser(id)));
        setUsers(l => l.map(u => userIds.has(u.id)
          ? { ...u, is_active: false, suspended_at: new Date().toISOString() } : u));
        setSelectedUsers(new Set());
        showToast(`⚠️ ${ids.length} user${ids.length !== 1 ? "s" : ""} suspended.`);
      } else if (action === "bulk_delete") {
        const ids = [...userIds];
        const results = await Promise.allSettled(ids.map(id => api.deleteUser(id)));
        const deleted  = ids.filter((_, i) => results[i].status === "fulfilled");
        setUsers(l => l.filter(u => !deleted.includes(u.id)));
        setSelectedUsers(new Set());
        showToast(`🗑️ ${deleted.length} user${deleted.length !== 1 ? "s" : ""} deleted.`);
      } else if (action === "purge_all_suspended") {
        await handlePurgeAllSuspended();
        return; // handlePurgeAllSuspended closes modal + shows toast itself
      }
    } catch (e) { showToast("❌ " + (e.message || "Action failed."), "error"); }
    setConfirmLoading(false);
    setConfirmModal(null);
  };

  /* ── Purge all suspended ── */
  const handlePurgeAllSuspended = async () => {
    try {
      const res = await api.purgeAllSuspended();
      setUsers(u => u.filter(x => x.is_active || x.role === 'admin'));
      setConfirmModal(null);
      showToast(`🗑️ Deleted ${res.deleted} suspended account${res.deleted !== 1 ? 's' : ''}.`);
    } catch (e) {
      showToast("❌ " + e.message, "error");
      setConfirmModal(null);
    }
  };

  /* ── Bulk action entry-points ── */
  const handleBulkSuspend = () => {
    if (!selectedUsers.size) return;
    setConfirmModal({ action: "bulk_suspend", userIds: new Set(selectedUsers), count: selectedUsers.size });
  };
  const handleBulkDelete = () => {
    if (!selectedUsers.size) return;
    const hasActive = [...selectedUsers].some(id => users.find(u => u.id === id)?.is_active);
    if (hasActive) { showToast("⚠️ Bulk delete only works on already-suspended users. Suspend them first.", "error"); return; }
    setConfirmModal({ action: "bulk_delete", userIds: new Set(selectedUsers), count: selectedUsers.size });
  };

  const saveEditUser = async () => {
    if (!editUserModal) return;
    setEditUserSaving(true);
    try {
      await api.adminEditUser(editUserModal.id, {
        name:    editUserForm.name    ?? editUserModal.name,
        email:   editUserForm.email   ?? editUserModal.email,
        address: editUserForm.address ?? editUserModal.address,
        city:    editUserForm.city    ?? editUserModal.city,
        area:    editUserForm.area    ?? editUserModal.area,
        pincode: editUserForm.pincode ?? editUserModal.pincode,
      });
      setUsers(l => l.map(u => u.id === editUserModal.id
        ? { ...u, name: editUserForm.name ?? u.name, email: editUserForm.email ?? u.email }
        : u));
      setEditUserModal(null); setEditUserForm({});
      showToast("✅ User profile updated.");
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setEditUserSaving(false);
  };

  // Real-time deletion countdown — driven by the `now` ticker (updates every 60 s)
  const deletionCountdown = suspendedAt => {
    if (!suspendedAt) return null;
    const deletesAt = new Date(new Date(suspendedAt).getTime() + 24 * 60 * 60 * 1000);
    const msLeft = deletesAt - now;
    if (msLeft <= 0) return "🗑️ Deletes imminently";
    const h   = Math.floor(msLeft / 3_600_000);
    const m   = Math.floor((msLeft % 3_600_000) / 60_000);
    const at  = deletesAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const day = deletesAt.toDateString() !== new Date().toDateString()
      ? ` ${deletesAt.toLocaleDateString([], { month:"short", day:"numeric" })}` : "";
    if (h >= 1) return `🗑️ Deletes in ${h}h ${m}m (at ${at}${day})`;
    return `🗑️ Deletes in ${m}m (at ${at})`;
  };

  const filteredUsers = users.filter(u =>
    (roleFilter === "All" || u.role === roleFilter.toLowerCase() || u.professional_profiles?.[0]?.sub_role === roleFilter) &&
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
  );
  const pageCount      = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  // Short date formatter used in user cards
  const fmtShort = d => { try { return new Date(d).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" }); } catch { return "—"; } };

  const NAV = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"live",     icon:"🗺️", label:"Live Trips", badge: bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length || 0 },
    { id:"verify",   icon:"🔍", label:"Verify",   badge: pending.length },
    { id:"users",    icon:"👥", label:"Users" },
    { id:"bookings", icon:"📅", label:"Bookings" },
    { id:"dbhealth", icon:"🗄️", label:"DB Health" },
  ];

  if (loading) return <Spinner full/>;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 text-sm">
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 text-white shrink-0 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <PawLogo sz={32}/>
            <div>
              <div className="font-extrabold text-orange-400 text-base">PETclub</div>
              <div className="text-xs text-red-400 font-bold tracking-widest">ADMIN</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === n.id ? "bg-orange-500 text-white shadow-sm" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-base">{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge > 0 && <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 text-center mb-3">
            <div className="text-2xl mb-1">🛡️</div>
            <div className="text-sm font-bold text-white">{session.name || "Admin"}</div>
            <div className="text-xs text-gray-400">Super Admin</div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/5 transition">
            🚪 Sign Out
          </button>
          <div className="text-center mt-1">
            <span className="text-[10px] text-gray-700 font-mono tracking-wider">v{__APP_VERSION__}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 pb-24 md:pb-8 min-h-screen">
        {toast.msg && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-5 py-3 rounded-full shadow-xl ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.msg}
          </div>
        )}

        {view === "overview" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-16">
              <div className="md:hidden flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><PawLogo sz={24}/><span className="font-bold text-orange-400">PETclub</span></div>
                <button onClick={onLogout} className="text-gray-400 text-xs border border-gray-600 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-white text-2xl font-extrabold mb-1">Admin Dashboard</h1>
                  <p className="text-gray-400 text-sm">PETclub · Super Admin</p>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-xs text-gray-500">{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                  <div className={`text-xs mt-1 font-semibold ${health ? "text-emerald-400" : "text-gray-500"}`}>
                    {health ? "● Platform Live" : "● Checking…"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 -mt-8">
              {/* ── KPI Cards ── */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatCard icon="👥" label="Total Users"    value={stats?.users ?? users.length}  gradient="bg-gradient-to-br from-blue-500 to-blue-700"     onClick={() => setView("users")}/>
                <StatCard icon="✅" label="Verified Pros"  value={stats?.verified_pros ?? 0}     gradient="bg-gradient-to-br from-emerald-500 to-teal-600"/>
                <StatCard icon="⏳" label="Pending Review" value={pending.length} sub={pending.length > 0 ? "Needs action" : "All clear!"} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => pending.length && setView("verify")}/>
                <StatCard icon="📅" label="Total Bookings" value={bookings.length}                gradient="bg-gradient-to-br from-violet-500 to-purple-600"  onClick={() => setView("bookings")}/>
              </div>
              {/* Revenue card — full width */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Gross Revenue (Customer Paid)</div>
                    <div className="text-white text-3xl font-extrabold">
                      {currencySymbol}{(stats?.revenue ?? bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+parseFloat(b.total_amount||b.amount||0),0)).toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">{bookings.filter(b=>b.status==="completed").length} completed bookings</div>
                  </div>
                  <div className="text-5xl opacity-30">💰</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <div className="text-gray-400 text-[10px] font-semibold mb-0.5">PETclub Net (30%)</div>
                    <div className="text-orange-400 font-extrabold text-sm">
                      {currencySymbol}{(stats?.platform_net ?? bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+parseFloat(b.platform_fee||b.amount*0.3||0),0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <div className="text-gray-400 text-[10px] font-semibold mb-0.5">Provider Payouts (70%)</div>
                    <div className="text-emerald-400 font-extrabold text-sm">
                      {currencySymbol}{(stats?.provider_total ?? bookings.filter(b=>b.status==="completed").reduce((s,b)=>s+parseFloat(b.provider_earnings||b.amount*0.7||0),0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Role distribution ── */}
              {(() => {
                const customers  = users.filter(u => u.role === "customer").length;
                const groomers   = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Groomer").length;
                const trainers   = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Trainer").length;
                const vets       = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Vet").length;
                const total      = users.length || 1;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <h2 className="font-bold text-gray-800 mb-3">User Mix</h2>
                    <div className="space-y-2">
                      {[
                        { label:"🐕 Pet Owners", count:customers,  color:"bg-blue-400",   pct:Math.round(customers/total*100) },
                        { label:"✂️ Groomers",   count:groomers,   color:"bg-violet-400", pct:Math.round(groomers/total*100) },
                        { label:"🐕‍🦺 Trainers",   count:trainers,   color:"bg-indigo-400", pct:Math.round(trainers/total*100) },
                        { label:"🏥 Vets",        count:vets,       color:"bg-emerald-400",pct:Math.round(vets/total*100) },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600 w-28 shrink-0">{row.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${row.color} transition-all duration-500`} style={{ width: `${row.pct}%` }}/>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8 text-right">{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── Pending alert ── */}
              {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 mb-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
                    <div>
                      <div className="font-bold text-amber-800 text-sm">{pending.length} professional{pending.length !== 1 ? "s" : ""} await review</div>
                      <div className="text-xs text-amber-700">Approve or reject their applications</div>
                    </div>
                  </div>
                  <button onClick={() => setView("verify")} className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-600 shrink-0 transition">Review →</button>
                </div>
              )}

              {/* ── Recent Bookings ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Bookings</h2>
                  <button onClick={() => setView("bookings")} className="text-xs text-orange-500 font-semibold">View all →</button>
                </div>
                {bookings.length === 0 ? <div className="px-5 py-8 text-center text-sm text-gray-400">No bookings yet.</div>
                : bookings.slice(0,6).map((b,i) => {
                  const assignBadge = {
                    confirmed:"✅", searching:"🔍", offered:"📤", no_pros_available:"⚠️"
                  }[b.assignment_status] || "";
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base shrink-0">
                        {({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥" })[b.service_type] || "🐕"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"} {assignBadge && `· ${assignBadge} ${b.assignment_status}`}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                  );
                })}
              </div>

              {/* ── Recent Users ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setView("users")} className="text-xs text-orange-500 font-semibold">View all →</button>
                </div>
                {users.slice(0,5).map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{rIcon(proRole || u.role)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize">{proRole || u.role} · {u.phone}</div>
                      </div>
                      <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")}/>
                    </div>
                  );
                })}
              </div>

              {/* ── Platform Status — driven from /health API ── */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4">
                <h2 className="font-bold text-gray-700 text-sm mb-3">⚙️ Platform Status</h2>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const svc = health?.services || {};
                    const ok  = v => v?.startsWith("✅");
                    const svcVal = (raw) => raw ? raw.replace(' live','').replace(' configured','').replace(' (set FIREBASE_SERVICE_ACCOUNT_JSON)','').replace(' (set env vars)','').replace(' (email fallback active)','') : '—';
                    const rows = [
                      { label:"Backend API",  val: health ? (ok(svc.supabase) ? "Cloud Run ✅" : "Cloud Run ⚠️") : "Checking…",    color: health ? (ok(svc.supabase) ? "text-emerald-600":"text-amber-600") : "text-gray-400" },
                      { label:"Frontend",     val: "Vercel ✅",                                                                       color: "text-emerald-600" },
                      { label:"Database",     val: svc.supabase      ? `Supabase ${svcVal(svc.supabase)}`         : "Supabase —",     color: ok(svc.supabase)      ? "text-emerald-600":"text-amber-600" },
                      { label:"Auth / Push",  val: svc.firebase_auth ? `Firebase ${svcVal(svc.firebase_auth)}`    : "Firebase —",     color: ok(svc.firebase_auth) ? "text-emerald-600":"text-amber-600" },
                      { label:"SMS (OTP)",    val: svc.twilio_sms    ? `Twilio ${svcVal(svc.twilio_sms)}`         : "Twilio —",       color: ok(svc.twilio_sms)    ? "text-emerald-600":"text-amber-600" },
                      { label:"Email (SMTP)", val: svc.zoho_smtp     ? `Zoho ${svcVal(svc.zoho_smtp)}`            : "Zoho —",         color: ok(svc.zoho_smtp)     ? "text-emerald-600":"text-amber-600" },
                      { label:"Payments",     val: svc.razorpay      ? (ok(svc.razorpay) ? "Razorpay ✅" : "⏳ Pending LLC") : "⏳ Pending LLC", color: ok(svc.razorpay) ? "text-emerald-600":"text-amber-600" },
                    ];
                    return rows.map(s => (
                      <div key={s.label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <span className="text-gray-500 font-medium">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.val}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "verify" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Verifications</h1>
              <p className="text-sm text-gray-400">Review and approve professional applications</p>
            </div>
            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <div className="font-bold text-gray-700 text-lg mb-1">All caught up!</div>
                <div className="text-sm text-gray-400">No pending verifications at this time.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map(pro => (
                  <div key={pro.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`bg-gradient-to-r ${rColor(pro.sub_role)} px-5 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-base">{rIcon(pro.sub_role)}</span>
                        <span className="text-white font-bold text-sm">{pro.sub_role}</span>
                      </div>
                      <Bdg text="⏳ Pending" cls="bg-white/20 text-white border-white/20"/>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                          {(pro.users?.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-base">{pro.users?.name || "—"}</div>
                          <div className="text-xs text-gray-500 mt-0.5">📱 {pro.users?.phone || "—"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">📍 {pro.city || "—"} · 💼 {pro.experience || "—"}</div>
                          {pro.license_number && <div className="text-xs text-gray-400 mt-0.5">📋 License: {pro.license_number}</div>}
                          {pro.clinic_name && <div className="text-xs text-gray-400 mt-0.5">🏥 {pro.clinic_name}</div>}
                        </div>
                      </div>
                      {pro.bio && <div className="bg-gray-50 rounded-xl p-3 mb-4"><p className="text-xs text-gray-600 italic leading-relaxed">"{pro.bio}"</p></div>}
                      {Array.isArray(pro.pet_types) && pro.pet_types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pro.pet_types.map(t => <span key={t} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">{t}</span>)}
                        </div>
                      )}
                      {Array.isArray(pro.services) && pro.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pro.services.map(s => <span key={s} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">{s}</span>)}
                        </div>
                      )}
                      {/* ── ID Documents (signed URL — opens for 60s) ── */}
                      {(() => {
                        const doc = Array.isArray(pro.id_documents) ? pro.id_documents[0] : pro.id_documents;
                        if (!doc) return (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 font-medium">⚠️ No ID documents uploaded yet</div>
                        );
                        const openDoc = async (path) => {
                          if (!path) return alert("No document uploaded for this field.");
                          try {
                            const r = await api.getSignedDocUrl(path);
                            window.open(r.url, "_blank", "noopener,noreferrer");
                          } catch { alert("Could not load document. Please try again."); }
                        };
                        return (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">🪪 Submitted Documents</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">ID Type: <strong className="text-gray-800">{doc.doc_type || "—"}</strong></span>
                              <span className="text-gray-500">No: <strong className="text-gray-800">{doc.doc_number || "—"}</strong></span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openDoc(doc.photo_url)}
                                className="flex-1 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition">
                                🪪 View ID Photo
                              </button>
                              {doc.cert_photo_url && (
                                <button onClick={() => openDoc(doc.cert_photo_url)}
                                  className="flex-1 text-xs font-bold bg-violet-50 border border-violet-200 text-violet-700 py-2 rounded-lg hover:bg-violet-100 transition">
                                  📄 View Certificate
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">🔒 Links expire in 60 seconds · Admin access only</p>
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        <button onClick={() => approve(pro.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm transition">✅ Approve</button>
                        <button onClick={() => setRejectModal(pro.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition">❌ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rejectModal && (
              <Modal title="Reject Application" onClose={() => setRejectModal(null)}>
                <p className="text-sm text-gray-500 mb-4">The reason will be sent to the professional via SMS and email.</p>
                <Txta label="Reason for rejection *" placeholder="e.g. Please provide clearer ID photo and add bio details, then resubmit." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}/>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={() => reject(rejectModal)} disabled={!rejectReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">Confirm Reject</button>
                </div>
              </Modal>
            )}

          </div>
        )}

        {view === "users" && (
          <div className="max-w-2xl mx-auto px-4 py-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-gray-800">Users</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">
                  {filteredUsers.length} / {users.length} total
                </span>
                {users.some(u => !u.is_active && u.role !== 'admin') && (
                  <button
                    onClick={() => {
                      const count = users.filter(u => !u.is_active && u.role !== 'admin').length;
                      setConfirmModal({ action: "purge_all_suspended", count });
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1">
                    🗑️ Purge All Suspended ({users.filter(u => !u.is_active && u.role !== 'admin').length})
                  </button>
                )}
              </div>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition"/>
            </div>

            {/* ── Role filter chips ── */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              {["All","customer","Groomer","Trainer","Vet"].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition-all shrink-0 ${roleFilter === r ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"}`}>
                  {r === "customer" ? "🐕 Owners" : r === "All" ? "All" : `${rIcon(r)} ${r}s`}
                </button>
              ))}
            </div>

            {/* ── Sticky bulk action bar (appears on selection) ── */}
            {selectedUsers.size > 0 && (
              <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3 sticky top-4 z-30 shadow-2xl">
                <span className="text-sm font-bold shrink-0">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={handleBulkSuspend}
                    className="text-xs font-bold px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl transition">
                    ⏸ Suspend All
                  </button>
                  <button onClick={handleBulkDelete}
                    className="text-xs font-bold px-3 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition">
                    🗑️ Delete All
                  </button>
                  <button onClick={() => setSelectedUsers(new Set())}
                    className="text-xs font-semibold px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
                    ✕ Clear
                  </button>
                </div>
              </div>
            )}

            {filteredUsers.length === 0 ? <EmptyState icon="👥" title="No users found" desc="Try a different search or filter."/> : (
              <>
                {/* ── Select all on this page ── */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.has(u.id))}
                    onChange={e => {
                      const next = new Set(selectedUsers);
                      if (e.target.checked) paginatedUsers.forEach(u => next.add(u.id));
                      else paginatedUsers.forEach(u => next.delete(u.id));
                      setSelectedUsers(next);
                    }}
                  />
                  <span className="text-xs text-gray-400 font-medium">
                    Select all on page {userPage} ({paginatedUsers.length})
                  </span>
                </div>

                {/* ── User cards ── */}
                <div className="space-y-2">
                  {paginatedUsers.map(u => {
                    const proRole    = u.professional_profiles?.[0]?.sub_role;
                    const verStatus  = u.professional_profiles?.[0]?.verification_status;
                    const custDoc    = u.customer_profiles?.[0];
                    const hasCustDoc = custDoc?.id_photo_url;
                    const isSelected = selectedUsers.has(u.id);

                    const openCustDoc = async () => {
                      try { const r = await api.getSignedDocUrl(custDoc.id_photo_url); window.open(r.url, "_blank", "noopener,noreferrer"); }
                      catch { showToast("❌ Could not load document", "error"); }
                    };

                    return (
                      <div key={u.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                        isSelected ? "border-orange-300 ring-2 ring-orange-100 bg-orange-50/20" :
                        !u.is_active ? "border-red-100 bg-red-50/30" : "border-gray-100"
                      }`}>

                        {/* Top row: checkbox + avatar + info */}
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className="pt-0.5 shrink-0">
                            <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                              checked={isSelected}
                              onChange={e => {
                                const next = new Set(selectedUsers);
                                if (e.target.checked) next.add(u.id); else next.delete(u.id);
                                setSelectedUsers(next);
                              }}
                            />
                          </div>
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0 mt-0.5">
                            {rIcon(proRole || u.role)}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate">{u.name || "—"}</div>
                            <div className="text-xs text-gray-400 capitalize truncate">{proRole || u.role} · {u.phone}</div>
                            {u.email && <div className="text-xs text-gray-400 truncate">{u.email}</div>}

                            {/* Date Registered + Last Active */}
                            <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-gray-400">
                              {u.created_at && <span title="Date Registered">📅 Joined {fmtShort(u.created_at)}</span>}
                              {(u.updated_at || u.last_active_at) &&
                                <span title="Last Active">🕐 Active {fmtShort(u.last_active_at || u.updated_at)}</span>}
                            </div>

                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sColor(u.is_active ? "active" : "suspended")}`}>
                                {u.is_active ? "active" : "suspended"}
                              </span>
                              {proRole && verStatus &&
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sColor(verStatus)}`}>{verStatus}</span>}
                              {hasCustDoc &&
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">🪪 ID on file</span>}
                            </div>

                            {/* Real-time deletion countdown */}
                            {!u.is_active && u.suspended_at && (
                              <div className="text-xs font-semibold text-red-500 mt-1">
                                {deletionCountdown(u.suspended_at)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                          {hasCustDoc && (
                            <button onClick={openCustDoc}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                              🪪 View ID
                            </button>
                          )}
                          {custDoc && custDoc.id_doc_type && !hasCustDoc && (
                            <span className="text-xs text-gray-400 px-2 py-1.5">{custDoc.id_doc_type}: {custDoc.id_doc_number || "—"} (no photo)</span>
                          )}

                          {/* Edit */}
                          <button onClick={() => {
                            const cp = u.customer_profiles?.[0] || {};
                            const pp = u.professional_profiles?.[0] || {};
                            setEditUserModal({ id: u.id, name: u.name, email: u.email,
                              address: cp.address || pp.address || "",
                              city: cp.city || pp.city || "",
                              area: cp.area || pp.area || "",
                              pincode: cp.pincode || "" });
                            setEditUserForm({});
                          }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            ✏️ Edit
                          </button>

                          {/* Suspend / Restore */}
                          <button onClick={() => suspend(u.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${u.is_active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                            {u.is_active ? "⏸ Suspend" : "▶ Restore"}
                          </button>

                          {/* Delete (suspended only) */}
                          {!u.is_active && (
                            <button onClick={() => deleteUser(u.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition">
                              🗑️ Delete
                            </button>
                          )}

                          {/* Clean role assignment popover — replaces the raw <select> */}
                          {u.role === "professional" && !proRole && (
                            <div className="relative">
                              <button onClick={() => setRolePopover(rp => rp === u.id ? null : u.id)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 transition flex items-center gap-1">
                                🏷 Assign Role <span className="text-[10px]">{rolePopover === u.id ? "▲" : "▼"}</span>
                              </button>
                              {rolePopover === u.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setRolePopover(null)} />
                                  <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 min-w-[168px] py-1.5 overflow-hidden">
                                    {[["Groomer","✂️"],["Trainer","🐕‍🦺"],["Vet","🏥"]].map(([role, icon]) => (
                                      <button key={role}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition text-left"
                                        onClick={async () => {
                                          setRolePopover(null);
                                          try {
                                            await api.setUserSubRole(u.id, role);
                                            setUsers(l => l.map(x => x.id === u.id
                                              ? { ...x, professional_profiles: [{ ...(x.professional_profiles?.[0] || {}), sub_role: role }] }
                                              : x));
                                            showToast(`✅ Set as ${role}`);
                                          } catch (err) { showToast("❌ " + (err.message || "Failed"), "error"); }
                                        }}>
                                        <span>{icon}</span> {role}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination ── */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition">
                      ← Prev
                    </button>
                    <div className="flex gap-1">
                      {(() => {
                        // Show up to 7 page numbers, windowed around current page
                        const total = pageCount;
                        const pages = total <= 7
                          ? Array.from({ length: total }, (_, i) => i + 1)
                          : userPage <= 4
                            ? [...Array.from({ length: 5 }, (_, i) => i + 1), "…", total]
                            : userPage >= total - 3
                              ? [1, "…", ...Array.from({ length: 5 }, (_, i) => total - 4 + i)]
                              : [1, "…", userPage - 1, userPage, userPage + 1, "…", total];
                        return pages.map((p, i) =>
                          p === "…"
                            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                            : <button key={p} onClick={() => setUserPage(p)}
                                className={`w-8 h-8 text-xs font-bold rounded-xl transition ${userPage === p ? "bg-orange-500 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                                {p}
                              </button>
                        );
                      })()}
                    </div>
                    <button onClick={() => setUserPage(p => Math.min(pageCount, p + 1))} disabled={userPage === pageCount}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition">
                      Next →
                    </button>
                    <span className="w-full text-center text-xs text-gray-400 mt-1">
                      Page {userPage} of {pageCount} · {filteredUsers.length} users
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === "bookings" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Bookings</h1>
              <span className="text-sm text-gray-400">{bookings.length} total</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              {[
                { l:"Upcoming",  v:bookings.filter(b=>b.status==="upcoming").length,                   c:"bg-blue-50 text-blue-700" },
                { l:"Completed", v:bookings.filter(b=>b.status==="completed").length,                  c:"bg-emerald-50 text-emerald-700" },
                { l:"Searching", v:bookings.filter(b=>b.assignment_status==="searching").length,       c:"bg-orange-50 text-orange-700" },
                { l:"Confirmed", v:bookings.filter(b=>b.assignment_status==="confirmed").length,       c:"bg-violet-50 text-violet-700" },
                { l:"🚗 En Route",v:bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length, c:"bg-amber-50 text-amber-700" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center ${s.c}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
            {bookings.length === 0 ? <EmptyState icon="📅" title="No bookings yet" desc="Bookings appear here once users start booking."/> : (
              <div className="space-y-3">
                {bookings.map((b,i) => {
                  const assignBadge = {
                    confirmed:"✅ Confirmed", searching:"🔍 Searching", offered:"📤 Offered",
                    no_pros_available:"⚠️ No Pros", cancelled:"❌ Cancelled"
                  }[b.assignment_status] || b.assignment_status;
                  return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} · ${fmtTime(b.scheduled_at)}` : "—"}</div>
                        {b.assignment_status && (
                          <div className="text-xs text-gray-500 mt-0.5">{assignBadge}</div>
                        )}
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                    {/* Financial breakdown — only visible to admin */}
                    {(b.total_amount || b.amount) && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 rounded-lg p-1.5">
                            <div className="text-[10px] text-blue-500 font-semibold">Customer Paid</div>
                            <div className="text-xs font-extrabold text-blue-700">{currencySymbol}{parseFloat(b.total_amount || b.amount || 0).toFixed(2)}</div>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-1.5">
                            <div className="text-[10px] text-emerald-500 font-semibold">Provider (70%)</div>
                            <div className="text-xs font-extrabold text-emerald-700">{currencySymbol}{parseFloat(b.provider_earnings || (b.amount * 0.7) || 0).toFixed(2)}</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-1.5">
                            <div className="text-[10px] text-orange-500 font-semibold">PETclub (30%)</div>
                            <div className="text-xs font-extrabold text-orange-700">{currencySymbol}{parseFloat(b.platform_fee || (b.amount * 0.3) || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        {b.gateway_fee && (
                          <div className="text-[10px] text-gray-400 mt-1 text-right">
                            Gateway fee: −{currencySymbol}{parseFloat(b.gateway_fee).toFixed(2)} · Net platform: {currencySymbol}{(parseFloat(b.platform_fee || 0) - parseFloat(b.gateway_fee || 0)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 🗺️ LIVE TRIPS OVERVIEW ── */}
        {view === "live" && (() => {
          const liveTrips = bookings.filter(b => ["on_the_way","in_progress"].includes(b.assignment_status));
          return (
            <div className="max-w-2xl mx-auto px-5 py-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-extrabold text-gray-800">🗺️ Live Trips</h1>
                <div className="flex items-center gap-2">
                  {liveTrips.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"/>
                      <span className="text-xs font-bold text-emerald-700">{liveTrips.length} active</span>
                    </div>
                  )}
                  <button
                    onClick={() => api.getBookings().then(r => setBookings(r.bookings || [])).catch(() => {})}
                    className="text-xs bg-orange-50 border border-orange-200 text-orange-600 font-bold px-3 py-1.5 rounded-full hover:bg-orange-100 transition">
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5 text-xs text-blue-700 font-medium">
                📡 Auto-refreshes every 15 seconds · GPS updated every 15s by professional's device
              </div>

              {liveTrips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="text-5xl mb-4">🗺️</div>
                  <div className="font-bold text-gray-700 text-lg mb-1">No active trips</div>
                  <div className="text-sm text-gray-400">Trips appear here when a professional clicks "On My Way".</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveTrips.map(b => {
                    const hasPro = b.pro_lat && b.pro_lng;
                    const hasCust = b.address_lat && b.address_lng;
                    const proUpdated = b.pro_location_updated_at
                      ? new Date(b.pro_location_updated_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
                      : null;
                    const statusColor = b.assignment_status === "in_progress" ? "bg-emerald-500" : "bg-orange-500";
                    const custName = b.users?.name || "Customer";
                    const petName = b.pets?.name || "";
                    return (
                      <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse inline-block`}/>
                            <span className="text-white font-bold text-sm">{b.service_name || b.service_type || "Service"}</span>
                            {petName && <span className="text-gray-400 text-xs">· 🐾 {petName}</span>}
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${b.assignment_status === "in_progress" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-orange-500/20 text-orange-300 border border-orange-500/30"}`}>
                            {b.assignment_status === "in_progress" ? "🔧 In Progress" : "🚗 On The Way"}
                          </span>
                        </div>

                        <div className="p-5">
                          {/* Customer info */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base shrink-0">👤</div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{custName}</div>
                              <div className="text-xs text-gray-400">{b.users?.phone || "—"}</div>
                            </div>
                          </div>

                          {/* GPS info grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`rounded-xl p-3 border ${hasPro ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="text-xs font-semibold text-gray-500 mb-1">🚗 Professional GPS</div>
                              {hasPro ? (
                                <>
                                  <div className="text-xs font-bold text-emerald-700 font-mono">{b.pro_lat?.toFixed(5)}, {b.pro_lng?.toFixed(5)}</div>
                                  {proUpdated && <div className="text-xs text-gray-400 mt-1">Updated {proUpdated}</div>}
                                </>
                              ) : (
                                <div className="text-xs text-gray-400">Awaiting GPS…</div>
                              )}
                            </div>
                            <div className={`rounded-xl p-3 border ${hasCust ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="text-xs font-semibold text-gray-500 mb-1">📍 Customer Location</div>
                              {hasCust ? (
                                <div className="text-xs font-bold text-blue-700 font-mono">{b.address_lat?.toFixed(5)}, {b.address_lng?.toFixed(5)}</div>
                              ) : (
                                <div className="text-xs text-gray-400">{b.city || b.address || "—"}</div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {hasPro && (
                              <a
                                href={`https://www.google.com/maps?q=${b.pro_lat},${b.pro_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-100 transition">
                                🗺️ Track Pro
                              </a>
                            )}
                            {hasCust && (
                              <a
                                href={`https://www.google.com/maps?q=${b.address_lat},${b.address_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2.5 rounded-xl hover:bg-blue-100 transition">
                                📍 Customer
                              </a>
                            )}
                            {hasPro && hasCust && (
                              <a
                                href={`https://www.google.com/maps/dir/${b.pro_lat},${b.pro_lng}/${b.address_lat},${b.address_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold py-2.5 rounded-xl hover:bg-orange-100 transition">
                                🧭 Route
                              </a>
                            )}
                          </div>

                          {/* Appointment details */}
                          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                            {b.scheduled_at && <span>📅 {fmtDate(b.scheduled_at)} {fmtTime(b.scheduled_at)}</span>}
                            {(b.total_amount || b.amount) && <span>{currencySymbol}{parseFloat(b.total_amount || b.amount || 0).toFixed(2)}</span>}
                            {b.ten_min_notified && <span className="text-amber-600 font-semibold">⏱ 10-min alert sent</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ 🗄️ DB HEALTH ══════════════════════════════════════════════════ */}
        {view === "dbhealth" && (
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-xl font-extrabold text-gray-800">🗄️ DB Health</h1>
              <button
                onClick={async () => {
                  setDbAuditLoading(true);
                  try { const r = await api.dbAudit(); setDbAudit(r.audit); }
                  catch (e) { showToast("❌ " + e.message, "error"); }
                  finally { setDbAuditLoading(false); }
                }}
                disabled={dbAuditLoading}
                className="text-sm font-bold px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-60 transition flex items-center gap-2">
                {dbAuditLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Scanning…</> : "🔍 Run Audit"}
              </button>
            </div>

            {!dbAudit && !dbAuditLoading && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🗄️</div>
                <p className="font-semibold text-gray-500">Click "Run Audit" to scan all tables</p>
                <p className="text-xs mt-1">Checks for orphaned rows, stale records, and expired tokens</p>
              </div>
            )}

            {dbAudit && (() => {
              const a = dbAudit;
              const issues = [];
              if (a.users?.suspended > 0)              issues.push({ key: "purge_suspended",     label: `${a.users.suspended} suspended account${a.users.suspended !== 1 ? "s" : ""}`, severity: "red" });
              if (a.users?.pending_role > 0)            issues.push({ key: "stale_pending_users", label: `${a.stale_pending_users?.count || 0} incomplete signups (>7 days old)`, severity: a.stale_pending_users?.count > 0 ? "amber" : "green" });
              if (a.orphans?.professional_profiles > 0) issues.push({ key: "orphan_profiles",     label: `${a.orphans.professional_profiles} orphaned professional profiles`, severity: "red" });
              if (a.orphans?.customer_profiles > 0)    issues.push({ key: "orphan_profiles",     label: `${a.orphans.customer_profiles} orphaned customer profiles`, severity: "red" });
              if (a.orphans?.pets > 0)                  issues.push({ key: "orphan_profiles",     label: `${a.orphans.pets} orphaned pet records`, severity: "red" });
              if (a.otp_tokens?.expired > 0)            issues.push({ key: "expired_otps",        label: `${a.otp_tokens.expired} expired OTP tokens`, severity: "amber" });
              if (a.bookings?.cancelled > 0)            issues.push({ key: "cancelled_bookings",  label: `${a.bookings.cancelled} cancelled bookings`, severity: "amber" });
              if (a.bookings?.stale_upcoming > 0)       issues.push({ key: "cancelled_bookings",  label: `${a.bookings.stale_upcoming} stale upcoming bookings (>30d)`, severity: "amber" });
              if (a.website_leads?.older_than_30d > 0)  issues.push({ key: "stale_leads",         label: `${a.website_leads.older_than_30d} website leads older than 30 days`, severity: "amber" });
              const cleanTargets = [...new Set(issues.filter(i => i.severity !== "green").map(i => i.key))];

              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:"Total Users",      value: a.users?.total,       icon:"👥" },
                      { label:"Active",            value: a.users?.active,      icon:"✅" },
                      { label:"Suspended",         value: a.users?.suspended,   icon:"⏸", warn: a.users?.suspended > 0 },
                      { label:"Pending Signup",    value: a.users?.pending_role,icon:"⏳", warn: a.users?.pending_role > 0 },
                      { label:"Professionals",     value: a.professionals?.total,       icon:"🧑‍💼" },
                      { label:"Pending Verify",    value: a.professionals?.pending_verification, icon:"🔍", warn: a.professionals?.pending_verification > 0 },
                      { label:"Total Bookings",    value: a.bookings?.total,    icon:"📅" },
                      { label:"Cancelled",         value: a.bookings?.cancelled,icon:"❌", warn: a.bookings?.cancelled > 0 },
                      { label:"Orphaned Records",  value: (a.orphans?.professional_profiles||0)+(a.orphans?.customer_profiles||0)+(a.orphans?.pets||0), icon:"🔗", warn: (a.orphans?.professional_profiles||0)+(a.orphans?.customer_profiles||0)+(a.orphans?.pets||0) > 0 },
                      { label:"Expired OTPs",      value: a.otp_tokens?.expired,icon:"🔑", warn: a.otp_tokens?.expired > 0 },
                      { label:"Website Leads",     value: a.website_leads?.total,       icon:"📬" },
                      { label:"Payment Logs",      value: a.payment_logs?.total,icon:"💳" },
                    ].map(c => (
                      <div key={c.label} className={`rounded-2xl p-4 border ${c.warn ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
                        <div className="text-xs text-gray-500 font-medium">{c.icon} {c.label}</div>
                        <div className={`text-2xl font-extrabold mt-1 ${c.warn ? "text-red-600" : "text-gray-800"}`}>{c.value ?? "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Issues */}
                  {issues.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-bold text-emerald-700">Database is clean</p>
                      <p className="text-xs text-emerald-600 mt-1">No stale or orphaned data found.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
                      <div className="px-4 py-3 font-bold text-gray-700 text-sm flex items-center gap-2">
                        ⚠️ Issues Found ({issues.length})
                      </div>
                      {issues.map((iss, i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${iss.severity === "red" ? "bg-red-500" : "bg-amber-400"}`}/>
                          <span className="text-sm text-gray-700 flex-1">{iss.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cleanup button */}
                  {cleanTargets.length > 0 && (
                    <button
                      onClick={async () => {
                        setDbCleanLoading(true);
                        try {
                          const r = await api.dbCleanup(cleanTargets);
                          const total = Object.values(r.cleaned).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                          showToast(`🧹 Cleaned ${total} stale record${total !== 1 ? 's' : ''}.`);
                          // Re-run audit to reflect new state
                          const fresh = await api.dbAudit();
                          setDbAudit(fresh.audit);
                          // Also refresh users list
                          const usersRes = await api.getAdminUsers().catch(() => null);
                          if (usersRes?.users) setUsers(usersRes.users);
                        } catch (e) { showToast("❌ " + e.message, "error"); }
                        finally { setDbCleanLoading(false); }
                      }}
                      disabled={dbCleanLoading}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                      {dbCleanLoading
                        ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Cleaning…</>
                        : `🧹 Clean Up All Issues (${cleanTargets.length} ${cleanTargets.length !== 1 ? 'categories' : 'category'})`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 flex shadow-nav">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors relative ${view === n.id ? "text-orange-500" : "text-gray-400"}`}>
            {view === n.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full"/>}
            <span className="text-xl mb-0.5 relative">
              {n.icon}
              {n.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{n.badge}</span>}
            </span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* ══ GLOBAL CONFIRM MODAL ══════════════════════════════════════════════
          Used for Suspend, Delete, Bulk Suspend, and Bulk Delete.
          Rendered at the root level so it overlays all views correctly.     */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
          onClick={() => !confirmLoading && setConfirmModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 ${
              confirmModal.action.includes("delete") ? "bg-red-100" : "bg-amber-100"
            }`}>
              {confirmModal.action.includes("delete") ? "🗑️" : "⏸"}
            </div>

            {/* Title */}
            <h3 className="text-lg font-extrabold text-gray-900 text-center mb-2">
              {confirmModal.action === "suspend"             && "Suspend User?"}
              {confirmModal.action === "delete"              && "Delete User?"}
              {confirmModal.action === "bulk_suspend"        && `Suspend ${confirmModal.count} Users?`}
              {confirmModal.action === "bulk_delete"         && `Delete ${confirmModal.count} Users?`}
              {confirmModal.action === "purge_all_suspended" && `Purge All ${confirmModal.count} Suspended Accounts?`}
            </h3>

            {/* Body */}
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              {confirmModal.action === "purge_all_suspended" && (
                <>Permanently delete all <strong className="text-gray-800">{confirmModal.count} suspended account{confirmModal.count !== 1 ? "s" : ""}</strong>?
                  All their data, profiles, and logs will be removed. This cannot be undone.</>
              )}
              {confirmModal.action === "suspend" && (
                <>Are you sure you want to suspend <strong className="text-gray-800">{confirmModal.userName}</strong>?
                  They will be locked out and permanently deleted after 24 hours if not restored.</>
              )}
              {confirmModal.action === "delete" && (
                <>Permanently delete <strong className="text-gray-800">{confirmModal.userName}</strong>?
                  All data for this account will be removed. This cannot be undone.</>
              )}
              {confirmModal.action === "bulk_suspend" && (
                <>Suspend all <strong className="text-gray-800">{confirmModal.count} selected users</strong>?
                  They will be locked out and scheduled for deletion in 24 hours.</>
              )}
              {confirmModal.action === "bulk_delete" && (
                <>Permanently delete all <strong className="text-gray-800">{confirmModal.count} selected users</strong>?
                  This action cannot be undone.</>
              )}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirm}
                disabled={confirmLoading}
                className={`flex-1 font-bold py-3 rounded-2xl text-sm text-white transition disabled:opacity-60 ${
                  confirmModal.action.includes("delete")
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {confirmLoading
                  ? "Processing…"
                  : confirmModal.action === "purge_all_suspended" ? "🗑️ Purge All"
                  : confirmModal.action.includes("delete") ? "🗑️ Delete" : "⏸ Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ GLOBAL EDIT USER MODAL ═══════════════════════════════════════════
          Moved here from inside the verify view (where it was unreachable).
          The Edit button lives in the users view, so the modal must be global. */}
      {editUserModal && (
        <Modal title={`✏️ Edit User — ${editUserModal.name || editUserModal.id}`} onClose={() => { setEditUserModal(null); setEditUserForm({}); }}>
          <p className="text-xs text-gray-400 mb-4">Correct bad data for this user. Leave a field unchanged to keep the current value.</p>
          <Inp label="Full Name" defaultValue={editUserModal.name || ""} onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
              defaultValue={editUserModal.email || ""}
              onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correct@email.com"
              type="email"
            />
            {editUserModal.email && (
              <p className="text-xs text-amber-600 mt-1">
                Current: <strong>{editUserModal.email}</strong>
                {(editUserModal.email.endsWith(".conm") || editUserModal.email.endsWith(".con")) && " ⚠️ Bad TLD"}
              </p>
            )}
          </div>
          <Inp label="Address" defaultValue={editUserModal.address || ""} onChange={e => setEditUserForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="City"    defaultValue={editUserModal.city    || ""} onChange={e => setEditUserForm(f => ({ ...f, city:    e.target.value }))} placeholder="City" />
            <Inp label="Pincode" defaultValue={editUserModal.pincode || ""} onChange={e => setEditUserForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" />
          </div>
          <Inp label="Area / Locality" defaultValue={editUserModal.area || ""} onChange={e => setEditUserForm(f => ({ ...f, area: e.target.value }))} placeholder="Area" />
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setEditUserModal(null); setEditUserForm({}); }}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveEditUser} disabled={editUserSaving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
              {editUserSaving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════ */
export default function ProApp({ session, onLogout }) {
  const [profileChecked,  setProfileChecked]  = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [enrichedSession, setEnrichedSession] = useState(session);

  useEffect(() => {
    if (session.role === "admin") { setProfileChecked(true); return; }
    api.getMyProProfile().then(res => {
      const subRole = res.profile?.sub_role;
      if (subRole) setEnrichedSession(s => ({ ...s, subRole }));
      const incomplete = !res.profile?.bio && !res.profile?.experience;
      setNeedsOnboarding(incomplete);
      setProfileChecked(true);
    }).catch(() => { setNeedsOnboarding(false); setProfileChecked(true); });
  }, [session]);

  if (!profileChecked) return <Spinner full/>;
  if (session.role === "admin")  return <AdminDashboard   session={session} onLogout={onLogout}/>;
  if (needsOnboarding)           return <ProfessionalOnboarding session={enrichedSession} onComplete={() => setNeedsOnboarding(false)}/>;
  return <ProfessionalDashboard session={enrichedSession} onLogout={onLogout}/>;
}
