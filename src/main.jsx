import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import ProApp from "./App.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";
import { clearToken } from "./api.js";

function Root() {
  const [session, setSession] = useState(loadSession);
  const [portal, setPortal] = useState(() => (loadSession() ? "customer" : null));

  if (portal === "customer") {
    if (!session)
      return (
        <Login
          onLogin={(s) => {
            saveSession(s);
            setSession(s);
          }}
        />
      );
    return (
      <PetclubApp
        session={session}
        onLogout={() => {
          clearSession();
          clearToken();
          setSession(null);
          setPortal(null);
        }}
      />
    );
  }

  if (portal === "professional") return <ProApp />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🐾</div>
        <h1 className="text-4xl font-extrabold text-gray-900">
          PET<span className="text-orange-500">club</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">Your complete pet care platform 🇮🇳</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => setPortal("customer")}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 rounded-2xl text-base shadow-md hover:shadow-lg transition-all"
        >
          🐕 &nbsp;I&apos;m a Pet Owner
        </button>
        <button
          onClick={() => setPortal("professional")}
          className="w-full border-2 border-orange-400 text-orange-500 hover:bg-orange-50 active:bg-orange-100 font-bold py-4 rounded-2xl text-base transition-all"
        >
          ✂️ &nbsp;Professional / Admin
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-10 text-center leading-relaxed">
        Grooming · Training · Food · Vet care<br />
        All in one place
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
