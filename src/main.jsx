import { StrictMode, useState, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import ProApp from "./App.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";
import { clearToken, api } from "./api.js";
import { initPushNotifications } from "./firebase.js";

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
        // Update session and switch to dashboard
        const updated = { ...session, verificationStatus: "approved", subRole: res.user?.subRole || res.user?.professional_profiles?.[0]?.sub_role || subRole };
        saveSession(updated);
        onApproved(updated);
      } else if (vs === "rejected") {
        setMsg("❌ Your application was not approved. Please contact support at support@petclub.in");
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
  const [session, setSession] = useState(loadSession);

  // Initialize push notifications whenever user is logged in
  useEffect(() => {
    if (session) {
      // Slight delay so the rest of the app loads first
      const t = setTimeout(() => initPushNotifications().catch(() => {}), 3000);
      return () => clearTimeout(t);
    }
  }, [!!session]);

  const handleLogin = (s) => {
    saveSession(s);
    setSession(s);
    // Kick off FCM setup after login (non-blocking)
    setTimeout(() => initPushNotifications().catch(() => {}), 3000);
  };

  const handleLogout = () => {
    clearSession();
    clearToken();
    setSession(null);
  };

  const handleApproved = useCallback((updatedSession) => {
    setSession(updatedSession);
  }, []);

  // Not logged in
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const { role, verificationStatus } = session;

  // Customer
  if (role === "customer") {
    return <PetclubApp session={session} onLogout={handleLogout} />;
  }

  // Admin
  if (role === "admin") {
    return <ProApp session={session} onLogout={handleLogout} />;
  }

  // Professional — pending approval
  if (role === "professional" && verificationStatus !== "approved") {
    return <PendingApproval session={session} onLogout={handleLogout} onApproved={handleApproved} />;
  }

  // Professional — approved
  if (role === "professional" && verificationStatus === "approved") {
    return <ProApp session={session} onLogout={handleLogout} />;
  }

  // Fallback: pending_role or unknown — re-login
  return <Login onLogin={handleLogin} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
