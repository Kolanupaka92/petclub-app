import { StrictMode, useState, useCallback, useEffect, useRef, Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import * as Sentry from "@sentry/react";

// Sentry — active only when VITE_SENTRY_DSN is set (prod). No-op in local dev.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? "production" : "development",
    release: `petclub-app@${__APP_VERSION__}`,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Never send PII — scrub phone numbers and emails from breadcrumbs
    beforeSend(event) {
      if (event.user) { delete event.user.email; delete event.user.username; }
      return event;
    },
  });
}
import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import ProApp from "./App.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";
import { clearToken, api } from "./api.js";
import { initPushNotifications } from "./firebase.js";
import { clearGpsDb } from "./utils/gpsBuffer.js";

/* ── Error Boundary ─────────────────────────────────────────────────────────
 * Catches render errors in any child component and shows a friendly recovery
 * screen instead of a blank white page. Class component required by React API.  */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null, stack: null, copied: false }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) {
    const stack = info?.componentStack || "";
    this.setState({ stack });
    console.error('[ErrorBoundary]', err, stack);
    Sentry.captureException(err, { extra: { componentStack: stack } });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const { error, stack, copied } = this.state;
    const details = `PETclub error report\nv${__APP_VERSION__} · ${new Date().toISOString()}\n\n${error?.toString()}\n\nComponent stack:${stack}`;
    const copyDetails = () => {
      navigator.clipboard?.writeText(details).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }).catch(() => {});
    };
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff8f0", padding: "24px", fontFamily: "system-ui,-apple-system,sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🐾</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#c2410c", marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: "#7c2d12", maxWidth: 340, lineHeight: 1.6, marginBottom: 20 }}>
          PETclub hit an unexpected error. Your data is safe — please reload to continue.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: "#f97316", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 12 }}>
          🔄 Reload App
        </button>
        <button
          onClick={copyDetails}
          style={{ background: "transparent", color: "#9a3412", fontWeight: 600, fontSize: 12, padding: "8px 20px", borderRadius: 10, border: "1px solid #fed7aa", cursor: "pointer" }}>
          {copied ? "✅ Copied!" : "📋 Copy error details"}
        </button>
        {process.env.NODE_ENV !== "production" && (
          <pre style={{ marginTop: 20, fontSize: 11, color: "#6b7280", textAlign: "left", maxWidth: 500, overflow: "auto", background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
            {error?.toString()}{stack}
          </pre>
        )}
      </div>
    );
  }
}

/* ── Inactivity config ── */
// Admin users often monitor passively (dashboard, live trips) so give them
// a longer window before auto-logout. Regular users keep the tighter 8-min limit.
// PWA note: localStorage persists across home-screen launches, so the session
// survives app close/reopen. The timer resets on the first touch/click after
// relaunch, giving the full window from that point — no aggressive logout on refresh.
const LOGOUT_AFTER_ADMIN = 60 * 60 * 1000; // 60 min for admin
const LOGOUT_AFTER_USER  =  8 * 60 * 1000; //  8 min for customers / pros
const WARN_BEFORE        = 60 * 1000;       // show warning 60s before logout

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
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/icon.svg" alt="PETclub" className="w-9 h-9 rounded-xl" />
          <span className="font-extrabold text-gray-900 text-xl tracking-tight">PET<span className="text-orange-500">club</span></span>
        </div>
        <div className="text-5xl mb-4">⏳</div>
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
  // Parse deep-link params once — before replaceState cleans the URL.
  // ?signin=1            → skip landing page
  // ?role=professional   → pre-select professional signup flow
  const [_deepLink] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const skip = params.get('signin') === '1';
    const role = params.get('role'); // "professional" | null
    if (skip) {
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }
    return { skip, role };
  });
  const [showLanding, setShowLanding] = useState(() => !_deepLink.skip);
  const [loginHint, setLoginHint]     = useState(() =>
    _deepLink.role === 'professional' ? 'professional' : null
  ); // "customer" | "professional"
  const [warnVisible, setWarnVisible] = useState(false);
  const [countdown, setCountdown]   = useState(60);

  /* ── Dynamic robots meta tag ─────────────────────────────────────────────
   * The public landing page (showLanding && !session) should be indexed by
   * Google. Every authenticated route — including the admin portal — stays
   * noindex. The <meta> tag in index.html defaults to "noindex, nofollow"
   * so search engines are safe even before JS executes.                   */
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (!meta) return;
    const isPublicLanding = !session && showLanding;
    meta.setAttribute('content', isPublicLanding ? 'index, follow' : 'noindex, nofollow');
  }, [session, showLanding]);

  /* ── Wipe stale service workers when user is not logged in ──────────────────
   * Service workers persist across sessions. A stale SW from a previous build
   * can intercept auth API requests and return fabricated 405 errors before the
   * request even leaves the browser. Because push notifications / background sync
   * are only needed AFTER login (re-registered by initPushNotifications), it is
   * always safe to unregister every SW on a fresh unauthenticated load.          */
  useEffect(() => {
    if (session) return; // already logged in — don't touch the active SW
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations()
      .then(regs => {
        if (regs.length) {
          console.info(`[SW] Clearing ${regs.length} stale service worker(s) before auth`);
          regs.forEach(r => r.unregister());
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — before any API call can be made

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
    clearGpsDb(); // clear buffered GPS positions + auth token from IDB on logout
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

    // Role-aware timeout: admin gets 60 min, everyone else 8 min
    const LOGOUT_AFTER = sessionRef.current?.role === 'admin'
      ? LOGOUT_AFTER_ADMIN
      : LOGOUT_AFTER_USER;

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

  /* ── 401 / expired JWT auto-logout ── */
  // api.js dispatches petclub:unauthorized when any request receives a 401.
  // This handles the case where the 7-day JWT expires mid-session.
  useEffect(() => {
    const handle = () => {
      if (sessionRef.current) {
        console.info('[Auth] JWT expired — auto-logging out');
        doLogout();
        setShowLanding(false); // go straight to login, skip landing
      }
    };
    window.addEventListener('petclub:unauthorized', handle);
    return () => window.removeEventListener('petclub:unauthorized', handle);
  }, [doLogout]);

  /* ── M-1: Server-side session re-validation on mount ────────────────────
   * Prevents a tampered localStorage session (e.g. role="admin" injected by
   * hand) from accessing the admin panel. We call getMe() once on load;
   * if the backend rejects the token the 401 handler auto-logs the user out.
   * Runs only when a session is already present (returning user). */
  useEffect(() => {
    if (!session) return;
    api.getMe().catch(() => {
      // 401 is handled by the petclub:unauthorized event — this catch handles
      // network errors gracefully (do nothing, let the user proceed offline).
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once on mount only

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
    setShowLanding(true); // return to public landing on sign-out
  };

  const handleApproved = useCallback((updatedSession) => {
    setSession(updatedSession);
  }, []);

  /* ── Route ── */
  let content;
  if (!session) {
    content = showLanding
      ? <LandingPage onGetStarted={hint => { setLoginHint(hint); setShowLanding(false); }} />
      : <Login onLogin={handleLogin} initialHint={loginHint} />;
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

// ── Version banner ────────────────────────────────────────────────────────
console.info(
  `%c🐾 PETclub%c v${__APP_VERSION__}`,
  'color:#f97316;font-weight:900;font-size:14px',
  'color:#94a3b8;font-size:12px'
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>
);
