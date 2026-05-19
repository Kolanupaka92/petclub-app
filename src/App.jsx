import { useState, useEffect, useRef } from "react";
import { api } from "./api.js";

/* ── Helpers ── */
const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || "—"; } };
const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const rIcon  = r => ({ Groomer:"✂️", Trainer:"🎓", Vet:"🏥", Admin:"🛡️", customer:"🐕" })[r] || "👤";
const rColor = r => ({ Groomer:"from-violet-500 to-purple-600", Trainer:"from-blue-500 to-indigo-600", Vet:"from-emerald-500 to-teal-600", Admin:"from-gray-700 to-gray-900" })[r] || "from-orange-500 to-amber-500";
const rAccent= r => ({ Groomer:"#7c3aed", Trainer:"#2563eb", Vet:"#059669" })[r] || "#f97316";
const sColor = s => ({
  completed:"bg-emerald-50 text-emerald-700 border-emerald-200", upcoming:"bg-blue-50 text-blue-700 border-blue-200",
  ongoing:"bg-orange-50 text-orange-700 border-orange-200", pending:"bg-amber-50 text-amber-700 border-amber-200",
  approved:"bg-emerald-50 text-emerald-700 border-emerald-200", rejected:"bg-red-50 text-red-600 border-red-200",
  active:"bg-emerald-50 text-emerald-700 border-emerald-200", suspended:"bg-red-50 text-red-600 border-red-200",
})[s] || "bg-gray-50 text-gray-600 border-gray-200";

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
  <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="40" r="18" fill="#f97316"/>
    <ellipse cx="20" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(-20 20 20)"/>
    <ellipse cx="44" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(20 44 20)"/>
    <ellipse cx="10" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(-30 10 34)"/>
    <ellipse cx="54" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(30 54 34)"/>
    <ellipse cx="24" cy="44" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="32" cy="47" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="40" cy="44" rx="4" ry="5" fill="white" opacity="0.9"/>
    <ellipse cx="28" cy="38" rx="7" ry="8" fill="white" opacity="0.9"/>
    <ellipse cx="36" cy="38" rx="7" ry="8" fill="white" opacity="0.9"/>
  </svg>
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
  const cfg      = ROLE_CONFIG[subRole] || ROLE_CONFIG.Groomer;
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");

  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);
  // If sub_role is missing (null in DB), let user pick it on Step 1
  const [pickedRole, setPickedRole] = useState(subRole !== "Groomer" || session.subRole ? subRole : null);

  const [form, setForm] = useState({
    name: session.name || "", email: session.email || "", dob: "", gender: "Male",
    address: "", area: "", city: session.city || "", pincode: "",
    services: [], bio: "", langs: "", service_areas: "", experience: "",
    certification: "", license_number: "", clinic_name: "",
    has_salon: false, home_visit: false, mobile_van: false,
    group_classes: false, board_train: false, telemedicine: false, "24_7": false,
    priceA: "", priceB: "", priceC: "",
    idType: idTypes[0]?.value || "passport", idNumber: "",
  });

  const [addrLoading, setAddrLoading] = useState(false);

  const sf  = k => e  => setForm(f => ({ ...f, [k]: e.target.value }));
  const stg = k => ()  => setForm(f => ({ ...f, [k]: !f[k] }));
  const toggleSvc = s  => setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));

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
    try {
      await api.updateMyProProfile({
        sub_role: pickedRole || subRole,    // always save sub_role so DB stays correct
        name: form.name, email: form.email, city: form.city, area: form.area,
        address: form.address, bio: form.bio, experience: form.experience,
        services: form.services, service_areas: form.service_areas, langs: form.langs,
        certification: form.certification, license_number: form.license_number,
        clinic_name: form.clinic_name,
        price_basic: form.priceA, price_full: form.priceB, price_custom: form.priceC,
      });
      if (form.idNumber.trim()) {
        await api.uploadIdPhoto({
          docType: form.idType, docNumber: form.idNumber.trim(), docPhoto: idPhoto || undefined,
        }).catch(() => {});
      }
    } catch { /* proceed */ }
    setSaving(false);
    onComplete();
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
                  {[{id:"Groomer",icon:"✂️"},{id:"Trainer",icon:"🎓"},{id:"Vet",icon:"🏥"}].map(r => (
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
              <Inp label="Date of Birth" type="date" value={form.dob} onChange={sf("dob")}/>
              <Sel label="Gender" opts={["Male","Female","Other"]} value={form.gender} onChange={sf("gender")}/>
            </div>
            <Txta label="Full Address" placeholder="House/Flat No., Street, Locality" value={form.address} onChange={sf("address")} rows={2}/>
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
              {subRole === "Groomer" ? "Grooming Profile" : subRole === "Trainer" ? "Training Profile" : "Veterinary Profile"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">Services, expertise & pricing</p>

            {/* Services */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Services Offered * (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {(SVC_OPTS[subRole] || []).map(s => (
                  <button key={s} type="button" onClick={() => toggleSvc(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.services.includes(s) ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={form.services.includes(s) ? { background: cfg.accent } : {}}>
                    {s}
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
              <div className="text-5xl mb-2">{rIcon(subRole)}</div>
              <div className="font-bold text-xl">{form.name || "—"}</div>
              <div className="text-white/80 text-sm">{subRole} · {form.city || "—"}</div>
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
  const [loading,   setLoading]   = useState(true);
  const [available, setAvailable] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [idModal,   setIdModal]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [idForm,    setIdForm]    = useState({ idType: "", idNumber: "", idPhoto: null });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState("");
  const [responding, setResponding] = useState({});

  const subRole  = session.subRole || "Groomer";
  const cfg      = ROLE_CONFIG[subRole] || ROLE_CONFIG.Groomer;
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");

  const refreshRequests = () => api.getIncomingBookings().then(r => setRequests(r.bookings || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.getMyProProfile().catch(() => null),
      api.getBookings().catch(() => ({ bookings: [] })),
      api.getIncomingBookings().catch(() => ({ bookings: [] })),
    ]).then(([profRes, bkRes, reqRes]) => {
      if (profRes?.profile) { setProfile(profRes.profile); setAvailable(profRes.profile?.is_available ?? true); }
      setBookings(bkRes?.bookings || []);
      setRequests(reqRes?.bookings || []);
    }).finally(() => setLoading(false));

    // Auto-refresh requests every 30 seconds (like Ola/Uber)
    const interval = setInterval(refreshRequests, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const upcomingBk  = bookings.filter(b => b.status === "upcoming");
  const completedBk = bookings.filter(b => b.status === "completed");
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
              {isVerified ? "✅ Verified" : "⏳ Pending"}
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
                {isVerified && <div className="bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">✅ Live</div>}
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">✅</div>
                    <div>
                      <div className="font-bold text-emerald-800 text-sm">Verified & Active</div>
                      <div className="text-xs text-emerald-600">Listed on PETclub · Accepting bookings</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setAvailable(true)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${available ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>🟢</button>
                    <button onClick={() => setAvailable(false)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${!available ? "bg-red-400 text-white" : "bg-gray-100 text-gray-400"}`}>⏸</button>
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
                    <Bdg text={b.status} cls={sColor(b.status)}/>
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
            <p className="text-xs text-gray-400 mb-5">Accept or Reject within <strong>5 minutes</strong> — unanswered requests auto-pass to the next professional.</p>

            {activeRequests.length === 0 ? (
              <EmptyState icon="🔔" title="No incoming requests" desc="New booking requests will appear here. Refreshes every 30 sec automatically."/>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(bk => {
                  const svcIcon = ({ Groomer:"✂️", Trainer:"🎓", Vet:"🏥" })[bk.service_type] || "📋";
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
                          </div>
                          {bk.amount && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-right">
                              <div className="text-xs text-emerald-600 font-medium">Earning</div>
                              <div className="font-extrabold text-emerald-700 text-base">₹{bk.amount}</div>
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
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} at ${fmtTime(b.scheduled_at)}` : "Date TBD"}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                    {b.amount && <div className="text-sm font-bold text-gray-700">{b.amount}</div>}
                  </div>
                ))}
              </div>
            )}
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
                    setEditForm({ name: profile?.name || session.name, email: profile?.email || "", city: profile?.city || "", langs: profile?.langs || "", service_areas: profile?.service_areas || "", bio: profile?.bio || "", experience: profile?.experience || "", certification: profile?.certification || "", license_number: profile?.license_number || "", clinic_name: profile?.clinic_name || "" });
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
  const [toast,      setToast]      = useState({ msg:"", type:"success" });

  useEffect(() => {
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getPendingVerifications().catch(() => ({ pending:[] })),
      api.getAdminUsers().catch(() => ({ users:[] })),
      api.getBookings().catch(() => ({ bookings:[] })),
    ]).then(([statsRes, pendRes, usersRes, bkRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      setPending(pendRes?.pending || []);
      setUsers(usersRes?.users || []);
      setBookings(bkRes?.bookings || []);
    }).finally(() => setLoading(false));
  }, []);

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
  const suspend = async userId => {
    try {
      await api.suspendUser(userId);
      setUsers(l => l.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
      showToast("User status updated.");
    } catch { showToast("❌ Failed to update user.", "error"); }
  };

  const filteredUsers = users.filter(u =>
    (roleFilter === "All" || u.role === roleFilter.toLowerCase() || u.professional_profiles?.[0]?.sub_role === roleFilter) &&
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
  );

  const NAV = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"verify",   icon:"🔍", label:"Verify",   badge: pending.length },
    { id:"users",    icon:"👥", label:"Users" },
    { id:"bookings", icon:"📅", label:"Bookings" },
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
              <h1 className="text-white text-2xl font-extrabold mb-1">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">PETclub Platform · All Regions</p>
            </div>
            <div className="px-5 -mt-8">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard icon="👥" label="Total Users"    value={stats?.users ?? users.length}  gradient="bg-gradient-to-br from-blue-500 to-blue-700"     onClick={() => setView("users")}/>
                <StatCard icon="✅" label="Verified Pros"  value={stats?.verified_pros ?? 0}    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"/>
                <StatCard icon="⏳" label="Pending Review" value={pending.length} sub={pending.length > 0 ? "Needs action" : "All clear!"} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => pending.length && setView("verify")}/>
                <StatCard icon="📅" label="Total Bookings" value={bookings.length}               gradient="bg-gradient-to-br from-violet-500 to-purple-600"   onClick={() => setView("bookings")}/>
              </div>
              {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 mb-5 shadow-sm">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Bookings</h2>
                  <button onClick={() => setView("bookings")} className="text-xs text-orange-500 font-semibold">View all</button>
                </div>
                {bookings.length === 0 ? <div className="px-5 py-8 text-center text-sm text-gray-400">No bookings yet.</div>
                : bookings.slice(0,6).map((b,i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base shrink-0">🐕</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                      <div className="text-xs text-gray-400">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"}</div>
                    </div>
                    <Bdg text={b.status} cls={sColor(b.status)}/>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setView("users")} className="text-xs text-orange-500 font-semibold">View all</button>
                </div>
                {users.slice(0,5).map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{rIcon(proRole || u.role)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize">{proRole || u.role}</div>
                      </div>
                      <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")}/>
                    </div>
                  );
                })}
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
                      {Array.isArray(pro.services) && pro.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pro.services.map(s => <span key={s} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">{s}</span>)}
                        </div>
                      )}
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
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Users</h1>
              <span className="text-sm text-gray-400">{users.length} total</span>
            </div>
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition"/>
            </div>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {["All","customer","Groomer","Trainer","Vet"].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all ${roleFilter === r ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                  {r === "customer" ? "🐕 Pet Owners" : r === "All" ? "All" : `${rIcon(r)} ${r}s`}
                </button>
              ))}
            </div>
            {filteredUsers.length === 0 ? <EmptyState icon="👥" title="No users found" desc="Try a different search or filter."/> : (
              <div className="space-y-2">
                {filteredUsers.map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  const verStatus = u.professional_profiles?.[0]?.verification_status;
                  return (
                    <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl shrink-0">{rIcon(proRole || u.role)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize truncate">{proRole || u.role} · {u.phone}</div>
                        {proRole && verStatus && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${sColor(verStatus)}`}>{verStatus}</span>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")}/>
                        <button onClick={() => suspend(u.id)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${u.is_active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                          {u.is_active ? "Suspend" : "Restore"}
                        </button>
                        {/* Role assignment for professionals with missing sub_role */}
                        {u.role === "professional" && !proRole && (
                          <select
                            defaultValue=""
                            onChange={async e => {
                              if (!e.target.value) return;
                              try {
                                await api.setUserSubRole(u.id, e.target.value);
                                setUsers(l => l.map(x => x.id === u.id
                                  ? { ...x, professional_profiles: [{ ...(x.professional_profiles?.[0] || {}), sub_role: e.target.value }] }
                                  : x));
                                showToast(`✅ Set as ${e.target.value}`);
                              } catch { showToast("❌ Failed", "error"); }
                            }}
                            className="text-xs border border-orange-200 text-orange-600 rounded-full px-2 py-1 bg-orange-50 cursor-pointer">
                            <option value="">Set role…</option>
                            <option value="Groomer">✂️ Groomer</option>
                            <option value="Trainer">🎓 Trainer</option>
                            <option value="Vet">🏥 Vet</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "bookings" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Bookings</h1>
              <span className="text-sm text-gray-400">{bookings.length} total</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { l:"Upcoming",  v:bookings.filter(b=>b.status==="upcoming").length,  c:"bg-blue-50 text-blue-700" },
                { l:"Completed", v:bookings.filter(b=>b.status==="completed").length, c:"bg-emerald-50 text-emerald-700" },
                { l:"Total",     v:bookings.length,                                   c:"bg-orange-50 text-orange-700" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center ${s.c}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
            {bookings.length === 0 ? <EmptyState icon="📅" title="No bookings yet" desc="Bookings appear here once users start booking."/> : (
              <div className="space-y-3">
                {bookings.map((b,i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} · ${fmtTime(b.scheduled_at)}` : "—"}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                    {b.amount && <div className="text-xs font-bold text-gray-700">{b.amount}</div>}
                  </div>
                ))}
              </div>
            )}
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
