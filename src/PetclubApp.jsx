import { useState, useEffect } from "react";
import { api } from "./api.js";
import { loadPets, savePets } from "./utils/storage.js";
import { TC, fmtDate } from "./data/mockData.js";

/* ── helpers ── */
const today = () => new Date().toISOString().split("T")[0];
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const daysUntil = s => Math.ceil((new Date(s) - Date.now()) / 864e5);
const isDueSoon = (s, d) => { const n = daysUntil(s); return n >= 0 && n <= d; };
const speciesEmoji = s => s === "cat" ? "🐈" : "🐕";

const INITIAL_PETS = [];

const SVC_OPTS = {
  grooming: ["Full Groom","Basic Groom","Bath & Brush","Nail Trim","De-shedding","Herbal Bath","Spa Treatment"],
  training: ["Puppy Basics","Basic Obedience","Advanced Obedience","Agility","Behaviour Correction","Leash Training"],
  food:     ["Dry Food","Wet Food","Raw Diet","Treats","Supplement"],
  vet:      ["General Check-up","Vaccination","Deworming","Dental Care","Surgery","Emergency Care"],
};

const TAB_META = {
  grooming: { icon:"✂️", label:"Grooming", color:"blue" },
  training: { icon:"🎓", label:"Training", color:"purple" },
  food:     { icon:"🍖", label:"Food",     color:"green" },
  vet:      { icon:"🏥", label:"Vet",      color:"rose" },
};

const SERVICES = [
  { id:"grooming", icon:"✂️", label:"Grooming", bg:"bg-blue-50",   tc:"text-blue-600",   desc:"Doorstep grooming" },
  { id:"training", icon:"🎓", label:"Training", bg:"bg-purple-50", tc:"text-purple-600", desc:"Certified trainers" },
  { id:"vet",      icon:"🏥", label:"Vet Care",  bg:"bg-rose-50",   tc:"text-rose-600",   desc:"In-home vet visits" },
  { id:"food",     icon:"🍖", label:"Pet Food",  bg:"bg-green-50",  tc:"text-green-600",  desc:"Free delivery" },
];

/* ── Shared UI ── */
const Spinner = ({ sm }) => <div className={`border-2 border-orange-400 border-t-transparent rounded-full animate-spin ${sm ? "w-4 h-4" : "w-8 h-8"}`} />;
const Bdg = ({ text, cls }) => <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{text}</span>;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition-colors">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

function Fld({ label, children }) {
  return <div className="mb-3.5"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>{children}</div>;
}

function Inp(props) {
  return <input className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" {...props} />;
}
function Sel({ opts, ...props }) {
  return <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white" {...props}>{opts.map(o => <option key={o}>{o}</option>)}</select>;
}
function Txta(props) {
  return <textarea className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none" rows={3} {...props} />;
}

function Stars({ n }) {
  return <span>{Array.from({length:5},(_,i)=><span key={i} className={i<n?"text-amber-400":"text-gray-200"}>★</span>)}</span>;
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const bg = type === "error" ? "bg-red-500" : "bg-green-500";
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 ${bg} text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-slide-up max-w-xs text-center`}>
      {msg}
    </div>
  );
}

const ASSIGNMENT_STATUS_CONFIG = {
  searching:          { icon:"🔍", label:"Finding Professional…", cls:"bg-blue-50 text-blue-700 border-blue-200",    animate: true  },
  offered:            { icon:"⏳", label:"Professional Notified",  cls:"bg-amber-50 text-amber-700 border-amber-200",  animate: true  },
  confirmed:          { icon:"✅", label:"Confirmed",              cls:"bg-emerald-50 text-emerald-700 border-emerald-200", animate: false },
  no_pros_available:  { icon:"😔", label:"No Pros Available",      cls:"bg-gray-50 text-gray-500 border-gray-200",     animate: false },
  manual:             { icon:"👤", label:"Assigned",               cls:"bg-violet-50 text-violet-700 border-violet-200", animate: false },
};

/* ══════════ MAIN APP ══════════ */
export default function PetclubApp({ session, onLogout }) {
  const [pets, setPets] = useState(() => loadPets(INITIAL_PETS));
  const [apiMode, setApiMode] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: session?.name, phone: session?.phone });
  const [view, setView] = useState("home");
  const [activePetId, setActivePetId] = useState(null);
  const [activeTab, setActiveTab] = useState("grooming");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [loadingPets, setLoadingPets] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingStep, setBookingStep] = useState(1); // 1=service 2=details 3=confirm
  const [bookingForm, setBookingForm] = useState({ service_type:"", service_name:"", pet_id:"", date:"", time:"10:00", address:"", city:"", notes:"", amount:"" });
  const [bookingLoading, setBookingLoading] = useState(false);

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const bsf = k => e => setBookingForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));
  const pet = pets.find(p => p.id === activePetId);

  // Load from API
  useEffect(() => {
    api.getMe().then(r => { if (r.user?.name) setUserInfo({ name: r.user.name, phone: r.user.phone, email: r.user.email, city: r.user.customer_profiles?.[0]?.city }); }).catch(() => {});
    api.getPets().then(r => {
      if (r.pets?.length) {
        setPets(r.pets.map(p => ({ id: p.id, name: p.name, species: p.species || "dog", breed: p.breed || "Mixed", age: p.age || "", dob: p.dob || "", weight: p.weight || "", gender: p.gender || "", color: p.color || "", chip: p.chip || "", records: { grooming:[], training:[], food:[], vet:[] } })));
        setApiMode(true);
      }
    }).catch(() => {}).finally(() => setLoadingPets(false));
    api.getBookings().then(r => setMyBookings(r.bookings || [])).catch(() => {});
  }, []);

  useEffect(() => { if (!apiMode) savePets(pets); }, [pets, apiMode]);

  const goTo = v => { setView(v); if (v !== "petDetail") setActivePetId(null); };
  const openPet = id => { setActivePetId(id); setActiveTab("grooming"); setView("petDetail"); };
  const showToast = (msg, type="success") => setToast({ msg, type });

  const addPet = async () => {
    if (!form.name?.trim()) return;
    const data = {
      name: form.name.trim(),
      species: form.species || "dog",
      breed: form.breed || "Mixed",
      age: form.age || "",
      dob: form.dob || "",
      weight: form.weight || "",
      gender: form.gender || "",
      color: form.color || "",
      chip: form.chip || "",
      insurance: form.insurance || "",
    };
    try {
      let newPet;
      if (apiMode) {
        const r = await api.addPet(data);
        newPet = { ...r.pet, records: { grooming:[], training:[], food:[], vet:[] } };
      } else {
        newPet = { id: `p${Date.now()}`, ...data, records: { grooming:[], training:[], food:[], vet:[] } };
      }
      setPets(prev => [...prev, newPet]);
      setModal(null); setForm({});
      showToast(`${data.name} added! 🐾`);
    } catch { showToast("Failed to save pet", "error"); }
  };

  const updatePet = async () => {
    if (!form.name?.trim() || !activePetId) return;
    const data = {
      name: form.name.trim(),
      species: form.species || "dog",
      breed: form.breed || "",
      age: form.age || "",
      dob: form.dob || "",
      weight: form.weight || "",
      gender: form.gender || "",
      color: form.color || "",
      chip: form.chip || "",
      insurance: form.insurance || "",
    };
    try {
      if (apiMode) { await api.updatePet(activePetId, data).catch(() => {}); }
      setPets(prev => prev.map(p => p.id === activePetId ? { ...p, ...data } : p));
      setModal(null); setForm({});
      showToast("Pet profile updated! 🐾");
    } catch { showToast("Failed to update", "error"); }
  };

  const updateProfile = async () => {
    if (!form.name?.trim()) return;
    try {
      await api.updateMe({ name: form.name.trim(), email: form.email || "", city: form.city || "" }).catch(() => {});
      setUserInfo(prev => ({ ...prev, name: form.name.trim(), email: form.email || prev.email, city: form.city || prev.city }));
      setModal(null); setForm({});
      showToast("Profile updated!");
    } catch { showToast("Failed to update", "error"); }
  };

  const addRecord = async () => {
    if (!activePetId) return;
    const date = form.date || today();
    const base = { id: `r${Date.now()}`, date };
    let rec;
    if (activeTab === "grooming")      rec = { ...base, service: form.service || "Grooming", by: form.by || "", cost: form.cost || "", notes: form.notes || "", rating: form.rating ? Number(form.rating) : 0 };
    else if (activeTab === "training") rec = { ...base, session: form.service || "Training", by: form.by || "", notes: form.notes || "", rating: form.rating ? Number(form.rating) : 0 };
    else if (activeTab === "food")     rec = { ...base, product: form.service || "Food", brand: form.by || "", qty: form.qty || "", cost: form.cost || "", notes: form.notes || "" };
    else                               rec = { ...base, detail: form.service || "Vet Visit", vet: form.by || "", clinic: form.clinic || "", vtype: form.vtype || "General Check-up", nextDue: form.nextDue || undefined, cost: form.cost || "", notes: form.notes || "" };
    try {
      if (apiMode) {
        const ap = { date, service: rec.service, session: rec.session, product: rec.product, detail: rec.detail, by: rec.by, brand: rec.brand, qty: rec.qty, vet: rec.vet, clinic: rec.clinic, cost: rec.cost, notes: rec.notes, rating: rec.rating, next_due: rec.nextDue };
        await api.addRecord(activePetId, activeTab, ap).catch(() => {});
      }
    } catch { }
    setPets(prev => prev.map(p => p.id === activePetId ? { ...p, records: { ...p.records, [activeTab]: [rec, ...p.records[activeTab]] } } : p));
    setModal(null); setForm({});
    showToast("Record saved!");
  };

  const createBooking = async () => {
    if (!bookingForm.service_type) return showToast("Select a service type", "error");
    if (!bookingForm.service_name) return showToast("Select a service", "error");
    if (!bookingForm.date)         return showToast("Pick a date", "error");
    setBookingLoading(true);
    try {
      const scheduled_at = bookingForm.date && bookingForm.time
        ? new Date(`${bookingForm.date}T${bookingForm.time}:00`).toISOString() : null;
      const res = await api.createBooking({
        service_type: bookingForm.service_type,
        service_name: bookingForm.service_name,
        pet_id: bookingForm.pet_id || null,
        scheduled_at,
        city: bookingForm.city || userInfo.city || "",
        address: bookingForm.address || "",
        notes: bookingForm.notes || "",
        amount: bookingForm.amount ? parseFloat(bookingForm.amount) : null,
      });
      setMyBookings(prev => [res.booking, ...prev]);
      setModal(null);
      setBookingStep(1);
      setBookingForm({ service_type:"", service_name:"", pet_id:"", date:"", time:"10:00", address:"", city:"", notes:"", amount:"" });
      showToast("✅ Booking placed! Finding your professional…");
      setView("bookings");
    } catch (e) { showToast(e.message || "Failed to book", "error"); }
    setBookingLoading(false);
  };

  const firstName = (userInfo.name || session?.name || "there").split(" ")[0];
  const totalRecs = pets.reduce((s,p) => s + p.records.grooming.length + p.records.training.length + p.records.food.length + p.records.vet.length, 0);
  const allUpcoming = pets.flatMap(p => p.records.vet.filter(v => v.nextDue && isDueSoon(v.nextDue, 60)).map(v => ({ ...v, petName: p.name, petId: p.id })));
  const filteredPets = pets.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase()));
  const pendingBookings = myBookings.filter(b => b.assignment_status === "confirmed");

  /* ── NAV ── */
  const NAV = [
    { id:"home",     icon:"🏠", label:"Home" },
    { id:"bookings", icon:"📅", label:"Bookings", badge: pendingBookings.length || null },
    { id:"pets",     icon:"🐾", label:"My Pets" },
    { id:"profile",  icon:"👤", label:"Profile" },
  ];

  /* ── HEADER ── */
  const Header = () => (
    <header className="sticky top-0 z-30 glass-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-lg font-black shadow-orange shrink-0">🐾</div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">PETclub</p>
            <p className="text-sm font-extrabold text-gray-900 leading-tight">{firstName}</p>
          </div>
        </div>
        <button onClick={() => setModal("reminders")}
          className="relative w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-lg hover:bg-orange-50 transition-colors">
          🔔
          {allUpcoming.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
        </button>
      </div>
    </header>
  );

  /* ── BOTTOM NAV ── */
  const BottomNav = () => (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto nav-safe">
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-nav mx-3 mb-3 rounded-2xl flex">
        {NAV.map(n => {
          const active = view === n.id || (view === "petDetail" && n.id === "pets");
          return (
            <button key={n.id} onClick={() => goTo(n.id)}
              className={`flex-1 flex flex-col items-center py-3 text-[11px] font-bold transition-all relative ${active ? "text-orange-500" : "text-gray-400"}`}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full" />}
              <span className="relative">
                <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>{n.icon}</span>
                {n.badge ? <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{n.badge}</span> : null}
              </span>
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  /* ── BOOKINGS VIEW ── */
  const BookingsView = () => {
    const statusMap = {
      searching:         { icon:"🔍", label:"Finding Pro…",   cls:"bg-blue-50 text-blue-700 border-blue-200" },
      offered:           { icon:"⏳", label:"Pro Notified",   cls:"bg-amber-50 text-amber-700 border-amber-200" },
      confirmed:         { icon:"✅", label:"Confirmed",      cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
      no_pros_available: { icon:"😔", label:"No Pro Found",   cls:"bg-gray-100 text-gray-500 border-gray-200" },
    };
    const refreshBookings = () => api.getBookings().then(r => setMyBookings(r.bookings || [])).catch(() => {});

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900">My Bookings</h2>
          <div className="flex gap-2">
            <button onClick={refreshBookings} className="text-xs font-semibold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50">🔄</button>
            <button onClick={() => { setBookingStep(1); setModal("bookService"); }}
              className="text-xs font-semibold bg-orange-500 text-white px-3 py-1.5 rounded-full hover:bg-orange-600">+ Book</button>
          </div>
        </div>

        {myBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <div className="font-bold text-gray-700 text-base mb-1">No bookings yet</div>
            <div className="text-sm text-gray-400 mb-5">Book grooming, training, or vet care for your pet</div>
            <button onClick={() => { setBookingStep(1); setModal("bookService"); }}
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-orange-600 transition">
              Book First Service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myBookings.map(b => {
              const s = statusMap[b.assignment_status] || statusMap.searching;
              const svcIcon = ({ Groomer:"✂️", Trainer:"🎓", Vet:"🏥" })[b.service_type] || "📋";
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Status bar */}
                  <div className={`px-4 py-2 flex items-center justify-between border-b ${s.cls}`}>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span>{s.icon}</span><span>{s.label}</span>
                      {(b.assignment_status === "searching" || b.assignment_status === "offered") && (
                        <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-bounce ml-1"/>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{svcIcon}</span>
                          <span className="font-bold text-gray-800">{b.service_name || b.service_type}</span>
                        </div>
                        {b.pets && <div className="text-xs text-gray-400 mt-0.5">🐾 {b.pets.name}</div>}
                      </div>
                      {b.amount && <div className="font-extrabold text-gray-700">₹{b.amount}</div>}
                    </div>
                    {b.scheduled_at && (
                      <div className="text-xs text-gray-500 mb-1">📅 {fmtDate(b.scheduled_at)} at {new Date(b.scheduled_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</div>
                    )}
                    {b.city && <div className="text-xs text-gray-500">📍 {[b.address, b.city].filter(Boolean).join(", ")}</div>}
                    {b.assignment_status === "no_pros_available" && (
                      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5 text-center mt-3">
                        No professionals available in your area right now. We'll keep searching and notify you via email.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── HOME DASHBOARD ── */
  const Home = () => (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Hero greeting */}
      <div className="bg-brand-gradient rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 text-8xl opacity-20 select-none">🐕</div>
        <div className="absolute -left-4 -bottom-4 text-7xl opacity-15 select-none">🐈</div>
        <div className="relative z-10">
          <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide mb-1">{getGreeting()}</p>
          <h1 className="text-2xl font-extrabold mb-1">{firstName}! 👋</h1>
          <p className="text-orange-100 text-sm">{pets.length > 0 ? `${pets.length} pet${pets.length!==1?"s":""} · ${totalRecs} care record${totalRecs!==1?"s":""}` : "Add your first pet to get started"}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => goTo("pets")}
          className="bg-white rounded-2xl border border-gray-100 p-4 text-left shadow-card hover:shadow-card-hover hover:border-orange-100 transition-all active:scale-[0.98]">
          <div className="text-2xl mb-2">🐾</div>
          <div className="text-2xl font-extrabold text-orange-500">{pets.length}</div>
          <div className="text-xs text-gray-400 font-medium">My Pets</div>
        </button>
        <button onClick={() => pets[0] && openPet(pets[0].id)}
          className="bg-white rounded-2xl border border-gray-100 p-4 text-left shadow-card hover:shadow-card-hover hover:border-blue-100 transition-all active:scale-[0.98]">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-2xl font-extrabold text-blue-600">{totalRecs}</div>
          <div className="text-xs text-gray-400 font-medium">Care Records</div>
        </button>
      </div>

      {/* Services */}
      <div>
        <h2 className="font-extrabold text-gray-900 mb-3">Quick Book</h2>
        <div className="grid grid-cols-4 gap-2">
          {SERVICES.map(s => (
            <button key={s.id} onClick={() => setModal("bookService")}
              className={`${s.bg} rounded-2xl p-3 text-center transition-all active:scale-[0.95] hover:opacity-90`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-xs font-bold ${s.tc}`}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* My Pets carousel */}
      {pets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">My Pets</h2>
            <button onClick={() => goTo("pets")} className="text-xs text-orange-500 font-bold">See all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {pets.map(p => (
              <button key={p.id} onClick={() => openPet(p.id)}
                className="shrink-0 bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-orange-100 p-3 text-center w-24 transition-all active:scale-[0.95]">
                <div className="text-4xl mb-1.5">{speciesEmoji(p.species)}</div>
                <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{p.breed.length>8?p.breed.slice(0,8)+"…":p.breed}</div>
              </button>
            ))}
            <button onClick={() => { setForm({species:"dog"}); setModal("addPet"); }}
              className="shrink-0 w-24 border-2 border-dashed border-orange-200 text-orange-400 rounded-2xl p-3 text-center hover:bg-orange-50 transition-colors flex flex-col items-center justify-center">
              <span className="text-2xl mb-1">+</span>
              <span className="text-[10px] font-bold">Add Pet</span>
            </button>
          </div>
        </div>
      )}

      {/* No pets CTA */}
      {pets.length === 0 && !loadingPets && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-orange-200 p-8 text-center">
          <div className="text-5xl mb-3">🐾</div>
          <h3 className="font-extrabold text-gray-900 mb-1">Add your first pet</h3>
          <p className="text-gray-400 text-sm mb-5">Track grooming, vet visits & more.</p>
          <button onClick={() => { setForm({species:"dog"}); setModal("addPet"); }}
            className="btn-primary px-8 py-2.5 rounded-2xl text-sm w-auto inline-flex">
            + Add Pet
          </button>
        </div>
      )}

      {/* Upcoming reminders */}
      {allUpcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💉</span>
            <h2 className="font-extrabold text-gray-900">Upcoming ({allUpcoming.length})</h2>
          </div>
          {allUpcoming.slice(0,3).map((v, i) => (
            <button key={i} onClick={() => openPet(v.petId)}
              className="w-full flex items-center justify-between py-2 border-b border-amber-100 last:border-0 text-sm text-left">
              <span className="font-semibold text-gray-800">{v.petName} · {v.detail}</span>
              <Bdg text={daysUntil(v.nextDue)===0?"Today":`${daysUntil(v.nextDue)}d`} cls="bg-amber-200 text-amber-800" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ── MY PETS ── */
  const MyPets = () => (
    <div className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Pets</h1>
          <p className="text-xs text-gray-400">{pets.length} companion{pets.length!==1?"s":""}</p>
        </div>
        <button onClick={() => { setForm({species:"dog"}); setModal("addPet"); }}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-orange transition-all active:scale-95">
          + Add Pet
        </button>
      </div>

      {pets.length > 1 && (
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
          <input type="search" placeholder="Search pets…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white" />
        </div>
      )}

      {filteredPets.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-5xl mb-3">🐾</div>
          <div className="font-bold text-gray-500">{search ? "No pets found" : "No pets yet"}</div>
          {!search && <button onClick={() => { setForm({species:"dog"}); setModal("addPet"); }} className="mt-4 btn-primary px-8 py-2.5 rounded-2xl text-sm w-auto inline-flex">Add your first pet</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPets.map(p => {
            const cnt = p.records.grooming.length + p.records.training.length + p.records.food.length + p.records.vet.length;
            return (
              <button key={p.id} onClick={() => openPet(p.id)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-orange-100 transition-all active:scale-[0.98] overflow-hidden">
                <div className={`flex items-center gap-4 p-4 ${p.species==="dog"?"bg-gradient-to-r from-orange-50 to-amber-50":"bg-gradient-to-r from-purple-50 to-pink-50"}`}>
                  <div className="text-5xl">{speciesEmoji(p.species)}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-gray-900 text-lg">{p.name}</h2>
                    <p className="text-sm text-gray-500">{p.breed}{p.gender?` · ${p.gender}`:""}{p.age?` · ${p.age}`:""}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cnt} care record{cnt!==1?"s":""}</p>
                  </div>
                  <span className="text-orange-400 font-bold text-lg">→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ── PET DETAIL ── */
  const PetDetail = () => {
    if (!pet) return null;
    const list = pet.records[activeTab] || [];
    return (
      <div className="p-4 animate-fade-in">
        <button onClick={() => goTo("pets")} className="inline-flex items-center gap-1.5 text-sm text-orange-500 font-bold mb-4 hover:text-orange-600">
          ← Back
        </button>
        <div className={`rounded-2xl p-5 mb-4 ${pet.species==="dog"?"bg-gradient-to-br from-orange-50 to-amber-100":"bg-gradient-to-br from-purple-50 to-pink-100"}`}>
          <div className="flex items-start gap-4">
            <div className="text-6xl">{speciesEmoji(pet.species)}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900">{pet.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{pet.breed || "Mixed"}{pet.gender ? ` · ${pet.gender}` : ""}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pet.age && <span className="bg-white/70 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">🎂 {pet.age}</span>}
                {pet.weight && <span className="bg-white/70 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">⚖️ {pet.weight}</span>}
                {pet.color && <span className="bg-white/70 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">🎨 {pet.color}</span>}
                {pet.dob && <span className="bg-white/70 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">📅 {pet.dob}</span>}
              </div>
              {pet.chip && <p className="text-xs text-gray-500 mt-1.5">🔖 Chip: <span className="font-mono">{pet.chip}</span></p>}
              {pet.insurance && <p className="text-xs text-gray-500 mt-0.5">🛡️ {pet.insurance}</p>}
            </div>
          </div>
          <button
            onClick={() => {
              setForm({ name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, dob: pet.dob, weight: pet.weight, gender: pet.gender, color: pet.color, chip: pet.chip, insurance: pet.insurance });
              setModal("editPet");
            }}
            className="mt-3 w-full bg-white/60 hover:bg-white/80 text-gray-700 font-bold py-2 rounded-xl text-xs transition-all border border-white/40">
            ✏️ Edit Pet Details
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-3">
          {Object.entries(TAB_META).map(([t, m]) => {
            const cnt = pet.records[t]?.length || 0;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeTab===t ? "bg-orange-500 text-white shadow-orange" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-200"}`}>
                {m.icon} {m.label}
                {cnt > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab===t?"bg-white/25":"bg-gray-100 text-gray-500"}`}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => { setForm({ date: today() }); setModal("addRecord"); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-200 text-orange-500 font-bold py-3.5 rounded-2xl hover:bg-orange-50 transition-colors mb-3 text-sm">
          + Add {TAB_META[activeTab].label} Record
        </button>

        <div className="space-y-3">
          {list.length === 0
            ? <div className="text-center py-10 text-gray-300"><div className="text-4xl mb-2">{TAB_META[activeTab].icon}</div><div className="font-bold text-gray-400">No {TAB_META[activeTab].label.toLowerCase()} records yet</div></div>
            : list.map(r => (
              <div key={r.id} className={`bg-white rounded-2xl border-l-4 ${TC[activeTab]?.border||"border-gray-200"} border border-gray-100 p-4 shadow-card animate-fade-in`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-sm text-gray-900">{r.service||r.session||r.product||r.detail}</p>
                  {r.cost && <span className="text-xs font-semibold text-gray-500 shrink-0">{r.cost}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{r.by||r.brand||r.vet}{r.clinic?` · ${r.clinic}`:""} · {fmtDate(r.date)}</p>
                {r.rating > 0 && <div className="mt-1.5"><Stars n={r.rating} /></div>}
                {r.notes && <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-50 pt-2">&ldquo;{r.notes}&rdquo;</p>}
                {r.nextDue && <div className="mt-2"><Bdg text={`Next: ${fmtDate(r.nextDue)}`} cls="bg-green-100 text-green-700" /></div>}
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  /* ── PROFILE ── */
  const Profile = () => {
    const initials = (userInfo.name || "P").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
    return (
    <div className="p-4 animate-fade-in pb-28">
      <h1 className="text-xl font-extrabold text-gray-900 mb-5">My Profile</h1>

      {/* Hero card */}
      <div className="bg-brand-gradient rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-inner border border-white/20">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{userInfo.name || "Pet Parent"}</h2>
            <p className="text-orange-100 text-xs mt-0.5">PETclub Member</p>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1">🐾 Pet Owner</span>
          </div>
        </div>
        <button
          onClick={() => { setForm({ name: userInfo.name || "", email: userInfo.email || "", city: userInfo.city || "" }); setModal("editProfile"); }}
          className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-2xl text-sm transition-all border border-white/20">
          ✏️ Edit Profile
        </button>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card mb-4">
        <div className="px-5 pt-4 pb-2 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Personal Information</p>
        </div>
        <div className="px-5">
          {[
            ["📱", "Phone", userInfo.phone || session?.phone || "—"],
            ["📧", "Email", userInfo.email || "Not added"],
            ["📍", "City",  userInfo.city  || "Not added"],
          ].map(([icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
              <span className="text-xl w-8 shrink-0">{icon}</span>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold ${val === "Not added" ? "text-gray-300 italic" : "text-gray-800"}`}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Activity</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-orange-500">{pets.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Pets</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-blue-600">{totalRecs}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Records</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold text-amber-600">{allUpcoming.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Due Soon</div>
          </div>
        </div>
      </div>

      {/* My Pets quick list */}
      {pets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">My Pets</p>
            <button onClick={() => goTo("pets")} className="text-xs text-orange-500 font-bold">View all →</button>
          </div>
          <div className="space-y-2">
            {pets.slice(0,3).map(p => (
              <button key={p.id} onClick={() => openPet(p.id)}
                className="w-full flex items-center gap-3 text-left hover:bg-gray-50 rounded-xl p-2 transition-colors">
                <span className="text-2xl">{speciesEmoji(p.species)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.breed}{p.gender ? ` · ${p.gender}` : ""}{p.age ? ` · ${p.age}` : ""}</p>
                </div>
                <span className="text-orange-400 text-sm">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setModal("logout")} className="w-full border border-red-200 text-red-500 font-bold py-3 rounded-2xl text-sm hover:bg-red-50 transition-colors">
        🚪 Sign Out
      </button>
    </div>
    );
  };

  return (
    <div className="app-shell">
      <Header />
      <main key={view} className="safe-bottom min-h-screen">
        {view === "home"      && <Home />}
        {view === "bookings"  && <BookingsView />}
        {view === "pets"      && <MyPets />}
        {view === "petDetail" && <PetDetail />}
        {view === "profile"   && <Profile />}
      </main>
      <BottomNav />
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ADD PET */}
      {modal === "addPet" && (
        <Modal title="Add New Pet 🐾" onClose={() => { setModal(null); setForm({}); }}>
          <Fld label="Pet Name *"><Inp autoFocus placeholder="e.g. Bruno" value={form.name||""} onChange={sf("name")} /></Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Species">
              <Sel opts={["dog","cat","bird","rabbit","other"]} value={form.species||"dog"} onChange={sf("species")} />
            </Fld>
            <Fld label="Gender">
              <Sel opts={["","Male","Female"]} value={form.gender||""} onChange={sf("gender")} />
            </Fld>
          </div>
          <Fld label="Breed"><Inp placeholder="e.g. Labrador Retriever" value={form.breed||""} onChange={sf("breed")} /></Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Date of Birth"><Inp type="date" value={form.dob||""} onChange={sf("dob")} /></Fld>
            <Fld label="Age"><Inp placeholder="e.g. 3 years" value={form.age||""} onChange={sf("age")} /></Fld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Weight"><Inp placeholder="e.g. 12 kg" value={form.weight||""} onChange={sf("weight")} /></Fld>
            <Fld label="Coat Color"><Inp placeholder="e.g. Golden" value={form.color||""} onChange={sf("color")} /></Fld>
          </div>
          <Fld label="Microchip ID"><Inp placeholder="15-digit chip number" value={form.chip||""} onChange={sf("chip")} /></Fld>
          <Fld label="Insurance Provider"><Inp placeholder="e.g. PetSure (optional)" value={form.insurance||""} onChange={sf("insurance")} /></Fld>
          <button onClick={addPet} disabled={!form.name?.trim()} className="btn-primary mt-2">Add Pet 🐾</button>
        </Modal>
      )}

      {/* EDIT PET */}
      {modal === "editPet" && pet && (
        <Modal title={`Edit ${pet.name} 🐾`} onClose={() => { setModal(null); setForm({}); }}>
          <Fld label="Pet Name *"><Inp autoFocus value={form.name||""} onChange={sf("name")} /></Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Species">
              <Sel opts={["dog","cat","bird","rabbit","other"]} value={form.species||"dog"} onChange={sf("species")} />
            </Fld>
            <Fld label="Gender">
              <Sel opts={["","Male","Female"]} value={form.gender||""} onChange={sf("gender")} />
            </Fld>
          </div>
          <Fld label="Breed"><Inp value={form.breed||""} onChange={sf("breed")} /></Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Date of Birth"><Inp type="date" value={form.dob||""} onChange={sf("dob")} /></Fld>
            <Fld label="Age"><Inp placeholder="e.g. 3 years" value={form.age||""} onChange={sf("age")} /></Fld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Weight"><Inp placeholder="e.g. 12 kg" value={form.weight||""} onChange={sf("weight")} /></Fld>
            <Fld label="Coat Color"><Inp placeholder="e.g. Golden" value={form.color||""} onChange={sf("color")} /></Fld>
          </div>
          <Fld label="Microchip ID"><Inp placeholder="15-digit chip number" value={form.chip||""} onChange={sf("chip")} /></Fld>
          <Fld label="Insurance Provider"><Inp value={form.insurance||""} onChange={sf("insurance")} /></Fld>
          <button onClick={updatePet} disabled={!form.name?.trim()} className="btn-primary mt-2">Save Changes</button>
        </Modal>
      )}

      {/* ADD RECORD */}
      {modal === "addRecord" && pet && (
        <Modal title={`Add ${TAB_META[activeTab].label} Record`} onClose={() => { setModal(null); setForm({}); }}>
          <Fld label={activeTab==="food"?"Product":"Service"}>
            <Sel opts={SVC_OPTS[activeTab]} value={form.service||""} onChange={sf("service")} />
          </Fld>
          <Fld label={activeTab==="food"?"Brand":activeTab==="vet"?"Vet Name":"Provider"}>
            <Inp placeholder={activeTab==="vet"?"Dr. Kavitha":"Arjun Mehta"} value={form.by||""} onChange={sf("by")} />
          </Fld>
          {activeTab==="vet" && <Fld label="Clinic"><Inp placeholder="PetCare Clinic" value={form.clinic||""} onChange={sf("clinic")} /></Fld>}
          {activeTab==="food" && <Fld label="Quantity"><Inp placeholder="3 kg" value={form.qty||""} onChange={sf("qty")} /></Fld>}
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Date *"><Inp type="date" value={form.date||""} onChange={sf("date")} /></Fld>
            <Fld label="Cost (₹/$)"><Inp placeholder="₹999" value={form.cost||""} onChange={sf("cost")} /></Fld>
          </div>
          {activeTab==="vet" && <Fld label="Next Due Date"><Inp type="date" value={form.nextDue||""} onChange={sf("nextDue")} /></Fld>}
          {(activeTab==="grooming"||activeTab==="training") && (
            <Fld label="Rating"><Sel opts={["","5 ★","4 ★","3 ★","2 ★","1 ★"]} value={form.rating||""} onChange={sf("rating")} /></Fld>
          )}
          <Fld label="Notes"><Txta placeholder="Additional notes…" value={form.notes||""} onChange={sf("notes")} /></Fld>
          <button onClick={addRecord} disabled={!form.date} className="btn-primary mt-1">Save Record</button>
        </Modal>
      )}

      {/* REMINDERS */}
      {modal === "reminders" && (
        <Modal title="Reminders 🔔" onClose={() => setModal(null)}>
          {allUpcoming.length === 0
            ? <p className="text-sm text-gray-400 py-6 text-center">No upcoming reminders! All caught up ✅</p>
            : allUpcoming.map((v, i) => (
              <button key={i} onClick={() => { setModal(null); openPet(v.petId); }}
                className="w-full text-left bg-gray-50 rounded-2xl p-3.5 mb-2 last:mb-0 hover:bg-orange-50 transition-colors">
                <p className="font-bold text-sm text-gray-900">{v.petName} — {v.detail}</p>
                <p className="text-xs text-gray-400 mt-0.5">{daysUntil(v.nextDue)===0?"Due today":daysUntil(v.nextDue)===1?"Due tomorrow":`Due in ${daysUntil(v.nextDue)} days`} · {fmtDate(v.nextDue)}</p>
              </button>
            ))
          }
        </Modal>
      )}

      {/* BOOK SERVICE — Multi-step */}
      {modal === "bookService" && (
        <Modal title={bookingStep === 1 ? "Select Service 📅" : bookingStep === 2 ? "Booking Details" : "Confirm Booking"} onClose={() => { setModal(null); setBookingStep(1); }}>

          {/* Step indicators */}
          <div className="flex items-center mb-5">
            {["Service","Details","Confirm"].map((s,i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i+1 < bookingStep ? "bg-emerald-500 text-white" : i+1 === bookingStep ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i+1 < bookingStep ? "✓" : i+1}
                </div>
                <div className="text-xs font-semibold ml-1 mr-2 text-gray-500">{s}</div>
                {i < 2 && <div className={`flex-1 h-0.5 mr-2 ${i+1 < bookingStep ? "bg-emerald-400" : "bg-gray-200"}`}/>}
              </div>
            ))}
          </div>

          {/* STEP 1: Service type */}
          {bookingStep === 1 && (
            <div className="space-y-3">
              {SERVICES.filter(s => s.id !== "food").map(s => {
                const subRole = s.id === "grooming" ? "Groomer" : s.id === "training" ? "Trainer" : "Vet";
                const selected = bookingForm.service_type === subRole;
                return (
                  <button key={s.id} onClick={() => bsf("service_type")(subRole)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selected ? "border-orange-400 bg-orange-50" : `border-gray-100 ${s.bg}`}`}>
                    <div className="text-2xl">{s.icon}</div>
                    <div className="text-left flex-1">
                      <div className={`font-bold ${selected ? "text-orange-600" : s.tc}`}>{s.label}</div>
                      <div className="text-xs text-gray-500">{s.desc}</div>
                    </div>
                    {selected && <span className="text-orange-500 font-bold">✓</span>}
                  </button>
                );
              })}
              <button disabled={!bookingForm.service_type} onClick={() => setBookingStep(2)}
                className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-40 hover:bg-orange-600 transition">
                Next →
              </button>
            </div>
          )}

          {/* STEP 2: Details */}
          {bookingStep === 2 && (
            <div>
              {/* Specific service */}
              <Fld label="Specific Service *">
                <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
                  value={bookingForm.service_name} onChange={bsf("service_name")}>
                  <option value="">Select service…</option>
                  {(SVC_OPTS[{ Groomer:"grooming", Trainer:"training", Vet:"vet" }[bookingForm.service_type]] || []).map(o => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Fld>
              {/* Pet */}
              {pets.length > 0 && (
                <Fld label="Pet">
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
                    value={bookingForm.pet_id} onChange={bsf("pet_id")}>
                    <option value="">Select pet…</option>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                  </select>
                </Fld>
              )}
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <Fld label="Date *">
                  <Inp type="date" min={today()} value={bookingForm.date} onChange={bsf("date")}/>
                </Fld>
                <Fld label="Time">
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
                    value={bookingForm.time} onChange={bsf("time")}>
                    {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Fld>
              </div>
              {/* Address */}
              <Fld label="Address">
                <Inp placeholder="House/flat, street, locality" value={bookingForm.address} onChange={bsf("address")}/>
              </Fld>
              <Fld label="City *">
                <Inp placeholder="e.g. Mumbai" value={bookingForm.city || userInfo.city || ""} onChange={bsf("city")}/>
              </Fld>
              {/* Notes */}
              <Fld label="Special Notes">
                <Txta placeholder="Any special instructions for the professional…" value={bookingForm.notes} onChange={bsf("notes")} rows={2}/>
              </Fld>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setBookingStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">← Back</button>
                <button disabled={!bookingForm.service_name || !bookingForm.date || !(bookingForm.city || userInfo.city)} onClick={() => setBookingStep(3)}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40 hover:bg-orange-600 transition">Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {bookingStep === 3 && (
            <div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {({ Groomer:"✂️", Trainer:"🎓", Vet:"🏥" })[bookingForm.service_type] || "📋"}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800">{bookingForm.service_name}</div>
                    <div className="text-xs text-orange-600">{bookingForm.service_type}</div>
                  </div>
                </div>
                {bookingForm.pet_id && pets.find(p => p.id === bookingForm.pet_id) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🐾</span><span>{pets.find(p => p.id === bookingForm.pet_id)?.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span><span>{bookingForm.date} at {bookingForm.time}</span>
                </div>
                {(bookingForm.city || userInfo.city) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📍</span><span>{[bookingForm.address, bookingForm.city || userInfo.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {bookingForm.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-500 italic">
                    <span>📝</span><span>"{bookingForm.notes}"</span>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
                🔍 After confirming, we'll find the best available {bookingForm.service_type} in your area using our smart matching system. You'll be notified once confirmed!
              </div>
              <div className="flex gap-3">
                <button onClick={() => setBookingStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">← Back</button>
                <button disabled={bookingLoading} onClick={createBooking}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-60 hover:bg-orange-600 transition">
                  {bookingLoading ? "Placing…" : "✅ Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* EDIT PROFILE */}
      {modal === "editProfile" && (
        <Modal title="Edit Profile ✏️" onClose={() => { setModal(null); setForm({}); }}>
          <Fld label="Full Name *"><Inp autoFocus placeholder="Your full name" value={form.name||""} onChange={sf("name")} /></Fld>
          <Fld label="Email">
            <Inp type="email" placeholder="your@email.com" value={form.email||""} onChange={sf("email")} />
          </Fld>
          <Fld label="City / Location">
            <Inp placeholder="e.g. Mumbai, Bangalore" value={form.city||""} onChange={sf("city")} />
          </Fld>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3 text-xs text-orange-700">
            📱 Phone number cannot be changed. It&apos;s your unique identifier.
          </div>
          <button onClick={updateProfile} disabled={!form.name?.trim()} className="btn-primary mt-1">Save Profile</button>
        </Modal>
      )}

      {/* LOGOUT */}
      {modal === "logout" && (
        <Modal title="Sign out?" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500 mb-5">You&apos;ll need to sign in again to access your pets.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={onLogout} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl text-sm hover:bg-red-600">Sign Out</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
