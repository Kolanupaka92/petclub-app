import { useState, useRef, useEffect } from "react";
import { api, saveToken } from "./api.js";
// Phone auth — all countries via Firebase Phone Auth (Blaze plan)
//   India (+91) → Firebase  ($0.0023/verification)
//   USA   (+1)  → Firebase  ($0.0060/verification)
//   Fallback    → Backend Twilio/email OTP when Firebase is unavailable
import { initPhoneAuth, sendPhoneOtp, verifyPhoneOtp, clearPhoneAuth } from "./firebase.js";
import { AddressPicker } from "./components/AddressPicker.jsx";

/* ── Constants ── */
const COUNTRIES = [
  { code: "1",  flag: "🇺🇸", name: "United States", placeholder: "4155552671" },
  { code: "91", flag: "🇮🇳", name: "India",          placeholder: "9876543210" },
];

const ROLES = [
  {
    id: "customer", icon: "🐾", label: "Pet Owner",
    color: "#f97316", bg: "#fff7ed", border: "#fed7aa", textColor: "#c2410c",
    instant: true,
    tagline: "Book services for your pet",
    desc: "Grooming, training, vet visits & health records — all in one place.",
    perks: ["Book grooming, training & vet care", "Digital health records", "Real-time service tracking"],
  },
  {
    id: "Groomer", icon: "✂️", label: "Groomer",
    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", textColor: "#6d28d9",
    instant: false,
    tagline: "Offer professional grooming",
    desc: "Join PETclub's verified groomer network and grow your client base.",
    perks: ["Get discovered by pet owners", "Manage bookings & schedule", "Build 5-star reviews"],
  },
  {
    id: "Trainer", icon: "🐕‍🦺", label: "Dog Trainer",
    color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", textColor: "#1d4ed8",
    instant: false,
    tagline: "Provide training & coaching",
    desc: "Connect with pet owners who need expert training and behaviour help.",
    perks: ["Set your own rates & availability", "Certified trainer badge", "Progress reports for clients"],
  },
  {
    id: "Vet", icon: "🏥", label: "Veterinarian",
    color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", textColor: "#047857",
    instant: false,
    tagline: "Offer vet care & consults",
    desc: "Reach pet owners in your city and offer in-clinic or home visit care.",
    perks: ["In-clinic & home visit bookings", "Digital prescription records", "Verified vet badge"],
  },
];

const SPECIES = ["Dog","Cat","Bird","Rabbit","Fish","Hamster","Other"];

/* ── Dynamic ID types based on country code ── */
const getIdTypes = (cc) => cc === "91" ? [
  { value:"aadhar",   label:"Aadhar Card",      hint:"12-digit number (e.g. 1234 5678 9012)", required: true,
    validate: v => /^\d{12}$/.test(v.replace(/\s/g,"")) ? null : "Aadhar must be exactly 12 digits" },
  { value:"pan",      label:"PAN Card",          hint:"e.g. ABCDE1234F",
    validate: v => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim()) ? null : "Invalid PAN format (e.g. ABCDE1234F)" },
  { value:"passport", label:"Passport",          hint:"Passport number" },
  { value:"dl",       label:"Driving License",   hint:"DL number" },
] : [
  { value:"dl",       label:"Driver's License",  hint:"State DL number", required: true },
  { value:"passport", label:"Passport",          hint:"Passport number" },
  { value:"state_id", label:"State ID",          hint:"State-issued ID number" },
];

/* ── Professional certification types ── */
const getCertTypes = (role) => ({
  Groomer: [
    "Pet Grooming Certificate",
    "International Professional Groomers (IPG)",
    "National Dog Groomers Association (NDGA)",
    "City & Guilds Animal Care",
    "Other Grooming Certification",
  ],
  Trainer: [
    "CPDT-KA (Certified Professional Dog Trainer)",
    "International Association of Animal Behavior Consultants",
    "AKC Canine Good Citizen Evaluator",
    "Victoria Stilwell Academy",
    "Other Training Certification",
  ],
  Vet: [
    "BVSc & AH Degree",
    "MVSc / PhD (Veterinary Science)",
    "Veterinary Council of India Registration",
    "NAVLE License (USA)",
    "State Veterinary Practice License",
    "Other Veterinary License",
  ],
})[role] || ["Professional Certificate", "Other"];

const HERO = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=85";


/* ── OTP single digit box ── */
const OtpBox = ({ value, onChange, onKeyDown, inputRef, active }) => (
  <input ref={inputRef} type="text" inputMode="numeric" maxLength={1} value={value}
    onChange={onChange} onKeyDown={onKeyDown}
    className={`w-11 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none
      ${value ? "border-orange-500 bg-orange-50 text-orange-600 scale-105"
              : active ? "border-orange-400 bg-white" : "border-gray-200 bg-gray-50 text-gray-800"}
      focus:border-orange-500 focus:bg-white focus:scale-105`}
  />
);

/* ── Country picker ── */
const CountryPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-full px-3 bg-gray-50 border-r border-gray-200 rounded-l-2xl hover:bg-orange-50 transition-colors min-w-[90px]">
        <span className="text-base">{current.flag}</span>
        <span className="text-sm font-bold text-gray-800">+{current.code}</span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:9999,minWidth:210,
          background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,
          boxShadow:"0 10px 40px rgba(0,0,0,0.15)",overflow:"hidden"}}>
          {COUNTRIES.map(c => (
            <button key={c.code} type="button"
              onClick={() => { onChange(c.code); setOpen(false); }}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",
                background: c.code === value ? "#fff7ed" : "transparent",border:"none",cursor:"pointer"}}>
              <span style={{fontSize:22}}>{c.flag}</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontWeight:600,color:"#1e293b",fontSize:14}}>{c.name}</div>
              </div>
              <span style={{fontFamily:"monospace",color:"#94a3b8",fontSize:13}}>+{c.code}</span>
              {c.code === value && <span style={{color:"#f97316",fontWeight:700}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Email typo detection ── */
const EMAIL_TYPOS = {
  // gmail
  'gamil.com':'gmail.com','gmai.com':'gmail.com','gmail.co':'gmail.com',
  'gmail.con':'gmail.com','gmail.conm':'gmail.com','gmail.cpm':'gmail.com',
  'gmail.cim':'gmail.com','gmail.cm':'gmail.com','gmail.cmo':'gmail.com',
  'gmail.ocm':'gmail.com','gmail.copm':'gmail.com',
  'gmal.com':'gmail.com','gmial.com':'gmail.com','gnail.com':'gmail.com',
  'gmali.com':'gmail.com','gmil.com':'gmail.com','gmaill.com':'gmail.com',
  // yahoo
  'yaho.com':'yahoo.com','yahooo.com':'yahoo.com','yahoo.co':'yahoo.com',
  'yamil.com':'yahoo.com','ymail.com':'yahoo.com','yahool.com':'yahoo.com',
  'yhoo.com':'yahoo.com','yaho.in':'yahoo.com','yahoo.con':'yahoo.com',
  'yahoo.conm':'yahoo.com','yahoo.cmo':'yahoo.com','yahoo.ocm':'yahoo.com',
  // hotmail
  'hotmial.com':'hotmail.com','hotmai.com':'hotmail.com','hotmail.co':'hotmail.com',
  'hotmil.com':'hotmail.com','hotmail.con':'hotmail.com','hotmail.conm':'hotmail.com',
  'hotmail.cmo':'hotmail.com','hotmaill.com':'hotmail.com',
  // outlook
  'outlok.com':'outlook.com','outook.com':'outlook.com','outlook.co':'outlook.com',
  'outllook.com':'outlook.com','outlook.con':'outlook.com','outlook.conm':'outlook.com',
  'outlook.cmo':'outlook.com',
  // icloud
  'iclod.com':'icloud.com','icould.com':'icloud.com','icloud.co':'icloud.com',
  'icloud.con':'icloud.com','icloud.conm':'icloud.com',
  // rediffmail
  'redif.com':'rediffmail.com','redifmail.com':'rediffmail.com',
  // others
  'zoho.co':'zoho.com','protonmal.com':'protonmail.com',
};
export const getEmailSuggestion = (email) => {
  if (!email?.includes('@')) return null;
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();

  // Exact typo map lookup only — no regex (regex was matching valid .com)
  const fix = EMAIL_TYPOS[domain];
  return fix ? `${local}@${fix}` : null;
};

/* ── Address Autocomplete (thin wrapper — keeps backward compat with App.jsx / PetclubApp.jsx) ── */
export const AddressInput = ({ value, onChange, placeholder, cc, className }) => (
  <AddressPicker
    value={value}
    onChange={({ address }) => onChange(address)}
    placeholder={placeholder}
    countryCode={cc === "91" ? "in" : "us"}
    className={className}
  />
);

/* ── Document photo upload box ── */
const DocUploadBox = ({ preview, onFile, onClear, accept = "image/*", label, hint }) => (
  preview ? (
    <div className="relative rounded-xl overflow-hidden border-2 border-slate-300">
      <img src={preview} alt="Doc" className="w-full h-28 object-cover"/>
      <button type="button" onClick={onClear}
        className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600">×</button>
    </div>
  ) : (
    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:bg-slate-100/50 transition bg-white/50">
      <span className="text-2xl mb-1">📷</span>
      <span className="text-sm font-semibold text-slate-600">{label || "Upload photo"}</span>
      <span className="text-xs text-gray-400 mt-0.5">{hint || "JPG / PNG · Max 5 MB"}</span>
      <input type="file" accept={accept} className="hidden" onChange={onFile}/>
    </label>
  )
);

/* ══════════════════════════════════════════
   MAIN LOGIN COMPONENT
══════════════════════════════════════════ */
export default function Login({ onLogin }) {
  const [step, setStep]     = useState("start");
  const [mode, setMode]     = useState(null);
  const [cc, setCC]         = useState("91");   // default India
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState("");
  const [loginMethod, setLoginMethod] = useState("phone"); // "phone" | "email"
  const [otp, setOtp]       = useState(["","","","","",""]);
  const [role, setRole]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [shake, setShake]   = useState(false);
  const [timer, setTimer]   = useState(0);
  const [emailSuggestion, setEmailSuggestion] = useState("");
  const [pendingPhone, setPendingPhone] = useState(""); // E.164 used for Twilio (US) route
  const [phoneRoute, setPhoneRoute] = useState("twilio"); // "twilio" (US) | "firebase" (India)
  const [otpNote, setOtpNote] = useState(""); // info banner shown on OTP step (e.g. email fallback)
  const [fbReady, setFbReady] = useState(null); // null=initializing, true=ok, false=failed — India only
  const otpRefs = useRef([]);

  /* ── Firebase init — all countries (India + USA + fallback) ── */
  useEffect(() => {
    const needsFirebase = step === "phone" && loginMethod === "phone";
    if (!needsFirebase) {
      setFbReady(null); // reset whenever we leave the phone step
      return;
    }
    setFbReady(null);
    let cancelled = false;
    (async () => {
      try {
        const ok = await initPhoneAuth("recaptcha-container");
        if (!cancelled) setFbReady(ok ? true : false);
      } catch {
        if (!cancelled) setFbReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, cc, loginMethod]);

  /* ── Cleanup Firebase on unmount ── */
  useEffect(() => {
    return () => { clearPhoneAuth(); };
  }, []);

  /* ── Customer profile ── */
  const [cust, setCust] = useState({
    name:"", email:"", address:"",
    petName:"", petSpecies:"Dog", petBreed:"", petAge:"", petGender:"Male",
    referralInput:"",
  });
  const [custAddrMeta, setCustAddrMeta] = useState({ lat:null, lng:null, postalCode:"", city:"", state:"" });
  const [custId, setCustId] = useState({ type:"aadhar", number:"", photo:null, photoName:"", preview:null });

  /* ── Professional profile ── */
  const [pro, setPro]   = useState({ name:"", email:"", city:"", address:"" });
  const [proAddrMeta, setProAddrMeta] = useState({ lat:null, lng:null, postalCode:"", city:"", state:"" });
  const [proId, setProId] = useState({ type:"aadhar", number:"", photo:null, photoName:"", preview:null });
  const [proCert, setProCert] = useState({ type:"", photo:null, photoName:"", preview:null });
  const [partnerAgreed,    setPartnerAgreed]    = useState(false);
  const [showAgreement,    setShowAgreement]    = useState(false);

  const country  = COUNTRIES.find(c => c.code === cc) || COUNTRIES[0];
  const selRole  = ROLES.find(r => r.id === role);
  const isIndia  = cc === "91";
  const idTypes  = getIdTypes(cc);
  const certTypes = role && role !== "customer" ? getCertTypes(role) : [];

  /* ── Auto-set default ID type when country changes ── */
  useEffect(() => {
    const def = isIndia ? "aadhar" : "dl";
    setCustId(p => ({ ...p, type: def, number: "", photo: null, preview: null }));
    setProId(p => ({ ...p, type: def, number: "", photo: null, preview: null }));
  }, [cc]);

  /* ── OTP resend timer ── */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(n => (n <= 1 ? (clearInterval(t), 0) : n - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const showErr = msg => { setErr(msg); setShake(true); setTimeout(() => setShake(false), 450); };

  const signupSteps = ["pick-role", "phone", "otp", "profile"];
  const signinSteps = ["phone", "otp"];
  const flowSteps   = mode === "signup" ? signupSteps : signinSteps;
  const stepIdx     = flowSteps.indexOf(step);

  /* ── Send OTP ──
       Phone (all countries) → Firebase Phone Auth (India $0.0023 · USA $0.0060/verification)
       Firebase unavailable  → Backend Twilio SMS → email fallback
       Email                 → Backend email OTP (always available)
  ── */
  const sendOtp = async () => {
    setLoading(true); setErr("");
    try {
      if (loginMethod === "email") {
        const trimmedEmail = email.trim();
        const emailOk = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/.test(trimmedEmail);
        const tld = trimmedEmail.split('.').pop().toLowerCase();
        const fakeTlds = ['coin','test','fake','invalid','example','localhost','local','internal'];
        if (!emailOk || fakeTlds.includes(tld))
          return showErr("Enter a valid email address (e.g. you@gmail.com)");
        if (trimmedEmail.toLowerCase() !== trimmedEmail.replace(/\s/g, '').toLowerCase())
          return showErr("Email cannot contain spaces");
        const otpSuggestion = getEmailSuggestion(trimmedEmail);
        if (otpSuggestion) return showErr(`"${trimmedEmail.split('@')[1]}" is not a valid domain. Did you mean ${otpSuggestion}?`);
        await api.sendEmailOTP(email.trim());
      } else {
        // Strip all non-digits, then remove a leading country-code prefix if the user
        // accidentally pasted the full international number (e.g. "+91 98765 43210").
        // Without this, e164 would double-prefix: +91919876543210 instead of +919876543210.
        let digits = phone.replace(/\D/g, "");
        if (digits.startsWith(cc)) digits = digits.slice(cc.length);
        if (digits.length < 6) return showErr("Enter a valid phone number");
        const e164 = `+${cc}${digits}`;

        if (fbReady === true) {
          // All countries → Firebase Phone Auth (India + USA, cheapest & most reliable)
          await sendPhoneOtp(e164);
          setPhoneRoute("firebase");
          setOtpNote("");
        } else {
          // Firebase unavailable → Backend Twilio/email fallback
          const smsRes = await api.sendPhoneOTP(e164, email.trim() || undefined);
          setPendingPhone(e164);
          setPhoneRoute("twilio");
          if (smsRes?.via === 'email') {
            setOtpNote(`📧 SMS failed — OTP sent to your email (${smsRes.email || email || 'address on file'}) instead.`);
          } else {
            setOtpNote("");
          }
        }
      }
      setStep("otp"); setOtp(["","","","","",""]); setTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) {
      showErr(e.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  /* ── Verify OTP — routes by phoneRoute set at send time ── */
  const verifyOtp = async (code) => {
    if (loading) return;
    const c = code ?? otp.join("");
    if (c.length !== 6) return showErr("Enter all 6 digits");
    setLoading(true); setErr("");
    try {
      let res;
      if (loginMethod === "email") {
        res = await api.verifyEmailOTP(email.trim(), c);
      } else if (phoneRoute === "firebase") {
        // India (+91): confirm via Firebase → firebase.js exchanges ID token for PETclub JWT
        res = await verifyPhoneOtp(c);
      } else {
        // US (+1): backend Twilio OTP
        res = await api.verifyPhoneOTP(pendingPhone, c);
      }
      saveToken(res.token);
      if (mode === "signup" || res.isNew || res.user?.role === "pending_role") {
        // Pre-fill email from the login-step email field (used when loginMethod==="email")
        if (email.trim()) {
          setCust(cv => ({ ...cv, email: cv.email || email.trim() }));
          setPro(p => ({ ...p, email: p.email || email.trim() }));
        }
        // Sign In path (mode==="signin") never sets role — default to "customer"
        // so the profile step always renders a form instead of blank screen.
        if (mode !== "signup" && !role) setRole("customer");
        setStep("profile");
      } else {
        onLogin({ ...res.user });
      }
    } catch (e) {
      showErr(e.message || "Wrong OTP. Try again.");
    } finally { setLoading(false); }
  };

  const handleBox = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next); setErr("");
    if (val && i < 5) otpRefs.current[i+1]?.focus();
    if (next.join("").length === 6) verifyOtp(next.join(""));
  };
  const handlePaste = e => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (!p) return;
    const next = [...p.split(""), ...Array(6).fill("")].slice(0,6);
    setOtp(next);
    if (p.length === 6) verifyOtp(p);
    else otpRefs.current[p.length]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  /* ── Photo handlers ── */
  const makePhotoHandler = (setter) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5*1024*1024) return showErr("Photo must be under 5 MB");
    const r = new FileReader();
    r.onload = ev => setter(p => ({ ...p, photo: ev.target.result, photoName: f.name, preview: ev.target.result }));
    r.readAsDataURL(f);
  };
  const handleCustIdPhoto  = makePhotoHandler(setCustId);
  const handleProIdPhoto   = makePhotoHandler(setProId);
  const handleCertPhoto    = makePhotoHandler(setProCert);

  /* ── Validate ID number ── */
  const validateIdNumber = (idType, number, cc) => {
    const type = getIdTypes(cc).find(t => t.value === idType);
    if (type?.validate) return type.validate(number);
    return null;
  };

  /* ── Submit profile ── */
  const submit = async () => {
    setErr("");
    const isCust = role === "customer";

    if (isCust) {
      if (!cust.name.trim())    return showErr("Enter your name");
      if (!cust.address.trim()) return showErr("Enter your address — we need it for service delivery");
      if (!custAddrMeta.lat)    return showErr("Please search and select your address from the dropdown — we need the correct pincode and city for service delivery");
      if (!cust.petName.trim()) return showErr("Enter your pet's name");
      // Email validation (optional field — only validate if filled)
      if (cust.email.trim()) {
        const ce = cust.email.trim();
        const ceOk = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/.test(ce);
        const ceTld = ce.split('.').pop().toLowerCase();
        const fakeTlds = ['coin','test','fake','invalid','example','localhost','local','internal'];
        if (!ceOk || fakeTlds.includes(ceTld)) return showErr("Enter a valid email address (e.g. you@gmail.com)");
        const ceSugg = getEmailSuggestion(ce);
        if (ceSugg) return showErr(`"${ce.split('@')[1]}" is not a valid domain. Did you mean ${ceSugg}?`);
      }
      // ID verification
      if (!custId.type)         return showErr("Select an ID type for verification");
      if (!custId.number.trim()) return showErr(`Enter your ${getIdTypes(cc).find(t=>t.value===custId.type)?.label || "ID"} number`);
      const idErr = validateIdNumber(custId.type, custId.number, cc);
      if (idErr) return showErr(idErr);
      if (!custId.photo)        return showErr("Upload a photo of your ID document");
    } else {
      if (!pro.name.trim())     return showErr("Enter your full name");
      if (!pro.email.trim())    return showErr("Email is required for approval notification");
      // Validate address confirmed from dropdown
      if (!pro.address.trim())  return showErr("Enter your full address");
      if (!proAddrMeta.lat)     return showErr("Please search and select your address from the dropdown — we need the correct pincode and city");
      // Validate professional email format + typos
      const pe = pro.email.trim();
      const peOk = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/.test(pe);
      const peTld = pe.split('.').pop().toLowerCase();
      const fakeTlds2 = ['coin','test','fake','invalid','example','localhost','local','internal'];
      if (!peOk || fakeTlds2.includes(peTld)) return showErr("Enter a valid email address (e.g. you@gmail.com)");
      const peSugg = getEmailSuggestion(pe);
      if (peSugg) return showErr(`"${pe.split('@')[1]}" is not a valid domain. Did you mean ${peSugg}?`);
      if (!pro.city.trim())     return showErr("Enter your city");
      // Government ID
      if (!proId.type)          return showErr("Select a government ID type");
      if (!proId.number.trim()) return showErr(`Enter your ${getIdTypes(cc).find(t=>t.value===proId.type)?.label || "ID"} number`);
      const idErr = validateIdNumber(proId.type, proId.number, cc);
      if (idErr) return showErr(idErr);
      if (!proId.photo)         return showErr("Upload a photo of your government ID");
      // Professional certification
      if (!proCert.type)        return showErr("Select your professional certification type");
      if (!proCert.photo)       return showErr("Upload your professional certification document");
    }

    setLoading(true);
    try {
      const addrMeta = isCust ? custAddrMeta : proAddrMeta;
      const res = await api.setRole(
        isCust ? "customer" : "professional",
        isCust ? undefined : role,
        isCust ? cust.name.trim() : pro.name.trim(),
        isCust ? (cust.email.trim()||undefined) : pro.email.trim(),
        isCust ? undefined : pro.city.trim(),
        isCust ? cust.address.trim() : pro.address.trim(),
        isCust ? { name: cust.petName.trim(), species: cust.petSpecies, breed: cust.petBreed||undefined, age: cust.petAge||undefined, gender: cust.petGender } : undefined,
        addrMeta.lat,
        addrMeta.lng,
        addrMeta.postalCode || undefined,
        addrMeta.city       || undefined,
        addrMeta.state      || undefined,
        isCust ? (cust.referralInput.trim() || undefined) : undefined
      );
      saveToken(res.token);

      if (isCust) {
        // Upload customer government ID (non-blocking)
        api.uploadUserIdPhoto({ docType: custId.type, docNumber: custId.number.trim(), docPhoto: custId.photo })
          .catch(e => console.warn("Customer ID upload:", e.message));
      } else {
        // Upload professional government ID + certification
        api.uploadIdPhoto({ docType: proId.type, docNumber: proId.number.trim(), docPhoto: proId.photo,
          certType: proCert.type, certPhoto: proCert.photo })
          .catch(e => console.warn("Pro ID upload:", e.message));
      }

      onLogin({ ...res.user });
    } catch (e) { showErr(e.message || "Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  /* ── Shared input class ── */
  const inp = "w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all";

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="min-h-screen min-h-[100dvh] flex">

      {/* ── LEFT: Hero panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="PETclub" className="w-10 h-10 rounded-xl" />
            <span className="text-white font-extrabold text-2xl tracking-tight">PET<span className="text-orange-400">club</span></span>
          </div>
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {["✂️ Grooming","🐕‍🦺 Training","🏥 Vet Care","🍖 Pet Food"].map(s => (
                <span key={s} className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">{s}</span>
              ))}
            </div>
            <h2 className="text-white text-4xl font-extrabold leading-tight">Premium pet care,<br />at your doorstep 🐾</h2>
            <p className="text-white/60 text-sm mt-3">Trusted by pet parents across India & USA</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-5 py-10 overflow-y-auto">
        <div className={`w-full max-w-sm ${shake ? "animate-shake" : ""}`}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img src="/icon.svg" alt="PETclub" className="w-9 h-9 rounded-xl" />
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">PET<span className="text-orange-500">club</span></span>
          </div>

          {/* Step progress dots */}
          {step !== "start" && stepIdx >= 0 && (
            <div className="flex gap-1.5 mb-7">
              {flowSteps.map((s, i) => (
                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                  i === stepIdx ? "bg-orange-500 flex-[2]" :
                  i < stepIdx  ? "bg-orange-300 flex-1" : "bg-gray-200 flex-1"
                }`} />
              ))}
            </div>
          )}

          {/* ══════════════════════════════
               STEP: START
          ══════════════════════════════ */}
          {step === "start" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome to PETclub</h1>
                <p className="text-gray-500 text-sm mt-1">India's #1 pet care platform — no password needed.</p>
              </div>

              <button onClick={() => { setMode("signin"); setStep("phone"); setErr(""); }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 transition-all group text-left">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">🔑</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-base">Sign In</div>
                  <div className="text-xs text-gray-500 mt-0.5">Already have an account? Sign in with OTP</div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Create Account — Choose your role</p>
                <div className="space-y-2.5">
                  {ROLES.map(r => (
                    <button key={r.id} type="button"
                      onClick={() => { setMode("signup"); setRole(r.id); setStep("phone"); setErr(""); }}
                      className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:shadow-md transition-all group text-left"
                      onMouseEnter={e => e.currentTarget.style.borderColor = r.border}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#f1f5f9"}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-transform group-hover:scale-105"
                        style={{background: r.bg, border: `2px solid ${r.border}`}}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{r.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r.instant ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>{r.instant ? "✅ Instant" : "⏳ 24–48h review"}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{r.tagline}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════
               STEP: PHONE
          ══════════════════════════════ */}
          {step === "phone" && (
            <div className="space-y-5">
              {mode === "signup" && selRole ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
                      style={{background: selRole.bg, border: `2px solid ${selRole.border}`}}>
                      {selRole.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{selRole.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          selRole.instant ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>{selRole.instant ? "✅ Instant" : "⏳ 24–48h review"}</span>
                      </div>
                      <p className="text-xs text-gray-500">{selRole.tagline}</p>
                    </div>
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Verify your identity</h1>
                  <p className="text-gray-500 text-sm mt-0.5">We'll send a one-time code to verify you.</p>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome back 👋</h1>
                  <p className="text-gray-500 text-sm mt-1">Sign in with your phone or email.</p>
                </div>
              )}

              {/* ── Login method toggle ── */}
              <div className="flex rounded-2xl border-2 border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
                <button type="button"
                  onClick={() => { setLoginMethod("phone"); setErr(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${loginMethod === "phone" ? "bg-white text-orange-600 shadow-sm border border-orange-200" : "text-gray-400 hover:text-gray-600"}`}>
                  📱 Phone SMS
                </button>
                <button type="button"
                  onClick={() => { setLoginMethod("email"); setErr(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${loginMethod === "email" ? "bg-white text-orange-600 shadow-sm border border-orange-200" : "text-gray-400 hover:text-gray-600"}`}>
                  📧 Email OTP
                </button>
              </div>

              {/* ── Firebase init status (all countries) ── */}
              {loginMethod === "phone" && fbReady === null && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2.5 rounded-2xl">
                  <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin shrink-0"/>
                  <span>Setting up secure SMS verification…</span>
                </div>
              )}
              {loginMethod === "phone" && fbReady === false && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2.5 rounded-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="shrink-0">📱</span>
                    <span>Firebase unavailable — OTP will be sent via <strong>SMS backup</strong>. Tap <em>Send OTP</em> to continue, or switch to Email OTP.</span>
                  </div>
                </div>
              )}

              {/* ── Phone input ── */}
              {loginMethod === "phone" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                  <div className="flex border-2 border-gray-200 rounded-2xl focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50 transition-all bg-white h-14"
                    style={{overflow:"visible", position:"relative"}}>
                    <CountryPicker value={cc} onChange={v => { setCC(v); setPhone(""); setErr(""); }} />
                    <input type="tel" inputMode="numeric" autoComplete="tel"
                      placeholder={country.placeholder} maxLength={15}
                      value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,15)); setErr(""); }}
                      onKeyDown={e => e.key === "Enter" && sendOtp()}
                      className="flex-1 px-4 text-base font-semibold focus:outline-none bg-transparent placeholder-gray-300 rounded-r-2xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-3">
                      Email <span className="text-gray-400 normal-case font-normal">(optional — booking confirmations)</span>
                    </label>
                    <input type="email" autoComplete="email" placeholder="you@example.com"
                      value={email} onChange={e => { const v = e.target.value; setEmail(v); setErr(""); setEmailSuggestion(getEmailSuggestion(v) || ""); }}
                      onKeyDown={e => e.key === "Enter" && sendOtp()}
                      className="w-full h-12 border-2 border-gray-200 rounded-2xl px-4 text-sm font-medium focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
                    {emailSuggestion && (
                      <div className="flex items-center gap-2 mt-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <span className="text-amber-500 text-sm shrink-0">💡</span>
                        <span className="text-xs text-amber-800 flex-1">Did you mean <strong>{emailSuggestion}</strong>?</span>
                        <button type="button" onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(""); }}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 underline shrink-0">Use this</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Email input ── */}
              {loginMethod === "email" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" autoComplete="email" autoFocus
                    placeholder="your@email.com"
                    value={email} onChange={e => { const v = e.target.value; setEmail(v); setErr(""); setEmailSuggestion(getEmailSuggestion(v) || ""); }}
                    onKeyDown={e => e.key === "Enter" && sendOtp()}
                    className="w-full h-14 border-2 border-gray-200 rounded-2xl px-4 text-base font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
                  {emailSuggestion && (
                    <div className="flex items-center gap-2 mt-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <span className="text-amber-500 text-sm shrink-0">💡</span>
                      <span className="text-xs text-amber-800 flex-1">Did you mean <strong>{emailSuggestion}</strong>?</span>
                      <button type="button" onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(""); }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 underline shrink-0">Use this</button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">📧 A 6-digit OTP will be sent to this email address.</p>
                </div>
              )}

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={sendOtp}
                disabled={loading || (loginMethod === "phone" && fbReady === null)}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending…</>
                  : (loginMethod === "phone" && fbReady === null)
                    ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Initializing…</>
                    : <>Send OTP →</>}
              </button>

              <button onClick={() => { setStep("start"); setErr(""); setPhone(""); setEmail(""); setRole(null); setMode(null); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ══════════════════════════════
               STEP: OTP
          ══════════════════════════════ */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enter OTP</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {loginMethod === "email"
                    ? <>OTP sent to <span className="font-semibold text-orange-600">{email}</span><br/><span className="text-xs text-gray-400">Check your inbox and spam folder</span></>
                    : <>SMS sent to {country.flag} <span className="font-semibold text-gray-700">+{cc} ···{phone.slice(-4)}</span>{email && <><br/><span className="text-xs text-gray-400">Confirmation emails will go to {email}</span></>}</>
                  }
                </p>
              </div>

              {/* SMS → email fallback notification */}
              {otpNote && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                  <span className="text-blue-500 shrink-0 text-sm">ℹ️</span>
                  <p className="text-xs text-blue-800 font-medium">{otpNote}</p>
                </div>
              )}

              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <OtpBox key={i} value={d} active={!d && otp.slice(0,i).every(Boolean)}
                    inputRef={el => (otpRefs.current[i] = el)}
                    onChange={e => handleBox(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)} />
                ))}
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={() => verifyOtp()} disabled={loading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Verifying…</> : "Verify & Continue →"}
              </button>

              <div className="flex items-center justify-between">
                <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setErr(""); }}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">← Change number</button>
                {timer > 0
                  ? <span className="text-xs text-gray-400">Resend in <strong className="text-orange-500">{timer}s</strong></span>
                  : <button onClick={sendOtp} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Resend OTP</button>
                }
              </div>
            </div>
          )}

          {/* ══════════════════════════════
               STEP: PROFILE — CUSTOMER
          ══════════════════════════════ */}
          {step === "profile" && role === "customer" && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-center justify-center text-2xl mb-3">🐾</div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">You & your pet</h1>
                <p className="text-gray-500 text-sm mt-1">Quick setup — you can always edit later.</p>
              </div>

              {/* Basic info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Name <span className="text-red-400">*</span></label>
                  <input type="text" autoComplete="name" placeholder="e.g. Arjun Mehta"
                    value={cust.name} onChange={e => setCust(f => ({...f, name: e.target.value}))}
                    className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email <span className="text-gray-400 normal-case font-normal">(booking confirmations)</span></label>
                  <input type="email" autoComplete="email" placeholder="you@example.com"
                    value={cust.email} onChange={e => setCust(f => ({...f, email: e.target.value}))}
                    className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Referral Code or Partner Name <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input type="text" autoComplete="off" placeholder="e.g. PCR-A1B2C3-D4E5F6 or Dr. Sharma's Clinic"
                    value={cust.referralInput} onChange={e => setCust(f => ({...f, referralInput: e.target.value}))}
                    className={inp} />
                  <p className="text-xs text-gray-400 mt-1">🎁 Got a referral code from a friend, or recommended by a vet / pet shop? Enter it here.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Address <span className="text-red-400">*</span></label>
                  <AddressPicker
                    value={cust.address}
                    onChange={({ address, lat, lng, postalCode, city, state }) => {
                      setCust(f => ({...f, address}));
                      setCustAddrMeta({ lat, lng, postalCode, city, state });
                    }}
                    placeholder={isIndia ? "e.g. 12 MG Road, Koramangala, Bengaluru" : "e.g. 123 Main St, San Francisco, CA"}
                    countryCode={cc === "91" ? "in" : "us"}
                  />
                  <p className="text-xs text-gray-400 mt-1">📍 Where should professionals come to serve your pet?</p>
                </div>
              </div>

              {/* Pet info */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">🐾 Your Pet</p>
                <input type="text" placeholder="Pet's name * (e.g. Bruno)"
                  value={cust.petName} onChange={e => setCust(f => ({...f, petName: e.target.value}))}
                  className="w-full h-11 border-2 border-orange-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition-all" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={cust.petSpecies} onChange={e => setCust(f => ({...f, petSpecies: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white">
                    {SPECIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={cust.petGender} onChange={e => setCust(f => ({...f, petGender: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white">
                    {["Male","Female"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Breed (optional)" value={cust.petBreed}
                    onChange={e => setCust(f => ({...f, petBreed: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400" />
                  <input type="number" placeholder="Age (years)" min="0" max="30" value={cust.petAge}
                    onChange={e => setCust(f => ({...f, petAge: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400" />
                </div>
              </div>

              {/* ── Identity Verification ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🪪</span>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identity Verification</p>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <p className="text-xs text-slate-500">
                  {isIndia
                    ? "Required by Indian regulations. Your data is encrypted and only visible to PETclub admins."
                    : "Required for account security. Your ID is encrypted and visible only to PETclub admins."}
                </p>

                {/* ID type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {idTypes.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setCustId(p => ({ ...p, type: t.value, number: "", photo: null, preview: null }))}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        custId.type === t.value
                          ? "border-orange-400 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        {t.label}
                        {t.required && <span className="text-red-400">*</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.hint}</div>
                    </button>
                  ))}
                </div>

                {/* ID number input */}
                {custId.type && (
                  <input
                    type={custId.type === "aadhar" ? "tel" : "text"}
                    inputMode={custId.type === "aadhar" ? "numeric" : "text"}
                    placeholder={idTypes.find(t => t.value === custId.type)?.hint || "ID number"}
                    value={custId.number}
                    maxLength={custId.type === "aadhar" ? 12 : 20}
                    onChange={e => setCustId(p => ({ ...p, number: e.target.value.replace(custId.type === "aadhar" ? /\D/g : /\s/g, "").slice(0, custId.type === "aadhar" ? 12 : 20) }))}
                    className="w-full h-11 border-2 border-slate-200 rounded-xl px-4 text-sm font-mono tracking-widest focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400"
                  />
                )}

                {/* Aadhar digit counter */}
                {custId.type === "aadhar" && custId.number && (
                  <p className={`text-xs font-semibold ${custId.number.length === 12 ? "text-emerald-600" : "text-amber-600"}`}>
                    {custId.number.length}/12 digits {custId.number.length === 12 ? "✓" : ""}
                  </p>
                )}

                {/* ID photo upload */}
                <DocUploadBox
                  preview={custId.preview}
                  onFile={handleCustIdPhoto}
                  onClear={() => setCustId(p => ({ ...p, photo: null, photoName: "", preview: null }))}
                  label="Upload ID photo"
                  hint="Front side · JPG / PNG · Max 5 MB"
                />
                <p className="text-xs text-slate-400">🔒 Encrypted & visible only to PETclub admins. Never shared publicly.</p>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account…</> : "Enter PETclub 🐾"}
              </button>
              <button onClick={() => { setStep("otp"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Back</button>
            </div>
          )}

          {/* ══════════════════════════════
               STEP: PROFILE — PROFESSIONAL
          ══════════════════════════════ */}
          {step === "profile" && role !== "customer" && selRole && (
            <div className="space-y-5">
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm"
                  style={{background: selRole.bg, border: `2px solid ${selRole.border}`}}>
                  {selRole.icon}
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selRole.label} Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Government ID + professional certification required. Review takes 24–48 hours.</p>
              </div>

              {/* What you get */}
              <div className="rounded-2xl p-4 space-y-2" style={{background: selRole.bg, border: `1px solid ${selRole.border}`}}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{color: selRole.textColor}}>What you get on PETclub</p>
                {selRole.perks.map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs" style={{color: selRole.textColor}}>
                    <span>✓</span><span>{p}</span>
                  </div>
                ))}
              </div>

              {/* 24h notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">⏳</span>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  After submitting, you'll get a <strong>confirmation email within 24–48 hours</strong> once admin reviews your ID and approves your account.
                </p>
              </div>

              {/* Personal info */}
              <div className="space-y-3">
                <input type="text" autoComplete="name" placeholder="Full name *"
                  value={pro.name} onChange={e => setPro(f => ({...f, name: e.target.value}))}
                  className={inp} />
                <input type="email" autoComplete="email" placeholder="Email * (approval sent here)"
                  value={pro.email} onChange={e => setPro(f => ({...f, email: e.target.value}))}
                  className={inp} />
                <input type="text" placeholder="Operating city * (e.g. Hyderabad)"
                  value={pro.city} onChange={e => setPro(f => ({...f, city: e.target.value}))}
                  className={inp} />
                <div>
                  <AddressPicker
                    value={pro.address}
                    onChange={({ address, lat, lng, postalCode, city, state }) => {
                      setPro(f => ({...f, address}));
                      setProAddrMeta({ lat, lng, postalCode, city, state });
                    }}
                    placeholder={isIndia ? "Full address (house/flat, area, city)" : "Full street address"}
                    countryCode={cc === "91" ? "in" : "us"}
                  />
                  <p className="text-xs text-gray-400 mt-1">📍 Your base location shown to customers when searching</p>
                </div>
              </div>

              {/* ── Government ID ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span>🪪</span>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Government ID</p>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <p className="text-xs text-slate-500">
                  {isIndia ? "Aadhar Card is mandatory for India. Encrypted & admin-only." : "Driver's License or Passport required. Encrypted & admin-only."}
                </p>

                {/* ID type tabs */}
                <div className="grid grid-cols-2 gap-2">
                  {idTypes.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setProId(p => ({ ...p, type: t.value, number: "", photo: null, preview: null }))}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        proId.type === t.value
                          ? "border-orange-400 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                      <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        {t.label}
                        {t.required && <span className="text-red-400">*</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.hint}</div>
                    </button>
                  ))}
                </div>

                {/* ID number */}
                {proId.type && (
                  <input
                    type={proId.type === "aadhar" ? "tel" : "text"}
                    inputMode={proId.type === "aadhar" ? "numeric" : "text"}
                    placeholder={idTypes.find(t => t.value === proId.type)?.hint || "ID number"}
                    value={proId.number}
                    maxLength={proId.type === "aadhar" ? 12 : 20}
                    onChange={e => setProId(p => ({ ...p, number: e.target.value.replace(proId.type === "aadhar" ? /\D/g : /\s/g, "").slice(0, proId.type === "aadhar" ? 12 : 20) }))}
                    className="w-full h-11 border-2 border-slate-200 rounded-xl px-4 text-sm font-mono tracking-widest focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400"
                  />
                )}

                {proId.type === "aadhar" && proId.number && (
                  <p className={`text-xs font-semibold ${proId.number.length === 12 ? "text-emerald-600" : "text-amber-600"}`}>
                    {proId.number.length}/12 digits {proId.number.length === 12 ? "✓" : ""}
                  </p>
                )}

                <DocUploadBox
                  preview={proId.preview}
                  onFile={handleProIdPhoto}
                  onClear={() => setProId(p => ({ ...p, photo: null, photoName: "", preview: null }))}
                  label="Upload government ID photo"
                  hint="Front side · JPG / PNG · Max 5 MB"
                />
              </div>

              {/* ── Professional Certification ── */}
              <div className="rounded-2xl p-4 space-y-3" style={{background: selRole.bg, border: `2px solid ${selRole.border}`}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{selRole.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{color: selRole.textColor}}>
                    Professional Certification
                  </p>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <p className="text-xs" style={{color: selRole.textColor, opacity: 0.8}}>
                  Upload your {selRole.label.toLowerCase()} certification or license. This builds trust with customers.
                </p>

                {/* Cert type */}
                <select
                  value={proCert.type}
                  onChange={e => setProCert(p => ({ ...p, type: e.target.value }))}
                  className="w-full h-11 border-2 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white"
                  style={{borderColor: selRole.border}}>
                  <option value="">Select certification type *</option>
                  {certTypes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Cert photo */}
                <DocUploadBox
                  preview={proCert.preview}
                  onFile={handleCertPhoto}
                  onClear={() => setProCert(p => ({ ...p, photo: null, photoName: "", preview: null }))}
                  label="Upload certification document"
                  hint="Certificate / Degree / License · JPG / PNG / PDF"
                  accept="image/*,.pdf"
                />
                <p className="text-xs" style={{color: selRole.textColor, opacity: 0.7}}>🔒 Verified by our team. Displayed as a badge on your profile once approved.</p>
              </div>

              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                🔒 All documents are encrypted and visible only to PETclub admins for verification. Never shared publicly.
              </p>

              {/* ── Partner Network Agreement ── */}
              <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 overflow-hidden">
                {/* Header — tap to expand */}
                <button
                  type="button"
                  onClick={() => setShowAgreement(a => !a)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <div>
                      <div className="font-bold text-orange-800 text-sm">PETclub Partner Network Agreement</div>
                      <div className="text-[11px] text-orange-600">Read before submitting — acceptance required</div>
                    </div>
                  </div>
                  <span className="text-orange-500 font-bold text-sm ml-2">{showAgreement ? "▲" : "▼"}</span>
                </button>

                {/* Agreement content */}
                {showAgreement && (
                  <div className="px-4 pb-4 space-y-4 border-t border-orange-200">

                    {/* Section 1 — Earnings */}
                    <div className="pt-3">
                      <p className="text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-2">1. Earnings & Compensation</p>
                      <div className="bg-gray-900 rounded-xl px-4 py-2.5 mb-2">
                        <p className="text-xs text-white font-semibold">Total Partner Earnings = 45% Commission + Travel Allowance + 100% of Tips</p>
                      </div>
                      <div className="space-y-1.5 text-xs text-orange-800">
                        <p>• <strong>45% Service Commission</strong> — you retain 45% of the base service value, including any add-ons upsold at the customer's doorstep.</p>
                        <p>• <strong>100% Gratuity</strong> — all tips (cash or in-app) go entirely to you. PETclub takes zero commission on tips.</p>
                      </div>
                      {/* Travel allowance table */}
                      <div className="mt-2 rounded-xl overflow-hidden border border-orange-200">
                        <div className="bg-gray-800 px-3 py-1.5">
                          <p className="text-xs font-bold text-white">Flat Travel Allowance (per completed job)</p>
                        </div>
                        {[
                          { tier:"Tier 1", dist:"Up to 8 km",   amt:"₹150" },
                          { tier:"Tier 2", dist:"8 – 20 km",    amt:"₹250" },
                          { tier:"Tier 3", dist:"20 – 40 km",   amt:"₹350 – ₹400" },
                        ].map((r, i) => (
                          <div key={r.tier} className={`flex items-center text-xs px-3 py-2 ${i % 2 === 0 ? "bg-white" : "bg-orange-50/50"}`}>
                            <span className="w-14 font-bold text-orange-700 shrink-0">{r.tier}</span>
                            <span className="flex-1 text-gray-600">{r.dist}</span>
                            <span className="font-extrabold text-emerald-700">{r.amt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2 — Insurance */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1">2. Company-Sponsored Insurance</p>
                      <p className="text-xs text-emerald-800">PETclub covers <strong>100%</strong> of your Group Accidental Insurance Policy premiums — zero deductions from your earnings. Coverage is active throughout all working hours including transit.</p>
                    </div>

                    {/* Section 3 — Weekly Settlement */}
                    <div>
                      <p className="text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-1.5">3. Weekly Settlement</p>
                      <p className="text-xs text-orange-800 mb-2">Earnings are transferred to your bank account <strong>every Saturday</strong>. You will receive an itemized statement via WhatsApp/App showing:</p>
                      <div className="space-y-1 text-xs text-orange-800">
                        {["Jobs completed during the week","Total gross service value","Your exact 45% commission","Travel allowances & performance bonuses"].map(item => (
                          <p key={item} className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span>{item}</p>
                        ))}
                      </div>
                    </div>

                    {/* Section 4 — Performance */}
                    <div>
                      <p className="text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-1.5">4. Performance Incentives</p>
                      <div className="space-y-1 text-xs text-orange-800">
                        <p>• <strong>🏆 Elite Award</strong> — Top groomer/trainer monthly: ₹1,500 cash bonus + Gold badge on profile for 30 days</p>
                        <p>• <strong>⭐ 5-Star Review Bonus</strong> — ₹100 extra for every review mentioning your name</p>
                        <p>• <strong>🔄 Subscription Conversion</strong> — ₹250 for every client on a recurring care package</p>
                        <p>• <strong>✅ Reliability Bonus</strong> — ₹750/month for 80+ jobs with zero last-minute cancellations</p>
                      </div>
                    </div>

                    {/* Section 5 — Operational Standards */}
                    <div>
                      <p className="text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-1.5">5. Operational Standards</p>
                      <div className="space-y-1 text-xs text-orange-800">
                        <p>• <strong>App Check-Ins</strong> — Log arrival, obtain customer signature on waiver, and close out before departing</p>
                        <p>• <strong>Visual QC</strong> — Upload before & after photos for every session via the app</p>
                        <p>• <strong>Insurance Validity</strong> — Coverage is linked to your active app check-in status</p>
                        <p>• <strong>Quality Gate</strong> — Repeated negative feedback may result in suspension from premium zones</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-orange-600 italic">This document is confidential and intended solely for authorised PETclub partners. Queries: eshwar.kolanupaka@mypetclub.app</p>
                  </div>
                )}

                {/* Acceptance checkbox — always visible */}
                <label className="flex items-start gap-3 px-4 py-3.5 cursor-pointer border-t border-orange-200 bg-white">
                  <input
                    type="checkbox"
                    checked={partnerAgreed}
                    onChange={e => setPartnerAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 leading-relaxed">
                    I have read and agree to the <strong>PETclub Partner Network Agreement</strong> — including the 45% commission structure, travel allowance tiers, weekly settlement terms, operational standards, and insurance policy.
                  </span>
                </label>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading || !partnerAgreed}
                className="w-full h-14 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                style={{background: selRole.color}}>
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</> : "Submit Application →"}
              </button>
              {!partnerAgreed && (
                <p className="text-center text-xs text-orange-600 -mt-2">☝️ Please read and accept the Partner Agreement above to continue</p>
              )}
              <button onClick={() => { setStep("otp"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Back</button>
            </div>
          )}

          <p className="text-center text-[11px] text-gray-400 mt-6">
            By continuing you agree to our{" "}
            <a href={import.meta.env.VITE_TERMS_URL || "https://mypetclub.app/terms.html"} target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
            {" "}&amp;{" "}
            <a href={import.meta.env.VITE_PRIVACY_URL || "https://mypetclub.app/privacy.html"} target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* reCAPTCHA container — required by Firebase for India (+91) phone auth.
          Stays outside conditional blocks so Firebase always finds it in the DOM. */}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, left: 0, zIndex: -1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
