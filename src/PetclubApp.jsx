import { useState, useEffect, lazy, Suspense } from "react";
import { api } from "./api.js";
import { loadPets, savePets } from "./utils/storage.js";
import { TC, fmtDate } from "./data/mockData.js";
import { AddressInput, getEmailSuggestion } from "./Login.jsx";
import { AddressPicker } from "./components/AddressPicker.jsx";

// Lazy-load heavy map component (Mapbox GL is ~500 KB)
const TrackingMap = lazy(() => import("./components/TrackingMap.jsx"));

/* ── helpers ── */
const today = () => new Date().toISOString().split("T")[0];
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const daysUntil = s => Math.ceil((new Date(s) - Date.now()) / 864e5);
const isDueSoon = (s, d) => { const n = daysUntil(s); return n >= 0 && n <= d; };
const speciesEmoji = s => s === "cat" ? "🐈" : "🐕";

const INITIAL_PETS = [];

// ── Service Catalog & Pricing ────────────────────────────────────────────────
// Platform subsidy applied to every bookable service (hidden from SPs)
const PLATFORM_DISCOUNT = 150; // ₹150 PETclub offer

// Grooming — tiered by pet size
const GROOMING_PACKAGES = [
  { name: "Basic Bath",          prices: { Small: 800,  Medium: 1000, Large: 1300, Cat: 900  }, icon: "🛁", desc: "Shampoo, blow-dry & ear clean" },
  { name: "Trimming & Hygiene",  prices: { Small: 1300, Medium: 1500, Large: 1800, Cat: 1400 }, icon: "✂️", desc: "Bath + full trim, nail & paw care" },
  { name: "Complete Makeover",   prices: { Small: 1900, Medium: 2200, Large: 2600, Cat: 1600 }, icon: "✨", desc: "Full groom + styling + spa finish" },
];
const PET_SIZES = [
  { id: "Small",  label: "Small",  sub: "Up to 10 kg" },
  { id: "Medium", label: "Medium", sub: "10 – 20 kg"  },
  { id: "Large",  label: "Large",  sub: "20 kg+"      },
  { id: "Cat",    label: "Cat",    sub: "All breeds"  },
];
const GROOMING_ADDONS = [
  { id: "dematting",  label: "De-matting",             price: 550, desc: "Long-haired breeds — Shih Tzu, Golden" },
  { id: "tick_flea",  label: "Tick & Flea Treatment",   price: 750, desc: "Medicated treatment" },
  { id: "anal_gland", label: "Anal Gland Expression",   price: 300, desc: "Hygienic value-add" },
];

// Training — time-based packages (not size-dependent)
const TRAINING_PACKAGES = [
  { name: "Consultation Session",           price: 650,   icon: "💬", desc: "60 min temperament & behaviour assessment" },
  { name: "Puppy Basics",                   price: 650,   icon: "🐶", desc: "Gentle first sessions for pups under 6 months" },
  { name: "Leash Training",                 price: 800,   icon: "🦮", desc: "Per session — walking & heel training" },
  { name: "Behavioural Modification",       price: 1500,  icon: "🧠", desc: "Per session — anxiety, aggression, reactivity" },
  { name: "Agility Training",               price: 1500,  icon: "⚡", desc: "Per session — obstacle & agility course" },
  { name: "Advanced Obedience",             price: 1800,  icon: "🏆", desc: "Per session — off-leash & complex commands" },
  { name: "Basic Obedience (10 Sessions)",  price: 10000, icon: "🎓", desc: "Full package — sit, stay, recall & leash basics" },
];

// SVC_OPTS — used for pet health RECORDS only (not booking flow)
const SVC_OPTS = {
  grooming: ["Basic Bath","Trimming & Hygiene","Complete Makeover","De-matting","Tick & Flea Treatment","Anal Gland Expression","Puppy/Kitten First Groom","Herbal Bath","Spa Treatment"],
  training: ["Consultation Session","Puppy Basics","Basic Obedience","Behavioural Modification","Advanced Obedience","Leash Training","Agility Training"],
  food:     ["Dry Food","Wet Food","Raw Diet","Treats","Supplement"],
  vet:      ["General Check-up","Vaccination","Deworming","Dental Care","Surgery","Emergency Care"],
};

const TAB_META = {
  grooming: { icon:"✂️", label:"Grooming", color:"blue" },
  training: { icon:"🐕‍🦺", label:"Training", color:"purple" },
  food:     { icon:"🍖", label:"Food",     color:"green" },
  vet:      { icon:"🏥", label:"Vet",      color:"rose" },
};

const SERVICES = [
  { id:"grooming", icon:"✂️",  label:"Grooming", bg:"bg-blue-50",   tc:"text-blue-600",   desc:"Doorstep grooming" },
  { id:"training", icon:"🐕‍🦺", label:"Training", bg:"bg-purple-50", tc:"text-purple-600", desc:"Certified trainers" },
  { id:"vet",      icon:"🏥",  label:"Vet Care",  bg:"bg-rose-50",   tc:"text-rose-600",   desc:"In-home vet visits" },
  { id:"food",     icon:"🍖",  label:"Pet Food",  bg:"bg-green-50",  tc:"text-green-600",  desc:"Free delivery" },
];

/* ── Shared UI ── */
const Spinner = ({ sm }) => <div className={`border-2 border-orange-400 border-t-transparent rounded-full animate-spin ${sm ? "w-4 h-4" : "w-8 h-8"}`} />;
const Skeleton = ({ h = "h-4", w = "w-full", cls = "" }) => <div className={`${h} ${w} bg-gray-200 rounded-xl animate-pulse ${cls}`} />;
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
    <div className="flex items-center gap-3"><Skeleton h="h-10" w="w-10" cls="rounded-xl shrink-0"/><div className="flex-1 space-y-2"><Skeleton h="h-4" w="w-3/4"/><Skeleton h="h-3" w="w-1/2"/></div></div>
    <Skeleton h="h-3" w="w-full"/><Skeleton h="h-3" w="w-2/3"/>
  </div>
);
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


/* ══════════ MAIN APP ══════════ */
export default function PetclubApp({ session, onLogout }) {
  // Derive currency from phone prefix — instant, no API round-trip needed
  // +91 → India (₹)  |  everything else → USA/international ($)
  const currencySymbol = session?.phone?.startsWith("+91") ? "₹" : "$";

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
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1=service 2=details 3=confirm
  const [bookingForm, setBookingForm] = useState({ service_type:"", service_name:"", pet_size:"", addons:[], pet_id:"", date:"", time:"10:00", address:"", city:"", notes:"", amount:"" });
  const [bookingAddrMeta, setBookingAddrMeta] = useState({ lat: null, lng: null });
  const [bookingAddrErr,  setBookingAddrErr]  = useState("");
  const [editAddrMeta,   setEditAddrMeta]   = useState({ lat: null, lng: null, postalCode: "", city: "", state: "" });
  const [editEmailErr,   setEditEmailErr]   = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [ratingModal, setRatingModal] = useState(null); // { bookingId, serviceName }
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratedBookings, setRatedBookings] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("petclub_rated") || "[]")); } catch { return new Set(); }
  });
  const [trackingBooking, setTrackingBooking] = useState(null); // booking object → open TrackingMap
  const [loadedPetRecs, setLoadedPetRecs] = useState(new Set()); // tracks which pet IDs have had API records fetched

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const bsf = k => e => setBookingForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));
  const pet = pets.find(p => p.id === activePetId);

  // Load from API
  useEffect(() => {
    api.getMe().then(r => {
      if (r.user?.name) {
        const cp = r.user.customer_profiles?.[0] || {};
        setUserInfo({
          name: r.user.name,
          phone: r.user.phone,
          email: r.user.email,
          address: cp.address || "",
          area: cp.area || "",
          city: cp.city || "",
          pincode: cp.pincode || "",
          country: cp.country || "India",
        });
      }
    }).catch(() => {});
    api.getPets().then(r => {
      if (r.pets?.length) {
        setPets(r.pets.map(p => ({ id: p.id, name: p.name, species: p.species || "dog", breed: p.breed || "Mixed", age: p.age || "", dob: p.dob || "", weight: p.weight || "", gender: p.gender || "", color: p.color || "", chip: p.chip || "", records: { grooming:[], training:[], food:[], vet:[] } })));
        setApiMode(true);
      }
    }).catch(() => {}).finally(() => setLoadingPets(false));
    api.getBookings().then(r => setMyBookings(r.bookings || [])).catch(() => {});
    // Load loyalty data (only for customers — graceful on 403)
    api.getLoyalty().then(r => { if (r.success) setLoyaltyData(r); }).catch(() => {});
  }, []);

  // Smart polling: 5s when any booking is actively searching/offered, otherwise 30s
  useEffect(() => {
    const hasActive = myBookings.some(b => b.assignment_status === "searching" || b.assignment_status === "offered");
    const interval = setInterval(() => {
      api.getBookings().then(r => setMyBookings(r.bookings || [])).catch(() => {});
    }, hasActive ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [myBookings]);

  useEffect(() => { if (!apiMode) savePets(pets); }, [pets, apiMode]);
  useEffect(() => { localStorage.setItem("petclub_rated", JSON.stringify([...ratedBookings])); }, [ratedBookings]);

  // Lazy-load pet records from API when a pet detail view is opened
  useEffect(() => {
    if (!activePetId || !apiMode || loadedPetRecs.has(activePetId)) return;
    const types = ["grooming", "training", "food", "vet"];
    Promise.allSettled(types.map(t => api.getRecords(activePetId, t)))
      .then(results => {
        const recs = {};
        types.forEach((t, i) => {
          recs[t] = results[i].status === "fulfilled" ? (results[i].value?.records || []) : [];
        });
        setPets(prev => prev.map(p => p.id === activePetId ? { ...p, records: recs } : p));
        setLoadedPetRecs(prev => new Set([...prev, activePetId]));
      });
  }, [activePetId, apiMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      health_notes: form.health_notes || "",
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
      health_notes: form.health_notes || "",
    };
    try {
      if (apiMode) { await api.updatePet(activePetId, data); }
      setPets(prev => prev.map(p => p.id === activePetId ? { ...p, ...data } : p));
      setModal(null); setForm({});
      showToast("Pet profile updated! 🐾");
    } catch (e) { showToast(e.message || "Failed to update pet", "error"); }
  };

  const updateProfile = async () => {
    if (!form.name?.trim()) return showToast("Name is required", "error");

    // Email validation
    if (form.email) {
      const em = form.email.trim().toLowerCase();
      const sugg = getEmailSuggestion(em);
      if (sugg) {
        setEditEmailErr(`"${em.split('@')[1]}" doesn't look right. Did you mean ${sugg}?`);
        return;
      }
      // Block obviously fake TLDs
      const fakeTlds = ['.con','.cmo','.cim','.ocm','.cm','.co.'];
      if (fakeTlds.some(t => em.endsWith(t))) {
        setEditEmailErr(`"${em}" is not a valid email address. Please check the domain.`);
        return;
      }
    }

    // If address was changed, try to get GPS from dropdown — but don't block save if not selected
    // (user may be on poor connection or just correcting a typo)

    try {
      const city = editAddrMeta.city || form.city || "";
      const pincode = editAddrMeta.postalCode || form.pincode || "";
      await api.updateMe({
        name: form.name.trim(),
        email: form.email?.trim() || "",
        address: form.address || "",
        area: form.area || "",
        city,
        pincode,
        country: form.country || "India",
        addressLat: editAddrMeta.lat || null,
        addressLng: editAddrMeta.lng || null,
        addressPostalCode: editAddrMeta.postalCode || null,
        addressCity: editAddrMeta.city || null,
        addressState: editAddrMeta.state || null,
      });
      setUserInfo(prev => ({
        ...prev,
        name: form.name.trim(),
        email: form.email?.trim() || prev.email,
        address: form.address || "",
        area: form.area || "",
        city,
        pincode,
        country: form.country || "India",
      }));
      setModal(null);
      setForm({});
      setEditAddrMeta({ lat: null, lng: null, postalCode: "", city: "", state: "" });
      setEditEmailErr("");
      showToast("Profile updated! ✅");
    } catch { showToast("Failed to update", "error"); }
  };

  const submitRating = async () => {
    if (!ratingVal || !ratingModal) return;
    setRatingLoading(true);
    try {
      await api.rateBooking(ratingModal.bookingId, ratingVal, ratingReview);
      setRatedBookings(prev => new Set([...prev, ratingModal.bookingId]));
      setRatingModal(null); setRatingVal(0); setRatingReview("");
      showToast("⭐ Thanks! +50 PETclub Credits earned!");
      // Refresh loyalty balance in background
      api.getLoyalty().then(r => { if (r.success) setLoyaltyData(r); }).catch(() => {});
    } catch (e) { showToast(e.message || "Failed to submit rating", "error"); }
    setRatingLoading(false);
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
        const ap = { date, service: rec.service, session: rec.session, product: rec.product, detail: rec.detail, by: rec.by, brand: rec.brand, qty: rec.qty, vet: rec.vet, clinic: rec.clinic, vtype: rec.vtype, cost: rec.cost, notes: rec.notes, rating: rec.rating, next_due: rec.nextDue };
        await api.addRecord(activePetId, activeTab, ap);
      }
      setPets(prev => prev.map(p => p.id === activePetId ? { ...p, records: { ...p.records, [activeTab]: [rec, ...p.records[activeTab]] } } : p));
      setModal(null); setForm({});
      showToast("Record saved!");
    } catch (e) { showToast(e.message || "Failed to save record", "error"); }
  };

  // Calculate final booking amount shown to customer (platform discount applied)
  const calcAmount = (form) => {
    if (form.service_type === "Groomer") {
      const pkg = GROOMING_PACKAGES.find(p => p.name === form.service_name);
      if (!pkg || !form.pet_size) return null;
      const base     = pkg.prices[form.pet_size] || 0;
      const addonSum = (form.addons || []).reduce((s, id) => s + (GROOMING_ADDONS.find(a => a.id === id)?.price || 0), 0);
      return { base, addonSum, discount: PLATFORM_DISCOUNT, total: Math.max(0, base + addonSum - PLATFORM_DISCOUNT) };
    }
    if (form.service_type === "Trainer") {
      const pkg = TRAINING_PACKAGES.find(p => p.name === form.service_name);
      if (!pkg) return null;
      return { base: pkg.price, addonSum: 0, discount: PLATFORM_DISCOUNT, total: Math.max(0, pkg.price - PLATFORM_DISCOUNT) };
    }
    return null; // Vet — quoted on-site
  };

  const createBooking = async () => {
    if (!bookingForm.service_type) return showToast("Select a service type", "error");
    if (!bookingForm.service_name) return showToast("Select a service", "error");
    if (!bookingForm.date)         return showToast("Pick a date", "error");
    setBookingLoading(true);
    try {
      const scheduled_at = bookingForm.date && bookingForm.time
        ? new Date(`${bookingForm.date}T${bookingForm.time}:00`).toISOString() : null;
      const pricing = calcAmount(bookingForm);
      const res = await api.createBooking({
        service_type: bookingForm.service_type,
        service_name: bookingForm.service_name,
        pet_id: bookingForm.pet_id || null,
        pet_size: bookingForm.pet_size || null,
        addons: bookingForm.addons?.length ? bookingForm.addons : null,
        scheduled_at,
        city: bookingForm.city || userInfo.city || "",
        address: bookingForm.address || "",
        notes: bookingForm.notes || "",
        amount: pricing ? pricing.total : (bookingForm.amount ? parseFloat(bookingForm.amount) : null),
        lat: bookingAddrMeta.lat,
        lng: bookingAddrMeta.lng,
      });
      setMyBookings(prev => [res.booking, ...prev]);
      setModal(null);
      setBookingStep(1);
      setBookingAddrMeta({ lat: null, lng: null });
      setBookingAddrErr("");
      setBookingForm({ service_type:"", service_name:"", pet_size:"", addons:[], pet_id:"", date:"", time:"10:00", address:"", city:"", notes:"", amount:"" });
      showToast("✅ Booking placed! Finding your professional…");
      setView("bookings");
    } catch (e) { showToast(e.message || "Failed to book", "error"); }
    setBookingLoading(false);
  };

  const firstName = (userInfo.name || session?.name || "there").split(" ")[0];
  const totalRecs = pets.reduce((s,p) => s + p.records.grooming.length + p.records.training.length + p.records.food.length + p.records.vet.length, 0);
  const allUpcoming = pets.flatMap(p => p.records.vet.filter(v => v.nextDue && isDueSoon(v.nextDue, 60)).map(v => ({ ...v, petName: p.name, petId: p.id })));
  const filteredPets = pets.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase()));
  // Show badge on bookings tab when any booking is still being matched
  const activeMatchingCount = myBookings.filter(b => b.assignment_status === "searching" || b.assignment_status === "offered").length;

  /* ── NAV ── */
  const NAV = [
    { id:"home",     icon:"🏠", label:"Home" },
    { id:"bookings", icon:"📅", label:"Bookings", badge: activeMatchingCount || null },
    { id:"pets",     icon:"🐾", label:"My Pets" },
    { id:"profile",  icon:"👤", label:"Profile" },
  ];

  /* ── HEADER ── */
  const Header = () => (
    <header className="sticky top-0 z-30 glass-white border-b border-gray-100 px-4 py-3 relative">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-brand-gradient" />
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-lg font-black shadow-orange shrink-0">🐾</div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">PETclub</p>
            <p className="text-sm font-extrabold text-gray-900 leading-tight">{firstName}</p>
          </div>
        </div>
        <button onClick={() => setModal("reminders")}
          className="relative w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-lg hover:bg-orange-50 active:scale-95 transition-all">
          🔔
          {allUpcoming.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center text-[8px] font-black text-white">{allUpcoming.length > 9 ? "9+" : allUpcoming.length}</span>}
        </button>
      </div>
    </header>
  );

  /* ── BOTTOM NAV ── */
  const BottomNav = () => (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto nav-safe">
      <div className="bg-white/96 backdrop-blur-xl border-t border-gray-100 mx-3 mb-3 rounded-2xl flex shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        {NAV.map(n => {
          const active = view === n.id || (view === "petDetail" && n.id === "pets");
          return (
            <button key={n.id} onClick={() => goTo(n.id)}
              className="flex-1 flex flex-col items-center py-2 transition-all">
              <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${active ? "bg-orange-50" : ""}`}>
                <span className="relative">
                  <span className={`text-xl block transition-all ${active ? "scale-110" : "opacity-50"}`}>{n.icon}</span>
                  {n.badge ? <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{n.badge}</span> : null}
                </span>
                <span className={`text-[11px] font-bold transition-colors ${active ? "text-orange-500" : "text-gray-400"}`}>{n.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );

  /* ── BOOKINGS VIEW ── */
  const BookingsView = () => {
    const statusMap = {
      searching:         { icon:"🔍", label:"Finding Pro…",      cls:"bg-blue-50 text-blue-700 border-blue-200" },
      offered:           { icon:"⏳", label:"Pro Notified",       cls:"bg-amber-50 text-amber-700 border-amber-200" },
      confirmed:         { icon:"✅", label:"Confirmed",          cls:"bg-emerald-50 text-emerald-700 border-emerald-200" },
      on_the_way:        { icon:"🚗", label:"Pro On The Way!",    cls:"bg-orange-50 text-orange-700 border-orange-300" },
      in_progress:       { icon:"⚙️", label:"In Progress",        cls:"bg-violet-50 text-violet-700 border-violet-200" },
      completed:         { icon:"🎉", label:"Completed",          cls:"bg-green-50 text-green-700 border-green-200" },
      cancelled:         { icon:"❌", label:"Cancelled",          cls:"bg-red-50 text-red-500 border-red-200" },
      pending:           { icon:"🕐", label:"Pending",            cls:"bg-gray-50 text-gray-500 border-gray-200" },
      no_pros_available: { icon:"😔", label:"No Pro Found",       cls:"bg-gray-100 text-gray-500 border-gray-200" },
    };
    const StarRow = ({ val, onSelect }) => (
      <div className="flex gap-2 justify-center my-3">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onSelect(n)}
            className={`text-3xl transition-transform hover:scale-110 ${n <= val ? "text-yellow-400" : "text-gray-200"}`}>★</button>
        ))}
      </div>
    );
    const refreshBookings = () => api.getBookings().then(r => setMyBookings(r.bookings || [])).catch(() => {});

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">My Bookings</h2>
            {myBookings.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{myBookings.length} total booking{myBookings.length!==1?"s":""}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={refreshBookings} className="text-xs font-semibold text-gray-400 border border-gray-200 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">🔄</button>
            <button onClick={() => { setBookingStep(1); setModal("bookService"); }}
              className="text-xs font-bold bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-orange">+ Book</button>
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
              const s = statusMap[b.assignment_status] || statusMap[b.status] || statusMap.pending;
              const svcIcon = ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥" })[b.service_type] || "📋";
              const svcAccent = ({ Groomer:"border-l-violet-500", Trainer:"border-l-blue-500", Vet:"border-l-emerald-500" })[b.service_type] || "border-l-orange-400";
              const svcBg = ({ Groomer:"bg-violet-50", Trainer:"bg-blue-50", Vet:"bg-emerald-50" })[b.service_type] || "bg-orange-50";
              return (
                <div key={b.id} className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden border-l-4 ${svcAccent}`}>
                  {/* Status bar */}
                  <div className={`px-4 py-2 flex items-center justify-between border-b ${s.cls}`}>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span>{s.icon}</span><span>{s.label}</span>
                      {(b.assignment_status === "searching" || b.assignment_status === "offered") && (
                        <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-bounce ml-1"/>
                      )}
                    </div>
                    {(b.total_amount || b.amount) && (
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-gray-800">{currencySymbol}{parseFloat(b.total_amount || b.amount).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">Total paid</div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className={`w-10 h-10 ${svcBg} rounded-xl flex items-center justify-center text-xl shrink-0`}>{svcIcon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 leading-tight">{b.service_name || b.service_type}</div>
                        {b.pets && <div className="text-xs text-gray-400 mt-0.5">🐾 {b.pets.name}</div>}
                      </div>
                    </div>
                    {b.scheduled_at && (
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><span>📅</span><span>{fmtDate(b.scheduled_at)} at {new Date(b.scheduled_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span></div>
                    )}
                    {b.city && <div className="text-xs text-gray-500 flex items-center gap-1.5"><span>📍</span><span>{[b.address, b.city].filter(Boolean).join(", ")}</span></div>}
                    {/* Pro name + Track button when confirmed or on the way */}
                    {(b.assignment_status === "confirmed" || b.assignment_status === "on_the_way") && b.professional_profiles?.users?.name && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
                          <span className="text-base">👤</span>
                          <div className="flex-1">
                            <div className="text-xs text-emerald-700 font-bold">{b.professional_profiles.users.name}</div>
                            <div className="text-[10px] text-emerald-500">{b.service_type} · Confirmed</div>
                          </div>
                        </div>
                        {/* 🚗 On the way banner */}
                        {b.assignment_status === "on_the_way" && (
                          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-2">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-bounce"/>
                            <span className="text-xs font-bold text-orange-700">Your professional is on the way!</span>
                          </div>
                        )}
                        {/* 🗺️ Live track button */}
                        <button
                          onClick={() => setTrackingBooking(b)}
                          className={`w-full flex items-center justify-center gap-2 ${b.assignment_status === "on_the_way" ? "bg-orange-500 hover:bg-orange-600" : "bg-violet-600 hover:bg-violet-700"} active:scale-[0.97] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md`}>
                          <span className="text-sm">🗺️</span>
                          {b.assignment_status === "on_the_way" ? "Track Live — On The Way!" : "Track Live"}
                          <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"/>
                        </button>
                      </div>
                    )}
                    {b.assignment_status === "no_pros_available" && (
                      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5 text-center mt-3">
                        No professionals available in your area right now. We'll keep searching and notify you via email.
                      </div>
                    )}
                    {/* Rate session button for completed bookings */}
                    {b.status === "completed" && !ratedBookings.has(b.id) && (
                      <button
                        onClick={() => { setRatingModal({ bookingId: b.id, serviceName: b.service_name || b.service_type }); setRatingVal(0); setRatingReview(""); }}
                        className="mt-3 w-full text-center text-xs font-bold text-yellow-600 border border-yellow-200 bg-yellow-50 rounded-xl py-2 hover:bg-yellow-100 transition">
                        ⭐ Rate this session
                      </button>
                    )}
                    {ratedBookings.has(b.id) && (
                      <div className="mt-3 text-center text-xs text-gray-400 font-medium">✅ Thanks for your review!</div>
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
    <div className="animate-fade-in">
      {/* Hero — full-bleed gradient */}
      <div className="relative bg-brand-gradient overflow-hidden px-5 pt-6 pb-12">
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-52 h-52 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-6 top-20 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -left-8 bottom-0 w-40 h-40 bg-black/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-orange-100/80 text-[11px] font-semibold uppercase tracking-widest mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-black text-white leading-tight mb-5">{firstName}! 👋</h1>
          {/* Stats row */}
          <div className="flex gap-2.5">
            {[
              { v: pets.length,        l: "Pets",     onClick: () => goTo("pets") },
              { v: totalRecs,          l: "Records",  onClick: () => pets[0] ? openPet(pets[0].id) : null },
              { v: myBookings.length,  l: "Bookings", onClick: () => goTo("bookings") },
            ].map(s => (
              <button key={s.l} onClick={s.onClick}
                className="flex-1 bg-white/20 active:bg-white/30 backdrop-blur-sm rounded-2xl py-3 px-1 text-center border border-white/15 transition-all">
                <div className="text-2xl font-black text-white leading-none">{s.v}</div>
                <div className="text-[10px] text-orange-100/90 font-semibold mt-1">{s.l}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 -mt-5 space-y-4">
        {/* Book a Service — raised card overlapping hero */}
        <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-gray-100 p-4">
          <h2 className="font-extrabold text-gray-900 mb-3 text-[13px] uppercase tracking-wide">Book a Service</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {SERVICES.map(s => {
              const svcRole = s.id === "grooming" ? "Groomer" : s.id === "training" ? "Trainer" : s.id === "vet" ? "Vet" : null;
              return (
                <button key={s.id}
                  onClick={() => {
                    if (svcRole) {
                      setBookingForm(f => ({ ...f, service_type: svcRole, service_name: "" }));
                      setBookingStep(2);
                    } else {
                      setBookingStep(1);
                    }
                    setModal("bookService");
                  }}
                  className={`${s.bg} rounded-2xl p-4 text-left transition-all active:scale-[0.96] hover:opacity-90 relative overflow-hidden group`}>
                  <div className="text-2xl mb-2 leading-none">{s.icon}</div>
                  <div className={`font-extrabold text-sm ${s.tc}`}>{s.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{s.desc}</div>
                  <span className={`absolute bottom-3 right-3.5 text-base ${s.tc} opacity-30 group-hover:opacity-70 transition-opacity`}>→</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent bookings */}
        {myBookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-extrabold text-gray-900">Recent Bookings</h2>
              <button onClick={() => goTo("bookings")} className="text-xs text-orange-500 font-bold">See all →</button>
            </div>
            <div className="space-y-2">
              {myBookings.slice(0, 2).map(b => {
                const svcIcon = ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥" })[b.service_type] || "📋";
                const svcColor = ({ Groomer:"bg-violet-100", Trainer:"bg-blue-100", Vet:"bg-emerald-100" })[b.service_type] || "bg-orange-100";
                const st = b.assignment_status;
                const stCls = st==="confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : st==="searching" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200";
                const stLabel = st==="confirmed" ? "Confirmed" : st==="searching" ? "Finding Pro…" : st==="offered" ? "Pro Notified" : "Pending";
                return (
                  <button key={b.id} onClick={() => goTo("bookings")}
                    className="w-full bg-white rounded-2xl border border-gray-100 shadow-card p-3.5 flex items-center gap-3 text-left hover:border-orange-100 transition-all active:scale-[0.98]">
                    <div className={`w-11 h-11 ${svcColor} rounded-xl flex items-center justify-center text-xl shrink-0`}>{svcIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">{b.service_name || b.service_type}</div>
                      {b.scheduled_at && <div className="text-xs text-gray-400 mt-0.5">{fmtDate(b.scheduled_at)}</div>}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${stCls}`}>{stLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* My Pets carousel */}
        {pets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900">My Pets</h2>
              <button onClick={() => goTo("pets")} className="text-xs text-orange-500 font-bold">See all →</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {loadingPets && [1,2,3].map(i => (
                <div key={i} className="shrink-0 w-24 h-24 rounded-2xl skeleton-shimmer" />
              ))}
              {pets.map(p => (
                <button key={p.id} onClick={() => openPet(p.id)}
                  className="shrink-0 bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-orange-100 p-3 text-center w-24 transition-all active:scale-[0.95]">
                  <div className="text-4xl mb-1.5">{speciesEmoji(p.species)}</div>
                  <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{p.breed.length > 8 ? p.breed.slice(0,8)+"…" : p.breed}</div>
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
            {allUpcoming.slice(0, 3).map((v, i) => (
              <button key={i} onClick={() => openPet(v.petId)}
                className="w-full flex items-center justify-between py-2.5 border-b border-amber-100 last:border-0 text-sm text-left">
                <span className="font-semibold text-gray-800">{v.petName} · {v.detail}</span>
                <Bdg text={daysUntil(v.nextDue)===0 ? "Today" : `${daysUntil(v.nextDue)}d`} cls="bg-amber-200 text-amber-800" />
              </button>
            ))}
          </div>
        )}
      </div>
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
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${p.species==="dog" ? "bg-gradient-to-br from-orange-50 to-amber-100" : "bg-gradient-to-br from-purple-50 to-pink-100"}`}>
                    {speciesEmoji(p.species)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-gray-900 text-base">{p.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{p.breed}{p.gender ? ` · ${p.gender}` : ""}{p.age ? ` · ${p.age}` : ""}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {cnt > 0
                        ? <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cnt} record{cnt!==1?"s":""}</span>
                        : <span className="text-[10px] font-semibold text-gray-300 italic">No records yet</span>}
                      {p.weight && <span className="text-[10px] font-bold bg-blue-50 text-blue-400 px-2 py-0.5 rounded-full">⚖️ {p.weight}</span>}
                    </div>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.species==="dog" ? "bg-orange-50 text-orange-400" : "bg-purple-50 text-purple-400"}`}>→</div>
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
              {pet.health_notes && (
                <div className="mt-2 bg-rose-50/80 border border-rose-200 rounded-xl px-3 py-2">
                  <p className="text-xs font-bold text-rose-700 mb-0.5">⚕️ Health Notes</p>
                  <p className="text-xs text-rose-800 leading-relaxed">{pet.health_notes}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setForm({ name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, dob: pet.dob, weight: pet.weight, gender: pet.gender, color: pet.color, chip: pet.chip, insurance: pet.insurance, health_notes: pet.health_notes || "" });
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
            const tabColors = { grooming:"bg-blue-500 shadow-blue-200", training:"bg-purple-500 shadow-purple-200", food:"bg-green-500 shadow-green-200", vet:"bg-rose-500 shadow-rose-200" };
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 shadow-sm ${activeTab===t ? `${tabColors[t]} text-white` : "bg-white border border-gray-200 text-gray-600 hover:border-orange-200"}`}>
                {m.icon} {m.label}
                {cnt > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab===t ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>{cnt}</span>}
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
      <div className="bg-brand-gradient rounded-3xl p-5 mb-4 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none"/>
        <div className="absolute -left-4 bottom-0 w-28 h-28 bg-black/5 rounded-full pointer-events-none"/>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-inner border border-white/25 backdrop-blur-sm">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-white">{userInfo.name || "Pet Parent"}</h2>
              <p className="text-orange-100/80 text-xs mt-0.5">{userInfo.phone || session?.phone || "PETclub Member"}</p>
              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full mt-1.5 border border-white/20">🐾 Pet Owner</span>
            </div>
          </div>
          <button
            onClick={() => { setForm({ name: userInfo.name || "", email: userInfo.email || "", address: userInfo.address || "", area: userInfo.area || "", city: userInfo.city || "", pincode: userInfo.pincode || "", country: userInfo.country || "India" }); setEditAddrMeta({ lat: null, lng: null, postalCode: "", city: "", state: "" }); setEditEmailErr(""); setModal("editProfile"); }}
            className="w-full bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white font-bold py-2.5 rounded-2xl text-sm transition-all border border-white/20">
            ✏️ Edit Profile
          </button>
        </div>
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
          ].map(([icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
              <span className="text-xl w-8 shrink-0">{icon}</span>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold ${val === "Not added" ? "text-gray-300 italic" : "text-gray-800"}`}>{val}</p>
              </div>
            </div>
          ))}
          {/* Full Address block */}
          <div className="flex items-start gap-3 py-3.5">
            <span className="text-xl w-8 shrink-0 mt-0.5">📍</span>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Address</p>
              {(userInfo.address || userInfo.area || userInfo.city || userInfo.pincode) ? (
                <div className="text-sm font-semibold text-gray-800 space-y-0.5">
                  {userInfo.address && <p>{userInfo.address}</p>}
                  {userInfo.area && <p>{userInfo.area}</p>}
                  <p>
                    {[userInfo.city, userInfo.pincode].filter(Boolean).join(" – ")}
                  </p>
                  {userInfo.country && <p className="text-gray-500 text-xs">{userInfo.country}</p>}
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-300 italic">Not added</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Activity Summary</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { v: pets.length,        l: "Pets",     icon: "🐾", bg: "bg-orange-50", tc: "text-orange-500", onClick: () => goTo("pets") },
            { v: totalRecs,          l: "Records",  icon: "📋", bg: "bg-blue-50",   tc: "text-blue-600",   onClick: () => pets[0] ? openPet(pets[0].id) : null },
            { v: myBookings.length,  l: "Bookings", icon: "📅", bg: "bg-violet-50", tc: "text-violet-600", onClick: () => goTo("bookings") },
          ].map(s => (
            <button key={s.l} onClick={s.onClick}
              className={`${s.bg} rounded-2xl p-3 text-center active:scale-95 transition-all`}>
              <div className="text-base mb-0.5">{s.icon}</div>
              <div className={`text-xl font-black ${s.tc}`}>{s.v}</div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Loyalty Credits Dashboard ── */}
      {(() => {
        const ld = loyaltyData;
        const bal = ld?.balance ?? 0;
        const threshold = ld?.threshold ?? 1000;
        const pct = ld ? Math.min(100, Math.round((bal / threshold) * 100)) : 0;
        const needed = Math.max(0, threshold - bal);
        const canRedeem = bal >= threshold;

        const handleRedeem = async () => {
          setRedeemLoading(true);
          try {
            const r = await api.redeemCredits();
            showToast(`🎉 Coupon ready: ${r.couponCode} — Free ${r.serviceName}!`, "success");
            api.getLoyalty().then(res => { if (res.success) setLoyaltyData(res); }).catch(() => {});
          } catch (e) { showToast(e.message || "Redemption failed", "error"); }
          setRedeemLoading(false);
        };

        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">PETclub Credits</p>
              </div>
              {ld?.referral_code && (
                <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-full border border-orange-100">
                  {ld.referral_code}
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-2xl font-black text-gray-900">{bal.toLocaleString("en-IN")}</span>
                <span className="text-xs text-gray-400 font-semibold">{threshold.toLocaleString("en-IN")} Credits</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${canRedeem ? "bg-emerald-400" : "bg-gradient-to-r from-orange-400 to-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {canRedeem
                  ? "🎉 You've unlocked a free grooming session!"
                  : `Earn ${needed.toLocaleString("en-IN")} more credits for a free Basic Bath!`}
              </p>
            </div>

            {/* Redeem button */}
            <button
              disabled={!canRedeem || redeemLoading}
              onClick={handleRedeem}
              className={`w-full font-bold py-2.5 rounded-xl text-sm transition-all mb-4 ${canRedeem ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {redeemLoading ? "Processing…" : canRedeem ? "✨ Redeem 1,000 Credits — Free Basic Bath" : `🔒 Redeem (${bal}/${threshold} Credits)`}
            </button>

            {/* Active coupons */}
            {ld?.coupons?.filter(c => !c.is_used).length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active Coupons</p>
                {ld.coupons.filter(c => !c.is_used).map(c => (
                  <div key={c.code} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 font-mono tracking-widest">{c.code}</p>
                      <p className="text-[10px] text-emerald-600">Free {c.service_name} · Expires {new Date(c.expires_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className="text-emerald-500 text-base">🎟️</span>
                  </div>
                ))}
              </div>
            )}

            {/* Earn rules */}
            <div className="border-t border-gray-50 pt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">How to Earn</p>
              <div className="space-y-1.5">
                {(ld?.earn_rules || [
                  { icon:"📅", event:"Book & pay via app",    points:"1 per ₹10" },
                  { icon:"💳", event:"Pay in-app (Razorpay)", points:"+50 bonus" },
                  { icon:"⭐", event:"Write a review",         points:"+50"       },
                  { icon:"👥", event:"Refer a friend",          points:"+200"      },
                ]).map(r => (
                  <div key={r.event} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1.5"><span>{r.icon}</span>{r.event}</span>
                    <span className="font-bold text-orange-500">{r.points}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            {ld?.transactions?.length > 0 && (
              <div className="border-t border-gray-50 pt-3 mt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Recent Activity</p>
                <div className="space-y-1.5">
                  {ld.transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[70%]">{t.description || t.type}</span>
                      <span className={`font-bold ${t.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {t.points > 0 ? "+" : ""}{t.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

      <button onClick={() => setModal("logout")} className="w-full border border-red-200 text-red-500 font-bold py-3.5 rounded-2xl text-sm hover:bg-red-50 active:scale-[0.98] transition-all">
        🚪 Sign Out
      </button>
      <p className="text-center text-[10px] text-gray-300 font-semibold mt-3 pb-4">PETclub v1.0 · Made with 🐾 for pets</p>
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

      {/* 🗺️ LIVE TRACKING MAP — full-screen overlay for confirmed bookings */}
      {trackingBooking && (
        <Suspense fallback={
          <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#1a1825",
            display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #7c3aed",
              borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }}/>
            <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>Loading map…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        }>
          <TrackingMap booking={trackingBooking} onClose={() => setTrackingBooking(null)} session={session} />
        </Suspense>
      )}

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
            <Fld label="Date of Birth"><Inp type="date" max={today()} value={form.dob||""} onChange={sf("dob")} /></Fld>
            <Fld label="Age"><Inp placeholder="e.g. 3 years" value={form.age||""} onChange={sf("age")} /></Fld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Weight"><Inp placeholder="e.g. 12 kg" value={form.weight||""} onChange={sf("weight")} /></Fld>
            <Fld label="Coat Color"><Inp placeholder="e.g. Golden" value={form.color||""} onChange={sf("color")} /></Fld>
          </div>
          <Fld label="Microchip ID"><Inp placeholder="15-digit chip number" value={form.chip||""} onChange={sf("chip")} /></Fld>
          <Fld label="Insurance Provider"><Inp placeholder="e.g. PetSure (optional)" value={form.insurance||""} onChange={sf("insurance")} /></Fld>
          <Fld label="Health Notes / Special Conditions">
            <Txta placeholder="e.g. Allergic to chicken, arthritis in rear legs, on heart medication — this is shared with your assigned provider before appointments" value={form.health_notes||""} onChange={sf("health_notes")} rows={3} />
          </Fld>
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
            <Fld label="Date of Birth"><Inp type="date" max={today()} value={form.dob||""} onChange={sf("dob")} /></Fld>
            <Fld label="Age"><Inp placeholder="e.g. 3 years" value={form.age||""} onChange={sf("age")} /></Fld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Weight"><Inp placeholder="e.g. 12 kg" value={form.weight||""} onChange={sf("weight")} /></Fld>
            <Fld label="Coat Color"><Inp placeholder="e.g. Golden" value={form.color||""} onChange={sf("color")} /></Fld>
          </div>
          <Fld label="Microchip ID"><Inp placeholder="15-digit chip number" value={form.chip||""} onChange={sf("chip")} /></Fld>
          <Fld label="Insurance Provider"><Inp value={form.insurance||""} onChange={sf("insurance")} /></Fld>
          <Fld label="Health Notes / Special Conditions">
            <Txta placeholder="e.g. Allergic to chicken, on heart medication… shared with your provider" value={form.health_notes||""} onChange={sf("health_notes")} rows={3} />
          </Fld>
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
            <Fld label="Date *"><Inp type="date" max={today()} value={form.date||""} onChange={sf("date")} /></Fld>
            <Fld label={`Cost (${currencySymbol})`}><Inp placeholder={`${currencySymbol}${currencySymbol === "₹" ? "999" : "29"}`} value={form.cost||""} onChange={sf("cost")} /></Fld>
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
        <Modal title={bookingStep === 1 ? "Select Service 📅" : bookingStep === 2 ? "Booking Details" : "Confirm Booking"} onClose={() => { setModal(null); setBookingStep(1); setBookingForm({ service_type:"", service_name:"", pet_size:"", addons:[], pet_id:"", date:"", time:"10:00", address:"", city:"", notes:"", amount:"" }); setBookingAddrMeta({ lat: null, lng: null }); setBookingAddrErr(""); }}>

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

              {/* ── GROOMING: size selector + package cards + add-ons ── */}
              {bookingForm.service_type === "Groomer" && (<>
                {/* Pet size */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pet Size *</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PET_SIZES.map(sz => (
                    <button key={sz.id} onClick={() => setBookingForm(f => ({ ...f, pet_size: sz.id, service_name: "" }))}
                      className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 text-center transition-all ${bookingForm.pet_size === sz.id ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                      <span className="text-xs font-bold text-gray-700">{sz.label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight mt-0.5">{sz.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Package cards — show only once size is selected */}
                {bookingForm.pet_size && (<>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Choose Package *</p>
                  <div className="space-y-2 mb-4">
                    {GROOMING_PACKAGES.map(pkg => {
                      const price = pkg.prices[bookingForm.pet_size];
                      const sel   = bookingForm.service_name === pkg.name;
                      return (
                        <button key={pkg.name} onClick={() => setBookingForm(f => ({ ...f, service_name: pkg.name }))}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${sel ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                          <span className="text-xl">{pkg.icon}</span>
                          <div className="flex-1 text-left">
                            <div className={`font-bold text-sm ${sel ? "text-orange-700" : "text-gray-800"}`}>{pkg.name}</div>
                            <div className="text-xs text-gray-400">{pkg.desc}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-extrabold text-sm ${sel ? "text-orange-600" : "text-gray-700"}`}>₹{price}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold">Save ₹{PLATFORM_DISCOUNT}</div>
                          </div>
                          {sel && <span className="text-orange-500 font-bold text-sm">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add-ons */}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Add-on Services</p>
                  <div className="space-y-2 mb-4">
                    {GROOMING_ADDONS.map(addon => {
                      const checked = (bookingForm.addons || []).includes(addon.id);
                      return (
                        <label key={addon.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                          <input type="checkbox" checked={checked} onChange={() => {
                            setBookingForm(f => ({
                              ...f,
                              addons: checked
                                ? (f.addons || []).filter(x => x !== addon.id)
                                : [...(f.addons || []), addon.id]
                            }));
                          }} className="accent-orange-500 w-4 h-4 shrink-0"/>
                          <div className="flex-1">
                            <div className={`font-semibold text-xs ${checked ? "text-blue-700" : "text-gray-700"}`}>{addon.label}</div>
                            <div className="text-[10px] text-gray-400">{addon.desc}</div>
                          </div>
                          <span className={`text-xs font-bold ${checked ? "text-blue-600" : "text-gray-500"}`}>+₹{addon.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </>)}
              </>)}

              {/* ── TRAINING: package cards ── */}
              {bookingForm.service_type === "Trainer" && (<>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Choose Package *</p>
                <div className="space-y-2 mb-4">
                  {TRAINING_PACKAGES.map(pkg => {
                    const sel = bookingForm.service_name === pkg.name;
                    return (
                      <button key={pkg.name} onClick={() => setBookingForm(f => ({ ...f, service_name: pkg.name }))}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${sel ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                        <span className="text-xl">{pkg.icon}</span>
                        <div className="flex-1 text-left">
                          <div className={`font-bold text-sm ${sel ? "text-orange-700" : "text-gray-800"}`}>{pkg.name}</div>
                          <div className="text-xs text-gray-400">{pkg.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-extrabold text-sm ${sel ? "text-orange-600" : "text-gray-700"}`}>₹{pkg.price.toLocaleString("en-IN")}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">Save ₹{PLATFORM_DISCOUNT}</div>
                        </div>
                        {sel && <span className="text-orange-500 font-bold text-sm">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>)}

              {/* ── VET: dropdown (quoted on-site) ── */}
              {bookingForm.service_type === "Vet" && (
                <Fld label="Service Type *">
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
                    value={bookingForm.service_name} onChange={bsf("service_name")}>
                    <option value="">Select service…</option>
                    {SVC_OPTS.vet.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1 pl-1">💡 Our vet will confirm pricing after the initial assessment</p>
                </Fld>
              )}

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
              <Fld label="Service Address *">
                <AddressPicker
                  value={bookingForm.address}
                  onChange={({ address, lat, lng, postalCode, city, state }) => {
                    setBookingForm(f => ({ ...f, address, ...(city ? { city } : {}) }));
                    setBookingAddrMeta({ lat: lat || null, lng: lng || null, postalCode: postalCode || "", city: city || "", state: state || "" });
                    setBookingAddrErr("");
                  }}
                  placeholder="Type and select from suggestions…"
                  token={session.token}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition placeholder-gray-400"
                />
                {bookingAddrErr && (
                  <div className="mt-1.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <span className="text-red-500 shrink-0">⚠️</span>
                    <p className="text-xs text-red-700 font-medium">{bookingAddrErr}</p>
                  </div>
                )}
                {!bookingAddrErr && !bookingAddrMeta.lat && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">💡 Type your address and <strong>select from the list</strong> to verify it</p>
                )}
              </Fld>
              <Fld label="City *">
                <Inp placeholder="e.g. Hyderabad" value={bookingForm.city || userInfo.city || ""} onChange={bsf("city")}/>
              </Fld>
              {/* Notes */}
              <Fld label="Special Notes">
                <Txta placeholder="Any special instructions for the professional…" value={bookingForm.notes} onChange={bsf("notes")} rows={2}/>
              </Fld>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setBookingStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">← Back</button>
                <button
                  disabled={!bookingForm.service_name || !bookingForm.date || !(bookingForm.city || userInfo.city)
                    || (bookingForm.service_type === "Groomer" && !bookingForm.pet_size)}
                  onClick={() => {
                    // Require verified address (geocoded from dropdown) if any address was typed
                    if (bookingForm.address?.trim() && !bookingAddrMeta.lat) {
                      setBookingAddrErr("Please select your address from the dropdown list to verify it — this ensures we send the right professional to you.");
                      return;
                    }
                    setBookingAddrErr("");
                    setBookingStep(3);
                  }}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40 hover:bg-orange-600 transition">Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {bookingStep === 3 && (() => {
            const pricing = calcAmount(bookingForm);
            const pet     = pets.find(p => p.id === bookingForm.pet_id);
            return (
            <div>
              {/* Booking summary card */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥" })[bookingForm.service_type] || "📋"}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800">{bookingForm.service_name}</div>
                    <div className="text-xs text-orange-600">
                      {bookingForm.service_type}
                      {bookingForm.pet_size ? ` · ${bookingForm.pet_size}` : ""}
                    </div>
                  </div>
                </div>
                {/* Add-ons summary */}
                {bookingForm.addons?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {bookingForm.addons.map(id => {
                      const a = GROOMING_ADDONS.find(x => x.id === id);
                      return a ? (
                        <span key={id} className="text-[10px] bg-blue-100 text-blue-700 font-semibold rounded-full px-2 py-0.5">+ {a.label}</span>
                      ) : null;
                    })}
                  </div>
                )}
                {pet && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🐾</span><span>{pet.name} ({pet.species})</span>
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
                    <span>📝</span><span>&ldquo;{bookingForm.notes}&rdquo;</span>
                  </div>
                )}
              </div>

              {/* Price breakdown — grooming & training only */}
              {pricing && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Price Breakdown</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{bookingForm.service_name}</span>
                    <span className="font-semibold">₹{pricing.base.toLocaleString("en-IN")}</span>
                  </div>
                  {pricing.addonSum > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Add-on services</span>
                      <span className="font-semibold">+₹{pricing.addonSum.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>🎁 PETclub Offer</span>
                    <span className="font-semibold">−₹{pricing.discount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-extrabold text-orange-600 text-lg">₹{pricing.total.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Payment collected at service. No advance required.</p>
                </div>
              )}

              {/* Vet — quoted on-site notice */}
              {bookingForm.service_type === "Vet" && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4 text-xs text-rose-700">
                  🏥 Vet service pricing is confirmed after the initial assessment. No surprise charges.
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
                🔍 After confirming, we&apos;ll find the best available {bookingForm.service_type} in your area. You&apos;ll be notified once matched!
              </div>
              <div className="flex gap-3">
                <button onClick={() => setBookingStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50">← Back</button>
                <button disabled={bookingLoading} onClick={createBooking}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-60 hover:bg-orange-600 transition">
                  {bookingLoading ? "Placing…" : "✅ Confirm Booking"}
                </button>
              </div>
            </div>
            );
          })()}
        </Modal>
      )}

      {/* EDIT PROFILE */}
      {modal === "editProfile" && (
        <Modal title="Edit Profile ✏️" onClose={() => { setModal(null); setForm({}); setEditAddrMeta({ lat:null, lng:null, postalCode:"", city:"", state:"" }); setEditEmailErr(""); }}>
          <Fld label="Full Name *"><Inp autoFocus placeholder="Your full name" value={form.name||""} onChange={sf("name")} /></Fld>
          <Fld label="Email">
            <Inp
              type="email"
              placeholder="your@email.com"
              value={form.email||""}
              onChange={e => { sf("email")(e); setEditEmailErr(""); }}
            />
            {editEmailErr && (
              <div className="mt-1.5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <span className="text-red-500 text-sm shrink-0">⚠️</span>
                <p className="text-xs text-red-700 font-medium">{editEmailErr}</p>
              </div>
            )}
          </Fld>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3 text-xs text-orange-700">
            📱 Phone number cannot be changed. It&apos;s your unique identifier.
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-1">Address</p>
          <Fld label="Full Address">
            <AddressPicker
              value={form.address||""}
              onChange={({ address, lat, lng, postalCode, city, state }) => {
                setForm(f => ({ ...f, address }));
                setEditAddrMeta({ lat: lat||null, lng: lng||null, postalCode: postalCode||"", city: city||"", state: state||"" });
              }}
              placeholder="Start typing your address…"
              token={session.token}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition placeholder-gray-400"
            />
            {/* Warn if address is typed but not verified from dropdown */}
            {form.address?.trim() && !editAddrMeta.lat && (
              <div className="mt-1.5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-amber-500 shrink-0 text-sm">⚠️</span>
                <p className="text-xs text-amber-700 font-medium">Address not verified — type and <strong>select from the dropdown</strong> to confirm postal code &amp; city</p>
              </div>
            )}
          </Fld>
          <Fld label="Area / Locality">
            <Inp placeholder="e.g. LB Nagar, Sainikpuri" value={form.area||""} onChange={sf("area")} />
          </Fld>
          <button onClick={updateProfile} disabled={!form.name?.trim()} className="btn-primary mt-1">Save Profile</button>
        </Modal>
      )}

      {/* RATE SESSION */}
      {ratingModal && (
        <Modal title="Rate Your Session ⭐" onClose={() => setRatingModal(null)}>
          <p className="text-sm text-gray-500 text-center mb-1">How was your <strong>{ratingModal.serviceName}</strong>?</p>
          <div className="flex gap-2 justify-center my-4">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRatingVal(n)}
                className={`text-4xl transition-transform hover:scale-110 ${n <= ratingVal ? "text-yellow-400" : "text-gray-200"}`}>★</button>
            ))}
          </div>
          {ratingVal > 0 && (
            <p className="text-center text-sm font-bold text-gray-600 mb-3">
              {["","😞 Poor","😐 Fair","🙂 Good","😊 Great","🤩 Excellent!"][ratingVal]}
            </p>
          )}
          <Fld label="Leave a review (optional)">
            <textarea value={ratingReview} onChange={e => setRatingReview(e.target.value)}
              placeholder="Tell others about your experience…"
              rows={3} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"/>
          </Fld>
          <button onClick={submitRating} disabled={!ratingVal || ratingLoading}
            className="btn-primary mt-1 disabled:opacity-50">
            {ratingLoading ? "Submitting…" : "Submit Review"}
          </button>
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
