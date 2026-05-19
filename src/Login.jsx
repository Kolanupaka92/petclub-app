import { useState, useRef, useEffect } from "react";
import { api, saveToken } from "./api.js";

/* ── Constants ── */
const COUNTRIES = [
  { code: "1",  flag: "🇺🇸", label: "USA",   name: "United States", placeholder: "4155552671" },
  { code: "91", flag: "🇮🇳", label: "India",  name: "India",         placeholder: "9876543210" },
];

const ROLES = [
  { id: "customer", icon: "🐕", label: "Pet Owner",     color: "bg-orange-500",  light: "bg-orange-50 border-orange-200 text-orange-700",  instant: true,  desc: "Book services & manage your pet's health" },
  { id: "Groomer",  icon: "✂️", label: "Groomer",       color: "bg-violet-500",  light: "bg-violet-50 border-violet-200 text-violet-700",  instant: false, desc: "Offer professional grooming services" },
  { id: "Trainer",  icon: "🎓", label: "Dog Trainer",   color: "bg-blue-500",    light: "bg-blue-50 border-blue-200 text-blue-700",        instant: false, desc: "Provide training & behaviour coaching" },
  { id: "Vet",      icon: "🏥", label: "Veterinarian",  color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200 text-emerald-700", instant: false, desc: "Offer vet care & consultations" },
];

const SPECIES  = ["Dog","Cat","Bird","Rabbit","Fish","Hamster","Other"];
const DOC_TYPES = ["Aadhar Card","Passport","Driving License","Professional Certificate"];
const HERO = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=85";

/* ── OTP single box ── */
const OtpBox = ({ value, onChange, onKeyDown, inputRef, active }) => (
  <input ref={inputRef} type="text" inputMode="numeric" maxLength={1} value={value}
    onChange={onChange} onKeyDown={onKeyDown}
    className={`w-11 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none select-none
      ${value ? "border-orange-500 bg-orange-50 text-orange-600 scale-105" : active ? "border-orange-400 bg-white" : "border-gray-200 bg-gray-50 text-gray-800"}
      focus:border-orange-500 focus:bg-white focus:scale-105`}
  />
);

/* ── Country picker dropdown ── */
const CountryPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  useEffect(() => {
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-full px-3 bg-gray-50 border-r border-gray-200 rounded-l-2xl hover:bg-orange-50 transition-colors min-w-[90px]">
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-sm font-bold text-gray-800">+{current.code}</span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:9999,minWidth:200,background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,boxShadow:"0 10px 40px rgba(0,0,0,0.15)",overflow:"hidden"}}>
          {COUNTRIES.map(c => (
            <button key={c.code} type="button"
              onClick={() => { onChange(c.code); setOpen(false); }}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 16px",background: c.code === value ? "#fff7ed" : "transparent",border:"none",cursor:"pointer",textAlign:"left"}}
              onMouseEnter={e => { if (c.code !== value) e.currentTarget.style.background="#fff7ed"; }}
              onMouseLeave={e => { if (c.code !== value) e.currentTarget.style.background="transparent"; }}>
              <span style={{fontSize:22}}>{c.flag}</span>
              <span style={{fontWeight:600,color:"#1e293b",fontSize:14}}>{c.name}</span>
              <span style={{marginLeft:"auto",fontFamily:"monospace",color:"#94a3b8",fontSize:13}}>+{c.code}</span>
              {c.code === value && <span style={{color:"#f97316",fontWeight:700,fontSize:14}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Login({ onLogin }) {
  const [step, setStep]     = useState("phone");
  const [cc, setCC]         = useState("1");
  const [phone, setPhone]   = useState("");
  const [email, setEmail]   = useState("");
  const [otp, setOtp]       = useState(["","","","","",""]);
  const [role, setRole]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [shake, setShake]   = useState(false);
  const [timer, setTimer]   = useState(0);
  const otpRefs = useRef([]);

  // Customer fields
  const [cust, setCust] = useState({ name:"", email:"", petName:"", petSpecies:"Dog", petBreed:"", petAge:"", petGender:"Male" });
  // Professional fields
  const [pro, setPro]   = useState({ name:"", email:"", city:"", docType:"Aadhar Card", docNumber:"", docPhoto:null, docPhotoName:"" });
  const [docPreview, setDocPreview] = useState(null);

  const country = COUNTRIES.find(c => c.code === cc) || COUNTRIES[0];
  const selRole = ROLES.find(r => r.id === role);

  /* timer */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(n => (n <= 1 ? (clearInterval(t), 0) : n - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const showErr = msg => { setErr(msg); setShake(true); setTimeout(() => setShake(false), 450); };

  const isIndia = cc === "91";

  /* ── send OTP ── */
  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) return showErr("Enter a valid phone number");
    if (isIndia && !email.trim()) return showErr("Email is required for India (+91) — OTP will be sent to your email");
    setLoading(true); setErr("");
    try {
      await api.sendOTP(digits, cc, email || undefined);
      setStep("otp"); setOtp(["","","","","",""]); setTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) { showErr(e.message || "Failed to send OTP. Try again."); }
    finally { setLoading(false); }
  };

  /* ── verify OTP ── */
  const verifyOtp = async (code) => {
    if (loading) return;
    const c = code ?? otp.join("");
    if (c.length !== 6) return showErr("Enter all 6 digits");
    setLoading(true); setErr("");
    try {
      const res = await api.verifyOTP(phone.replace(/\D/g,""), c, cc);
      saveToken(res.token);
      if (res.isNew || res.user?.role === "pending_role") {
        setStep("role");
      } else {
        onLogin({ ...res.user });
      }
    } catch (e) { showErr(e.message || "Wrong OTP. Try again."); }
    finally { setLoading(false); }
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

  /* ── doc photo ── */
  const handleDoc = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5*1024*1024) return showErr("Photo must be under 5 MB");
    const r = new FileReader();
    r.onload = ev => { setPro(p => ({...p, docPhoto: ev.target.result, docPhotoName: f.name})); setDocPreview(ev.target.result); };
    r.readAsDataURL(f);
  };

  /* ── submit profile ── */
  const submit = async () => {
    setErr("");
    const isCust = role === "customer";
    if (isCust) {
      if (!cust.name.trim()) return showErr("Enter your name");
      if (!cust.petName.trim()) return showErr("Enter your pet's name");
    } else {
      if (!pro.name.trim())   return showErr("Enter your full name");
      if (!pro.email.trim())  return showErr("Email is required (for approval notification)");
      if (!pro.city.trim())   return showErr("Enter your city");
      if (!pro.docNumber.trim()) return showErr("Enter your document number");
    }
    setLoading(true);
    try {
      const res = await api.setRole(
        isCust ? "customer" : "professional",
        isCust ? undefined : role,
        isCust ? cust.name.trim() : pro.name.trim(),
        isCust ? (cust.email.trim()||undefined) : pro.email.trim(),
        isCust ? undefined : pro.city.trim(),
        isCust ? { name: cust.petName.trim(), species: cust.petSpecies, breed: cust.petBreed||undefined, age: cust.petAge||undefined, gender: cust.petGender } : undefined
      );
      saveToken(res.token);
      if (!isCust) {
        await api.uploadIdPhoto({ docType: pro.docType, docNumber: pro.docNumber.trim(), docPhoto: pro.docPhoto||undefined })
          .catch(e => console.warn("ID doc non-critical:", e.message));
      }
      onLogin({ ...res.user });
    } catch (e) { showErr(e.message || "Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="min-h-screen min-h-[100dvh] flex">

      {/* ── LEFT: Hero ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl font-black text-white">🐾</div>
            <span className="text-white font-extrabold text-2xl tracking-tight">PET<span className="text-orange-400">club</span></span>
          </div>
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {["✂️ Grooming","🎓 Training","🏥 Vet Care","🍖 Pet Food"].map(s => (
                <span key={s} className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">{s}</span>
              ))}
            </div>
            <h2 className="text-white text-4xl font-extrabold leading-tight">
              Premium pet care,<br />at your doorstep 🐾
            </h2>
            <p className="text-white/60 text-sm mt-3">Trusted by 50,000+ pet parents across India & USA</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-5 py-10 overflow-y-auto">
        <div className={`w-full max-w-sm ${shake ? "animate-shake" : ""}`}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-base font-black text-white">🐾</div>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">PET<span className="text-orange-500">club</span></span>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mb-8">
            {["phone","otp","role","profile"].map((s,i) => (
              <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                s === step ? "bg-orange-500 flex-[2]" :
                ["phone","otp","role","profile"].indexOf(step) > i ? "bg-orange-300 flex-1" : "bg-gray-200 flex-1"
              }`} />
            ))}
          </div>

          {/* ══ PHONE ══ */}
          {step === "phone" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome to PETclub</h1>
                <p className="text-gray-500 text-sm mt-1">Sign in or create your free account — no password needed.</p>
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="flex border-2 border-gray-200 rounded-2xl focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-50 transition-all bg-white h-14" style={{overflow:"visible", position:"relative"}}>
                  <CountryPicker value={cc} onChange={v => { setCC(v); setPhone(""); setErr(""); }} />
                  <input type="tel" inputMode="numeric" autoComplete="tel"
                    placeholder={country.placeholder} maxLength={15}
                    value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,15)); setErr(""); }}
                    onKeyDown={e => e.key === "Enter" && sendOtp()}
                    className="flex-1 px-4 text-base font-semibold focus:outline-none bg-transparent placeholder-gray-300 rounded-r-2xl" />
                </div>
              </div>

              {/* India SMS notice */}
              {isIndia && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                  <span className="text-base shrink-0">📧</span>
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    <strong>India users:</strong> SMS OTP isn't available yet. Your OTP will be sent to your email — please enter it below.
                  </p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email{" "}
                  {isIndia
                    ? <span className="text-red-500 normal-case font-semibold">* (OTP sent here for India)</span>
                    : <span className="text-gray-400 normal-case font-normal">(optional — backup OTP if SMS is delayed)</span>
                  }
                </label>
                <input type="email" autoComplete="email" placeholder={isIndia ? "your@email.com (required)" : "you@example.com"}
                  value={email} onChange={e => { setEmail(e.target.value); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && sendOtp()}
                  className={`w-full h-12 border-2 rounded-2xl px-4 text-sm font-medium focus:outline-none focus:ring-4 bg-white placeholder-gray-300 transition-all ${
                    isIndia
                      ? "border-blue-300 focus:border-blue-500 focus:ring-blue-50"
                      : "border-gray-200 focus:border-orange-400 focus:ring-orange-50"
                  }`} />
              </div>

              {err && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span>⚠️</span>{err}
                </div>
              )}

              <button onClick={sendOtp} disabled={loading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending…</> : <>Send OTP <span className="text-lg">→</span></>}
              </button>

              <p className="text-center text-xs text-gray-400 leading-relaxed">
                🆕 <strong className="text-gray-600">New here?</strong> Your account is created automatically after OTP verification.
              </p>
            </div>
          )}

          {/* ══ OTP ══ */}
          {step === "otp" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enter OTP</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {isIndia ? (
                    <>OTP sent to <span className="text-blue-600 font-semibold">{email}</span><br/><span className="text-xs text-gray-400">Check your inbox (or spam folder)</span></>
                  ) : (
                    <>Sent to {country.flag} +{cc} ···{phone.slice(-4)}
                    {email && <><br/><span className="text-orange-500 font-medium text-xs">Also sent to {email}</span></>}</>
                  )}
                </p>
              </div>

              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <OtpBox key={i} value={d} active={!d && otp.slice(0,i).every(Boolean)}
                    inputRef={el => (otpRefs.current[i] = el)}
                    onChange={e => handleBox(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)} />
                ))}
              </div>

              {err && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span>⚠️</span>{err}
                </div>
              )}

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

          {/* ══ ROLE ══ */}
          {step === "role" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">I am a…</h1>
                <p className="text-gray-500 text-sm mt-1">Choose your account type. This cannot be changed later.</p>
              </div>

              <div className="space-y-2.5">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => { setRole(r.id); setErr(""); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                      role === r.id
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white"
                    }`}>
                    <div className={`w-11 h-11 ${r.color} rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{r.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.instant ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {r.instant ? "✅ Instant" : "⏳ 24-48h approval"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      role === r.id ? "border-orange-500 bg-orange-500" : "border-gray-300"
                    }`}>
                      {role === r.id && <div className="w-2 h-2 bg-white rounded-full"/>}
                    </div>
                  </button>
                ))}
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={() => { if (!role) return showErr("Please choose your role"); setStep("profile"); }}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                Continue →
              </button>
            </div>
          )}

          {/* ══ PROFILE: CUSTOMER ══ */}
          {step === "profile" && role === "customer" && (
            <div className="space-y-5">
              <div>
                <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center text-xl mb-3">🐕</div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">About you & your pet</h1>
                <p className="text-gray-500 text-sm mt-1">Quick setup — you can edit this later.</p>
              </div>

              {/* Your info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Name <span className="text-red-400">*</span></label>
                  <input type="text" autoComplete="name" placeholder="e.g. Arjun Mehta"
                    value={cust.name} onChange={e => setCust(f => ({...f, name: e.target.value}))}
                    className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email <span className="text-gray-400 normal-case font-normal">(for booking confirmations)</span></label>
                  <input type="email" autoComplete="email" placeholder="you@example.com"
                    value={cust.email} onChange={e => setCust(f => ({...f, email: e.target.value}))}
                    className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
                </div>
              </div>

              {/* Pet info */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">🐾 Your Pet</p>
                <input type="text" placeholder="Pet's name (e.g. Bruno) *"
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
                  <input type="text" placeholder="Breed (optional)" value={cust.petBreed} onChange={e => setCust(f => ({...f, petBreed: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400" />
                  <input type="number" placeholder="Age (years)" min="0" max="30" value={cust.petAge} onChange={e => setCust(f => ({...f, petAge: e.target.value}))}
                    className="h-11 border-2 border-orange-200 rounded-xl px-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400" />
                </div>
                <p className="text-xs text-orange-500">Add more pets anytime from the dashboard.</p>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account…</> : "Enter PETclub 🐾"}
              </button>
              <button onClick={() => { setStep("role"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Change role</button>
            </div>
          )}

          {/* ══ PROFILE: PROFESSIONAL ══ */}
          {step === "profile" && role !== "customer" && selRole && (
            <div className="space-y-5">
              <div>
                <div className={`w-11 h-11 ${selRole.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{selRole.icon}</div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selRole.label} Setup</h1>
                <p className="text-gray-500 text-sm mt-1">Government ID required. Review takes 24–48 hours.</p>
              </div>

              {/* 24h banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">⏳</span>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  After submitting, you'll receive a <strong>confirmation email within 24–48 hours</strong> once admin reviews and approves your account.
                </p>
              </div>

              {/* Personal */}
              <div className="space-y-3">
                <input type="text" autoComplete="name" placeholder="Full name *"
                  value={pro.name} onChange={e => setPro(f => ({...f, name: e.target.value}))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
                <input type="email" autoComplete="email" placeholder="Email address * (approval sent here)"
                  value={pro.email} onChange={e => setPro(f => ({...f, email: e.target.value}))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
                <input type="text" placeholder="Operating city * (e.g. Mumbai / Dallas)"
                  value={pro.city} onChange={e => setPro(f => ({...f, city: e.target.value}))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
              </div>

              {/* Gov ID */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">🪪 Government ID</p>
                <select value={pro.docType} onChange={e => setPro(f => ({...f, docType: e.target.value}))}
                  className="w-full h-11 border-2 border-blue-200 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:border-blue-400 bg-white">
                  {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
                </select>
                <input type="text" placeholder="Document number *"
                  value={pro.docNumber} onChange={e => setPro(f => ({...f, docNumber: e.target.value}))}
                  className="w-full h-11 border-2 border-blue-200 rounded-xl px-4 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-400 bg-white placeholder-gray-400" />
                {/* Photo upload */}
                {docPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-blue-300">
                    <img src={docPreview} alt="ID" className="w-full h-28 object-cover"/>
                    <button type="button" onClick={() => { setDocPreview(null); setPro(f => ({...f, docPhoto:null, docPhotoName:""})); }}
                      className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-4 cursor-pointer hover:bg-blue-100/50 transition bg-white/50">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-sm font-semibold text-blue-700">Upload ID photo</span>
                    <span className="text-xs text-gray-400 mt-0.5">JPG / PNG · Max 5 MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleDoc}/>
                  </label>
                )}
                <p className="text-xs text-blue-500">🔒 Only visible to PETclub admins. Never shared publicly.</p>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading}
                className={`w-full h-14 ${selRole.color} hover:opacity-90 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2`}>
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</> : `Submit Application →`}
              </button>
              <button onClick={() => { setStep("role"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Change role</button>
            </div>
          )}

          <p className="text-center text-[11px] text-gray-400 mt-6">
            By continuing you agree to our <span className="underline cursor-pointer">Terms</span> &amp; <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
