import { useState, useEffect } from "react";
import { api } from "./api.js";
import { ProfessionalOnboarding } from "./features/pro/ProOnboarding.jsx";
import { ProfessionalDashboard } from "./features/pro/ProDashboard.jsx";
import { AdminDashboard } from "./features/admin/AdminDashboard.jsx";
import { Spinner } from "./shared/ui.jsx";

export default function ProApp({ session, onLogout }) {
  const [profileChecked,  setProfileChecked]  = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [enrichedSession, setEnrichedSession] = useState(session);

  useEffect(() => {
    if (session.role === "admin") { setProfileChecked(true); return; }
    api.getMyProProfile().then(res => {
      const subRole = res.profile?.sub_role;
      if (subRole) setEnrichedSession(s => ({ ...s, subRole }));
      // bio is set only when the 4-step onboarding form is submitted (required field
      // in step 2). name cannot be used — it comes from the users table and is always
      // set after auth. Already-verified professionals bypass the form regardless of
      // bio, so legacy accounts without bio land on the dashboard directly.
      const incomplete = !res.profile?.bio && res.profile?.verification_status !== 'approved';
      setNeedsOnboarding(incomplete);
      setProfileChecked(true);
    }).catch(() => { setNeedsOnboarding(false); setProfileChecked(true); });
  }, [session.id]); // depend on stable ID, not the whole object, to avoid repeat spinner

  if (!profileChecked) return <Spinner full/>;
  if (session.role === "admin")  return <AdminDashboard   session={session} onLogout={onLogout}/>;
  if (needsOnboarding)           return <ProfessionalOnboarding session={enrichedSession} onComplete={() => setNeedsOnboarding(false)}/>;
  return <ProfessionalDashboard session={enrichedSession} onLogout={onLogout}/>;
}
