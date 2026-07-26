import { useState, useEffect, useRef } from "react";
import { api } from "../../api.js";
import { AddressPicker } from "../../components/AddressPicker.jsx";
import { bufferPosition, saveTokenToGpsDb } from "../../utils/gpsBuffer.js";
import WhatsAppFAB from "../../components/WhatsAppFAB.jsx";
import ChatModal from "../../components/ChatModal.jsx";
import { fmtDate, fmtTime, rIcon, rColor, rAccent, sColor, aStatusLabel, getIdTypes, ROLE_CONFIG } from "../../shared/proData.js";
import { Bdg, Modal, Inp, Sel, Txta, Spinner, EmptyState, StatCard, PhotoUpload, PawLogo } from "../../shared/ui.jsx";

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

export const ProfessionalDashboard = ({ session, onLogout }) => {
  const [view,      setView]      = useState("home");
  const [profile,   setProfile]   = useState(null);
  const [bookings,  setBookings]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [health,    setHealth]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [available, setAvailable] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [idModal,   setIdModal]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [idForm,    setIdForm]    = useState({ idType: "", idNumber: "", idPhoto: null });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState({ msg: "", type: "success" });
  const [responding,   setResponding]   = useState({});
  const [earnings,     setEarnings]     = useState(null);  // { total, paid, pending, bookings[] }
  const [earningsLoad, setEarningsLoad] = useState(false);
  const [sharingLocId,    setSharingLocId]    = useState(null);  // bookingId being shared
  const [bgWarning,       setBgWarning]       = useState(false); // page-hidden warning
  const [chatBooking,     setChatBooking]     = useState(null);  // booking open in chat
  const [serviceNotes,    setServiceNotes]    = useState({});    // { [bookingId]: text }
  const [noShowLoading,   setNoShowLoading]   = useState(null);  // bookingId being marked
  const [payoutModal,     setPayoutModal]     = useState(false);
  const [payoutForm,      setPayoutForm]      = useState({ payment_type: "upi", upi_id: "", bank_name: "", account_number: "", account_holder: "", ifsc_code: "" });
  const [payoutSaving,    setPayoutSaving]    = useState(false);
  const watchIdRef        = useRef(null);  // watchPosition ID
  const lastSentRef       = useRef(0);     // throttle: min 10s between sends
  const wakeLockRef       = useRef(null);  // Screen Wake Lock sentinel (keeps screen on during transit)
  const visCleanupRef     = useRef(null);  // visibilitychange cleanup fn — stored here, NOT on the numeric watchPosition ID

  // ── Screen Wake Lock helpers ────────────────────────────────────────────────
  // Keeps the provider's screen on so watchPosition keeps firing normally.
  // The Web Geolocation API runs in the main browser thread; when the screen
  // locks the OS suspends the thread (especially on iOS Safari). Holding a
  // wake lock is the only reliable PWA-based solution.
  //
  // Service workers CANNOT access navigator.geolocation — it is not in the SW
  // spec. Background Sync in the SW handles offline *buffering* (network drops),
  // not GPS suspension from screen lock.
  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator) || document.hidden) return; // API absent or screen already off
    try {
      if (wakeLockRef.current) return; // already held
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      // If the OS releases the lock (battery saver, incoming call, etc.) auto-reacquire
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
        // Re-acquire only if we're still actively tracking
        if (watchIdRef.current !== null) acquireWakeLock();
      }, { once: true });
    } catch (e) {
      // NotAllowedError is expected when document is hidden; others are benign
      console.warn('[WakeLock] Could not acquire:', e.message);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // "On My Way" — notify customer + start continuous GPS watchPosition
  const startJourney = async (bookingId) => {
    if (!navigator.geolocation) { showToast("❌ GPS not available on this device."); return; }
    try {
      await api.startJourney(bookingId);
      showToast("🚗 Journey started! Customer has been notified.");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, assignment_status: 'on_the_way' } : b));
    } catch (e) { showToast("❌ " + (e.message || "Failed to start journey")); return; }
    startLocationSharing(bookingId);
  };

  // "Start Service" — transition on_the_way → in_progress when pro arrives
  const startService = async (bookingId) => {
    try {
      await api.updateBookingStatus(bookingId, 'in_progress');
      showToast("🔧 Service started! Good luck!");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'in_progress', assignment_status: 'in_progress' } : b));
    } catch (e) { showToast("❌ " + (e.message || "Failed to start service")); }
  };

  // "Mark Complete" — mark service done by professional
  const markComplete = async (bookingId, notes = "") => {
    try {
      await api.updateBookingStatus(bookingId, 'completed', notes ? { service_notes: notes } : {});
      showToast("✅ Service marked as complete!");
      stopLocationSharing();
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed', assignment_status: 'completed' } : b));
      setServiceNotes(prev => { const n = { ...prev }; delete n[bookingId]; return n; });
    } catch (e) { showToast("❌ " + (e.message || "Failed to mark complete")); }
  };

  // watchPosition — fires continuously as device moves; throttled to max 1 send/10s
  // More reliable than setInterval on mobile (browser-native, lower battery drain)
  const startLocationSharing = (bookingId) => {
    if (!navigator.geolocation) return;

    // ── Clean up any previous watch + visibility listener ──────────────────
    if (visCleanupRef.current) {
      document.removeEventListener('visibilitychange', visCleanupRef.current);
      visCleanupRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setSharingLocId(bookingId);
    lastSentRef.current = 0;

    // Token is now an httpOnly cookie — SW background sync uses credentials:'include'
    saveTokenToGpsDb('').catch(() => {});

    // Acquire wake lock — keeps screen on so watchPosition isn't suspended
    acquireWakeLock();

    // ── GPS watch ───────────────────────────────────────────────────────────
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 10000) return; // throttle: send max every 10s
        lastSentRef.current = now;
        api.updateLocation(bookingId, pos.coords.latitude, pos.coords.longitude)
          .catch(() => {
            // Network drop — buffer position in IndexedDB for SW Background Sync retry
            bufferPosition(bookingId, pos.coords.latitude, pos.coords.longitude).catch(() => {});
          });
      },
      (err) => {
        console.warn('[GPS watch error]', err.code, err.message);
        if (err.code === 1) showToast("⚠️ GPS permission denied — location sharing paused.");
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );

    // ── Visibility change handler ───────────────────────────────────────────
    // When the screen wakes back up: re-acquire wake lock + re-attach watch
    // (some browsers cancel watchPosition while the page is hidden)
    // NOTE: stored in visCleanupRef — NOT on the numeric watchPosition ID
    // (setting properties on primitives silently fails in JS non-strict mode)
    const onVisibility = () => {
      if (document.hidden) {
        setBgWarning(true);
      } else {
        setBgWarning(false);
        acquireWakeLock(); // re-acquire if OS released it while hidden
        // Re-attach the watch if the browser suspended it
        if (watchIdRef.current !== null) startLocationSharing(bookingId);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    visCleanupRef.current = onVisibility;
  };

  const stopLocationSharing = () => {
    // Remove visibility listener
    if (visCleanupRef.current) {
      document.removeEventListener('visibilitychange', visCleanupRef.current);
      visCleanupRef.current = null;
    }
    // Stop GPS watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Release wake lock — screen can sleep normally again
    releaseWakeLock();
    setSharingLocId(null);
    setBgWarning(false);
    showToast("📍 Location sharing stopped.");
  };

  // Clean up on unmount — runs when the pro navigates away mid-journey
  useEffect(() => () => {
    if (visCleanupRef.current)
      document.removeEventListener('visibilitychange', visCleanupRef.current);
    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
    releaseWakeLock();
  }, []);

  const subRole  = session.subRole || "Groomer";
  const cfg      = ROLE_CONFIG[subRole] || ROLE_CONFIG.Groomer;
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");
  const currencySymbol = (() => {
    const phone = session?.phone || "";
    if (phone.startsWith("+91"))  return "₹";
    if (phone.startsWith("+1"))   return "$";
    if (phone.startsWith("+44"))  return "£";
    if (phone.startsWith("+61"))  return "A$";
    if (phone.startsWith("+971")) return "AED";
    if (phone.startsWith("+65"))  return "S$";
    if (phone.startsWith("+60"))  return "RM";
    return "₹";
  })();
  const numLocale = (() => {
    const phone = session?.phone || "";
    if (phone.startsWith("+91"))  return "en-IN";
    if (phone.startsWith("+1"))   return "en-US";
    if (phone.startsWith("+44"))  return "en-GB";
    if (phone.startsWith("+61"))  return "en-AU";
    if (phone.startsWith("+971")) return "ar-AE";
    if (phone.startsWith("+65"))  return "en-SG";
    if (phone.startsWith("+60"))  return "ms-MY";
    return "en-IN";
  })();

  const refreshRequests = () => api.getIncomingBookings().then(r => setRequests(r.bookings || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.getMyProProfile().catch(() => null),
      api.getBookings().catch(() => ({ bookings: [] })),
      api.getIncomingBookings().catch(() => ({ bookings: [] })),
      api.health().catch(() => null),
    ]).then(([profRes, bkRes, reqRes, healthRes]) => {
      if (profRes?.profile) { setProfile(profRes.profile); setAvailable(profRes.profile?.is_available ?? true); }
      setBookings(bkRes?.bookings || []);
      setRequests(reqRes?.bookings || []);
      if (healthRes) setHealth(healthRes);
    }).finally(() => setLoading(false));

    // Auto-refresh requests every 30 seconds (like Ola/Uber)
    const interval = setInterval(refreshRequests, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll for approval while pending ─────────────────────────────────────
  // Checks every 30 s whether verification_status has changed to "approved".
  // Stops automatically once approved so it doesn't run forever.
  useEffect(() => {
    if (!profile || profile.verification_status === "approved") return;
    const t = setInterval(() => {
      api.getMyProProfile().then(res => {
        if (res?.profile?.verification_status === "approved") {
          setProfile(res.profile);
          setAvailable(res.profile.is_available ?? false);
          showToast("🎉 You're verified! You can now go Online and accept bookings.");
        }
      }).catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.verification_status]);

  // Load earnings data lazily when the Earnings tab is first opened
  useEffect(() => {
    if (view !== 'earnings' || earnings !== null) return;
    setEarningsLoad(true);
    api.getEarnings().then(r => setEarnings(r.earnings || { total: 0, paid: 0, pending: 0, bookings: [] }))
      .catch(() => setEarnings({ total: 0, paid: 0, pending: 0, bookings: [] }))
      .finally(() => setEarningsLoad(false));
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "success" }), 3500); };

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
  const upcomingBk  = bookings.filter(b => ["upcoming","confirmed","on_the_way","in_progress"].includes(b.assignment_status || b.status));
  const completedBk = bookings.filter(b => b.status === "completed" || b.assignment_status === "completed");
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
    { id:"earnings", icon:"💰", label:"Earnings" },
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
              {isVerified ? (available ? "🟢 Online" : "⏸ Offline") : "⏳ Pending"}
            </div>
          </div>
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/5 transition">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-60 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 min-h-[100dvh]">
        {/* Toast */}
        {toast.msg && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-5 py-3 rounded-full shadow-xl ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.msg}
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
                {isVerified && (
                  <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-full border ${available ? "bg-emerald-500/80 border-emerald-400/40" : "bg-gray-500/60 border-white/10"}`}>
                    {available ? "🟢 Online" : "⏸ Offline"}
                  </div>
                )}
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
                <div className={`rounded-2xl p-4 mb-4 shadow-sm border transition-colors ${available ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${available ? "bg-emerald-100" : "bg-gray-100"}`}>
                        {available ? "🟢" : "⏸"}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-sm ${available ? "text-emerald-800" : "text-gray-700"}`}>
                          {available ? "Online — Accepting Bookings" : "Offline — Not Accepting Bookings"}
                        </div>
                        <div className={`text-xs mt-0.5 ${available ? "text-emerald-600" : "text-gray-400"}`}>
                          {available ? "Customers can find & book you" : "You won't receive new requests"}
                        </div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={async () => {
                        const next = !available;
                        setAvailable(next); // optimistic
                        try {
                          await api.setAvailability(next);
                          showToast(next ? "🟢 You're now Online" : "⏸ You're now Offline");
                        } catch (e) {
                          setAvailable(!next); // revert on failure
                          showToast(e.message || "Failed to update availability", "error");
                        }
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none ${available ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${available ? "translate-x-7" : "translate-x-0"}`}/>
                    </button>
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
                    <Bdg text={aStatusLabel(b.assignment_status || b.status)} cls={sColor(b.assignment_status || b.status)}/>
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
            <p className="text-xs text-gray-400 mb-5">Accept or Reject within <strong>{health?.config?.booking_response_timeout_mins ?? 5} minutes</strong> — unanswered requests auto-pass to the next professional.</p>

            {activeRequests.length === 0 ? (
              <EmptyState icon="🔔" title="No incoming requests" desc="New booking requests will appear here. Refreshes every 30 sec automatically."/>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(bk => {
                  const svcIcon = ({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Walker:"🦮", Boarding:"🏠" })[bk.service_type] || "📋";
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
                            {pet?.health_notes && (
                              <div className="mt-1.5 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-rose-700 mb-0.5">⚕️ Health Notes</p>
                                <p className="text-xs text-rose-800 leading-relaxed">{pet.health_notes}</p>
                              </div>
                            )}
                          </div>
                          {bk.provider_earnings && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-right">
                              <div className="text-xs text-emerald-600 font-medium">Your Earning</div>
                              <div className="font-extrabold text-emerald-700 text-base">{currencySymbol}{parseFloat(bk.provider_earnings).toFixed(2)}</div>
                              <div className="text-[10px] text-emerald-500">70% of booking</div>
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
                {bookings.map(b => {
                  const isActive = ["confirmed","on_the_way","in_progress"].includes(b.assignment_status);
                  const isSharing = sharingLocId === b.id;
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm text-gray-800">{b.service_name || b.service_type || "Service"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} at ${fmtTime(b.scheduled_at)}` : "Date TBD"}</div>
                        </div>
                        <Bdg text={aStatusLabel(b.assignment_status || b.status)} cls={sColor(b.assignment_status || b.status)}/>
                      </div>
                      {(b.provider_earnings || b.amount) && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400 font-medium">
                            {(b.status === 'completed' || b.assignment_status === 'completed') ? 'Earned' : 'Expected earning'}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-emerald-600">
                              {currencySymbol}{parseFloat(b.provider_earnings || b.amount * 0.70 || 0).toFixed(2)}
                            </span>
                            {b.payout_status && (
                              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.payout_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {b.payout_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* ⚕️ Pet health notes — shown to assigned professional */}
                      {b.pets?.health_notes && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-2">
                          <p className="text-xs font-bold text-rose-700 mb-0.5">⚕️ {b.pets?.name || "Pet"} Health Notes</p>
                          <p className="text-xs text-rose-800 leading-relaxed">{b.pets.health_notes}</p>
                        </div>
                      )}
                      {/* 🗺️ Navigate to customer — shown when coords available */}
                      {(b.address_lat && b.address_lng) && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${b.address_lat},${b.address_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-blue-100 active:scale-[0.97] mb-2">
                          🗺️ Navigate to Customer
                        </a>
                      )}
                      {/* 🚗 On My Way + 📍 Location sharing */}
                      {isActive && (
                        b.assignment_status === 'confirmed' ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => startJourney(b.id)}
                              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                              🚗 I&apos;m On My Way — Start Journey
                            </button>
                            {/* Emergency cancel — professional unable to attend */}
                            <button
                              onClick={async () => {
                                if (!window.confirm("Cancel this booking? The customer will be notified and we'll find them another professional. Only use this for genuine emergencies.")) return;
                                try {
                                  await api.cancelBooking(b.id, "Professional unable to attend");
                                  stopLocationSharing();
                                  setBookings(prev => prev.filter(bk => bk.id !== b.id));
                                  showToast("Booking returned to queue. Customer will be notified.", "success");
                                } catch (e) { showToast("❌ " + (e.message || "Failed"), "error"); }
                              }}
                              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                              ⚠️ Emergency Cancel — Can&apos;t Attend
                            </button>
                          </div>
                        ) : b.assignment_status === 'on_the_way' ? (
                          <div className="space-y-2">
                            {isSharing ? (
                              <>
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                                  <span className="text-xs font-bold text-emerald-700">Live GPS — customer is tracking you</span>
                                </div>
                                {bgWarning && (
                                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold">
                                    ⚠️ App is in background — keep screen ON for GPS accuracy.
                                  </div>
                                )}
                                <button
                                  onClick={stopLocationSharing}
                                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-red-100 active:scale-[0.97]">
                                  ⏹ Stop Sharing Location
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-orange-700 flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-bounce"/>
                                  On my way — tap Resume to share GPS
                                </div>
                                <button
                                  onClick={() => startLocationSharing(b.id)}
                                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
                                  📍 Resume Location Sharing
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => startService(b.id)}
                              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                              🔧 I&apos;ve Arrived — Start Service
                            </button>
                          </div>
                        ) : b.assignment_status === 'in_progress' ? (
                          <div className="space-y-2">
                            {isSharing ? (
                              <>
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                                  <span className="text-xs font-bold text-blue-700">Service in progress — GPS live</span>
                                </div>
                                {bgWarning && (
                                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold">
                                    ⚠️ Keep screen ON for GPS accuracy.
                                  </div>
                                )}
                                <button
                                  onClick={stopLocationSharing}
                                  className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2.5 rounded-xl transition-all hover:bg-red-100 active:scale-[0.97]">
                                  ⏹ Stop Sharing Location
                                </button>
                              </>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"/>
                                Service in progress
                              </div>
                            )}
                            {/* Service notes input before completing */}
                            <textarea
                              value={serviceNotes[b.id] || ""}
                              onChange={e => setServiceNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                              placeholder="Service notes (optional) — shampoo used, coat condition, behaviour…"
                              rows={2}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none transition"
                            />
                            <button
                              onClick={() => markComplete(b.id, serviceNotes[b.id] || "")}
                              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md">
                              ✅ Mark Service Complete
                            </button>
                            {/* No-show button — customer not at location */}
                            <button
                              disabled={noShowLoading === b.id}
                              onClick={async () => {
                                if (!window.confirm(`Mark customer as no-show? ${currencySymbol}${isIndia ? "300" : "5"} cancellation fee will apply and remainder will be refunded.`)) return;
                                setNoShowLoading(b.id);
                                try {
                                  await api.markNoShow(b.id);
                                  setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'cancelled', assignment_status: 'cancelled' } : bk));
                                  showToast("Marked as no-show. Customer will be notified.", "success");
                                } catch (e) { showToast(e.message || "Failed", "error"); }
                                setNoShowLoading(null);
                              }}
                              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50">
                              {noShowLoading === b.id ? "Processing…" : "🚫 Customer No-Show"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startLocationSharing(b.id)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
                            📍 Share My Location with Customer
                          </button>
                        )
                      )}
                      {/* No-show also available when on_the_way (customer might not answer door) */}
                      {b.assignment_status === "on_the_way" && (
                        <button
                          disabled={noShowLoading === b.id}
                          onClick={async () => {
                            if (!window.confirm(`Mark customer as no-show? ${currencySymbol}${isIndia ? "300" : "5"} cancellation fee will apply.`)) return;
                            setNoShowLoading(b.id);
                            try {
                              await api.markNoShow(b.id);
                              setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'cancelled', assignment_status: 'cancelled' } : bk));
                              showToast("Marked as no-show. Customer notified.", "success");
                            } catch (e) { showToast(e.message || "Failed", "error"); }
                            setNoShowLoading(null);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50">
                          🚫 Customer No-Show
                        </button>
                      )}
                      {/* Chat with customer */}
                      {["confirmed","on_the_way","in_progress","completed"].includes(b.assignment_status) && (
                        <button
                          onClick={() => setChatBooking(b)}
                          className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 rounded-xl py-2 hover:bg-blue-100 transition">
                          <span>💬</span> Chat with Customer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── EARNINGS ── */}
        {view === "earnings" && (
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

            {/* ── Weekly earnings widget ── */}
            {(() => {
              const now        = new Date();
              const todayDow   = now.getDay(); // 0=Sun … 6=Sat
              const daysFromMon = todayDow === 0 ? 6 : todayDow - 1;
              const thisMonday = new Date(now);
              thisMonday.setDate(now.getDate() - daysFromMon);
              thisMonday.setHours(0, 0, 0, 0);
              const thisSat = new Date(thisMonday);
              thisSat.setDate(thisMonday.getDate() + 5);
              thisSat.setHours(23, 59, 59, 999);
              const lastMonday = new Date(thisMonday);
              lastMonday.setDate(thisMonday.getDate() - 7);
              const lastSat = new Date(thisMonday);
              lastSat.setDate(thisMonday.getDate() - 1);
              lastSat.setHours(23, 59, 59, 999);
              const daysUntilSat = todayDow === 6 ? 0 : (6 - todayDow);
              const nextPayout = new Date(now);
              nextPayout.setDate(now.getDate() + daysUntilSat);
              const fmtShort = d => d.toLocaleDateString(numLocale, { day: 'numeric', month: 'short' });
              const allBkgs  = earnings?.bookings || [];
              const thisWeekBkgs = allBkgs.filter(b => { const d = new Date(b.scheduled_at || b.completed_at || 0); return d >= thisMonday && d <= thisSat; });
              const lastWeekBkgs = allBkgs.filter(b => { const d = new Date(b.scheduled_at || b.completed_at || 0); return d >= lastMonday && d <= lastSat; });
              const weekTotal = thisWeekBkgs.reduce((s, b) => s + parseFloat(b.provider_earnings || 0), 0);
              const lastTotal = lastWeekBkgs.reduce((s, b) => s + parseFloat(b.provider_earnings || 0), 0);
              const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
              const dayEarn = Array(6).fill(0);
              thisWeekBkgs.forEach(b => {
                const dow = new Date(b.scheduled_at || b.completed_at || 0).getDay();
                const idx = dow === 0 ? -1 : dow - 1;
                if (idx >= 0 && idx < 6) dayEarn[idx] += parseFloat(b.provider_earnings || 0);
              });
              const maxDay   = Math.max(...dayEarn, 1);
              const todayIdx = todayDow === 0 ? -1 : todayDow - 1;
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">📅 This Week's Earnings</p>
                      <p className="text-emerald-100 text-xs mt-0.5">{fmtShort(thisMonday)} – {fmtShort(thisSat)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wide">Next Payout</p>
                      <p className="text-white font-extrabold text-sm">
                        {daysUntilSat === 0 ? 'Today 🎉' : `${fmtShort(nextPayout)} (${daysUntilSat}d)`}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* This week vs last week tiles */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mb-1">This Week</p>
                        <p className="text-xl font-extrabold text-emerald-700">{currencySymbol}{weekTotal.toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5">{thisWeekBkgs.length} job{thisWeekBkgs.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">Last Sat Paid</p>
                        <p className="text-xl font-extrabold text-gray-700">{currencySymbol}{lastTotal.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{lastWeekBkgs.length} job{lastWeekBkgs.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {/* Daily bar chart Mon→Sat */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Daily Breakdown</p>
                    <div className="flex items-end gap-1.5" style={{ height: 68 }}>
                      {DAY_LABELS.map((day, i) => {
                        const barH = dayEarn[i] > 0 ? Math.max(Math.round((dayEarn[i] / maxDay) * 44), 6) : 4;
                        const isToday = i === todayIdx;
                        const hasPay  = dayEarn[i] > 0;
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1">
                            {hasPay && <span className="text-[8px] font-bold text-emerald-600 leading-none">{currencySymbol}{dayEarn[i] >= 1000 ? (dayEarn[i]/1000).toFixed(1)+'k' : Math.round(dayEarn[i])}</span>}
                            <div className={`w-full rounded-t-md ${isToday ? 'bg-orange-500' : hasPay ? 'bg-emerald-500' : 'bg-gray-100'}`} style={{ height: barH }} />
                            <span className={`text-[9px] font-bold ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>{day}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-2 mb-3">
                      {[['bg-orange-500','Today'],['bg-emerald-500','Earned'],['bg-gray-200','No jobs']].map(([c,l]) => (
                        <div key={l} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${c}`}/><span className="text-[10px] text-gray-400">{l}</span></div>
                      ))}
                    </div>
                    {/* Payout countdown */}
                    <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <span className="text-lg shrink-0">💸</span>
                      <div>
                        <p className="text-xs font-bold text-violet-800">
                          {daysUntilSat === 0 ? '🎉 Payout processing today — check your bank by 6 PM!' : `Payout in ${daysUntilSat} day${daysUntilSat !== 1 ? 's' : ''} — ${nextPayout.toLocaleDateString(numLocale, { weekday:'short', day:'numeric', month:'short' })}`}
                        </p>
                        <p className="text-[10px] text-violet-600 mt-0.5">This week's 70% share transferred directly to your bank. Every Saturday.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── All-time summary tiles ── */}
            <div className={`bg-gradient-to-br ${grad} rounded-2xl p-5 text-white`}>
              <div className="text-sm font-semibold text-white/70 mb-1">All-Time Summary</div>
              {earningsLoad ? (
                <div className="flex items-center gap-2 text-white/60 text-sm"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Loading…</div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: "Total Earned",   val: earnings?.total   ?? 0, color: "bg-white/20" },
                    { label: "Paid Out",        val: earnings?.paid    ?? 0, color: "bg-emerald-500/40" },
                    { label: "Awaiting Payout", val: earnings?.pending ?? 0, color: "bg-amber-500/40" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`${color} rounded-xl p-3 text-center`}>
                      <div className="text-xs text-white/70 mb-1">{label}</div>
                      <div className="text-lg font-extrabold">{currencySymbol}{parseFloat(val).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/50 mt-3">Settled every Saturday via direct bank transfer. 70% of every completed service.</p>
              {/* Payout request button — opens bank-details modal */}
              {(earnings?.pending ?? 0) > 0 && (
                <button
                  onClick={() => setPayoutModal(true)}
                  className="mt-3 w-full bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white font-bold text-sm py-2.5 rounded-xl transition-all">
                  💰 Request Payout — {currencySymbol}{parseFloat(earnings?.pending ?? 0).toFixed(2)} Pending
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Job History</h2>
                <span className="text-xs text-gray-400">{earnings?.bookings?.length ?? 0} bookings</span>
              </div>
              {earningsLoad ? (
                <div className="p-6 flex justify-center"><span className="w-6 h-6 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/></div>
              ) : !earnings?.bookings?.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No completed bookings yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {earnings.bookings.map(b => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{b.service_name || "Service"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-sm text-emerald-600">{currencySymbol}{parseFloat(b.provider_earnings || 0).toFixed(2)}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.payout_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.payout_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Partner Compensation Breakdown ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3">
                <p className="text-white font-bold text-sm">💼 Your Partner Compensation</p>
                <p className="text-gray-400 text-xs mt-0.5">PETclub Partner Network Agreement</p>
              </div>

              {/* Total earnings formula */}
              <div className="bg-orange-500 px-4 py-2.5 flex items-center justify-between">
                <p className="text-white text-xs font-bold">Total Earnings =</p>
                <p className="text-white text-xs font-extrabold">70% Commission + 100% Tips</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Commission */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-lg shrink-0">💰</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">70% Service Commission</p>
                    <p className="text-xs text-gray-500 mt-0.5">You keep 70% of every service including upsells at the customer's doorstep. PETclub retains 30%.</p>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mt-1.5 text-xs text-gray-600">
                      <strong>Example:</strong> {currencySymbol}{isIndia ? "1,500" : "100"} grooming → you earn <strong className="text-emerald-600">{currencySymbol}{isIndia ? "1,050" : "70"}</strong>. {currencySymbol}{isIndia ? "300" : "20"} add-on shampoo → +<strong className="text-emerald-600">{currencySymbol}{isIndia ? "210" : "14"}</strong> more.
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-lg shrink-0">🎁</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">100% Gratuity</p>
                    <p className="text-xs text-gray-500 mt-0.5">All tips — cash or in-app — are entirely yours. PETclub takes zero commission on tips.</p>
                  </div>
                </div>

                <div className="border-t border-gray-50"/>

                {/* Weekly settlement */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-lg shrink-0">📅</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">Weekly Settlement — Every Saturday</p>
                    <p className="text-xs text-gray-500 mt-0.5">Itemized statement sent via WhatsApp/App showing jobs, commission, and bonuses. Direct bank transfer.</p>
                  </div>
                </div>

                {/* Performance incentives */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🏆 Performance Incentives</p>
                  <div className="space-y-1.5">
                    {[
                      { icon:"🥇", label:"Elite Award",            desc:`Top performer monthly — ${currencySymbol}${isIndia ? "1,500" : "50"} bonus + Gold badge 30 days` },
                      { icon:"🔄", label:"Subscription Conversion", desc:`${currencySymbol}${isIndia ? "250" : "15"} for every client on a recurring care package` },
                      { icon:"✅", label:"Reliability Bonus",       desc:`${currencySymbol}${isIndia ? "750" : "50"}/month for 80+ jobs with zero last-minute cancellations` },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-700">{item.label} — </span>
                          <span className="text-xs text-gray-500">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
                    setEditForm({ name: profile?.name || session.name, email: profile?.email || "", city: profile?.city || "", langs: profile?.langs || "", service_areas: profile?.service_areas || "", bio: profile?.bio || "", experience: profile?.experience || "", certification: profile?.certification || "", license_number: profile?.license_number || "", clinic_name: profile?.clinic_name || "", price_basic: profile?.price_basic || "", price_full: profile?.price_full || "", price_custom: profile?.price_custom || "" });
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
                {Array.isArray(profile?.pet_types) && profile.pet_types.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-50">
                    <div className="text-xs text-gray-400 font-medium mb-2">🐾 Animals I Work With</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.pet_types.map(t => (
                        <span key={t} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
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
                        <div className="text-base font-extrabold" style={{ color: cfg.accent }}>{currencySymbol}{p.v}</div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 shadow-nav nav-safe">
        <div className="flex">
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
        </div>
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
          <div className="mt-4 mb-1">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Pricing ({currencySymbol} per session)</label>
            <div className="grid grid-cols-3 gap-2">
              <Inp label={cfg.pricing.a} type="number" placeholder={isIndia?"599":"29"}  value={editForm.price_basic||""}  onChange={e => setEditForm(f => ({...f, price_basic:e.target.value}))}/>
              <Inp label={cfg.pricing.b} type="number" placeholder={isIndia?"999":"59"}  value={editForm.price_full||""}   onChange={e => setEditForm(f => ({...f, price_full:e.target.value}))}/>
              <Inp label={cfg.pricing.c} type="number" placeholder={isIndia?"1499":"99"} value={editForm.price_custom||""} onChange={e => setEditForm(f => ({...f, price_custom:e.target.value}))}/>
            </div>
          </div>
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

      {/* In-app chat with customer */}
      {chatBooking && (
        <ChatModal
          booking={chatBooking}
          currentUserId={session.id}
          onClose={() => setChatBooking(null)}
        />
      )}

      {/* Payout request modal — collect bank / UPI details before submitting */}
      {payoutModal && (
        <Modal title="Request Payout 💰" onClose={() => setPayoutModal(false)}>
          <p className="text-xs text-gray-500 mb-4">
            Enter your payout details. Admin will transfer your pending earnings within 2 business days.
          </p>

          {/* Payment type toggle */}
          <div className="flex gap-2 mb-4">
            {["upi", "bank"].map(t => (
              <button
                key={t}
                onClick={() => setPayoutForm(f => ({ ...f, payment_type: t }))}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${payoutForm.payment_type === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"}`}>
                {t === "upi" ? "📱 UPI" : "🏦 Bank Transfer"}
              </button>
            ))}
          </div>

          {payoutForm.payment_type === "upi" ? (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">UPI ID *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="yourname@upi"
                value={payoutForm.upi_id}
                onChange={e => setPayoutForm(f => ({ ...f, upi_id: e.target.value }))}
              />
            </div>
          ) : (
            <>
              {[
                { key: "bank_name",      label: "Bank Name *",          placeholder: "e.g. HDFC Bank" },
                { key: "account_holder", label: "Account Holder Name *", placeholder: "Full name as on passbook" },
                { key: "account_number", label: "Account Number *",      placeholder: "10–18 digit account number" },
                { key: "ifsc_code",      label: "IFSC Code *",           placeholder: "e.g. HDFC0001234" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder={placeholder}
                    value={payoutForm[key]}
                    onChange={e => setPayoutForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-800">
            ⚠️ Double-check your details — incorrect information may delay your payout.
          </div>

          <button
            disabled={payoutSaving || (payoutForm.payment_type === "upi" ? !payoutForm.upi_id.trim() : !payoutForm.account_number.trim() || !payoutForm.ifsc_code.trim())}
            onClick={async () => {
              setPayoutSaving(true);
              try {
                const payload = payoutForm.payment_type === "upi"
                  ? { payment_type: "upi", upi_id: payoutForm.upi_id.trim() }
                  : { payment_type: "bank", bank_name: payoutForm.bank_name.trim(), account_holder: payoutForm.account_holder.trim(), account_number: payoutForm.account_number.trim(), ifsc_code: payoutForm.ifsc_code.trim().toUpperCase() };
                await api.requestPayout(payload);
                setPayoutModal(false);
                showToast("✅ Payout request sent! You'll receive payment within 2 business days.");
              } catch (e) { showToast("❌ " + (e.message || "Payout request failed")); }
              finally { setPayoutSaving(false); }
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition">
            {payoutSaving ? "Submitting…" : "Submit Payout Request"}
          </button>
        </Modal>
      )}

      {/* WhatsApp support chat */}
      <WhatsAppFAB role="professional" />
    </div>
  );
};
