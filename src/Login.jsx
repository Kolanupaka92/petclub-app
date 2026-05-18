import { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui.jsx";
import { api, saveToken } from "./api.js";

const DEMO_OTP = "123456";
const DEMO_PHONE = "9876543210";

const FEATURES = [
  { icon: "✂️", label: "Grooming" },
  { icon: "🎓", label: "Training" },
  { icon: "🍖", label: "Food" },
  { icon: "🏥", label: "Vet care" },
];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("phone");
  const [step, setStep] = useState("identifier"); // identifier | otp | signup
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [pendingSession, setPendingSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const otpRefs = useRef([]);

  const identifier = mode === "phone" ? phone.replace(/\D/g, "") : email.trim();

  const showError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const sendOtp = async () => {
    setError("");
    if (mode === "phone" && identifier.length !== 10) {
      showError("Enter a valid 10-digit mobile number");
      return;
    }
    if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      showError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      if (mode === "phone") {
        await api.sendOTP(identifier);
      }
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      showError(err.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (codeOverride) => {
    if (loading) return;
    const code = codeOverride ?? otp.join("");
    if (code.length !== 6) {
      showError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "phone") {
        const res = await api.verifyOTP(identifier, code);
        saveToken(res.token);
        const session = { phone: `+91 ${identifier.slice(0, 5)} ${identifier.slice(5)}`, name: res.user?.name, id: res.user?.id };
        if (res.isNew) {
          setPendingSession(session);
          setStep("signup");
          setLoading(false);
          return;
        }
        onLogin(session);
      } else {
        // email mode — fallback demo (no email OTP backend yet)
        if (code !== DEMO_OTP) { showError("Invalid OTP. Try demo code 123456"); setLoading(false); return; }
        onLogin({ email: identifier });
      }
    } catch (err) {
      showError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError("");
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    const joined = next.join("");
    if (joined.length === 6) verifyOtp(joined);
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    if (pasted.length === 6) verifyOtp(pasted);
    else otpRefs.current[pasted.length]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleSignup = async () => {
    if (!signupName.trim()) { showError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      await api.updateMe({ name: signupName.trim(), email: signupEmail.trim() || undefined });
      onLogin({ ...pendingSession, name: signupName.trim() });
    } catch {
      onLogin({ ...pendingSession, name: signupName.trim() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-gradient-to-br from-orange-400 via-brand-500 to-amber-500 px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 text-9xl opacity-[0.15] select-none pointer-events-none">🐕</div>
        <div className="absolute left-2 bottom-6 text-6xl opacity-[0.15] select-none pointer-events-none">🐈</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl drop-shadow-sm">🐾</span>
            <span className="font-extrabold text-white text-2xl tracking-tight">PETclub</span>
          </div>

          <div className="flex gap-2 mb-5" aria-label="Sign-in progress">
            <div className={`h-1 flex-1 rounded-full transition-all ${step === "identifier" ? "bg-white" : "bg-white/40"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step === "otp" ? "bg-white" : "bg-white/30"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step === "signup" ? "bg-white" : "bg-white/20"}`} />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-1">
            {step === "identifier" ? "Welcome!" : step === "otp" ? "Verify OTP" : "Complete Sign Up"}
          </h1>
          <p className="text-orange-100 text-sm leading-relaxed">
            {step === "identifier"
              ? "New user? Just enter your number — we'll create your account."
              : step === "otp"
                ? (mode === "phone" ? `We sent a code to +91 ${identifier}` : `We sent a code to ${identifier}`)
                : "Tell us your name to personalize your PETclub experience."}
          </p>

          {step === "identifier" && (
            <div className="flex flex-wrap gap-2 mt-5">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 px-5 -mt-10 relative z-20 pb-8">
        <div
          className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-5 animate-fade-in ${shake ? "animate-shake" : ""}`}
        >
          {step === "identifier" && (
            <>
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5" role="tablist">
                {[
                  { id: "phone", label: "📱 Phone" },
                  { id: "email", label: "📧 Email" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === t.id}
                    onClick={() => {
                      setMode(t.id);
                      setError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      mode === t.id ? "bg-white text-brand-600 shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {mode === "phone" ? (
                <label className="block mb-4">
                  <span className="block text-xs font-semibold text-gray-500 mb-1.5">Mobile number</span>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-orange-100 transition-shadow">
                    <span className="bg-gray-50 px-3 py-3.5 text-sm font-semibold text-gray-600 border-r border-gray-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                      className="flex-1 px-3 py-3.5 text-sm focus:outline-none"
                    />
                  </div>
                  {phone.length > 0 && (
                    <p className={`text-xs mt-1.5 ${phone.length === 10 ? "text-green-600" : "text-gray-400"}`}>
                      {phone.length}/10 digits
                    </p>
                  )}
                </label>
              ) : (
                <label className="block mb-4">
                  <span className="block text-xs font-semibold text-gray-500 mb-1.5">Email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    className="input-field"
                  />
                </label>
              )}

              {error && (
                <p className="text-red-500 text-xs font-medium mb-3 flex items-center gap-1.5" role="alert">
                  <span aria-hidden="true">⚠</span> {error}
                </p>
              )}

              <Button loading={loading} onClick={sendOtp}>
                {loading ? "Sending OTP…" : "Send OTP →"}
              </Button>

              <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-center text-xs text-orange-800">
                  <span className="font-bold">Demo login</span>
                  <br />
                  Phone <span className="font-mono font-semibold">9876543210</span> · OTP{" "}
                  <span className="font-mono font-semibold">123456</span>
                </p>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-center text-xs text-gray-500 mb-4">Enter the 6-digit code (paste supported)</p>
              <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all ${
                      d ? "border-brand-500 bg-orange-50/50" : "border-gray-200"
                    } focus:border-brand-500 focus:ring-2 focus:ring-orange-100`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-xs font-medium text-center mb-3" role="alert">
                  {error}
                </p>
              )}

              <Button loading={loading} onClick={() => verifyOtp()} className="mb-3">
                {loading ? "Verifying…" : "Verify & Sign In 🐾"}
              </Button>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identifier");
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="w-full text-sm text-brand-500 font-semibold py-2 hover:text-brand-600 transition-colors"
                >
                  ← Change {mode === "phone" ? "number" : "email"}
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full text-xs text-gray-400 py-1 hover:text-gray-600 disabled:opacity-50"
                >
                  Didn&apos;t get it? Resend OTP
                </button>
              </div>
            </>
          )}

          {step === "signup" && (
            <>
              <p className="text-center text-xs text-gray-500 mb-4">Almost there! Just one more step.</p>
              <label className="block mb-4">
                <span className="block text-xs font-semibold text-gray-500 mb-1.5">Your name <span className="text-red-400">*</span></span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Arjun Mehta"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  className="input-field"
                />
              </label>
              <label className="block mb-5">
                <span className="block text-xs font-semibold text-gray-500 mb-1.5">Email <span className="text-gray-400">(optional)</span></span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  className="input-field"
                />
              </label>
              {error && (
                <p className="text-red-500 text-xs font-medium mb-3 flex items-center gap-1.5" role="alert">
                  <span aria-hidden="true">⚠</span> {error}
                </p>
              )}
              <Button loading={loading} onClick={handleSignup}>
                {loading ? "Saving…" : "Let's Go 🐾"}
              </Button>
              <button
                type="button"
                onClick={() => onLogin(pendingSession)}
                className="w-full text-xs text-gray-400 py-2 hover:text-gray-600 mt-2"
              >
                Skip for now
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">🔒 Secure</span>
          <span>·</span>
          <span className="flex items-center gap-1">💬 WhatsApp updates</span>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-3 px-4 leading-relaxed">
          By continuing, you agree to PETclub&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
