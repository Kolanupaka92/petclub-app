/**
 * TrackingMap — Regional map router for PETclub live service tracking.
 *
 * Selects the correct map implementation based on the user's phone prefix:
 *   +91 (India)  → TrackingMapMappls  (Mappls Web Maps SDK)
 *   +1  (USA)    → TrackingMapMapbox  (Mapbox GL JS)
 *   anything else → TrackingMapMapbox  (safe fallback)
 *
 * Props:
 *   booking  {object}  — full booking record (with professional_profiles joined)
 *   onClose  {fn}      — called when the user presses the back button
 *   session  {object}  — Supabase/JWT session; session.phone determines the map region
 */
import { lazy, Suspense } from "react";

const TrackingMapMappls = lazy(() => import("./TrackingMapMappls.jsx"));
const TrackingMapMapbox = lazy(() => import("./TrackingMapMapbox.jsx"));

/* ── Fallback shown while the heavy map bundle is loading ── */
function MapLoadingFallback() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:"#1a1825",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16,
    }}>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        border:"4px solid rgba(249,115,22,0.2)", borderTopColor:"#f97316",
        animation:"spin 0.9s linear infinite",
      }}/>
      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:13, fontWeight:600 }}>
        Loading map…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function TrackingMap({ booking, onClose, session }) {
  const phone    = session?.phone || "";
  const isIndia  = phone.startsWith("+91");

  return (
    <Suspense fallback={<MapLoadingFallback />}>
      {isIndia
        ? <TrackingMapMappls booking={booking} onClose={onClose} />
        : <TrackingMapMapbox booking={booking} onClose={onClose} />
      }
    </Suspense>
  );
}
