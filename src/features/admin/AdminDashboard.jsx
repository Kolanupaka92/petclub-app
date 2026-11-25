// Author: Sai Kolanupaka
import { useState, useEffect } from "react";
import { api } from "../../api.js";
import { fmtDate, fmtTime, rIcon, rColor, sColor, aStatusLabel, roleLabel } from "../../shared/proData.js";
import { Bdg, Modal, Inp, Sel, Txta, Spinner, EmptyState, StatCard, PawLogo } from "../../shared/ui.jsx";

/* ══════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════ */
export const AdminDashboard = ({ session, onLogout }) => {
  const [view,       setView]       = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats,      setStats]      = useState(null);
  const [pending,    setPending]    = useState([]);
  const [users,      setUsers]      = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [rejectModal,setRejectModal]= useState(null);
  const [rejectReason,setRejectReason]=useState("");
  const [editUserModal, setEditUserModal] = useState(null); // { id, name, email, address, city, area, pincode }
  const [editUserForm,  setEditUserForm]  = useState({});
  const [editUserSaving,setEditUserSaving]= useState(false);
  const [toast,      setToast]      = useState({ msg:"", type:"success" });
  const [health,     setHealth]     = useState(null);
  const [healthRefreshing, setHealthRefreshing] = useState(false);
  const [healthLastAt,     setHealthLastAt]     = useState(null);
  const [dbAudit,    setDbAudit]    = useState(null);
  const [dbAuditLoading, setDbAuditLoading] = useState(false);
  const [dbCleanLoading, setDbCleanLoading] = useState(false);

  /* ── Payout state ── */
  const [payouts, setPayouts] = useState([]);

  /* ── Loyalty Award state ── */
  const [loyaltySearch,       setLoyaltySearch]       = useState("");
  const [loyaltyTarget,       setLoyaltyTarget]       = useState(null);   // selected user object
  const [loyaltyPoints,       setLoyaltyPoints]       = useState("");
  const [loyaltyDesc,         setLoyaltyDesc]         = useState("");
  const [loyaltySubmitting,   setLoyaltySubmitting]   = useState(false);
  const [loyaltyStats,        setLoyaltyStats]        = useState(null);
  const [loyaltyStatsLoading, setLoyaltyStatsLoading] = useState(false);

  /* ── Revenue Reports state ── */
  const [revenueData,    setRevenueData]    = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueFrom,    setRevenueFrom]    = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); });
  const [revenueTo,      setRevenueTo]      = useState(() => new Date().toISOString().slice(0,10));
  // Admin panel shows split INR (India) and USD (US) revenue.
  // currencySymbol used only for legacy stat cards; revenue card uses explicit symbols.
  const currencySymbol = "₹";

  /* ── Admin UX additions ── */
  const [confirmModal,   setConfirmModal]   = useState(null);   // { action, userId?, userName?, userIds?, count? }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedUsers,  setSelectedUsers]  = useState(new Set());
  const PAGE_SIZE  = 25;
  const [userPage,    setUserPage]    = useState(1);
  const [now,         setNow]         = useState(() => Date.now()); // drives live deletion countdowns
  const [rolePopover, setRolePopover] = useState(null);              // userId whose role dropdown is open

  /* ── Bookings tab filter state — hoisted from inline IIFE to satisfy Rules of Hooks ── */
  const [bSearch,  setBSearch]  = useState("");
  const [bStatus,  setBStatus]  = useState("All");
  const [bService, setBService] = useState("All");

  /* ── Manual assignment modal ── */
  const [assignModal,    setAssignModal]    = useState(null);  // booking object being assigned
  const [assignPros,     setAssignPros]     = useState([]);
  const [assignLoading,  setAssignLoading]  = useState(false);
  const [assignSending,  setAssignSending]  = useState(null);  // professionalId being sent
  const [assignSearch,   setAssignSearch]   = useState("");

  const openAssignModal = async (booking) => {
    setAssignModal(booking);
    setAssignPros([]);
    setAssignSearch("");
    setAssignLoading(true);
    const roleMap = { Groomer:"Groomer", Trainer:"Trainer", Vet:"Vet", Walker:"Walker", Boarding:"Boarding" };
    const subRole = roleMap[booking.service_type] || "";
    try {
      const res = await api.getProfessionals("", subRole);
      setAssignPros(res.professionals || []);
    } catch { setAssignPros([]); }
    setAssignLoading(false);
  };

  const doAssign = async (professionalId, proName) => {
    if (!assignModal) return;
    setAssignSending(professionalId);
    try {
      await api.adminAssignBooking(assignModal.id, professionalId);
      setBookings(prev => prev.map(b => b.id === assignModal.id
        ? { ...b, assignment_status: "offered", professional_id: professionalId }
        : b
      ));
      showToast(`✅ Assigned to ${proName} — notification sent!`, "success");
      setAssignModal(null);
    } catch (e) {
      showToast(e.message || "Assignment failed", "error");
    }
    setAssignSending(null);
  };

  useEffect(() => {
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getPendingVerifications().catch(() => ({ pending:[] })),
      api.getAdminUsers().catch(() => ({ users:[] })),
      api.getBookings().catch(() => ({ bookings:[] })),
      api.adminHealth().catch(() => null),
    ]).then(([statsRes, pendRes, usersRes, bkRes, healthRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      setPending(pendRes?.pending || []);
      setUsers(usersRes?.users || []);
      setBookings(bkRes?.bookings || []);
      if (healthRes) { setHealth(healthRes); setHealthLastAt(new Date()); }
    }).finally(() => setLoading(false));
  }, []);

  // ── Platform Status auto-refresh every 60 s ──────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      api.adminHealth().then(r => { if (r) { setHealth(r); setHealthLastAt(new Date()); } }).catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const refreshHealth = async () => {
    if (healthRefreshing) return;
    setHealthRefreshing(true);
    try {
      const r = await api.adminHealth();
      if (r) { setHealth(r); setHealthLastAt(new Date()); }
    } catch {}
    setHealthRefreshing(false);
  };

  // Live tracking auto-refresh — poll every 15s when "live" tab is active
  useEffect(() => {
    if (view !== "live") return;
    const t = setInterval(() => {
      api.getBookings().then(r => setBookings(r.bookings || [])).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [view]);

  // Tick every 60s to keep deletion countdown timers accurate
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Load payouts whenever the payouts tab is opened
  useEffect(() => {
    if (view !== "payouts") return;
    api.adminGetPayouts().then(r => setPayouts(r.payouts || [])).catch(() => {});
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load loyalty programme stats whenever the loyalty tab is opened
  useEffect(() => {
    if (view !== "loyalty" || loyaltyStats || loyaltyStatsLoading) return;
    setLoyaltyStatsLoading(true);
    api.loyaltyStats(30).then(r => setLoyaltyStats(r)).catch(() => {}).finally(() => setLoyaltyStatsLoading(false));
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pagination + selection when the user changes filters or search
  useEffect(() => {
    setUserPage(1);
    setSelectedUsers(new Set());
  }, [search, roleFilter]);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg:"", type:"success" }), 3500); };

  const approve = async id => {
    try {
      await api.verifyProfessional(id, "approve");
      setPending(l => l.filter(p => p.id !== id));
      showToast("✅ Professional approved and notified!");
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
  // Suspend routes through confirm modal for active→suspended; restore is instant
  const suspend = userId => {
    const u = users.find(u => u.id === userId);
    if (u?.is_active) {
      setConfirmModal({ action: "suspend", userId, userName: u.name || "this user" });
    } else {
      api.suspendUser(userId)
        .then(res => {
          setUsers(l => l.map(u => u.id === userId
            ? { ...u, is_active: res.is_active, suspended_at: res.suspended_at ?? u.suspended_at }
            : u));
          showToast("✅ User restored.");
        })
        .catch(() => showToast("❌ Failed to restore user.", "error"));
    }
  };

  // Delete always requires confirmation
  const deleteUser = userId => {
    const u = users.find(u => u.id === userId);
    setConfirmModal({ action: "delete", userId, userName: u?.name || "this user" });
  };

  /* ── Execute the action confirmed in the modal ── */
  const executeConfirm = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    const { action, userId, userIds } = confirmModal;
    try {
      if (action === "suspend") {
        const res = await api.suspendUser(userId);
        setUsers(l => l.map(u => u.id === userId
          ? { ...u, is_active: res.is_active, suspended_at: res.suspended_at ?? u.suspended_at }
          : u));
        showToast("⚠️ User suspended — will be deleted in 24 hrs.");
      } else if (action === "delete") {
        await api.deleteUser(userId);
        setUsers(l => l.filter(u => u.id !== userId));
        showToast("🗑️ User permanently deleted.");
      } else if (action === "bulk_suspend") {
        const ids = [...userIds];
        await Promise.allSettled(ids.map(id => api.suspendUser(id)));
        setUsers(l => l.map(u => userIds.has(u.id)
          ? { ...u, is_active: false, suspended_at: new Date().toISOString() } : u));
        setSelectedUsers(new Set());
        showToast(`⚠️ ${ids.length} user${ids.length !== 1 ? "s" : ""} suspended.`);
      } else if (action === "bulk_delete") {
        const ids = [...userIds];
        const results = await Promise.allSettled(ids.map(id => api.deleteUser(id)));
        const deleted  = ids.filter((_, i) => results[i].status === "fulfilled");
        setUsers(l => l.filter(u => !deleted.includes(u.id)));
        setSelectedUsers(new Set());
        showToast(`🗑️ ${deleted.length} user${deleted.length !== 1 ? "s" : ""} deleted.`);
      } else if (action === "purge_all_suspended") {
        await handlePurgeAllSuspended();
        return; // handlePurgeAllSuspended closes modal + shows toast itself
      }
    } catch (e) { showToast("❌ " + (e.message || "Action failed."), "error"); }
    setConfirmLoading(false);
    setConfirmModal(null);
  };

  /* ── Purge all suspended ── */
  const handlePurgeAllSuspended = async () => {
    try {
      const res = await api.purgeAllSuspended();
      setUsers(u => u.filter(x => x.is_active || x.role === 'admin'));
      setConfirmModal(null);
      showToast(`🗑️ Deleted ${res.deleted} suspended account${res.deleted !== 1 ? 's' : ''}.`);
    } catch (e) {
      showToast("❌ " + e.message, "error");
      setConfirmModal(null);
    }
  };

  /* ── Bulk action entry-points ── */
  const handleBulkSuspend = () => {
    if (!selectedUsers.size) return;
    setConfirmModal({ action: "bulk_suspend", userIds: new Set(selectedUsers), count: selectedUsers.size });
  };
  const handleBulkDelete = () => {
    if (!selectedUsers.size) return;
    const hasActive = [...selectedUsers].some(id => users.find(u => u.id === id)?.is_active);
    if (hasActive) { showToast("⚠️ Bulk delete only works on already-suspended users. Suspend them first.", "error"); return; }
    setConfirmModal({ action: "bulk_delete", userIds: new Set(selectedUsers), count: selectedUsers.size });
  };

  const saveEditUser = async () => {
    if (!editUserModal) return;
    setEditUserSaving(true);
    try {
      await api.adminEditUser(editUserModal.id, {
        name:    editUserForm.name    ?? editUserModal.name,
        email:   editUserForm.email   ?? editUserModal.email,
        address: editUserForm.address ?? editUserModal.address,
        city:    editUserForm.city    ?? editUserModal.city,
        area:    editUserForm.area    ?? editUserModal.area,
        pincode: editUserForm.pincode ?? editUserModal.pincode,
      });
      setUsers(l => l.map(u => u.id === editUserModal.id
        ? { ...u, name: editUserForm.name ?? u.name, email: editUserForm.email ?? u.email }
        : u));
      setEditUserModal(null); setEditUserForm({});
      showToast("✅ User profile updated.");
    } catch (e) { showToast("❌ " + e.message, "error"); }
    setEditUserSaving(false);
  };

  // Real-time deletion countdown — driven by the `now` ticker (updates every 60 s)
  const deletionCountdown = suspendedAt => {
    if (!suspendedAt) return null;
    const deletesAt = new Date(new Date(suspendedAt).getTime() + 24 * 60 * 60 * 1000);
    const msLeft = deletesAt - now;
    if (msLeft <= 0) return "🗑️ Deletes imminently";
    const h   = Math.floor(msLeft / 3_600_000);
    const m   = Math.floor((msLeft % 3_600_000) / 60_000);
    const at  = deletesAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const day = deletesAt.toDateString() !== new Date().toDateString()
      ? ` ${deletesAt.toLocaleDateString([], { month:"short", day:"numeric" })}` : "";
    if (h >= 1) return `🗑️ Deletes in ${h}h ${m}m (at ${at}${day})`;
    return `🗑️ Deletes in ${m}m (at ${at})`;
  };

  const filteredUsers = users.filter(u =>
    (roleFilter === "All" || u.role === roleFilter.toLowerCase() || u.professional_profiles?.[0]?.sub_role === roleFilter) &&
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
  );
  const pageCount      = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  // Short date formatter used in user cards
  const fmtShort = d => { try { return new Date(d).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" }); } catch { return "—"; } };

  // Revenue split by currency — use bookings.currency field set server-side at creation
  const completedAll  = bookings.filter(b => b.status === "completed");
  const inrBookings   = completedAll.filter(b => (b.currency || "INR") !== "USD");
  const usdBookings   = completedAll.filter(b => (b.currency || "INR") === "USD");
  const revINR = {
    gross:    inrBookings.reduce((s,b) => s + parseFloat(b.total_amount||b.amount||0), 0),
    platform: inrBookings.reduce((s,b) => s + parseFloat(b.platform_fee||0), 0),
    provider: inrBookings.reduce((s,b) => s + parseFloat(b.provider_earnings||0), 0),
    count:    inrBookings.length,
  };
  const revUSD = {
    gross:    usdBookings.reduce((s,b) => s + parseFloat(b.total_amount||b.amount||0), 0),
    platform: usdBookings.reduce((s,b) => s + parseFloat(b.platform_fee||0), 0),
    provider: usdBookings.reduce((s,b) => s + parseFloat(b.provider_earnings||0), 0),
    count:    usdBookings.length,
  };

  const NAV = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"live",     icon:"🗺️", label:"Live",     badge: bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length || 0 },
    { id:"verify",   icon:"🔍", label:"Verify",   badge: pending.length },
    { id:"users",    icon:"👥", label:"Users" },
    { id:"bookings", icon:"📅", label:"Bookings" },
    { id:"reports",  icon:"📈", label:"Reports" },
    { id:"loyalty",  icon:"🎁", label:"Loyalty" },
    { id:"payouts",  icon:"💸", label:"Payouts" },
    { id:"dbhealth", icon:"🗄️", label:"DB" },
  ];

  if (loading) return <Spinner full/>;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 text-sm">
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-gray-950 text-white shrink-0 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <PawLogo sz={32}/>
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
          <div className="text-center mt-1">
            <span className="text-[10px] text-gray-700 font-mono tracking-wider">v{__APP_VERSION__}</span>
          </div>
        </div>
      </aside>

      {/* Mobile header + slide-down menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950 text-white flex items-center px-4 py-3 shadow-lg gap-3">
        <PawLogo sz={24}/>
        <span className="font-extrabold text-orange-400 text-sm">PETclub</span>
        <span className="text-xs text-red-400 font-bold tracking-widest">ADMIN</span>
        {health && <span className="ml-auto text-[11px] font-semibold text-emerald-400">● Live</span>}
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-gray-950 text-white p-4 space-y-1 shadow-2xl border-t border-white/10">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setView(n.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${view === n.id ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <span>{n.icon}</span><span>{n.label}</span>
              {n.badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{n.badge}</span>}
            </button>
          ))}
          <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-400 flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-white/5 transition">
            🚪 Sign Out
          </button>
        </div>
      )}

      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 min-h-screen">
        {toast.msg && (
          <div className={`fixed top-16 md:top-4 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-5 py-3 rounded-full shadow-xl ${toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
            {toast.msg}
          </div>
        )}

        {view === "overview" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-16">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-white text-2xl font-extrabold mb-1">Admin Dashboard</h1>
                  <p className="text-gray-400 text-sm">PETclub · Super Admin</p>
                  <div className={`text-xs mt-1 font-semibold ${health ? "text-emerald-400" : "text-gray-500"}`}>
                    {health ? "● Platform Live" : "● Checking…"}
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-xs text-gray-500">{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                </div>
              </div>
            </div>
            <div className="px-5 -mt-8">
              {/* ── KPI Cards ── */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatCard icon="👥" label="Total Users"    value={stats?.users ?? users.length}  gradient="bg-gradient-to-br from-blue-500 to-blue-700"     onClick={() => setView("users")}/>
                <StatCard icon="✅" label="Verified Pros"  value={stats?.verified_pros ?? 0}     gradient="bg-gradient-to-br from-emerald-500 to-teal-600"  onClick={() => setView("users")}/>
                <StatCard icon="⏳" label="Pending Review" value={pending.length} sub={pending.length > 0 ? "Needs action" : "All clear!"} gradient="bg-gradient-to-br from-amber-500 to-orange-500" onClick={() => pending.length && setView("verify")}/>
                <StatCard icon="🗺️" label="Live Trips"     value={bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length} sub={bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length > 0 ? "Active now" : "All quiet"} gradient="bg-gradient-to-br from-violet-500 to-purple-600" onClick={() => setView("live")}/>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatCard icon="📅" label="Total Bookings" value={bookings.length}  gradient="bg-gradient-to-br from-gray-600 to-gray-800" onClick={() => setView("bookings")}/>
                <StatCard icon="🏁" label="Completion Rate" value={bookings.length ? `${Math.round(bookings.filter(b=>b.status==="completed").length/bookings.length*100)}%` : "—"} sub={`${bookings.filter(b=>b.status==="completed").length} done`} gradient="bg-gradient-to-br from-teal-500 to-cyan-600" onClick={() => setView("bookings")}/>
              </div>
              {/* Revenue card — split INR / USD */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Gross Revenue (Customer Paid)</div>
                    <div className="text-white text-2xl font-extrabold">
                      ₹{revINR.gross.toLocaleString("en-IN")}
                      {revUSD.count > 0 && <span className="text-gray-300 text-lg font-semibold"> · ${revUSD.gross.toLocaleString("en-US")}</span>}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {completedAll.length} completed · {revINR.count} INR · {revUSD.count} USD
                    </div>
                  </div>
                  <div className="text-5xl opacity-30">💰</div>
                </div>

                {/* India (INR) */}
                <div className="mb-2">
                  <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1.5">🇮🇳 India (₹)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-xl p-2 text-center">
                      <div className="text-gray-400 text-[10px] font-semibold mb-0.5">Gross</div>
                      <div className="text-white font-extrabold text-xs">₹{revINR.gross.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 text-center">
                      <div className="text-gray-400 text-[10px] font-semibold mb-0.5">PETclub</div>
                      <div className="text-orange-400 font-extrabold text-xs">₹{revINR.platform.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 text-center">
                      <div className="text-gray-400 text-[10px] font-semibold mb-0.5">Providers</div>
                      <div className="text-emerald-400 font-extrabold text-xs">₹{revINR.provider.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>

                {/* USA (USD) — only shown when there are USD bookings */}
                {revUSD.count > 0 ? (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1.5">🇺🇸 USA ($)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 rounded-xl p-2 text-center">
                        <div className="text-gray-400 text-[10px] font-semibold mb-0.5">Gross</div>
                        <div className="text-white font-extrabold text-xs">${revUSD.gross.toLocaleString("en-US")}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2 text-center">
                        <div className="text-gray-400 text-[10px] font-semibold mb-0.5">PETclub</div>
                        <div className="text-orange-400 font-extrabold text-xs">${revUSD.platform.toLocaleString("en-US")}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2 text-center">
                        <div className="text-gray-400 text-[10px] font-semibold mb-0.5">Providers</div>
                        <div className="text-emerald-400 font-extrabold text-xs">${revUSD.provider.toLocaleString("en-US")}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-white/10 text-center">
                    <span className="text-gray-600 text-[10px]">🇺🇸 No USD bookings yet</span>
                  </div>
                )}
              </div>

              {/* ── Role distribution ── */}
              {(() => {
                const customers  = users.filter(u => u.role === "customer").length;
                const groomers   = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Groomer").length;
                const trainers   = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Trainer").length;
                const vets       = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Vet").length;
                const walkers    = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Walker").length;
                const boarders   = users.filter(u => u.professional_profiles?.[0]?.sub_role === "Boarding").length;
                const total      = users.length || 1;
                const pros       = groomers + trainers + vets + walkers + boarders;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-bold text-gray-800">User Mix</h2>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span><span className="font-bold text-blue-600">{customers}</span> owners</span>
                        <span><span className="font-bold text-violet-600">{pros}</span> pros</span>
                        <span className="font-bold text-gray-700">{total} total</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label:"🐕 Pet Owners", count:customers,  color:"bg-blue-400",   pct:Math.round(customers/total*100) },
                        { label:"✂️ Groomers",   count:groomers,   color:"bg-violet-400", pct:Math.round(groomers/total*100) },
                        { label:"🐕‍🦺 Trainers",   count:trainers,   color:"bg-indigo-400", pct:Math.round(trainers/total*100) },
                        { label:"🏥 Vets",        count:vets,       color:"bg-emerald-400",pct:Math.round(vets/total*100) },
                        { label:"🦮 Walkers",     count:walkers,    color:"bg-green-400",  pct:Math.round(walkers/total*100) },
                        { label:"🏠 Boarders",    count:boarders,   color:"bg-amber-400",  pct:Math.round(boarders/total*100) },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600 w-28 shrink-0">{row.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${row.color} transition-all duration-500`} style={{ width: `${row.pct || 0}%` }}/>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8 text-right">{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── Pending alert ── */}
              {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 mb-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
                    <div>
                      <div className="font-bold text-amber-800 text-sm">{pending.length} professional{pending.length !== 1 ? "s" : ""} await review</div>
                      <div className="text-xs text-amber-700">Approve or reject their applications</div>
                    </div>
                  </div>
                  <button onClick={() => setView("verify")} className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-600 shrink-0 transition">Review →</button>
                </div>
              )}

              {/* ── Recent Bookings ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Bookings</h2>
                  <button onClick={() => setView("bookings")} className="text-xs text-orange-500 font-semibold">View all →</button>
                </div>
                {bookings.length === 0 ? <div className="px-5 py-8 text-center text-sm text-gray-400">No bookings yet.</div>
                : bookings.slice(0,6).map((b,i) => {
                  const assignBadge = {
                    confirmed:"✅", searching:"🔍", offered:"📤", no_pros_available:"⚠️"
                  }[b.assignment_status] || "";
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base shrink-0">
                        {({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Walker:"🦮", Boarding:"🏠" })[b.service_type] || "🐕"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                        <div className="text-xs text-gray-400">{b.scheduled_at ? fmtDate(b.scheduled_at) : "—"} {assignBadge && `· ${assignBadge} ${b.assignment_status}`}</div>
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                  );
                })}
              </div>

              {/* ── Recent Users ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setView("users")} className="text-xs text-orange-500 font-semibold">View all →</button>
                </div>
                {users.slice(0,5).map(u => {
                  const proRole = u.professional_profiles?.[0]?.sub_role;
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{rIcon(proRole || u.role)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400 capitalize">{proRole || roleLabel(u.role)} · {u.phone}</div>
                      </div>
                      <Bdg text={u.is_active ? "active" : "suspended"} cls={sColor(u.is_active ? "active" : "suspended")}/>
                    </div>
                  );
                })}
              </div>

              {/* ── Platform Status — driven from /health API ── */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-700 text-sm">⚙️ Platform Status</h2>
                  <div className="flex items-center gap-2">
                    {healthLastAt && (
                      <span className="text-[10px] text-gray-400">
                        {healthLastAt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                      </span>
                    )}
                    <button
                      onClick={refreshHealth}
                      disabled={healthRefreshing}
                      className="text-[11px] font-semibold text-orange-500 border border-orange-200 bg-orange-50 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition disabled:opacity-50 flex items-center gap-1">
                      {healthRefreshing ? "⏳" : "↻"} Refresh
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const svcs = health?.services || {};
                    // Backend returns "" (empty string) for healthy, "...unreachable" for broken,
                    // or a pending/not-configured message for intentionally absent services.
                    const ok     = v => v === "" || (typeof v === "string" && v.startsWith("✅"));
                    const broken = v => typeof v === "string" && v.length > 0 && v.includes("unreachable");
                    const hColor = v => ok(v) ? "text-emerald-600" : broken(v) ? "text-red-600" : "text-gray-400";
                    // Use 'in' check so "" (healthy empty string) is not treated as missing
                    const has    = key => svcs != null && key in svcs;
                    const svcStr = (raw) => {
                      if (raw === "") return "✅";
                      if (raw == null) return "—";
                      // strip leading non-word chars (emoji prefix), then clean known suffixes
                      return raw.replace(/^[^\w]+\s*/u, '').trim()
                        .replace(' live','').replace(' configured','')
                        .replace('(set FIREBASE_SERVICE_ACCOUNT_JSON)','').replace('(set env vars)','')
                        .replace('(email fallback active)','email fallback')
                        .replace('not configured','email fallback').replace('pending','pending')
                        .trim() || '—';
                    };
                    const rows = [
                      { label:"Backend API",  val: health ? (ok(svcs.supabase) ? "Cloud Run ✅" : broken(svcs.supabase) ? "Cloud Run ❌" : "Cloud Run ⚠️") : "Checking…", color: health ? hColor(svcs.supabase) : "text-gray-400" },
                      { label:"Frontend",     val: "Vercel ✅",                                                                              color: "text-emerald-600" },
                      { label:"Database",     val: has('supabase')      ? `Supabase ${svcStr(svcs.supabase)}`      : "Supabase —",           color: hColor(svcs.supabase) },
                      { label:"Auth / Push",  val: has('firebase_auth') ? `Firebase ${svcStr(svcs.firebase_auth)}` : "Firebase —",           color: hColor(svcs.firebase_auth) },
                      { label:"SMS Alerts",   val: has('twilio_sms')    ? `Twilio ${svcStr(svcs.twilio_sms)}`      : "email fallback",        color: hColor(svcs.twilio_sms) },
                      { label:"Email (SMTP)", val: has('zoho_smtp')     ? `Zoho ${svcStr(svcs.zoho_smtp)}`         : "Zoho —",               color: hColor(svcs.zoho_smtp) },
                      { label:"Payments",     val: ok(svcs.razorpay)   ? "Razorpay ✅"                             : "⏳ Pending LLC",         color: ok(svcs.razorpay) ? "text-emerald-600" : "text-gray-400" },
                    ];
                    return rows.map(s => (
                      <div key={s.label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <span className="text-gray-500 font-medium">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.val}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <div className={`bg-gradient-to-r ${rColor(pro.sub_role)} px-5 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-base">{rIcon(pro.sub_role)}</span>
                        <span className="text-white font-bold text-sm">{pro.sub_role}</span>
                      </div>
                      <Bdg text="⏳ Pending" cls="bg-white/20 text-white border-white/20"/>
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
                          {pro.license_number && <div className="text-xs text-gray-400 mt-0.5">📋 License: {pro.license_number}</div>}
                          {pro.clinic_name && <div className="text-xs text-gray-400 mt-0.5">🏥 {pro.clinic_name}</div>}
                        </div>
                      </div>
                      {pro.bio && <div className="bg-gray-50 rounded-xl p-3 mb-4"><p className="text-xs text-gray-600 italic leading-relaxed">"{pro.bio}"</p></div>}
                      {Array.isArray(pro.pet_types) && pro.pet_types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pro.pet_types.map(t => <span key={t} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">{t}</span>)}
                        </div>
                      )}
                      {Array.isArray(pro.services) && pro.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pro.services.map(s => <span key={s} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">{s}</span>)}
                        </div>
                      )}
                      {/* ── ID Documents (signed URL — opens for 60s) ── */}
                      {(() => {
                        const doc = Array.isArray(pro.id_documents) ? pro.id_documents[0] : pro.id_documents;
                        if (!doc) return (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 font-medium">⚠️ No ID documents uploaded yet</div>
                        );
                        const openDoc = async (path) => {
                          if (!path) return alert("No document uploaded for this field.");
                          try {
                            const r = await api.getSignedDocUrl(path);
                            window.open(r.url, "_blank", "noopener,noreferrer");
                          } catch { alert("Could not load document. Please try again."); }
                        };
                        return (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">🪪 Submitted Documents</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">ID Type: <strong className="text-gray-800">{doc.doc_type || "—"}</strong></span>
                              <span className="text-gray-500">No: <strong className="text-gray-800">{doc.doc_number || "—"}</strong></span>
                            </div>
                            {doc.cert_type && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Cert Type: <strong className="text-gray-800">{doc.cert_type}</strong></span>
                                {doc.cert_number && <span className="text-gray-500">No: <strong className="text-gray-800">{doc.cert_number}</strong></span>}
                              </div>
                            )}
                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                              <span className="shrink-0 mt-0.5">📧</span>
                              <span>ID photo was emailed to your admin inbox as an attachment — check <strong>admin@mypetclub.app</strong></span>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        <button onClick={() => approve(pro.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm transition">✅ Approve</button>
                        <button onClick={() => setRejectModal(pro.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition">❌ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rejectModal && (
              <Modal title="Reject Application" onClose={() => setRejectModal(null)}>
                <p className="text-sm text-gray-500 mb-4">The reason will be sent to the professional via SMS and email.</p>
                <Txta label="Reason for rejection *" placeholder="e.g. Please provide clearer ID photo and add bio details, then resubmit." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}/>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={() => reject(rejectModal)} disabled={!rejectReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">Confirm Reject</button>
                </div>
              </Modal>
            )}

          </div>
        )}

        {view === "users" && (
          <div className="max-w-2xl mx-auto px-4 py-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-gray-800">Users</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">
                  {filteredUsers.length} / {users.length} total
                </span>
                {users.some(u => !u.is_active && u.role !== 'admin') && (
                  <button
                    onClick={() => {
                      const count = users.filter(u => !u.is_active && u.role !== 'admin').length;
                      setConfirmModal({ action: "purge_all_suspended", count });
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1">
                    🗑️ Purge All Suspended ({users.filter(u => !u.is_active && u.role !== 'admin').length})
                  </button>
                )}
              </div>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition"/>
            </div>

            {/* ── Role filter chips ── */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              {["All","customer","Groomer","Trainer","Vet","Walker","Boarding"].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition-all shrink-0 ${roleFilter === r ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"}`}>
                  {r === "customer" ? "🐕 Owners" : r === "All" ? "All" : `${rIcon(r)} ${r}s`}
                </button>
              ))}
            </div>

            {/* ── Sticky bulk action bar (appears on selection) ── */}
            {selectedUsers.size > 0 && (
              <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3 sticky top-4 z-30 shadow-2xl">
                <span className="text-sm font-bold shrink-0">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={handleBulkSuspend}
                    className="text-xs font-bold px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl transition">
                    ⏸ Suspend All
                  </button>
                  <button onClick={handleBulkDelete}
                    className="text-xs font-bold px-3 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition">
                    🗑️ Delete All
                  </button>
                  <button onClick={() => setSelectedUsers(new Set())}
                    className="text-xs font-semibold px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
                    ✕ Clear
                  </button>
                </div>
              </div>
            )}

            {filteredUsers.length === 0 ? <EmptyState icon="👥" title="No users found" desc="Try a different search or filter."/> : (
              <>
                {/* ── Select all on this page ── */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.has(u.id))}
                    onChange={e => {
                      const next = new Set(selectedUsers);
                      if (e.target.checked) paginatedUsers.forEach(u => next.add(u.id));
                      else paginatedUsers.forEach(u => next.delete(u.id));
                      setSelectedUsers(next);
                    }}
                  />
                  <span className="text-xs text-gray-400 font-medium">
                    Select all on page {userPage} ({paginatedUsers.length})
                  </span>
                </div>

                {/* ── User cards ── */}
                <div className="space-y-2">
                  {paginatedUsers.map(u => {
                    const proRole    = u.professional_profiles?.[0]?.sub_role;
                    const verStatus  = u.professional_profiles?.[0]?.verification_status;
                    const custDoc    = u.customer_profiles?.[0];
                    const hasCustDoc = custDoc?.id_photo_url;
                    const isSelected = selectedUsers.has(u.id);

                    const openCustDoc = async () => {
                      try { const r = await api.getSignedDocUrl(custDoc.id_photo_url); window.open(r.url, "_blank", "noopener,noreferrer"); }
                      catch { showToast("❌ Could not load document", "error"); }
                    };

                    return (
                      <div key={u.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                        isSelected ? "border-orange-300 ring-2 ring-orange-100 bg-orange-50/20" :
                        !u.is_active ? "border-red-100 bg-red-50/30" : "border-gray-100"
                      }`}>

                        {/* Top row: checkbox + avatar + info */}
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className="pt-0.5 shrink-0">
                            <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                              checked={isSelected}
                              onChange={e => {
                                const next = new Set(selectedUsers);
                                if (e.target.checked) next.add(u.id); else next.delete(u.id);
                                setSelectedUsers(next);
                              }}
                            />
                          </div>
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0 mt-0.5">
                            {rIcon(proRole || u.role)}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate">{u.name || "—"}</div>
                            <div className="text-xs text-gray-400 capitalize truncate">{proRole || roleLabel(u.role)} · {u.phone}</div>
                            {u.email && <div className="text-xs text-gray-400 truncate">{u.email}</div>}

                            {/* Date Registered + Last Active */}
                            <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-gray-400">
                              {u.created_at && <span title="Date Registered">📅 Joined {fmtShort(u.created_at)}</span>}
                              {(u.updated_at || u.last_active_at) &&
                                <span title="Last Active">🕐 Active {fmtShort(u.last_active_at || u.updated_at)}</span>}
                            </div>

                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sColor(u.is_active ? "active" : "suspended")}`}>
                                {u.is_active ? "active" : "suspended"}
                              </span>
                              {proRole && verStatus &&
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sColor(verStatus)}`}>{verStatus}</span>}
                              {hasCustDoc &&
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">🪪 ID on file</span>}
                            </div>

                            {/* Real-time deletion countdown */}
                            {!u.is_active && u.suspended_at && (
                              <div className="text-xs font-semibold text-red-500 mt-1">
                                {deletionCountdown(u.suspended_at)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                          {hasCustDoc && (
                            <button onClick={openCustDoc}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                              🪪 View ID
                            </button>
                          )}
                          {custDoc && custDoc.id_doc_type && !hasCustDoc && (
                            <span className="text-xs text-gray-400 px-2 py-1.5">{custDoc.id_doc_type}: {custDoc.id_doc_number || "—"} (no photo)</span>
                          )}

                          {/* Edit */}
                          <button onClick={() => {
                            const cp = u.customer_profiles?.[0] || {};
                            const pp = u.professional_profiles?.[0] || {};
                            setEditUserModal({ id: u.id, name: u.name, email: u.email,
                              address: cp.address || pp.address || "",
                              city: cp.city || pp.city || "",
                              area: cp.area || pp.area || "",
                              pincode: cp.pincode || "" });
                            setEditUserForm({});
                          }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                            ✏️ Edit
                          </button>

                          {/* Suspend / Restore */}
                          <button onClick={() => suspend(u.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${u.is_active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                            {u.is_active ? "⏸ Suspend" : "▶ Restore"}
                          </button>

                          {/* Delete (suspended only) */}
                          {!u.is_active && (
                            <button onClick={() => deleteUser(u.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition">
                              🗑️ Delete
                            </button>
                          )}

                          {/* Clean role assignment popover — replaces the raw <select> */}
                          {u.role === "professional" && !proRole && (
                            <div className="relative">
                              <button onClick={() => setRolePopover(rp => rp === u.id ? null : u.id)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 transition flex items-center gap-1">
                                🏷 Assign Role <span className="text-[10px]">{rolePopover === u.id ? "▲" : "▼"}</span>
                              </button>
                              {rolePopover === u.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setRolePopover(null)} />
                                  <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 min-w-[168px] py-1.5 overflow-hidden">
                                    {[["Groomer","✂️"],["Trainer","🐕‍🦺"],["Vet","🏥"],["Walker","🦮"],["Boarding","🏠"]].map(([role, icon]) => (
                                      <button key={role}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition text-left"
                                        onClick={async () => {
                                          setRolePopover(null);
                                          try {
                                            await api.setUserSubRole(u.id, role);
                                            setUsers(l => l.map(x => x.id === u.id
                                              ? { ...x, professional_profiles: [{ ...(x.professional_profiles?.[0] || {}), sub_role: role }] }
                                              : x));
                                            showToast(`✅ Set as ${role}`);
                                          } catch (err) { showToast("❌ " + (err.message || "Failed"), "error"); }
                                        }}>
                                        <span>{icon}</span> {role}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination ── */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition">
                      ← Prev
                    </button>
                    <div className="flex gap-1">
                      {(() => {
                        // Show up to 7 page numbers, windowed around current page
                        const total = pageCount;
                        const pages = total <= 7
                          ? Array.from({ length: total }, (_, i) => i + 1)
                          : userPage <= 4
                            ? [...Array.from({ length: 5 }, (_, i) => i + 1), "…", total]
                            : userPage >= total - 3
                              ? [1, "…", ...Array.from({ length: 5 }, (_, i) => total - 4 + i)]
                              : [1, "…", userPage - 1, userPage, userPage + 1, "…", total];
                        return pages.map((p, i) =>
                          p === "…"
                            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                            : <button key={p} onClick={() => setUserPage(p)}
                                className={`w-8 h-8 text-xs font-bold rounded-xl transition ${userPage === p ? "bg-orange-500 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                                {p}
                              </button>
                        );
                      })()}
                    </div>
                    <button onClick={() => setUserPage(p => Math.min(pageCount, p + 1))} disabled={userPage === pageCount}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition">
                      Next →
                    </button>
                    <span className="w-full text-center text-xs text-gray-400 mt-1">
                      Page {userPage} of {pageCount} · {filteredUsers.length} users
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === "bookings" && (() => {
          const SERVICE_TYPES = ["All","Groomer","Trainer","Vet","Walker","Boarding"];
          const STATUS_TABS   = ["All","upcoming","completed","cancelled"];
          const filtered = bookings.filter(b => {
            const matchStatus  = bStatus  === "All" || b.status === bStatus;
            const matchService = bService === "All" || b.service_type === bService;
            const q = bSearch.trim().toLowerCase();
            const matchSearch  = !q || (b.users?.name || "").toLowerCase().includes(q) ||
                                 (b.service_name || b.service_type || "").toLowerCase().includes(q) ||
                                 (b.users?.phone || "").includes(q);
            return matchStatus && matchService && matchSearch;
          });
          const completedFiltered = filtered.filter(b=>b.status==="completed");
          const cfINR = completedFiltered.filter(b => (b.currency || "INR") !== "USD");
          const cfUSD = completedFiltered.filter(b => (b.currency || "INR") === "USD");
          const bRevINR = { gross: cfINR.reduce((s,b)=>s+parseFloat(b.total_amount||b.amount||0),0), platform: cfINR.reduce((s,b)=>s+parseFloat(b.platform_fee||0),0), provider: cfINR.reduce((s,b)=>s+parseFloat(b.provider_earnings||0),0) };
          const bRevUSD = { gross: cfUSD.reduce((s,b)=>s+parseFloat(b.total_amount||b.amount||0),0), platform: cfUSD.reduce((s,b)=>s+parseFloat(b.platform_fee||0),0), provider: cfUSD.reduce((s,b)=>s+parseFloat(b.provider_earnings||0),0) };
          return (
          <div className="max-w-2xl mx-auto px-5 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-extrabold text-gray-800">Bookings</h1>
              <span className="text-sm text-gray-400">{filtered.length} / {bookings.length}</span>
            </div>

            {/* Status summary chips — clickable filters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {[
                { l:"Upcoming",   v:bookings.filter(b=>b.status==="upcoming").length,   c:"bg-blue-50 text-blue-700",    s:"upcoming" },
                { l:"Completed",  v:bookings.filter(b=>b.status==="completed").length,  c:"bg-emerald-50 text-emerald-700", s:"completed" },
                { l:"Searching",  v:bookings.filter(b=>b.assignment_status==="searching").length, c:"bg-orange-50 text-orange-700", s:"All" },
                { l:"Confirmed",  v:bookings.filter(b=>b.assignment_status==="confirmed").length, c:"bg-violet-50 text-violet-700", s:"All" },
                { l:"🚗 En Route",v:bookings.filter(b=>["on_the_way","in_progress"].includes(b.assignment_status)).length, c:"bg-amber-50 text-amber-700", s:"All" },
              ].map(s => (
                <button key={s.l} onClick={() => setBStatus(s.s === bStatus ? "All" : s.s)}
                  className={`rounded-xl p-3 text-center transition ${s.c} ${bStatus === s.s && s.s !== "All" ? "ring-2 ring-offset-1 ring-current" : ""}`}>
                  <div className="text-lg font-extrabold">{s.v}</div>
                  <div className="text-xs font-semibold opacity-70">{s.l}</div>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input value={bSearch} onChange={e => setBSearch(e.target.value)}
                placeholder="Search by customer name, phone, or service…"
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition"/>
            </div>

            {/* Service type filter */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
              {SERVICE_TYPES.map(t => (
                <button key={t} onClick={() => setBService(t)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition shrink-0 ${bService === t ? "bg-orange-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"}`}>
                  {t === "All" ? "All Services" : `${({Groomer:"✂️",Trainer:"🐕‍🦺",Vet:"🏥",Walker:"🦮",Boarding:"🏠"})[t]} ${t}`}
                </button>
              ))}
            </div>

            {/* Revenue summary for filtered view */}
            {completedFiltered.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-3">
                {/* INR row */}
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1.5">🇮🇳 India (₹) · {cfINR.length} bookings</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-[10px] text-gray-400 font-semibold">Gross</div><div className="text-white font-extrabold text-xs mt-0.5">₹{bRevINR.gross.toLocaleString("en-IN",{maximumFractionDigits:0})}</div></div>
                    <div><div className="text-[10px] text-gray-400 font-semibold">PETclub</div><div className="text-orange-400 font-extrabold text-xs mt-0.5">₹{bRevINR.platform.toLocaleString("en-IN",{maximumFractionDigits:0})}</div></div>
                    <div><div className="text-[10px] text-gray-400 font-semibold">Providers</div><div className="text-emerald-400 font-extrabold text-xs mt-0.5">₹{bRevINR.provider.toLocaleString("en-IN",{maximumFractionDigits:0})}</div></div>
                  </div>
                </div>
                {/* USD row — only if any USD bookings in this filter */}
                {cfUSD.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1.5">🇺🇸 USA ($) · {cfUSD.length} bookings</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><div className="text-[10px] text-gray-400 font-semibold">Gross</div><div className="text-white font-extrabold text-xs mt-0.5">${bRevUSD.gross.toLocaleString("en-US",{maximumFractionDigits:0})}</div></div>
                      <div><div className="text-[10px] text-gray-400 font-semibold">PETclub</div><div className="text-orange-400 font-extrabold text-xs mt-0.5">${bRevUSD.platform.toLocaleString("en-US",{maximumFractionDigits:0})}</div></div>
                      <div><div className="text-[10px] text-gray-400 font-semibold">Providers</div><div className="text-emerald-400 font-extrabold text-xs mt-0.5">${bRevUSD.provider.toLocaleString("en-US",{maximumFractionDigits:0})}</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {filtered.length === 0 ? <EmptyState icon="📅" title="No bookings match" desc="Try adjusting your search or filters."/> : (
              <div className="space-y-3">
                {filtered.map((b,i) => {
                  const assignBadge = {
                    confirmed:"✅ Confirmed", searching:"🔍 Searching", offered:"📤 Offered",
                    no_pros_available:"⚠️ No Pros", cancelled:"❌ Cancelled"
                  }[b.assignment_status] || b.assignment_status;
                  const custName = b.users?.name || b.users?.phone || null;
                  return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{({Groomer:"✂️",Trainer:"🐕‍🦺",Vet:"🏥",Walker:"🦮",Boarding:"🏠"})[b.service_type] || "🐕"}</span>
                          <div className="font-bold text-sm text-gray-800 truncate">{b.service_name || b.service_type || "Service"}</div>
                        </div>
                        {custName && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-0.5">
                            <span>👤</span><span>{custName}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">{b.scheduled_at ? `${fmtDate(b.scheduled_at)} · ${fmtTime(b.scheduled_at)}` : "—"}</div>
                        {b.assignment_status && (
                          <div className="text-xs text-gray-500 mt-0.5">{assignBadge}</div>
                        )}
                      </div>
                      <Bdg text={b.status} cls={sColor(b.status)}/>
                    </div>
                    {/* Financial breakdown — only visible to admin */}
                    {(b.total_amount || b.amount) && (() => {
                      const isGroomer   = b.service_type === "Groomer";
                      const totalPaid   = parseFloat(b.total_amount || b.amount || 0);
                      const offerAmt    = parseFloat(b.petclub_offer_amount || 0);
                      const splitBase   = offerAmt > 0 ? Math.max(0, totalPaid - offerAmt) : totalPaid;
                      // Derive % labels from actual stored values where possible
                      const provEarned  = parseFloat(b.provider_earnings || (splitBase * (isGroomer ? 0.70 : 0.45)));
                      const platFee     = parseFloat(b.platform_fee     || (splitBase * (isGroomer ? 0.30 : 0.55)));
                      const provPct     = splitBase > 0 ? Math.round((provEarned / splitBase) * 100) : (isGroomer ? 70 : 45);
                      const platPct     = splitBase > 0 ? Math.round((platFee    / splitBase) * 100) : (isGroomer ? 30 : 55);
                      return (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        {/* Offer deduction row — only shown when a PETclub offer was applied */}
                        {offerAmt > 0 && (
                          <div className="flex items-center justify-between text-[10px] mb-2 bg-amber-50 rounded-lg px-2.5 py-1.5">
                            <span className="text-amber-600 font-semibold">Customer Paid</span>
                            <span className="font-bold text-amber-700">{currencySymbol}{totalPaid.toFixed(2)}</span>
                            <span className="text-amber-500">− PETclub Offer</span>
                            <span className="font-bold text-amber-700">−{currencySymbol}{offerAmt.toFixed(2)}</span>
                            <span className="text-amber-600 font-semibold">Net</span>
                            <span className="font-extrabold text-amber-800">{currencySymbol}{splitBase.toFixed(2)}</span>
                          </div>
                        )}
                        <div className={`grid gap-2 text-center ${offerAmt > 0 ? "grid-cols-2" : "grid-cols-3"}`}>
                          {offerAmt === 0 && (
                            <div className="bg-blue-50 rounded-lg p-1.5">
                              <div className="text-[10px] text-blue-500 font-semibold">Customer Paid</div>
                              <div className="text-xs font-extrabold text-blue-700">{currencySymbol}{totalPaid.toFixed(2)}</div>
                            </div>
                          )}
                          <div className="bg-emerald-50 rounded-lg p-1.5">
                            <div className="text-[10px] text-emerald-500 font-semibold">Provider ({provPct}%)</div>
                            <div className="text-xs font-extrabold text-emerald-700">{currencySymbol}{provEarned.toFixed(2)}</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-1.5">
                            <div className="text-[10px] text-orange-500 font-semibold">PETclub ({platPct}%)</div>
                            <div className="text-xs font-extrabold text-orange-700">{currencySymbol}{platFee.toFixed(2)}</div>
                          </div>
                        </div>
                        {b.gateway_fee && (
                          <div className="text-[10px] text-gray-400 mt-1 text-right">
                            Gateway fee: −{currencySymbol}{parseFloat(b.gateway_fee).toFixed(2)} · Net platform: {currencySymbol}{(platFee - parseFloat(b.gateway_fee || 0)).toFixed(2)}
                          </div>
                        )}
                      </div>
                      );
                    })()}

                    {/* ── Manual assign button — shown when no pro found yet ── */}
                    {["no_pros_available","searching",""].includes(b.assignment_status || "") && b.status !== "cancelled" && (
                      <button
                        onClick={() => openAssignModal(b)}
                        className="mt-3 w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                        <span>👤</span> Assign Provider
                      </button>
                    )}
                    {/* ── Admin cancel button ── */}
                    {b.status !== "cancelled" && b.status !== "completed" && (
                      <button
                        onClick={async () => {
                          const reason = window.prompt("Reason for cancellation (shown to customer):");
                          if (reason === null) return; // user dismissed
                          try {
                            await api.cancelBooking(b.id, reason);
                            setBookings(prev => prev.map(bk => bk.id === b.id
                              ? { ...bk, status: "cancelled", assignment_status: "cancelled" } : bk));
                            showToast("Booking cancelled.", "success");
                          } catch (e) { showToast(e.message || "Cancel failed", "error"); }
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                        ✕ Cancel Booking
                      </button>
                    )}
                    {b.status === "cancelled" && b.refund_amount != null && (
                      <div className="mt-2 bg-red-50 rounded-xl px-3 py-2.5 space-y-1.5">
                        <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-3">
                          <span>By: <strong>{b.cancelled_by || "—"}</strong></span>
                          <span>Fee: <strong>{currencySymbol}{parseFloat(b.cancellation_fee||0).toFixed(2)}</strong></span>
                          <span>Refund: <strong className="text-emerald-700">{currencySymbol}{parseFloat(b.refund_amount||0).toFixed(2)}</strong></span>
                          <span className={`font-bold ${b.refund_status === 'processed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {b.refund_status === 'processed' ? '✓ Refund Processed' : b.refund_status === 'not_applicable' ? 'No Refund' : '⏳ Refund Pending'}
                          </span>
                        </div>
                        {b.refund_amount > 0 && b.refund_status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                await api.adminSetRefundStatus(b.id, 'processed');
                                setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, refund_status: 'processed' } : bk));
                                showToast("Refund marked as processed — customer notified.", "success");
                              } catch (e) { showToast(e.message || "Failed", "error"); }
                            }}
                            className="w-full text-xs font-bold text-emerald-700 border border-emerald-200 bg-white rounded-lg py-1.5 hover:bg-emerald-50 transition">
                            ✓ Mark Refund as Processed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {/* ── 🗺️ LIVE TRIPS OVERVIEW ── */}
        {view === "live" && (() => {
          const liveTrips = bookings.filter(b => ["on_the_way","in_progress"].includes(b.assignment_status));
          return (
            <div className="max-w-2xl mx-auto px-5 py-6">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-extrabold text-gray-800">🗺️ Live Trips</h1>
                <div className="flex items-center gap-2">
                  {liveTrips.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"/>
                      <span className="text-xs font-bold text-emerald-700">{liveTrips.length} active</span>
                    </div>
                  )}
                  <button
                    onClick={() => api.getBookings().then(r => setBookings(r.bookings || [])).catch(() => {})}
                    className="text-xs bg-orange-50 border border-orange-200 text-orange-600 font-bold px-3 py-1.5 rounded-full hover:bg-orange-100 transition">
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-5 text-xs text-blue-700 font-medium">
                📡 Auto-refreshes every 15 seconds · GPS updated every 15s by professional's device
              </div>

              {liveTrips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="text-5xl mb-4">🗺️</div>
                  <div className="font-bold text-gray-700 text-lg mb-1">No active trips</div>
                  <div className="text-sm text-gray-400">Trips appear here when a professional clicks "On My Way".</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveTrips.map(b => {
                    const hasPro = b.pro_lat && b.pro_lng;
                    const hasCust = b.address_lat && b.address_lng;
                    const proUpdated = b.pro_location_updated_at
                      ? new Date(b.pro_location_updated_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
                      : null;
                    const statusColor = b.assignment_status === "in_progress" ? "bg-emerald-500" : "bg-orange-500";
                    const custName = b.users?.name || "Customer";
                    const petName = b.pets?.name || "";
                    return (
                      <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse inline-block`}/>
                            <span className="text-white font-bold text-sm">{b.service_name || b.service_type || "Service"}</span>
                            {petName && <span className="text-gray-400 text-xs">· 🐾 {petName}</span>}
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${b.assignment_status === "in_progress" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-orange-500/20 text-orange-300 border border-orange-500/30"}`}>
                            {b.assignment_status === "in_progress" ? "🔧 In Progress" : "🚗 On The Way"}
                          </span>
                        </div>

                        <div className="p-5">
                          {/* Customer info */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base shrink-0">👤</div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{custName}</div>
                              <div className="text-xs text-gray-400">{b.users?.phone || "—"}</div>
                            </div>
                          </div>

                          {/* GPS info grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`rounded-xl p-3 border ${hasPro ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="text-xs font-semibold text-gray-500 mb-1">🚗 Professional GPS</div>
                              {hasPro ? (
                                <>
                                  <div className="text-xs font-bold text-emerald-700 font-mono">{b.pro_lat?.toFixed(5)}, {b.pro_lng?.toFixed(5)}</div>
                                  {proUpdated && <div className="text-xs text-gray-400 mt-1">Updated {proUpdated}</div>}
                                </>
                              ) : (
                                <div className="text-xs text-gray-400">Awaiting GPS…</div>
                              )}
                            </div>
                            <div className={`rounded-xl p-3 border ${hasCust ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                              <div className="text-xs font-semibold text-gray-500 mb-1">📍 Customer Location</div>
                              {hasCust ? (
                                <div className="text-xs font-bold text-blue-700 font-mono">{b.address_lat?.toFixed(5)}, {b.address_lng?.toFixed(5)}</div>
                              ) : (
                                <div className="text-xs text-gray-400">{b.city || b.address || "—"}</div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {hasPro && (
                              <a
                                href={`https://www.google.com/maps?q=${b.pro_lat},${b.pro_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-100 transition">
                                🗺️ Track Pro
                              </a>
                            )}
                            {hasCust && (
                              <a
                                href={`https://www.google.com/maps?q=${b.address_lat},${b.address_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2.5 rounded-xl hover:bg-blue-100 transition">
                                📍 Customer
                              </a>
                            )}
                            {hasPro && hasCust && (
                              <a
                                href={`https://www.google.com/maps/dir/${b.pro_lat},${b.pro_lng}/${b.address_lat},${b.address_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold py-2.5 rounded-xl hover:bg-orange-100 transition">
                                🧭 Route
                              </a>
                            )}
                          </div>

                          {/* Appointment details */}
                          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                            {b.scheduled_at && <span>📅 {fmtDate(b.scheduled_at)} {fmtTime(b.scheduled_at)}</span>}
                            {(b.total_amount || b.amount) && <span>{currencySymbol}{parseFloat(b.total_amount || b.amount || 0).toFixed(2)}</span>}
                            {b.ten_min_notified && <span className="text-amber-600 font-semibold">⏱ 10-min alert sent</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ 📈 REPORTS ═══════════════════════════════════════════════════ */}
        {view === "reports" && (
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-gray-800">📈 Revenue Report</h1>
                <p className="text-sm text-gray-400 mt-0.5">Earnings by professional — platform vs provider split</p>
              </div>
            </div>

            {/* Date range picker */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Date Range</h2>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">From</label>
                  <input type="date" value={revenueFrom} onChange={e => setRevenueFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"/>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">To</label>
                  <input type="date" value={revenueTo} onChange={e => setRevenueTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"/>
                </div>
                <div className="flex items-end">
                  <button disabled={revenueLoading}
                    onClick={async () => {
                      setRevenueLoading(true);
                      try { const r = await api.revenueReport(revenueFrom, revenueTo); setRevenueData(r); }
                      catch (e) { showToast("❌ " + e.message, "error"); }
                      finally { setRevenueLoading(false); }
                    }}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 disabled:opacity-60 transition flex items-center gap-2">
                    {revenueLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Loading…</> : "Run Report"}
                  </button>
                </div>
              </div>
              {/* Quick range presets */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { l:"This Month",   fn: () => { const d = new Date(); d.setDate(1); setRevenueFrom(d.toISOString().slice(0,10)); setRevenueTo(new Date().toISOString().slice(0,10)); } },
                  { l:"Last 7 Days",  fn: () => { const d = new Date(); d.setDate(d.getDate()-7); setRevenueFrom(d.toISOString().slice(0,10)); setRevenueTo(new Date().toISOString().slice(0,10)); } },
                  { l:"Last 30 Days", fn: () => { const d = new Date(); d.setDate(d.getDate()-30); setRevenueFrom(d.toISOString().slice(0,10)); setRevenueTo(new Date().toISOString().slice(0,10)); } },
                  { l:"All Time",     fn: () => { setRevenueFrom("2024-01-01"); setRevenueTo(new Date().toISOString().slice(0,10)); } },
                ].map(p => (
                  <button key={p.l} onClick={p.fn}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition">
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            {!revenueData && !revenueLoading && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">📈</div>
                <p className="font-semibold text-gray-500">Select a date range and run the report</p>
              </div>
            )}

            {revenueData && (() => {
              const rows     = revenueData.rows || revenueData.report || [];
              const summary  = revenueData.summary || {};
              const gross    = summary.total_gross    ?? rows.reduce((s,r) => s + parseFloat(r.gross_revenue || r.total_revenue || r.total || 0), 0);
              const platform = summary.platform_total ?? rows.reduce((s,r) => s + parseFloat(r.platform_fee || 0), 0);
              const provider = summary.provider_total ?? rows.reduce((s,r) => s + parseFloat(r.provider_earnings || 0), 0);
              return (
                <>
                  {/* Summary banner — server-aggregated, mixed INR+USD */}
                  <div className="bg-gray-900 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Gross Revenue</div><div className="text-white text-xl font-extrabold">₹{parseFloat(gross).toLocaleString()}</div></div>
                    <div><div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">PETclub Net</div><div className="text-orange-400 text-xl font-extrabold">₹{parseFloat(platform).toLocaleString()}</div></div>
                    <div><div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Providers</div><div className="text-emerald-400 text-xl font-extrabold">₹{parseFloat(provider).toLocaleString()}</div></div>
                  </div>
                  <div className="text-[10px] text-gray-400 text-center mt-1">⚠️ Report totals are server-aggregated — INR and USD amounts are summed together. Use the Bookings tab for per-currency breakdown.</div>

                  {/* Per-professional breakdown */}
                  {rows.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-700 text-sm">By Professional</h2>
                        <span className="text-xs text-gray-400">{rows.length} professionals</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {rows.map((r, i) => {
                          const rowGross = parseFloat(r.gross_revenue || r.total_revenue || r.total || 0);
                          const rowPro   = parseFloat(r.provider_earnings || rowGross * 0.45 || 0);
                          const rowPlat  = parseFloat(r.platform_fee || rowGross * 0.55 || 0);
                          return (
                            <div key={i} className="px-5 py-3.5">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">
                                  {({Groomer:"✂️",Trainer:"🐕‍🦺",Vet:"🏥",Walker:"🦮",Boarding:"🏠"})[r.sub_role] || "🧑‍💼"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-800 truncate">{r.name || r.professional_name || "—"}</div>
                                  <div className="text-xs text-gray-400">{r.sub_role || "—"} · {r.bookings_count ?? r.total_bookings ?? r.count ?? 0} bookings</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-sm font-extrabold text-gray-800">₹{rowGross.toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">gross (mixed)</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 rounded-lg px-3 py-1.5 flex items-center justify-between">
                                  <span className="text-xs text-emerald-600 font-medium">Provider gets</span>
                                  <span className="text-xs font-extrabold text-emerald-700">₹{rowPro.toLocaleString()}</span>
                                </div>
                                <div className="bg-orange-50 rounded-lg px-3 py-1.5 flex items-center justify-between">
                                  <span className="text-xs text-orange-500 font-medium">Platform gets</span>
                                  <span className="text-xs font-extrabold text-orange-600">₹{rowPlat.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="font-semibold text-gray-500">No completed bookings in this range</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ══ 🎁 LOYALTY ════════════════════════════════════════════════════ */}
        {view === "loyalty" && (() => {
          // Customers filtered by the search query in this panel (separate from the users-tab search)
          const loyaltyCustomers = users.filter(u =>
            u.role === "customer" &&
            loyaltySearch.length >= 2 &&
            (u.name?.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
             u.phone?.includes(loyaltySearch))
          ).slice(0, 6);

          const pts        = parseInt(loyaltyPoints, 10);
          const isAward    = pts > 0;
          const isDeduct   = pts < 0;
          const currentBal = loyaltyTarget?.loyalty_points ?? 0;
          const newBal     = isNaN(pts) ? currentBal : currentBal + pts;
          const canSubmit  = loyaltyTarget && !isNaN(pts) && pts !== 0 && loyaltyDesc.trim().length >= 3;

          const submitAward = async () => {
            if (!canSubmit) return;
            setLoyaltySubmitting(true);
            try {
              const r = await api.adminAwardLoyalty(loyaltyTarget.id, pts, loyaltyDesc.trim());
              // Reflect new balance in the users list immediately
              setUsers(prev => prev.map(u =>
                u.id === loyaltyTarget.id
                  ? { ...u, loyalty_points: r.newBalance ?? newBal }
                  : u
              ));
              setLoyaltyTarget(prev => prev ? { ...prev, loyalty_points: r.newBalance ?? newBal } : prev);
              showToast(`✅ ${isAward ? "Awarded" : "Deducted"} ${Math.abs(pts)} pts — new balance: ${r.newBalance ?? newBal}`);
              setLoyaltyPoints("");
              setLoyaltyDesc("");
            } catch (e) {
              showToast("❌ " + (e.message || "Failed to update points"), "error");
            }
            setLoyaltySubmitting(false);
          };

          return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
              <div>
                <h1 className="text-xl font-extrabold text-gray-800">🎁 Loyalty Points</h1>
                <p className="text-sm text-gray-400 mt-0.5">Award credits, fix errors, or issue goodwill adjustments</p>
              </div>

              {/* ── Award / Adjust card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Award or Adjust Points</h2>

                {/* Customer search */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search customer</label>
                  <input
                    value={loyaltySearch}
                    onChange={e => { setLoyaltySearch(e.target.value); if (loyaltyTarget) setLoyaltyTarget(null); }}
                    placeholder="Name or phone number…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition"
                  />
                  {/* Dropdown results */}
                  {loyaltySearch.length >= 2 && !loyaltyTarget && (
                    <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
                      {loyaltyCustomers.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-400">No matching customers found</div>
                      ) : loyaltyCustomers.map(u => (
                        <button key={u.id}
                          onClick={() => { setLoyaltyTarget(u); setLoyaltySearch(u.name || u.phone || ""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 text-left">
                          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-gray-800 truncate">{u.name || "—"}</div>
                            <div className="text-xs text-gray-400">{u.phone}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-orange-600">{(u.loyalty_points ?? 0).toLocaleString()} pts</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected user card */}
                {loyaltyTarget && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center text-lg font-bold text-orange-600 shrink-0">
                      {(loyaltyTarget.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800">{loyaltyTarget.name || "—"}</div>
                      <div className="text-xs text-gray-500">{loyaltyTarget.phone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gray-500 font-medium">Current balance</div>
                      <div className="text-xl font-extrabold text-orange-600">{currentBal.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">credits</div>
                    </div>
                    <button onClick={() => { setLoyaltyTarget(null); setLoyaltySearch(""); setLoyaltyPoints(""); setLoyaltyDesc(""); }}
                      className="ml-1 text-gray-400 hover:text-red-400 text-lg leading-none shrink-0">✕</button>
                  </div>
                )}

                {/* Points + description — only show once a user is selected */}
                {loyaltyTarget && (
                  <>
                    {/* Points input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Points to add / deduct
                        <span className="ml-2 font-normal text-gray-400">(positive = award, negative = deduct)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Quick preset buttons */}
                        {[50, 100, 200, -50, -100].map(v => (
                          <button key={v} type="button"
                            onClick={() => setLoyaltyPoints(String(v))}
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                              parseInt(loyaltyPoints) === v
                                ? v > 0 ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                                : v > 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                            }`}>
                            {v > 0 ? `+${v}` : v}
                          </button>
                        ))}
                        <input
                          type="number"
                          value={loyaltyPoints}
                          onChange={e => setLoyaltyPoints(e.target.value)}
                          placeholder="Custom…"
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reason / description</label>
                      <input
                        value={loyaltyDesc}
                        onChange={e => setLoyaltyDesc(e.target.value)}
                        placeholder="e.g. Goodwill for delayed appointment, Correction for missed webhook…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                      />
                    </div>

                    {/* Balance preview */}
                    {!isNaN(pts) && pts !== 0 && (
                      <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
                        isAward ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                      }`}>
                        <span className="text-2xl">{isAward ? "🎉" : "📉"}</span>
                        <div className="flex-1">
                          <div className={`font-bold text-sm ${isAward ? "text-emerald-700" : "text-red-600"}`}>
                            {isAward ? "Award" : "Deduct"} {Math.abs(pts)} credits
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Balance: <strong>{currentBal.toLocaleString()}</strong>
                            <span className="mx-1.5 text-gray-300">→</span>
                            <strong className={isAward ? "text-emerald-700" : "text-red-600"}>{Math.max(0, newBal).toLocaleString()}</strong>
                            {newBal < 0 && <span className="ml-1 text-xs text-red-500">(capped at 0)</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      onClick={submitAward}
                      disabled={!canSubmit || loyaltySubmitting}
                      className={`w-full py-3.5 font-bold rounded-2xl text-white text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDeduct ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                      }`}>
                      {loyaltySubmitting
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</>
                        : isDeduct
                          ? `📉 Deduct ${Math.abs(pts)} Points`
                          : `🎁 Award ${pts || 0} Points`}
                    </button>
                    {!canSubmit && loyaltyTarget && loyaltyDesc.trim().length > 0 && loyaltyDesc.trim().length < 3 && (
                      <p className="text-xs text-red-500 -mt-2">Please write a reason (at least 3 characters).</p>
                    )}
                  </>
                )}
              </div>

              {/* ── Programme stats ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Programme Health · Last 30 Days</h2>
                  <button
                    onClick={() => {
                      setLoyaltyStats(null);
                      setLoyaltyStatsLoading(true);
                      api.loyaltyStats(30).then(r => setLoyaltyStats(r)).catch(() => {}).finally(() => setLoyaltyStatsLoading(false));
                    }}
                    className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition">
                    🔄 Refresh
                  </button>
                </div>

                {loyaltyStatsLoading && (
                  <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
                    <span className="w-5 h-5 border-2 border-gray-200 border-t-orange-400 rounded-full animate-spin"/>
                    Loading stats…
                  </div>
                )}

                {!loyaltyStatsLoading && !loyaltyStats && (
                  <div className="text-center py-8 text-gray-400 text-sm">Stats failed to load. Click Refresh to try again.</div>
                )}

                {loyaltyStats && (() => {
                  const s = loyaltyStats;
                  const statCards = [
                    { icon:"💰", label:"Points Earned (30d)",   value:(s.total_earned ?? 0).toLocaleString(),        color:"text-emerald-700", bg:"bg-emerald-50", border:"border-emerald-100" },
                    { icon:"🎫", label:"Coupons Redeemed (30d)", value:(s.total_redeemed ?? 0).toLocaleString(),      color:"text-orange-700",  bg:"bg-orange-50",  border:"border-orange-100" },
                    { icon:"🏦", label:"Active Coupons",         value:(s.active_coupons ?? 0).toLocaleString(),      color:"text-blue-700",    bg:"bg-blue-50",    border:"border-blue-100" },
                    { icon:"👤", label:"Active Members",          value:(s.eligible_to_redeem ?? 0).toLocaleString(), color:"text-violet-700",  bg:"bg-violet-50",  border:"border-violet-100" },
                  ];
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {statCards.map(c => (
                          <div key={c.label} className={`rounded-xl p-3.5 border ${c.bg} ${c.border}`}>
                            <div className="text-lg mb-1">{c.icon}</div>
                            <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5">{c.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Top earners leaderboard */}
                      {Array.isArray(s.top_earners) && s.top_earners.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🏆 Top Earners</div>
                          <div className="space-y-1.5">
                            {s.top_earners.slice(0, 5).map((e, i) => (
                              <div key={e.user_id || i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                                <span className="text-sm font-extrabold text-gray-400 w-5 text-center shrink-0">
                                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-800 truncate">{e.name || "—"}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-orange-600">{(e.current_balance ?? 0).toLocaleString()} pts</div>
                                  <div className="text-[10px] text-gray-400">{(e.total_earned ?? 0).toLocaleString()} earned</div>
                                </div>
                                <button
                                  onClick={() => {
                                    const fullUser = users.find(u => u.id === e.user_id);
                                    if (fullUser) {
                                      setLoyaltyTarget({ ...fullUser, loyalty_points: e.current_balance ?? fullUser.loyalty_points });
                                      setLoyaltySearch(fullUser.name || fullUser.phone || "");
                                      setLoyaltyPoints("");
                                      setLoyaltyDesc("");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }
                                  }}
                                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 transition shrink-0">
                                  ➕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Anomaly alerts */}
                      {Array.isArray(s.anomalies) && s.anomalies.length > 0 && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🚨</span>
                            <span className="font-bold text-red-700 text-sm">Anomaly Alerts ({s.anomalies.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {s.anomalies.map((a, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-red-700 bg-white rounded-lg px-3 py-2 border border-red-100">
                                <span className="font-medium truncate mr-2">{a.name || a.user_id}</span>
                                <span className="font-bold shrink-0">{(a.earned_24h ?? 0).toLocaleString()} pts in 24h</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-red-500 mt-2">Review these accounts in the Users tab.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* ══ 🗄️ DB HEALTH ══════════════════════════════════════════════════ */}
        {view === "dbhealth" && (
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-xl font-extrabold text-gray-800">🗄️ DB Health</h1>
              <button
                onClick={async () => {
                  setDbAuditLoading(true);
                  try { const r = await api.dbAudit(); setDbAudit(r.audit); }
                  catch (e) { showToast("❌ " + e.message, "error"); }
                  finally { setDbAuditLoading(false); }
                }}
                disabled={dbAuditLoading}
                className="text-sm font-bold px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-60 transition flex items-center gap-2">
                {dbAuditLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Scanning…</> : "🔍 Run Audit"}
              </button>
            </div>

            {!dbAudit && !dbAuditLoading && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🗄️</div>
                <p className="font-semibold text-gray-500">Click "Run Audit" to scan all tables</p>
                <p className="text-xs mt-1">Checks for orphaned rows, stale records, and expired tokens</p>
              </div>
            )}

            {dbAudit && (() => {
              const a = dbAudit;
              const issues = [];
              if (a.users?.suspended > 0)              issues.push({ key: "purge_suspended",     label: `${a.users.suspended} suspended account${a.users.suspended !== 1 ? "s" : ""} — resolve via Purge All Suspended in Users tab`, severity: "red" });
              // Only stale (>7d) incomplete signups are an issue — recent pending
              // signups are normal (user may still finish) and aren't cleanable.
              if ((a.stale_pending_users?.count || 0) > 0) issues.push({ key: "stale_pending_users", label: `${a.stale_pending_users.count} incomplete signup${a.stale_pending_users.count !== 1 ? "s" : ""} (>7 days old)`, severity: "amber" });
              if (a.orphans?.professional_profiles > 0) issues.push({ key: "orphan_profiles",     label: `${a.orphans.professional_profiles} orphaned professional profiles`, severity: "red" });
              if (a.orphans?.customer_profiles > 0)    issues.push({ key: "orphan_profiles",     label: `${a.orphans.customer_profiles} orphaned customer profiles`, severity: "red" });
              if (a.orphans?.pets > 0)                  issues.push({ key: "orphan_profiles",     label: `${a.orphans.pets} orphaned pet records`, severity: "red" });
              if (a.otp_tokens?.expired > 0)            issues.push({ key: "expired_otps",        label: `${a.otp_tokens.expired} expired OTP tokens`, severity: "amber" });
              if (a.bookings?.cancelled > 0)            issues.push({ key: "cancelled_bookings",  label: `${a.bookings.cancelled} cancelled bookings`, severity: "amber" });
              if (a.bookings?.stale_upcoming > 0)       issues.push({ key: "stale_upcoming",      label: `${a.bookings.stale_upcoming} stale upcoming bookings (>30d)`, severity: "amber" });
              if (a.bookings?.no_pros_available > 0)    issues.push({ key: "no_pros_available",   label: `${a.bookings.no_pros_available} bookings stuck with no pro found`, severity: "amber" });
              if (a.website_leads?.older_than_30d > 0)  issues.push({ key: "stale_leads",         label: `${a.website_leads.older_than_30d} website leads older than 30 days`, severity: "amber" });
              // purge_suspended is deliberately excluded from bulk auto-clean — permanently
              // deleting user accounts is destructive and already has its own confirm-modal
              // gated flow (the "Purge All Suspended" button in the Users tab).
              const cleanTargets = [...new Set(issues.filter(i => i.severity !== "green" && i.key !== "purge_suspended").map(i => i.key))];

              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:"Total Users",      value: a.users?.total,       icon:"👥" },
                      { label:"Active",            value: a.users?.active,      icon:"✅" },
                      { label:"Suspended",         value: a.users?.suspended,   icon:"⏸", warn: a.users?.suspended > 0 },
                      { label:"Pending Signup",    value: a.users?.pending_role,icon:"⏳", warn: (a.stale_pending_users?.count || 0) > 0 },
                      { label:"Professionals",     value: a.professionals?.total,       icon:"🧑‍💼" },
                      { label:"Pending Verify",    value: a.professionals?.pending_verification, icon:"🔍", warn: a.professionals?.pending_verification > 0 },
                      { label:"Total Bookings",    value: a.bookings?.total,    icon:"📅" },
                      { label:"Cancelled",         value: a.bookings?.cancelled,icon:"❌", warn: a.bookings?.cancelled > 0 },
                      { label:"Orphaned Records",  value: (a.orphans?.professional_profiles||0)+(a.orphans?.customer_profiles||0)+(a.orphans?.pets||0), icon:"🔗", warn: (a.orphans?.professional_profiles||0)+(a.orphans?.customer_profiles||0)+(a.orphans?.pets||0) > 0 },
                      { label:"Expired OTPs",      value: a.otp_tokens?.expired,icon:"🔑", warn: a.otp_tokens?.expired > 0 },
                      { label:"Website Leads",     value: a.website_leads?.total,       icon:"📬" },
                      { label:"Payment Logs",      value: a.payment_logs?.total,icon:"💳" },
                    ].map(c => (
                      <div key={c.label} className={`rounded-2xl p-4 border ${c.warn ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
                        <div className="text-xs text-gray-500 font-medium">{c.icon} {c.label}</div>
                        <div className={`text-2xl font-extrabold mt-1 ${c.warn ? "text-red-600" : "text-gray-800"}`}>{c.value ?? "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Issues */}
                  {issues.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-bold text-emerald-700">Database is clean</p>
                      <p className="text-xs text-emerald-600 mt-1">No stale or orphaned data found.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
                      <div className="px-4 py-3 font-bold text-gray-700 text-sm flex items-center gap-2">
                        ⚠️ Issues Found ({issues.length})
                      </div>
                      {issues.map((iss, i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${iss.severity === "red" ? "bg-red-500" : "bg-amber-400"}`}/>
                          <span className="text-sm text-gray-700 flex-1">{iss.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cleanup button */}
                  {cleanTargets.length > 0 && (
                    <button
                      onClick={async () => {
                        setDbCleanLoading(true);
                        try {
                          const r = await api.dbCleanup(cleanTargets);
                          const total = Object.values(r.cleaned).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
                          showToast(`🧹 Cleaned ${total} stale record${total !== 1 ? 's' : ''}.`);
                          // Re-run audit to reflect new state
                          const fresh = await api.dbAudit();
                          setDbAudit(fresh.audit);
                          // Also refresh users list
                          const usersRes = await api.getAdminUsers().catch(() => null);
                          if (usersRes?.users) setUsers(usersRes.users);
                        } catch (e) { showToast("❌ " + e.message, "error"); }
                        finally { setDbCleanLoading(false); }
                      }}
                      disabled={dbCleanLoading}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                      {dbCleanLoading
                        ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Cleaning…</>
                        : `🧹 Clean Up All Issues (${cleanTargets.length} ${cleanTargets.length !== 1 ? 'categories' : 'category'})`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {view === "payouts" && (() => {
          return (
            <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl font-extrabold text-gray-800">💸 Payout Requests</h1>
                <button onClick={async () => {
                  try { const r = await api.adminGetPayouts(); setPayouts(r.payouts || []); }
                  catch (e) { showToast("❌ " + e.message, "error"); }
                }} className="text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition">
                  🔄 Refresh
                </button>
              </div>
              {payouts.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">No payout requests yet.</div>
              ) : payouts.map(p => {
                const pro = p.professional_profiles;
                const user = pro?.users;
                const hasPending = p.pending_inr > 0 || p.pending_usd > 0;
                return (
                  <div key={p.prof_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-gray-800 text-base">{user?.name || "—"}</div>
                        <div className="text-xs text-gray-400">{pro?.sub_role} · {user?.phone} · {user?.email}</div>
                      </div>
                      <div className="text-right">
                        {p.pending_inr > 0 && <div className="text-lg font-extrabold text-emerald-600">₹{p.pending_inr.toFixed(2)}</div>}
                        {p.pending_usd > 0 && <div className="text-lg font-extrabold text-blue-600">${p.pending_usd.toFixed(2)}</div>}
                        {!hasPending && <div className="text-xs text-gray-400">No pending earnings</div>}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                      {p.payment_type === "upi" ? (
                        <div><span className="font-semibold text-gray-600">UPI ID:</span> <span className="font-mono text-gray-800">{p.upi_id || "—"}</span></div>
                      ) : (
                        <>
                          <div><span className="font-semibold text-gray-600">Bank:</span> {p.bank_name || "—"}</div>
                          <div><span className="font-semibold text-gray-600">Account:</span> <span className="font-mono">{p.account_number || "—"}</span></div>
                          <div><span className="font-semibold text-gray-600">Holder:</span> {p.account_holder || "—"}</div>
                          <div><span className="font-semibold text-gray-600">IFSC:</span> <span className="font-mono">{p.ifsc_code || "—"}</span></div>
                        </>
                      )}
                    </div>
                    {hasPending && (
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Mark all pending earnings for ${user?.name} as paid?`)) return;
                          try {
                            await api.adminMarkPaid(p.prof_id);
                            showToast("✅ Marked as paid");
                            const r = await api.adminGetPayouts();
                            setPayouts(r.payouts || []);
                          } catch (e) { showToast("❌ " + e.message, "error"); }
                        }}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition">
                        ✅ Mark Paid — Transfer {p.pending_inr > 0 ? `₹${p.pending_inr.toFixed(2)}` : `$${p.pending_usd.toFixed(2)}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40 shadow-nav nav-safe">
        <div className="flex">
          {[
            { id:"overview",  icon:"📊", label:"Overview" },
            { id:"verify",    icon:"🔍", label:"Verify",  badge: NAV.find(n=>n.id==="verify")?.badge || 0 },
            { id:"users",     icon:"👥", label:"Users" },
            { id:"bookings",  icon:"📅", label:"Bookings" },
          ].map(n => (
            <button key={n.id} onClick={() => { setView(n.id); setMobileMenuOpen(false); }}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors relative ${view === n.id ? "text-orange-500" : "text-gray-400"}`}>
              {view === n.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full"/>}
              <span className="text-xl mb-0.5 relative">
                {n.icon}
                {n.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{n.badge}</span>}
              </span>
              {n.label}
            </button>
          ))}
          {/* More — opens the full nav dropdown; badge shows if secondary views have alerts */}
          {(() => {
            const moreBadge = NAV.filter(n => !["overview","verify","users","bookings"].includes(n.id))
              .reduce((s, n) => s + (n.badge || 0), 0);
            const moreActive = !["overview","verify","users","bookings"].includes(view);
            return (
              <button onClick={() => setMobileMenuOpen(o => !o)}
                className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors relative ${moreActive || mobileMenuOpen ? "text-orange-500" : "text-gray-400"}`}>
                {(moreActive || mobileMenuOpen) && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-500 rounded-full"/>}
                <span className="text-xl mb-0.5 relative">
                  {mobileMenuOpen ? "✕" : "⋯"}
                  {moreBadge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{moreBadge}</span>}
                </span>
                More
              </button>
            );
          })()}
        </div>
      </nav>

      {/* ══ GLOBAL CONFIRM MODAL ══════════════════════════════════════════════
          Used for Suspend, Delete, Bulk Suspend, and Bulk Delete.
          Rendered at the root level so it overlays all views correctly.     */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
          onClick={() => !confirmLoading && setConfirmModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 ${
              confirmModal.action.includes("delete") ? "bg-red-100" : "bg-amber-100"
            }`}>
              {confirmModal.action.includes("delete") ? "🗑️" : "⏸"}
            </div>

            {/* Title */}
            <h3 className="text-lg font-extrabold text-gray-900 text-center mb-2">
              {confirmModal.action === "suspend"             && "Suspend User?"}
              {confirmModal.action === "delete"              && "Delete User?"}
              {confirmModal.action === "bulk_suspend"        && `Suspend ${confirmModal.count} Users?`}
              {confirmModal.action === "bulk_delete"         && `Delete ${confirmModal.count} Users?`}
              {confirmModal.action === "purge_all_suspended" && `Purge All ${confirmModal.count} Suspended Accounts?`}
            </h3>

            {/* Body */}
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              {confirmModal.action === "purge_all_suspended" && (
                <>Permanently delete all <strong className="text-gray-800">{confirmModal.count} suspended account{confirmModal.count !== 1 ? "s" : ""}</strong>?
                  All their data, profiles, and logs will be removed. This cannot be undone.</>
              )}
              {confirmModal.action === "suspend" && (
                <>Are you sure you want to suspend <strong className="text-gray-800">{confirmModal.userName}</strong>?
                  They will be locked out and permanently deleted after 24 hours if not restored.</>
              )}
              {confirmModal.action === "delete" && (
                <>Permanently delete <strong className="text-gray-800">{confirmModal.userName}</strong>?
                  All data for this account will be removed. This cannot be undone.</>
              )}
              {confirmModal.action === "bulk_suspend" && (
                <>Suspend all <strong className="text-gray-800">{confirmModal.count} selected users</strong>?
                  They will be locked out and scheduled for deletion in 24 hours.</>
              )}
              {confirmModal.action === "bulk_delete" && (
                <>Permanently delete all <strong className="text-gray-800">{confirmModal.count} selected users</strong>?
                  This action cannot be undone.</>
              )}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirm}
                disabled={confirmLoading}
                className={`flex-1 font-bold py-3 rounded-2xl text-sm text-white transition disabled:opacity-60 ${
                  confirmModal.action.includes("delete")
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {confirmLoading
                  ? "Processing…"
                  : confirmModal.action === "purge_all_suspended" ? "🗑️ Purge All"
                  : confirmModal.action.includes("delete") ? "🗑️ Delete" : "⏸ Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ GLOBAL EDIT USER MODAL ═══════════════════════════════════════════
          Moved here from inside the verify view (where it was unreachable).
          The Edit button lives in the users view, so the modal must be global. */}
      {editUserModal && (
        <Modal title={`✏️ Edit User — ${editUserModal.name || editUserModal.id}`} onClose={() => { setEditUserModal(null); setEditUserForm({}); }}>
          <p className="text-xs text-gray-400 mb-4">Correct bad data for this user. Leave a field unchanged to keep the current value.</p>
          <Inp label="Full Name" defaultValue={editUserModal.name || ""} onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white"
              defaultValue={editUserModal.email || ""}
              onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correct@email.com"
              type="email"
            />
            {editUserModal.email && (
              <p className="text-xs text-amber-600 mt-1">
                Current: <strong>{editUserModal.email}</strong>
                {(editUserModal.email.endsWith(".conm") || editUserModal.email.endsWith(".con")) && " ⚠️ Bad TLD"}
              </p>
            )}
          </div>
          <Inp label="Address" defaultValue={editUserModal.address || ""} onChange={e => setEditUserForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="City"    defaultValue={editUserModal.city    || ""} onChange={e => setEditUserForm(f => ({ ...f, city:    e.target.value }))} placeholder="City" />
            <Inp label="Pincode" defaultValue={editUserModal.pincode || ""} onChange={e => setEditUserForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" />
          </div>
          <Inp label="Area / Locality" defaultValue={editUserModal.area || ""} onChange={e => setEditUserForm(f => ({ ...f, area: e.target.value }))} placeholder="Area" />
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setEditUserModal(null); setEditUserForm({}); }}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveEditUser} disabled={editUserSaving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition">
              {editUserSaving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ ASSIGN PROVIDER MODAL ══════════════════════════════════════════════ */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Assign Provider</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {assignModal.service_name || assignModal.service_type} · {assignModal.users?.name || "Customer"} · {fmtDate(assignModal.scheduled_at)}
                </p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  placeholder="Search by name or city…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"/>
              </div>
            </div>

            {/* Pro list */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {assignLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm">Loading providers…</div>
              ) : assignPros.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl mb-2">😔</div>
                  <p className="text-sm font-semibold text-gray-600">No available {assignModal.service_type}s found</p>
                  <p className="text-xs text-gray-400 mt-1">Try approving more providers or check availability settings</p>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {assignPros
                    .filter(p => {
                      const q = assignSearch.trim().toLowerCase();
                      return !q || (p.users?.name || "").toLowerCase().includes(q) || (p.city || "").toLowerCase().includes(q);
                    })
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 hover:bg-orange-50 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{({Groomer:"✂️",Trainer:"🐕‍🦺",Vet:"🏥",Walker:"🦮",Boarding:"🏠"})[p.sub_role] || "👤"}</span>
                            <span className="font-bold text-sm text-gray-800 truncate">{p.users?.name || "—"}</span>
                            {p.rating && <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">⭐ {p.rating}</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 ml-7">{p.sub_role} · {p.city || "—"}{p.area ? `, ${p.area}` : ""}</div>
                          {p.service_areas && <div className="text-[10px] text-gray-400 ml-7 truncate">{p.service_areas}</div>}
                        </div>
                        <button
                          disabled={assignSending === p.id}
                          onClick={() => doAssign(p.id, p.users?.name || p.id)}
                          className="ml-3 shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95">
                          {assignSending === p.id ? "…" : "Assign"}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
