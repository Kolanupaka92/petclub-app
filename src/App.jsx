import { useState, useEffect } from "react";
import { api } from "./api.js";

/* ── Helpers ── */
const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || "—"; } };
const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const fmtCurr = (n, phone) => phone?.startsWith("+91") ? `₹${(n || 0).toLocaleString("en-IN")}` : `$${(n || 0).toFixed(2)}`;
const rIcon = r => ({ Groomer: "✂️", Trainer: "🎓", Vet: "🏥", Admin: "🛡️", customer: "🐕" })[r] || "👤";
const rColor = r => ({ Groomer: "from-violet-500 to-purple-600", Trainer: "from-blue-500 to-indigo-600", Vet: "from-emerald-500 to-teal-600", Admin: "from-gray-700 to-gray-900" })[r] || "from-orange-500 to-amber-500";
const sColor = s => ({
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  ongoing: "bg-orange-50 text-orange-700 border-orange-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-600 border-red-200",
})[s] || "bg-gray-50 text-gray-600 border-gray-200";

const SVC_OPTS = {
  Groomer: ["Bath & Brush", "Nail Trim", "Haircut", "De-shedding", "Herbal Bath", "Spa Treatment", "Tick & Flea Bath"],
  Trainer: ["Puppy Basics", "Basic Obedience", "Advanced Obedience", "Agility", "Behaviour Correction", "Leash Training"],
  Vet: ["General Check-up", "Vaccination", "Deworming", "Dental Care", "Surgery", "Emergency Care", "Nutrition Consult"]
};

/* ── Shared UI ── */
const PawLogo = ({ sz = 36 }) => (
  <svg width={sz} height={sz} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="40" r="18" fill="#f97316" />
    <ellipse cx="20" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(-20 20 20)" />
    <ellipse cx="44" cy="20" rx="6" ry="8" fill="#f97316" transform="rotate(20 44 20)" />
    <ellipse cx="10" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(-30 10 34)" />
    <ellipse cx="54" cy="34" rx="5" ry="7" fill="#f97316" transform="rotate(30 54 34)" />
    <ellipse cx="24" cy="44" rx="4" ry="5" fill="white" opacity="0.9" />
    <ellipse cx="32" cy="47" rx="4" ry="5" fill="white" opacity="0.9" />
    <ellipse cx="40" cy="44" rx="4" ry="5" fill="white" opacity="0.9" />
    <ellipse cx="28" cy="38" rx="7" ry="8" fill="white" opacity="0.9" />
    <ellipse cx="36" cy="38" rx="7" ry="8" fill="white" opacity="0.9" />
  </svg>
);

const Bdg = ({ text, cls = "" }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>{text}</span>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-2xl animate-slide-up`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition">&times;</button>
      </div>
      <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const Inp = ({ label, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white placeholder-gray-400" {...p} />
  </div>
);

const Sel = ({ label, opts, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white" {...p}>
      {opts.map(o => <option key={o}>{o}</option>)}
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
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
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

/* ══════════════════════════════════════════════
   PROFESSIONAL ONBOARDING
══════════════════════════════════════════════ */
const ProfessionalOnboarding = ({ session, onComplete }) => {
  const subRole = session.subRole || "Groomer";
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: session.name || "", email: session.email || "", dob: "", gender: "Male",
    address: "", area: "", city: session.city || "", pincode: "",
    services: [], experience: "", bio: "", serviceAreas: "", langs: "",
    priceA: "", priceB: "", priceC: "",
  });
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleSvc = s => setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));
  const STEPS = [{ n: "Basic Info", icon: "👤" }, { n: "Professional", icon: "🎯" }, { n: "Review", icon: "✅" }];
  const canNext = [!!(form.name && form.city), !!(form.services.length > 0 && form.experience && form.bio), true];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.updateMyProProfile({
        name: form.name, email: form.email, city: form.city, area: form.area,
        address: form.address, bio: form.bio, experience: form.experience,
        services: form.services, service_areas: form.serviceAreas,
        langs: form.langs, price_basic: form.priceA, price_full: form.priceB, price_custom: form.priceC,
      });
    } catch { /* proceed anyway */ }
    setSaving(false);
    onComplete();
  };

  const colorMap = { Groomer: "from-violet-500 to-purple-600", Trainer: "from-blue-500 to-indigo-600", Vet: "from-emerald-500 to-teal-600" };
  const grad = colorMap[subRole] || "from-orange-500 to-amber-500";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${grad} px-5 pt-safe-top pb-6`}>
        <div className="max-w-xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-6">
            <PawLogo sz={28} />
            <div>
              <span className="font-extrabold text-white text-base">PETclub</span>
              <span className="text-xs text-white/70 ml-2">Professional Setup</span>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all ${i < step - 1 ? "bg-white text-green-600" : i === step - 1 ? "bg-white/20 border-2 border-white text-white" : "bg-white/10 text-white/50"}`}>
                    {i < step - 1 ? "✓" : s.icon}
                  </div>
                  <span className={`text-xs mt-1 font-semibold ${i === step - 1 ? "text-white" : "text-white/50"}`}>{s.n}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step - 1 ? "bg-white" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 -mt-2">
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Basic Information</h2>
            <p className="text-sm text-gray-400 mb-5">Registering as: <strong className="text-orange-500">{subRole}</strong></p>
            <Inp label="Full Name *" placeholder="e.g. Arjun Kumar Mehta" value={form.name} onChange={sf("name")} />
            <Inp label="Email Address" type="email" placeholder="you@gmail.com" value={form.email} onChange={sf("email")} />
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Date of Birth" type="date" value={form.dob} onChange={sf("dob")} />
              <Sel label="Gender" opts={["Male", "Female", "Other"]} value={form.gender} onChange={sf("gender")} />
            </div>
            <Txta label="Full Address" placeholder="House/Flat No., Street, Locality" value={form.address} onChange={sf("address")} rows={2} />
            <div className="grid grid-cols-3 gap-2">
              <Inp label="Area" placeholder="Andheri" value={form.area} onChange={sf("area")} />
              <Inp label="City *" placeholder="Mumbai" value={form.city} onChange={sf("city")} />
              <Inp label="PIN / ZIP" placeholder="400053" maxLength={10} value={form.pincode} onChange={sf("pincode")} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Professional Details</h2>
            <p className="text-sm text-gray-400 mb-5">Your expertise, services &amp; pricing</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Services as {subRole} *</label>
              <div className="flex flex-wrap gap-2">
                {(SVC_OPTS[subRole] || []).map(s => (
                  <button key={s} type="button" onClick={() => toggleSvc(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.services.includes(s) ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Experience *" opts={["<1 year", "1–2 years", "2–5 years", "5–8 years", "8+ years"]} value={form.experience} onChange={sf("experience")} />
              <Inp label="Languages" placeholder="Hindi, English" value={form.langs} onChange={sf("langs")} />
            </div>
            <Txta label="Short Bio *" placeholder="Tell pet parents about your experience, approach & certifications…" value={form.bio} onChange={sf("bio")} rows={4} />
            <Inp label="Service Areas" placeholder="e.g. Andheri, Juhu, Versova" value={form.serviceAreas} onChange={sf("serviceAreas")} />
            <div className="mt-1">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Pricing per session</label>
              <div className="grid grid-cols-3 gap-2">
                <Inp label="Basic" type="number" placeholder="599" value={form.priceA} onChange={sf("priceA")} />
                <Inp label="Standard" type="number" placeholder="999" value={form.priceB} onChange={sf("priceB")} />
                <Inp label="Premium" type="number" placeholder="1499" value={form.priceC} onChange={sf("priceC")} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-5">Review &amp; Submit</h2>
            <div className={`bg-gradient-to-br ${grad} rounded-xl p-4 text-white text-center mb-5`}>
              <div className="text-4xl mb-2">{rIcon(subRole)}</div>
              <div className="font-bold text-lg">{form.name || "—"}</div>
              <div className="text-white/80 text-sm">{subRole} · {form.city || "—"}</div>
            </div>
            {[
              ["Phone", session.phone],
              ["Email", form.email || "—"],
              ["Experience", form.experience || "—"],
              ["Services", form.services.length ? form.services.slice(0, 3).join(", ") + (form.services.length > 3 ? ` +${form.services.length - 3}` : "") : "—"],
              ["Area", [form.area, form.pincode].filter(Boolean).join(", ") || "—"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-400 font-medium">{l}</span>
                <span className="font-semibold text-gray-700 text-right">{v}</span>
              </div>
            ))}
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>⏳ What happens next?</strong><br />
              Your profile will be reviewed within <strong>24–48 hours</strong>. We'll send you an SMS and email once approved.
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => canNext[step - 1] && setStep(s => s + 1)}
              className={`flex-1 font-bold py-3 rounded-2xl transition-all ${canNext[step - 1] ? `bg-gradient-to-r ${grad} text-white shadow-sm hover:opacity-90` : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className={`flex-1 bg-gradient-to-r ${grad} text-white font-bold py-3 rounded-2xl shadow-sm hover:opacity-90 disabled:opacity-60 transition`}>
              {saving ? "Submitting…" : "Submit Application 🐾"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PROFESSIONAL DASHBOARD
══════════════════════════════════════════════ */
const ProfessionalDashboard = ({ session, onLogout }) => {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      api.getMyProProfile().catch(() => null),
      api.getBookings().catch(() => ({ bookings: [] })),
    ]).then(([profRes, bkRes]) => {
      if (profRes?.profile) setProfile(profRes.profile);
      setBookings(bkRes?.bookings || []);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const todayBk = bookings.filter(b => {
    try { return new Date(b.scheduled_at).toDateString() === new Date().toDateString(); } catch { return false; }
  });
  const upcomingBk = bookings.filter(b => b.status === "upcoming");
  const completedBk = bookings.filter(b => b.status === "completed");

  const isVerified = profile?.verification_status === "approved";
  const subRole = profile?.sub_role || session.subRole || "Professional";
  const grad = rColor(subRole);

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

  const NAV = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "bookings", icon: "📅", label: "Bookings" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  if (loading) return <Spinner full />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 text-sm">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 text-white shrink-0 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <PawLogo sz={32} />
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
              <span className="text-base">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        {/* Sidebar profile card */}
        <div className="p-4 border-t border-white/5">
          <div className={`bg-gradient-to-br ${grad} rounded-xl p-4 mb-3`}>
            <div className="text-center">
              <div className="text-3xl mb-1">{rIcon(subRole)}</div>
              <div className="font-bold text-white text-sm truncate">{profile?.name || session.name || "Pro"}</div>
              <div className="text-white/70 text-xs">{subRole}</div>
              <div className={`mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isVerified ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                {isVerified ? "✅ Verified" : "⏳ Pending"}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/5 transition">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8 min-h-screen">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl animate-fade-in">
            {toast}
          </div>
        )}

        {/* ── HOME VIEW ── */}
        {view === "home" && (
          <div className="max-w-2xl mx-auto">
            {/* Hero gradient */}
            <div className={`bg-gradient-to-br ${grad} px-5 pt-8 pb-16`}>
              <div className="flex items-center justify-between mb-6 md:hidden">
                <div className="flex items-center gap-2">
                  <PawLogo sz={28} />
                  <span className="font-extrabold text-white">PETclub</span>
                </div>
                <button onClick={onLogout} className="text-white/70 text-xs border border-white/20 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/20">
                  {rIcon(subRole)}
                </div>
                <div className="flex-1">
                  <div className="text-white/70 text-sm font-medium">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋</div>
                  <div className="text-white text-2xl font-extrabold leading-tight mt-0.5">{(profile?.name || session.name || "Pro").split(" ")[0]}</div>
                  <div className="text-white/60 text-sm mt-0.5">{subRole} · {profile?.city || "Set your city"}</div>
                </div>
                {isVerified && (
                  <div className="bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    ✅ Live
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 -mt-8">
              {/* Status banner */}
              {!isVerified ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">⏳</div>
                  <div>
                    <div className="font-bold text-amber-800 text-sm">Verification Under Review</div>
                    <div className="text-xs text-amber-700 mt-0.5">Your profile is being reviewed. Expected 24–48 hrs.</div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">✅</div>
                    <div>
                      <div className="font-bold text-emerald-800 text-sm">Verified &amp; Active</div>
                      <div className="text-xs text-emerald-600">Listed on PETclub · Accepting bookings</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setAvailable(true)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${available ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>🟢 Online</button>
                    <button onClick={() => setAvailable(false)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${!available ? "bg-red-400 text-white" : "bg-gray-100 text-gray-400"}`}>⏸ Pause</button>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard icon="📅" label="Today" value={todayBk.length} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard icon="✅" label="Completed" value={completedBk.length} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <StatCard icon="⭐" label="Rating" value={profile?.rating ? `${profile.rating}` : "—"} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
              </div>

              {/* Today's schedule */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Today's Schedule</h2>
                  <span className="text-xs text-gray-400 font-medium">{todayBk.length} appointment{todayBk.length !== 1 ? "s" : ""}</span>
                </div>
                {todayBk.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-3xl mb-2">📭</div>
                    <div className="text-sm text-gray-400">{isVerified ? "No appointments today — enjoy your day!" : "Appointments appear here after verification."}</div>
                  </div>
                ) : todayBk.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg shrink-0">🐕</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                      <div className="text-xs text-gray-400">{fmtTime(b.scheduled_at)}</div>
                    </div>
                    <Bdg text={b.status} cls={sColor(b.status)} />
                  </div>
                ))}
              </div>

              {/* Upcoming bookings summary */}
              {upcomingBk.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <h2 className="font-bold text-gray-800">Upcoming</h2>
                    <button onClick={() => setView("bookings")} className="text-xs text-orange-500 font-semibold">View all</button>
                  </div>
                  {upcomingBk.slice(0, 3).map(b => (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base shrink-0">📅</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{b.service_name || b.service_type}</div>
                        <div className="text-xs text-gray-400">{fmtDate(b.scheduled_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS VIEW ── */}
        {view === "bookings" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Bookings</h1>
              <span className="text-sm text-gray-400">{bookings.length} total</span>
            </div>
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { l: "Upcoming", v: upcomingBk.length, c: "bg-blue-50 text-blue-700" },
                { l: "Today", v: todayBk.length, c: "bg-orange-50 text-orange-700" },
                { l: "Completed", v: completedBk.length, c: "bg-emerald-50 text-emerald-700" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center ${s.c}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
            {bookings.length === 0 ? (
              <EmptyState icon="📅" title="No bookings yet" desc="They'll appear here after your profile is verified." />
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} at ${fmtTime(b.scheduled_at)}` : "Date TBD"}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)} />
                    </div>
                    {b.amount && <div className="text-sm font-bold text-gray-700 mt-1">${b.amount}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE VIEW ── */}
        {view === "profile" && (
          <div className="max-w-2xl mx-auto">
            {/* Profile hero */}
            <div className={`bg-gradient-to-br ${grad} px-5 pt-8 pb-16`}>
              <div className="md:hidden flex items-center justify-between mb-4">
                <span className="font-bold text-white">My Profile</span>
                <button onClick={onLogout} className="text-white/70 text-xs border border-white/20 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 border-2 border-white/30 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-3">
                  {rIcon(subRole)}
                </div>
                <h2 className="text-white text-xl font-extrabold">{profile?.name || session.name || "Complete Profile"}</h2>
                <p className="text-white/70 text-sm mt-1">{subRole} · {profile?.city || "—"}</p>
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {profile?.rating > 0 && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">⭐ {profile.rating}</span>}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isVerified ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                    {isVerified ? "✅ Verified" : "⏳ Pending Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 -mt-8 pb-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800">Profile Details</h3>
                  <button onClick={() => {
                    setEditForm({ name: profile?.name || session.name, email: profile?.email || "", city: profile?.city || "", bio: profile?.bio || "", experience: profile?.experience || "", service_areas: profile?.service_areas || "", langs: profile?.langs || "" });
                    setEditModal(true);
                  }} className="flex items-center gap-1 text-xs font-semibold text-orange-500 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-50 transition">
                    ✏️ Edit
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    ["📱", "Phone", profile?.phone || session.phone],
                    ["📧", "Email", profile?.email || "—"],
                    ["📍", "City", profile?.city || "—"],
                    ["💼", "Experience", profile?.experience || "—"],
                    ["🗣️", "Languages", profile?.langs || "—"],
                    ["🐾", "Services", Array.isArray(profile?.services) ? profile.services.join(", ") : (profile?.services || "—")],
                    ["🌍", "Service Areas", profile?.service_areas || "—"],
                  ].map(([icon, l, v]) => (
                    <div key={l} className="flex items-start gap-3 px-5 py-3">
                      <span className="text-base shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 font-medium">{l}</div>
                        <div className="text-sm font-semibold text-gray-700 mt-0.5 break-words">{v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {profile?.bio && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">About Me</h3>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"{profile.bio}"</p>
                </div>
              )}

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
            {view === n.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />}
            <span className="text-xl mb-0.5">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Profile" onClose={() => setEditModal(false)}>
          <Inp label="Full Name" value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <Inp label="Email" type="email" value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
          <Inp label="City" value={editForm.city || ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
          <Sel label="Experience" opts={["<1 year", "1–2 years", "2–5 years", "5–8 years", "8+ years"]} value={editForm.experience || ""} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} />
          <Inp label="Languages" value={editForm.langs || ""} onChange={e => setEditForm(f => ({ ...f, langs: e.target.value }))} />
          <Inp label="Service Areas" value={editForm.service_areas || ""} onChange={e => setEditForm(f => ({ ...f, service_areas: e.target.value }))} />
          <Txta label="Bio" value={editForm.bio || ""} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
          <button onClick={saveProfile} disabled={saving} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 disabled:opacity-60 transition mt-2">
            {saving ? "Saving…" : "Save Changes"}
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
  const [view, setView] = useState("overview");
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  useEffect(() => {
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getPendingVerifications().catch(() => ({ pending: [] })),
      api.getAdminUsers().catch(() => ({ users: [] })),
      api.getBookings().catch(() => ({ bookings: [] })),
    ]).then(([statsRes, pendRes, usersRes, bkRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      setPending(pendRes?.pending || []);
      setUsers(usersRes?.users || []);
      setBookings(bkRes?.bookings || []);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "success" }), 3500); };

  const approve = async id => {
    try {
      await api.verifyProfessional(id, "approve");
      setPending(l => l.filter(p => p.id !== id));
      showToast("✅ Professional approved and notified by SMS!");
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
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "verify", icon: "🔍", label: "Verify", badge: pending.length },
    { id: "users", icon: "👥", label: "Users" },
    { id: "bookings", icon: "📅", label: "Bookings" },
  ];

  if (loading) return <Spinner full />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 text-sm">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 text-white shrink-0 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <PawLogo sz={32} />
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

      {/* Main */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-8 min-h-screen">
        {/* Toast */}
        {toast.msg && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-5 py-3 rounded-full shadow-xl animate-fade-in ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.msg}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-16">
              <div className="md:hidden flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><PawLogo sz={24} /><span className="font-bold text-orange-400">PETclub</span></div>
                <button onClick={onLogout} className="text-gray-400 text-xs border border-gray-600 px-3 py-1.5 rounded-full">Sign out</button>
              </div>
              <h1 className="text-white text-2xl font-extrabold mb-1">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">PETclub Platform · All Regions</p>
            </div>
            <div className="px-5 -mt-8">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard icon="👥" label="Total Users" value={stats?.users ?? users.length} gradient="bg-gradient-to-br from-blue-500 to-blue-700" onClick={() => setView("users")} />
                <StatCard icon="✅" label="Verified Pros" value={stats?.verified_pros ?? 0} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <StatCard icon="⏳" label="Pending Review" value={pending.length} sub={pending.length > 0 ? "Needs action" : "All clear!"} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => pending.length && setView("verify")} />
                <StatCard icon="📅" label="Total Bookings" value={bookings.length} gradient="bg-gradient-to-br from-violet-500 to-purple-600" onClick={() => setView("bookings")} />
              </div>

              {/* Pending alert banner */}
              {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 mb-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
                    <div>
                      <div className="font-bold text-amber-800 text-sm">{pending.length} professional{pending.length !== 1 ? "s" : ""} await review</div>
                      <div className="text-xs text-amber-700">Approve or reject their applications</div>
                    </div>
                  </div>
                  <button onClick={() => setView("verify")} className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-600 shrink-0 transition">
                    Review →
                  </button>
                </div>
              )}

              {/* Recent bookings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Bookings</h2>
                  <button onClick={() => setView("bookings")} className="text-xs text-orange-500 font-semibold">View all</button>
                </div>
                {bookings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No bookings yet.</div>
                ) : bookings.slice(0, 6).map((b, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base shrink-0">🐕</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                      <div className="text-xs text-gray-400">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"}</div>
                    </div>
                    <Bdg text={b.status} cls={sColor(b.status)} />
                  </div>
                ))}
              </div>

              {/* Recent users */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setView("users")} className="text-xs text-orange-500 font-semibold">View all</button>
                </div>
                {users.slice(0, 5).map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{rIcon(proRole || u.role)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize">{proRole || u.role}</div>
                      </div>
                      <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── VERIFY PANEL ── */}
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
                    {/* Role stripe */}
                    <div className={`bg-gradient-to-r ${rColor(pro.sub_role)} px-5 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-base">{rIcon(pro.sub_role)}</span>
                        <span className="text-white font-bold text-sm">{pro.sub_role}</span>
                      </div>
                      <Bdg text="⏳ Pending" cls="bg-white/20 text-white border-white/20" />
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
                        </div>
                      </div>

                      {pro.bio && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-600 italic leading-relaxed">"{pro.bio}"</p>
                        </div>
                      )}

                      {Array.isArray(pro.services) && pro.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pro.services.map(s => (
                            <span key={s} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => approve(pro.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm transition">
                          ✅ Approve
                        </button>
                        <button onClick={() => setRejectModal(pro.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition">
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rejectModal && (
              <Modal title="Reject Application" onClose={() => setRejectModal(null)}>
                <p className="text-sm text-gray-500 mb-4">The reason will be sent to the professional via SMS and email.</p>
                <Txta label="Reason for rejection *" placeholder="e.g. Profile incomplete — please add bio and experience details, then resubmit." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={() => reject(rejectModal)} disabled={!rejectReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">Confirm Reject</button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* ── USERS PANEL ── */}
        {view === "users" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Users</h1>
              <span className="text-sm text-gray-400">{users.length} total</span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition" />
            </div>

            {/* Role filter */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
              {["All", "customer", "Groomer", "Trainer", "Vet"].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all ${roleFilter === r ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                  {r === "customer" ? "🐕 Customers" : r === "All" ? "All" : `${rIcon(r)} ${r}s`}
                </button>
              ))}
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState icon="👥" title="No users found" desc="Try a different search or filter." />
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  const verStatus = u.professional_profiles?.[0]?.verification_status;
                  return (
                    <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl shrink-0">
                        {rIcon(proRole || u.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize truncate">{proRole || u.role} · {u.phone}</div>
                        {proRole && verStatus && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${sColor(verStatus)}`}>{verStatus}</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")} />
                        <button onClick={() => suspend(u.id)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${u.is_active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                          {u.is_active ? "Suspend" : "Restore"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS PANEL ── */}
        {view === "bookings" && (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-extrabold text-gray-800">Bookings</h1>
              <span className="text-sm text-gray-400">{bookings.length} total</span>
            </div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { l: "Upcoming", v: bookings.filter(b => b.status === "upcoming").length, c: "bg-blue-50 text-blue-700" },
                { l: "Completed", v: bookings.filter(b => b.status === "completed").length, c: "bg-emerald-50 text-emerald-700" },
                { l: "Total", v: bookings.length, c: "bg-orange-50 text-orange-700" },
              ].map(s => (
                <div key={s.l} className={`rounded-xl p-3 text-center ${s.c}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </div>
              ))}
            </div>

            {bookings.length === 0 ? (
              <EmptyState icon="📅" title="No bookings yet" desc="Bookings will appear here once users start booking." />
            ) : (
              <div className="space-y-3">
                {bookings.map((b, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} · ${fmtTime(b.scheduled_at)}` : "—"}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)} />
                    </div>
                    {b.amount && <div className="text-xs font-bold text-gray-700">${b.amount}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 flex shadow-nav">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors relative ${view === n.id ? "text-orange-500" : "text-gray-400"}`}>
            {view === n.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />}
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
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (session.role === "admin") { setProfileChecked(true); return; }
    api.getMyProProfile().then(res => {
      const incomplete = !res.profile?.bio && !res.profile?.experience;
      setNeedsOnboarding(incomplete);
      setProfileChecked(true);
    }).catch(() => { setNeedsOnboarding(false); setProfileChecked(true); });
  }, [session]);

  if (!profileChecked) return <Spinner full />;
  if (session.role === "admin") return <AdminDashboard session={session} onLogout={onLogout} />;
  if (needsOnboarding) return <ProfessionalOnboarding session={session} onComplete={() => setNeedsOnboarding(false)} />;
  return <ProfessionalDashboard session={session} onLogout={onLogout} />;
}
