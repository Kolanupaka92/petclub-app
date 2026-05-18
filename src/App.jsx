import { useState } from "react";
import Login from "./Login.jsx";
import PetclubApp from "./PetclubApp.jsx";
import { loadSession, saveSession, clearSession } from "./utils/storage.js";

export default function App() {
  const [session, setSession] = useState(loadSession);

  const handleLogin = (data) => {
    setSession(data);
    saveSession(data);
  };

  const handleLogout = () => {
    setSession(null);
    clearSession();
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return <PetclubApp session={session} onLogout={handleLogout} />;
}
