import { useState, useRef } from "react";
import { api, saveToken } from "./api.js";

const COUNTRIES = [
  { code: "91", flag: "🇮🇳", label: "India", placeholder: "9876543210" },
  { code: "1",  flag: "🇺🇸", label: "USA",   placeholder: "4155552671" },
];

const ROLES = [
  {
    id: "customer", icon: "🐕", label: "Pet Owner", color: "from-orange-500 to-amber-500",
    badge: null, instant: true,
    desc: "Book grooming, training, vet care & track your pet's health.",
  },
  {
    id: "Groomer", icon: "✂️", label: "Groomer", color: "from-violet-500 to-purple-600",
    badge: "ID Verification Required", instant: false,
    desc: "Offer professional grooming services. Requires government ID.",
  },
  {
    id: "Trainer", icon: "🎓", label: "Dog Trainer", color: "from-blue-500 to-indigo-600",
    badge: "ID Verification Required", instant: false,
    desc: "Provide obedience, agility & behaviour training sessions.",
  },
  {
    id: "Vet", icon: "🏥", label: "Veterinarian", color: "from-emerald-500 to-teal-600",
    badge: "ID Verification Required", instant: false,
    desc: "Offer in-home vet consultations & health care services.",
  },
];

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];
const DOC_TYPES = ["Aadhar Card", "Passport", "Driving License", "Professional Certificate"];

const HERO_IMG = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=85";

function OtpBox({ value, onChange, onKeyDown, inputRef, filled }) {
  return (
    <input
      ref={inputRef} type="text" inputMode="numeric" maxLength={1} value={value}
      onChange={onChange} onKeyDown={onKeyDown}
      className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none transition-all duration-200
        ${filled ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-900"}
        focus:border-orange-400 focus:ring-2 focus:ring-orange-100`}
    />
  );
}

export default function Login({ onLogin }) {
  const [step, setStep] = useState("phone");
  const [cc, setCC] = useState("91");
  const [phone, setPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState(""); // OTP fallback email
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState(0);
  const refs = useRef([]);

  // Customer form state
  const [cust, setCust] = useState({ name: "", email: "", petName: "", petSpecies: "Dog", petBreed: "", petAge: "", petGender: "Male" });

  // Professional form state
  const [pro, setPro] = useState({ name: "", email: "", city: "", docType: "Aadhar Card", docNumber: "", docPhoto: null, docPhotoName: "" });
  const [docPreview, setDocPreview] = useState(null);

  const country = COUNTRIES.find(c => c.code === cc);
  const selectedRole = ROLES.find(r => r.id === role);

  // Timer
  const startTimer = () => {
    setTimer(60);
    const t = setInterval(() => setTimer(r => { if (r <= 1) { clearInterval(t); return 0; } return r - 1; }), 1000);
  };

  const showErr = msg => { setErr(msg); setShake(true); setTimeout(() => setShake(false), 500); };

  // ── SEND OTP ──
  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) return showErr("Enter a valid phone number");
    setLoading(true); setErr("");
    try {
      await api.sendOTP(digits, cc, loginEmail || undefined);
      setStep("otp"); setOtp(["","","","","",""]); startTimer();
      setTimeout(() => refs.current[0]?.focus(), 120);
    } catch (e) { showErr(e.message || "Failed to send OTP. Try again."); }
    finally { setLoading(false); }
  };

  // ── VERIFY OTP ──
  const verifyOtp = async (codeOverride) => {
    if (loading) return;
    const code = codeOverride ?? otp.join("");
    if (code.length !== 6) return showErr("Enter the 6-digit OTP");
    setLoading(true); setErr("");
    try {
      const res = await api.verifyOTP(phone.replace(/\D/g, ""), code, cc);
      saveToken(res.token);
      if (res.isNew || res.user?.role === "pending_role") {
        setStep("role");
      } else {
        onLogin({ id: res.user.id, name: res.user.name, phone: res.user.phone, role: res.user.role, verificationStatus: res.user.verificationStatus });
      }
    } catch (e) { showErr(e.message || "Verification failed. Check the OTP and try again."); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next); setErr("");
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.join("").length === 6) verifyOtp(next.join(""));
  };
  const handleOtpPaste = e => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!p) return;
    const next = p.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    if (p.length === 6) verifyOtp(p);
    else refs.current[p.length]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  // ── DOCUMENT PHOTO PICK ──
  const handleDocPhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showErr("Photo must be under 5MB");
    const reader = new FileReader();
    reader.onload = ev => {
      setPro(f => ({ ...f, docPhoto: ev.target.result, docPhotoName: file.name }));
      setDocPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // ── SUBMIT PROFILE ──
  const submitProfile = async () => {
    setErr("");
    const isCustomer = role === "customer";
    if (isCustomer) {
      if (!cust.name.trim()) return showErr("Please enter your name");
      if (!cust.petName.trim()) return showErr("Please enter your pet's name");
    } else {
      if (!pro.name.trim()) return showErr("Please enter your full name");
      if (!pro.email.trim()) return showErr("Email is required for professional accounts");
      if (!pro.city.trim()) return showErr("Please enter your city");
      if (!pro.docType) return showErr("Please select your government ID type");
      if (!pro.docNumber.trim()) return showErr("Please enter your document number");
    }
    setLoading(true);
    try {
      const res = await api.setRole(
        isCustomer ? "customer" : "professional",
        isCustomer ? undefined : role,
        isCustomer ? cust.name.trim() : pro.name.trim(),
        isCustomer ? (cust.email.trim() || undefined) : pro.email.trim(),
        isCustomer ? undefined : pro.city.trim(),
        isCustomer ? { name: cust.petName.trim(), species: cust.petSpecies, breed: cust.petBreed.trim() || undefined, age: cust.petAge || undefined, gender: cust.petGender } : undefined
      );
      saveToken(res.token);

      // For professionals — upload ID document (non-blocking if fails)
      if (!isCustomer) {
        await api.uploadIdPhoto({
          docType: pro.docType,
          docNumber: pro.docNumber.trim(),
          docPhoto: pro.docPhoto || undefined,
        }).catch(e => console.warn("ID doc upload failed (non-critical):", e.message));
      }

      onLogin({ id: res.user.id, name: res.user.name, phone: res.user.phone, role: res.user.role, verificationStatus: res.user.verificationStatus });
    } catch (e) { showErr(e.message || "Failed to complete signup. Try again."); }
    finally { setLoading(false); }
  };

  const STEP_NUM = { phone: 1, otp: 2, role: 3, profile: 4 };

  return (
    <div className="min-h-screen min-h-[100dvh] flex bg-white">

      {/* ─── LEFT: Hero photo (desktop only) ─── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-10 overflow-hidden">
        <img src={HERO_IMG} alt="Happy dog" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-900/30 to-gray-950/85" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg">🐾</div>
          <span className="font-extrabold text-white text-2xl">PET<span className="text-orange-400">club</span></span>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Trusted by 50,000+ pet parents</p>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-6">
            Premium pet care,<br />delivered to your door 🐾
          </h2>
          <div className="flex flex-wrap gap-2">
            {["✂️ Grooming", "🎓 Training", "🏥 Vet Care", "🍖 Pet Food"].map(s => (
              <span key={s} className="text-xs font-semibold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Form ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-10 py-10 min-h-screen overflow-y-auto bg-white">
        <div className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}>

          {/* Mobile logo */}
          <div className="flex items-center justify-between mb-7 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-base">🐾</div>
              <span className="font-extrabold text-gray-900 text-xl">PET<span className="text-orange-500">club</span></span>
            </div>
            {step === "phone" && <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-full border border-emerald-200">Free to join ✨</span>}
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-7">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${n <= STEP_NUM[step] ? "bg-orange-500" : "bg-gray-200"}`} />
            ))}
          </div>

          {/* ══ STEP 1: PHONE ══ */}
          {step === "phone" && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome to PETclub 🐾</h1>
              <p className="text-gray-500 text-sm mb-6">Sign in or create your free account — no password needed.</p>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4 mb-4">
                {/* Country selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Select your country</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map(c => (
                      <button key={c.code} type="button" onClick={() => { setCC(c.code); setPhone(""); setErr(""); }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${cc === c.code ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                        {c.flag} +{c.code} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">📱 Mobile number <span className="text-red-400">*</span></label>
                  <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors bg-white">
                    <span className="flex items-center px-3 text-gray-500 font-bold text-sm bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                      {country?.flag} +{cc}
                    </span>
                    <input type="tel" inputMode="numeric" autoComplete="tel"
                      placeholder={country?.placeholder} maxLength={15}
                      value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 15)); setErr(""); }}
                      onKeyDown={e => e.key === "Enter" && sendOtp()}
                      className="flex-1 px-4 py-3.5 text-sm focus:outline-none bg-transparent font-medium placeholder-gray-400" />
                  </div>
                </div>

                {/* Email for OTP fallback */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">
                    📧 Email address <span className="text-gray-400 font-normal">(also receive OTP here)</span>
                  </label>
                  <input type="email" autoComplete="email" placeholder="you@example.com"
                    value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setErr(""); }}
                    onKeyDown={e => e.key === "Enter" && sendOtp()}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition-colors" />
                  <p className="text-xs text-gray-400 mt-1">Useful if SMS is delayed. OTP sent to both.</p>
                </div>
              </div>

              {/* New user note */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
                <span className="text-xl shrink-0">🆕</span>
                <div>
                  <div className="text-sm font-bold text-blue-800">New here? Sign up is automatic!</div>
                  <div className="text-xs text-blue-700 mt-0.5 leading-relaxed">Enter your phone, verify the OTP, then choose your role. Takes 2 minutes!</div>
                </div>
              </div>

              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 mb-3"><span>⚠</span>{err}</p>}

              <button onClick={sendOtp} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 text-base">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP…</> : "Send OTP →"}
              </button>
            </>
          )}

          {/* ══ STEP 2: OTP ══ */}
          {step === "otp" && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Check Your Phone {loginEmail && "& Email"}</h1>
              <p className="text-gray-500 text-sm mb-7">
                OTP sent to {country?.flag} +{cc} {phone.slice(0, 3)}·····{phone.slice(-2)}
                {loginEmail && <span className="block text-orange-500 font-medium mt-0.5">Also sent to {loginEmail}</span>}
              </p>

              <div className="flex justify-center gap-2 mb-5" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <OtpBox key={i} value={d} filled={!!d} inputRef={el => (refs.current[i] = el)}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)} />
                ))}
              </div>

              {err && <p className="text-red-500 text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-4"><span>⚠</span>{err}</p>}

              <button onClick={() => verifyOtp()} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 text-base mb-4">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</> : "Verify & Continue →"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setErr(""); }}
                  className="text-gray-400 hover:text-gray-600 font-semibold transition-colors text-xs">
                  ← Change number
                </button>
                {timer > 0
                  ? <span className="text-gray-400 text-xs">Resend in <strong className="text-orange-500">{timer}s</strong></span>
                  : <button onClick={sendOtp} className="text-orange-500 font-bold text-xs hover:text-orange-600">Resend OTP</button>
                }
              </div>
            </>
          )}

          {/* ══ STEP 3: ROLE SELECTION ══ */}
          {step === "role" && (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">I am a…</h1>
              <p className="text-gray-500 text-sm mb-5">Choose how you'll use PETclub. This sets up your account type.</p>

              <div className="space-y-3 mb-5">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => { setRole(r.id); setErr(""); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${role === r.id ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{r.label}</span>
                        {r.instant
                          ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Instant Access</span>
                          : <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ Needs Approval</span>
                        }
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${role === r.id ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                      {role === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 mb-3"><span>⚠</span>{err}</p>}
              <button onClick={() => { if (!role) return showErr("Please select your role to continue"); setStep("profile"); }}
                className="btn-primary text-base flex items-center justify-center gap-2">
                Continue →
              </button>
            </>
          )}

          {/* ══ STEP 4A: CUSTOMER PROFILE ══ */}
          {step === "profile" && role === "customer" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-sm">🐕</div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Tell us about you & your pet</h1>
                  <p className="text-xs text-gray-400">Quick setup — takes 30 seconds</p>
                </div>
              </div>

              {/* Personal info */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">👤 Your Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" autoComplete="name" placeholder="e.g. Arjun Mehta"
                      value={cust.name} onChange={e => setCust(f => ({ ...f, name: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address <span className="text-gray-400 font-normal">(for booking confirmations)</span></label>
                    <input type="email" autoComplete="email" placeholder="you@example.com"
                      value={cust.email} onChange={e => setCust(f => ({ ...f, email: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                </div>
              </div>

              {/* Pet info */}
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 mb-5">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">🐾 Your Pet's Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pet's Name <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. Bruno, Mochi, Bella"
                      value={cust.petName} onChange={e => setCust(f => ({ ...f, petName: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Species</label>
                      <select value={cust.petSpecies} onChange={e => setCust(f => ({ ...f, petSpecies: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white">
                        {SPECIES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender</label>
                      <select value={cust.petGender} onChange={e => setCust(f => ({ ...f, petGender: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white">
                        {["Male", "Female"].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Breed <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" placeholder="e.g. Labrador"
                        value={cust.petBreed} onChange={e => setCust(f => ({ ...f, petBreed: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Age (years)</label>
                      <input type="number" placeholder="e.g. 2" min="0" max="30"
                        value={cust.petAge} onChange={e => setCust(f => ({ ...f, petAge: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-orange-500 mt-3 font-medium">You can add more pets anytime from the app 🐾</p>
              </div>

              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 mb-3"><span>⚠</span>{err}</p>}
              <button onClick={submitProfile} disabled={loading} className="btn-primary text-base flex items-center justify-center gap-2 mb-3">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</> : "Enter PETclub 🐾"}
              </button>
              <button type="button" onClick={() => { setStep("role"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors text-center">
                ← Back to role selection
              </button>
            </>
          )}

          {/* ══ STEP 4B: PROFESSIONAL PROFILE ══ */}
          {step === "profile" && role !== "customer" && selectedRole && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center text-2xl shadow-sm`}>
                  {selectedRole.icon}
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedRole.label} Registration</h1>
                  <p className="text-xs text-gray-400">Government ID required for verification</p>
                </div>
              </div>

              {/* 24-48h notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                <span className="text-xl shrink-0">⏳</span>
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Approval required — 24 to 48 hours.</strong> Submit your details and government ID below. You will receive a confirmation email once we review and approve your account.
                </div>
              </div>

              {/* Personal details */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">👤 Personal Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" autoComplete="name" placeholder="e.g. Priya Sharma"
                      value={pro.name} onChange={e => setPro(f => ({ ...f, name: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address <span className="text-red-400">*</span> <span className="text-gray-400 font-normal">(approval notification sent here)</span></label>
                    <input type="email" autoComplete="email" placeholder="you@example.com"
                      value={pro.email} onChange={e => setPro(f => ({ ...f, email: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Operating City <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. Mumbai / Dallas"
                      value={pro.city} onChange={e => setPro(f => ({ ...f, city: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition" />
                  </div>
                </div>
              </div>

              {/* Government ID */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-5">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">🪪 Government ID Verification</h3>
                <p className="text-xs text-blue-600 mb-3">Required for background check. Kept private and secure.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Document Type <span className="text-red-400">*</span></label>
                    <select value={pro.docType} onChange={e => setPro(f => ({ ...f, docType: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white">
                      {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Document Number <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. 1234 5678 9012 / A1234567"
                      value={pro.docNumber} onChange={e => setPro(f => ({ ...f, docNumber: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white placeholder-gray-400 transition font-mono tracking-wide" />
                  </div>

                  {/* Photo upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Upload ID Photo <span className="text-gray-400 font-normal">(front side, recommended)</span></label>
                    {docPreview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-blue-300">
                        <img src={docPreview} alt="ID preview" className="w-full h-36 object-cover" />
                        <button type="button" onClick={() => { setDocPreview(null); setPro(f => ({ ...f, docPhoto: null, docPhotoName: "" })); }}
                          className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center hover:bg-red-600">
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2">
                          <p className="text-white text-xs truncate">{pro.docPhotoName}</p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-6 cursor-pointer hover:bg-blue-50 transition bg-white">
                        <span className="text-3xl mb-2">📷</span>
                        <span className="text-sm font-semibold text-blue-700">Tap to upload photo</span>
                        <span className="text-xs text-gray-400 mt-1">JPG or PNG · Max 5MB</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleDocPhoto} />
                      </label>
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-3 font-medium">🔒 Your ID is encrypted and only visible to PETclub admins.</p>
              </div>

              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 mb-3"><span>⚠</span>{err}</p>}

              <button onClick={submitProfile} disabled={loading} className={`w-full bg-gradient-to-r ${selectedRole.color} text-white font-bold py-3.5 rounded-2xl text-base flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition disabled:opacity-60 mb-3`}>
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</> : `Submit ${selectedRole.label} Application 🐾`}
              </button>
              <button type="button" onClick={() => { setStep("role"); setErr(""); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors text-center">
                ← Back to role selection
              </button>
            </>
          )}

          <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
            By continuing, you agree to PETclub&apos;s{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span> &amp;{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
