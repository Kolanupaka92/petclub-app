import { useState, useRef, useEffect } from "react";
import { api, saveToken } from "./api.js";

const COUNTRIES = [
  { code: "91", flag: "🇮🇳", label: "India", placeholder: "9876543210" },
  { code: "1",  flag: "🇺🇸", label: "USA",   placeholder: "4155552671" },
];

const ROLES = [
  { id: "customer", icon: "🐕", label: "Pet Owner",  badge: null,              desc: "Manage pets, book grooming, training & vet care." },
  { id: "Groomer",  icon: "✂️", label: "Groomer",    badge: "Needs Approval",  desc: "Offer professional grooming services to pet owners." },
  { id: "Trainer",  icon: "🎓", label: "Trainer",    badge: "Needs Approval",  desc: "Provide obedience, agility & behaviour training." },
  { id: "Vet",      icon: "🏥", label: "Veterinarian", badge: "Needs Approval", desc: "Offer in-home vet consultations & health tracking." },
];

const HERO_IMG = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=85";

function OtpBox({ value, onChange, onKeyDown, inputRef, filled }) {
  return (
    <input
      ref={inputRef}
      type="text" inputMode="numeric" maxLength={1} value={value}
      onChange={onChange} onKeyDown={onKeyDown}
      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none transition-all duration-200
        ${filled ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-900"}
        focus:border-orange-400 focus:ring-2 focus:ring-orange-100`}
    />
  );
}

export default function Login({ onLogin }) {
  const [step, setStep] = useState("phone");
  const [cc, setCC] = useState("91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState(0);
  const refs = useRef([]);

  const country = COUNTRIES.find(c => c.code === cc);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const showErr = (msg) => { setErr(msg); setShake(true); setTimeout(() => setShake(false), 500); };

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) return showErr("Enter a valid phone number");
    setLoading(true); setErr("");
    try {
      await api.sendOTP(digits, cc);
      setStep("otp"); setOtp(["","","","","",""]); setTimer(45);
      setTimeout(() => refs.current[0]?.focus(), 120);
    } catch (e) { showErr(e.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (codeOverride) => {
    if (loading) return;
    const code = codeOverride ?? otp.join("");
    if (code.length !== 6) return showErr("Enter the 6-digit OTP");
    setLoading(true); setErr("");
    try {
      const res = await api.verifyOTP(phone.replace(/\D/g,""), code, cc);
      saveToken(res.token);
      if (res.isNew || res.user?.role === "pending_role") {
        setStep("role");
      } else {
        onLogin({ id: res.user.id, name: res.user.name, phone: res.user.phone, role: res.user.role, verificationStatus: res.user.verificationStatus });
      }
    } catch (e) { showErr(e.message || "Verification failed"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next); setErr("");
    if (val && i < 5) refs.current[i+1]?.focus();
    if (next.join("").length === 6) verifyOtp(next.join(""));
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (!p) return;
    const next = p.split("").concat(Array(6).fill("")).slice(0,6);
    setOtp(next);
    if (p.length === 6) verifyOtp(p);
    else refs.current[p.length]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i-1]?.focus();
  };

  const submitProfile = async () => {
    if (!form.name.trim()) return showErr("Please enter your name");
    setLoading(true); setErr("");
    try {
      const res = await api.setRole(
        role === "customer" ? "customer" : "professional",
        role === "customer" ? undefined : role,
        form.name.trim(), form.email.trim() || undefined, form.city.trim() || undefined
      );
      saveToken(res.token);
      onLogin({ id: res.user.id, name: res.user.name, phone: res.user.phone, role: res.user.role, verificationStatus: res.user.verificationStatus });
    } catch (e) { showErr(e.message || "Failed to save profile"); }
    finally { setLoading(false); }
  };

  const stepNum = { phone:1, otp:2, role:3, profile:4 }[step];
  const stepLabel = { phone:"Sign In", otp:"Verify OTP", role:"Choose Role", profile:"Complete Profile" }[step];

  return (
    <div className="min-h-screen min-h-[100dvh] flex bg-white">
      {/* LEFT — Photo panel (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-10 overflow-hidden">
        <img src={HERO_IMG} alt="Happy dog" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-900/40 to-gray-950/80" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-orange">🐾</div>
            <span className="font-extrabold text-white text-2xl">PET<span className="text-orange-400">club</span></span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Trusted by 50,000+ pet parents</p>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-5">
            Premium pet care,<br />delivered to your door 🐾
          </h2>
          <div className="flex flex-wrap gap-2">
            {["✂️ Grooming", "🎓 Training", "🏥 Vet Care", "🍖 Pet Food"].map(s => (
              <span key={s} className="text-xs font-semibold bg-white/15 text-white px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-10 py-12 min-h-screen overflow-y-auto">
        <div className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}>
          {/* Logo (mobile only) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white text-base font-black">🐾</div>
            <span className="font-extrabold text-gray-900 text-xl">PET<span className="text-orange-500">club</span></span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2,3,4].map(n => (
              <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-500 ${n <= stepNum ? "bg-orange-500" : "bg-gray-200"}`} />
            ))}
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{stepLabel}</h1>
          <p className="text-gray-500 text-sm mb-8">
            {step === "phone" && "Enter your number to sign in or create an account."}
            {step === "otp" && `Code sent to ${country?.flag} +${cc} ${phone.slice(0,3)}·····`}
            {step === "role" && "How will you be using PETclub? Choose your role."}
            {step === "profile" && "Just a few details to personalize your experience."}
          </p>

          {/* ── PHONE ── */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                {COUNTRIES.map(c => (
                  <button key={c.code} type="button"
                    onClick={() => { setCC(c.code); setPhone(""); setErr(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${cc === c.code ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                    <span className="text-base">{c.flag}</span> +{c.code} {c.label}
                  </button>
                ))}
              </div>
              <div className="flex border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-orange-400 transition-colors">
                <span className="flex items-center px-4 text-gray-500 font-semibold text-sm bg-gray-50 border-r-2 border-gray-200 whitespace-nowrap">
                  {country?.flag} +{cc}
                </span>
                <input type="tel" inputMode="numeric" autoComplete="tel"
                  placeholder={country?.placeholder} maxLength={15}
                  value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,15)); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && sendOtp()}
                  className="flex-1 px-4 py-4 text-sm focus:outline-none bg-white font-medium placeholder-gray-400" />
              </div>
              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5"><span>⚠</span>{err}</p>}
              <button onClick={sendOtp} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 text-base">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Sending…</> : "Send OTP →"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                New user? We&apos;ll create your account automatically.
              </p>
            </div>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <OtpBox key={i} value={d} filled={!!d}
                    inputRef={el => (refs.current[i] = el)}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)} />
                ))}
              </div>
              {err && <p className="text-red-500 text-xs font-semibold text-center flex items-center justify-center gap-1.5"><span>⚠</span>{err}</p>}
              <button onClick={() => verifyOtp()} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 text-base">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Verifying…</> : "Verify & Continue →"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setErr(""); }}
                  className="text-gray-400 hover:text-gray-600 font-semibold transition-colors">
                  ← Change number
                </button>
                {timer > 0
                  ? <span className="text-gray-400 text-xs">Resend in <strong className="text-orange-500">{timer}s</strong></span>
                  : <button onClick={sendOtp} className="text-orange-500 font-bold text-xs hover:text-orange-600 transition-colors">Resend OTP</button>
                }
              </div>
            </div>
          )}

          {/* ── ROLE ── */}
          {step === "role" && (
            <div className="space-y-3">
              {ROLES.map(r => (
                <button key={r.id} type="button"
                  onClick={() => { setRole(r.id); setErr(""); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    role === r.id ? "border-orange-500 bg-orange-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${role === r.id ? "bg-orange-100" : "bg-gray-100"}`}>
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{r.label}</span>
                      {r.badge && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{r.badge}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center ${role === r.id ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                    {role === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5"><span>⚠</span>{err}</p>}
              <button onClick={() => { if (!role) return showErr("Please select a role"); setStep("profile"); }}
                className="btn-primary text-base flex items-center justify-center gap-2 mt-2">
                Continue →
              </button>
            </div>
          )}

          {/* ── PROFILE ── */}
          {step === "profile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input type="text" autoComplete="name" placeholder="e.g. Arjun Mehta"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && submitProfile()}
                  className="input-field text-base" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address <span className="text-gray-400 font-normal normal-case">(optional — for confirmation email)</span>
                </label>
                <input type="email" autoComplete="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field" />
              </div>
              {role !== "customer" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Operating City
                  </label>
                  <input type="text" placeholder="e.g. Mumbai / Dallas"
                    value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="input-field" />
                </div>
              )}
              {role !== "customer" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                  <strong>⏳ Approval required</strong> — your {role} profile will be reviewed within 24–48 hours. You&apos;ll receive an SMS once approved.
                </div>
              )}
              {err && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5"><span>⚠</span>{err}</p>}
              <button onClick={submitProfile} disabled={loading}
                className="btn-primary text-base flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Saving…</>
                  : role === "customer" ? "Enter PETclub 🐾" : "Submit Application 🐾"
                }
              </button>
              <button type="button" onClick={() => { setStep("role"); setErr(""); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                ← Back to role selection
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-gray-400 mt-8 leading-relaxed">
            By continuing, you agree to PETclub&apos;s <span className="underline cursor-pointer">Terms</span> &amp; <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
