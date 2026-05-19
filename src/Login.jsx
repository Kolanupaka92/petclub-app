import { useState, useRef, useEffect } from "react";
import { api, saveToken } from "./api.js";

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
    id: "Trainer", icon: "🎓", label: "Dog Trainer",
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

const SPECIES   = ["Dog","Cat","Bird","Rabbit","Fish","Hamster","Other"];
const DOC_TYPES = ["Aadhar Card","Passport","Driving License","Professional Certificate"];
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

/* ══════════════════════════════════════════
   MAIN LOGIN COMPONENT
══════════════════════════════════════════ */
export default function Login({ onLogin }) {
  // flow: "start" → (signin: "phone"→"otp") | (signup: "pick-role"→"phone"→"otp"→"profile")
  const [step, setStep]     = useState("start");
  const [mode, setMode]     = useState(null);      // "signin" | "signup"
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

  // Customer profile fields
  const [cust, setCust] = useState({ name:"", email:"", petName:"", petSpecies:"Dog", petBreed:"", petAge:"", petGender:"Male" });
  // Professional profile fields
  const [pro, setPro]   = useState({ name:"", email:"", city:"", docType:"Aadhar Card", docNumber:"", docPhoto:null, docPhotoName:"" });
  const [docPreview, setDocPreview] = useState(null);

  const country  = COUNTRIES.find(c => c.code === cc) || COUNTRIES[0];
  const selRole  = ROLES.find(r => r.id === role);
  const isIndia  = cc === "91";

  /* OTP resend timer */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(n => (n <= 1 ? (clearInterval(t), 0) : n - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const showErr = msg => { setErr(msg); setShake(true); setTimeout(() => setShake(false), 450); };

  /* ── step progress dots: only shown during phone/otp/profile ── */
  const signupSteps = ["pick-role", "phone", "otp", "profile"];
  const signinSteps = ["phone", "otp"];
  const flowSteps   = mode === "signup" ? signupSteps : signinSteps;
  const stepIdx     = flowSteps.indexOf(step);

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
      if (mode === "signup" || res.isNew || res.user?.role === "pending_role") {
        setStep("profile");
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
      if (!cust.name.trim())    return showErr("Enter your name");
      if (!cust.petName.trim()) return showErr("Enter your pet's name");
    } else {
      if (!pro.name.trim())     return showErr("Enter your full name");
      if (!pro.email.trim())    return showErr("Email is required for approval notification");
      if (!pro.city.trim())     return showErr("Enter your city");
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
          .catch(e => console.warn("ID doc upload (non-critical):", e.message));
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

      {/* ── LEFT: Hero panel (desktop) ── */}
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
            <h2 className="text-white text-4xl font-extrabold leading-tight">Premium pet care,<br />at your doorstep 🐾</h2>
            <p className="text-white/60 text-sm mt-3">Trusted by 50,000+ pet parents across India & USA</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-5 py-10 overflow-y-auto">
        <div className={`w-full max-w-sm ${shake ? "animate-shake" : ""}`}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-base font-black text-white">🐾</div>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">PET<span className="text-orange-500">club</span></span>
          </div>

          {/* Step progress dots (not on start screen) */}
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
               STEP: START (Sign In / Sign Up)
          ══════════════════════════════ */}
          {step === "start" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome to PETclub</h1>
                <p className="text-gray-500 text-sm mt-1">India's #1 pet care platform — no password needed.</p>
              </div>

              {/* Sign In card */}
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

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Create Account heading */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Create Account — Choose your role</p>
                <div className="space-y-2.5">
                  {ROLES.map(r => (
                    <button key={r.id} type="button"
                      onClick={() => { setMode("signup"); setRole(r.id); setStep("phone"); setErr(""); }}
                      className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:shadow-md transition-all group text-left"
                      style={{"--hover-border": r.border}}
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
                          }`}>
                            {r.instant ? "✅ Instant" : "⏳ 24–48h review"}
                          </span>
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
              {/* Header */}
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
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enter your number</h1>
                  <p className="text-gray-500 text-sm mt-0.5">We'll send a one-time code to verify your identity.</p>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome back 👋</h1>
                  <p className="text-gray-500 text-sm mt-1">Enter your registered mobile number to sign in.</p>
                </div>
              )}

              {/* Phone */}
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
              </div>

              {/* India OTP notice */}
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
                    ? <span className="text-red-500 normal-case font-semibold">* required for India OTP</span>
                    : <span className="text-gray-400 normal-case font-normal">(optional — backup OTP if SMS delays)</span>
                  }
                </label>
                <input type="email" autoComplete="email"
                  placeholder={isIndia ? "your@email.com (required)" : "you@example.com"}
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
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending…</> : <>Send OTP →</>}
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
                  {isIndia
                    ? <>OTP sent to <span className="text-blue-600 font-semibold">{email}</span><br/><span className="text-xs text-gray-400">Check your inbox (and spam folder)</span></>
                    : <>Sent to {country.flag} +{cc} ···{phone.slice(-4)}{email && <><br/><span className="text-orange-500 font-medium text-xs">Also sent to {email}</span></>}</>
                  }
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

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Name <span className="text-red-400">*</span></label>
                  <input type="text" autoComplete="name" placeholder="e.g. Arjun Mehta"
                    value={cust.name} onChange={e => setCust(f => ({...f, name: e.target.value}))}
                    className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email <span className="text-gray-400 normal-case font-normal">(booking confirmations)</span></label>
                  <input type="email" autoComplete="email" placeholder="you@example.com"
                    value={cust.email} onChange={e => setCust(f => ({...f, email: e.target.value}))}
                    className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-300 transition-all" />
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
                <p className="text-xs text-orange-500">You can add more pets anytime from your dashboard.</p>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account…</> : "Enter PETclub 🐾"}
              </button>
              <button onClick={() => { setStep("start"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Back to start</button>
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
                <p className="text-gray-500 text-sm mt-1">Government ID required. Review takes 24–48 hours.</p>
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
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
                <input type="email" autoComplete="email" placeholder="Email * (approval sent here)"
                  value={pro.email} onChange={e => setPro(f => ({...f, email: e.target.value}))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
                <input type="text" placeholder="Operating city * (e.g. Hyderabad)"
                  value={pro.city} onChange={e => setPro(f => ({...f, city: e.target.value}))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 text-sm font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 bg-white placeholder-gray-400 transition-all" />
              </div>

              {/* Gov ID */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">🪪 Government ID</p>
                <select value={pro.docType} onChange={e => setPro(f => ({...f, docType: e.target.value}))}
                  className="w-full h-11 border-2 border-slate-200 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:border-slate-400 bg-white">
                  {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
                </select>
                <input type="text" placeholder="Document number *"
                  value={pro.docNumber} onChange={e => setPro(f => ({...f, docNumber: e.target.value}))}
                  className="w-full h-11 border-2 border-slate-200 rounded-xl px-4 text-sm font-mono tracking-widest focus:outline-none focus:border-slate-400 bg-white placeholder-gray-400" />
                {docPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-slate-300">
                    <img src={docPreview} alt="ID" className="w-full h-28 object-cover"/>
                    <button type="button" onClick={() => { setDocPreview(null); setPro(f => ({...f, docPhoto:null, docPhotoName:""})); }}
                      className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:bg-slate-100/50 transition bg-white/50">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-sm font-semibold text-slate-600">Upload ID photo</span>
                    <span className="text-xs text-gray-400 mt-0.5">JPG / PNG · Max 5 MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleDoc}/>
                  </label>
                )}
                <p className="text-xs text-slate-400">🔒 Visible only to PETclub admins. Never shared publicly.</p>
              </div>

              {err && <div className="flex items-center gap-2 text-red-500 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3"><span>⚠️</span>{err}</div>}

              <button onClick={submit} disabled={loading}
                className="w-full h-14 text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                style={{background: selRole.color}}>
                {loading ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</> : "Submit Application →"}
              </button>
              <button onClick={() => { setStep("start"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors">← Back to start</button>
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
