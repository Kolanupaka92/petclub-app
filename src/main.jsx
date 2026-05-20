import { StrictMode, useState, useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import ProApp from "./App.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";
import { clearToken, api } from "./api.js";
import { initPushNotifications } from "./firebase.js";

/* ── Inactivity config ── */
const LOGOUT_AFTER = 8 * 60 * 1000;  // 8 min total inactivity → logout
const WARN_BEFORE  = 60 * 1000;       // show warning 60s before logout (at 7 min)

// Pending approval screen for professionals
function PendingApproval({ session, onLogout, onApproved }) {
  const subRole = session?.subRole || "professional";
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState(null);

  const checkStatus = async () => {
    setChecking(true);
    setMsg(null);
    try {
      const res = await api.getMe();
      const vs = res.user?.verificationStatus || res.user?.professional_profiles?.[0]?.verification_status;
      if (vs === "approved") {
        const updated = { ...session, verificationStatus: "approved", subRole: res.user?.subRole || res.user?.professional_profiles?.[0]?.sub_role || subRole };
        saveSession(updated);
        onApproved(updated);
      } else if (vs === "rejected") {
        setMsg(`❌ Your application was not approved. Please contact ${import.meta.env.VITE_SUPPORT_EMAIL || 'support@mypetclub.app'}`);
      } else {
        setMsg("⏳ Still under review. Check back in a few hours.");
      }
    } catch {
      setMsg("Could not reach server. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Application Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your {subRole} profile is under review by the PETclub team.
          We'll notify you by email &amp; SMS once approved — usually within 24–48 hours.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">📋</span>
            <div>
              <div className="font-bold text-sm text-gray-800">What happens next?</div>
              <div className="text-xs text-gray-500 mt-0.5">Our team reviews your profile and contact details.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📧</span>
            <div>
              <div className="font-bold text-sm text-gray-800">Email &amp; SMS Notification</div>
              <div className="text-xs text-gray-500 mt-0.5">You'll be notified at {session?.phone} once approved.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">✅</span>
            <div>
              <div className="font-bold text-sm text-gray-800">Full Access</div>
              <div className="text-xs text-gray-500 mt-0.5">Once approved, tap "Check Status" below — no re-login needed.</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mb-4">
          Name: <strong>{session?.name || "—"}</strong><br />
          Phone: <strong>{session?.phone}</strong>
        </div>
        {msg && (
          <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
            {msg}
          </div>
        )}
        <button
          onClick={checkStatus}
          disabled={checking}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-orange-600 transition mb-3 disabled:opacity-60">
          {checking ? "Checking…" : "🔄 Check Approval Status"}
        </button>
        <button onClick={onLogout}
          className="w-full border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition">
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

function Root() {
  const [session, setSession]       = useState(loadSession);
  const [warnVisible, setWarnVisible] = useState(false);
  const [countdown, setCountdown]   = useState(60);

  const logoutTimerRef   = useRef(null);
  const warnTimerRef     = useRef(null);
  const countdownRef     = useRef(null);
  const sessionRef       = useRef(session);

  // Keep ref in sync so timer callbacks always see latest session
  useEffect(() => { sessionRef.current = session; }, [session]);

  /* ── Core logout ── */
  const doLogout = useCallback(() => {
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    clearSession();
    clearToken();
    setSession(null);
    setWarnVisible(false);
  }, []);

  /* ── Reset inactivity clock ── */
  const resetTimer = useCallback(() => {
    if (!sessionRef.current) return;
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warnTimerRef.current);
    clearInterval(countdownRef.current);
    setWarnVisible(false);

    // Show "Still there?" warning 60 s before logout
    warnTimerRef.current = setTimeout(() => {
      if (!sessionRef.current) return;
      setWarnVisible(true);
      let c = 60;
      setCountdown(c);
      countdownRef.current = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) clearInterval(countdownRef.current);
      }, 1000);
    }, LOGOUT_AFTER - WARN_BEFORE);

    // Auto-logout
    logoutTimerRef.current = setTimeout(() => {
      if (!sessionRef.current) return;
      doLogout();
    }, LOGOUT_AFTER);
  }, [doLogout]);

  /* ── Wire up activity listeners while logged in ── */
  useEffect(() => {
    if (!session) {
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warnTimerRef.current);
      clearInterval(countdownRef.current);
      setWarnVisible(false);
      return;
    }
    resetTimer();
    const EVENTS = ["mousemove","mousedown","keydown","scroll","touchstart","click"];
    EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warnTimerRef.current);
      clearInterval(countdownRef.current);
      EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!session]);

  /* ── Push notifications ── */
  useEffect(() => {
    if (session) {
      const t = setTimeout(() => initPushNotifications().catch(() => {}), 3000);
      return () => clearTimeout(t);
    }
  }, [!!session]);

  const handleLogin = (s) => {
    saveSession(s);
    setSession(s);
    setTimeout(() => initPushNotifications().catch(() => {}), 3000);
  };

  const handleLogout = () => {
    doLogout();
  };

  const handleApproved = useCallback((updatedSession) => {
    setSession(updatedSession);
  }, []);

  /* ── Route ── */
  let content;
  if (!session) {
    content = <Login onLogin={handleLogin} />;
  } else {
    const { role, verificationStatus } = session;
    if (role === "customer") {
      content = <PetclubApp session={session} onLogout={handleLogout} />;
    } else if (role === "admin") {
      content = <ProApp session={session} onLogout={handleLogout} />;
    } else if (role === "professional" && verificationStatus !== "approved") {
      content = <PendingApproval session={session} onLogout={handleLogout} onApproved={handleApproved} />;
    } else if (role === "professional" && verificationStatus === "approved") {
      content = <ProApp session={session} onLogout={handleLogout} />;
    } else {
      content = <Login onLogin={handleLogin} />;
    }
  }

  return (
    <>
      {content}

      {/* ── Inactivity warning overlay ── */}
      {warnVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-xs w-full text-center animate-fade-in">
            <div className="text-5xl mb-3">⏱️</div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Still there?</h2>
            <p className="text-sm text-gray-500 mb-5">
              You'll be signed out in{" "}
              <span className="font-extrabold text-orange-500 tabular-nums">{countdown}s</span>
              {" "}due to inactivity.
            </p>
            <button
              onClick={resetTimer}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-sm">
              ✅ Stay Signed In
            </button>
            <button
              onClick={doLogout}
              className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
              Sign out now
            </button>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
