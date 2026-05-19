import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import ProApp from "./App.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";
import { clearToken } from "./api.js";

// Pending approval screen for professionals
function PendingApproval({ session, onLogout }) {
  const subRole = session?.subRole || "professional";
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Application Submitted!</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your {subRole} profile is under review by the PETclub team.
          We'll notify you by SMS once approved — usually within 24–48 hours.
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
            <span className="text-lg">📱</span>
            <div>
              <div className="font-bold text-sm text-gray-800">SMS Notification</div>
              <div className="text-xs text-gray-500 mt-0.5">You'll receive an SMS at {session?.phone} once approved.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">✅</span>
            <div>
              <div className="font-bold text-sm text-gray-800">Full Access</div>
              <div className="text-xs text-gray-500 mt-0.5">After approval, log back in to access your professional dashboard.</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mb-6">
          Name: <strong>{session?.name || "—"}</strong><br />
          Phone: <strong>{session?.phone}</strong>
        </div>
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

  const handleLogin = (s) => {
    saveSession(s);
    setSession(s);
  };

  const handleLogout = () => {
    clearSession();
    clearToken();
    setSession(null);
  };

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
    return <PendingApproval session={session} onLogout={handleLogout} />;
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
