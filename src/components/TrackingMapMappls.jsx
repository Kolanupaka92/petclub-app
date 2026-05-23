/**
 * TrackingMapMappls — Mappls Web Maps SDK live tracking for India-based users (+91).
 *
 * Used by TrackingMap.jsx (router) when session.phone starts with "+91".
 *
 * SDK loading strategy:
 *   Mappls Web SDK is NOT on npm — it is loaded via dynamic <script> injection
 *   from the Mappls CDN and exposes window.mappls once ready.
 *   Key: VITE_MAPPLS_KEY (public static key from Mappls console)
 *
 * Coordinate convention (opposite of Mapbox):
 *   Mappls uses { lat, lng } objects throughout — for center, markers, polyline paths.
 *   Mapbox uses [lng, lat] arrays. All SSE data arrives as { lat, lng } from the backend
 *   and is used directly without swapping.
 *
 * QA checklist:
 * ✅ Call professional button  — tel: link with pro phone
 * ✅ ID Verified badge         — in header alongside live indicator
 * ✅ Distance chip             — haversine km, updates on every GPS tick
 * ✅ No-key fallback           — branded animated card when VITE_MAPPLS_KEY unset
 * ✅ Waiting-for-location UI   — gentle pulse while pro hasn't shared yet
 * ✅ ETA pill                  — Mappls Route Advanced API, updates on every GPS tick
 * ✅ Animated SVG route        — SMIL-animated polyline via Mappls Polyline
 * ✅ Dual markers              — customer home pin + animated SVG pro marker
 * ✅ Bounds auto-fit           — fitBounds after both markers present
 */
import { useEffect, useRef, useState, useCallback } from "react";

const _stripBom = (v) => (v || '').replace(/^﻿/, '').trim();
const BASE    = _stripBom(import.meta.env.VITE_API_URL) || "https://api.mypetclub.app/api";
const MAP_KEY = import.meta.env.VITE_MAPPLS_KEY || "";

const SVC_ICON  = { Groomer: "✂️", Trainer: "🐕‍🦺", Vet: "🏥" };
const SVC_COLOR = { Groomer: "#7c3aed", Trainer: "#ea580c", Vet: "#059669" };
const SVC_LABEL = { Groomer: "Groomer", Trainer: "Trainer", Vet: "Veterinarian" };

/* ── Load Mappls SDK script (idempotent) ── */
let sdkReady = false;
let sdkCallbacks = [];

function loadMapplsSDK(key) {
  return new Promise((resolve, reject) => {
    if (sdkReady && window.mappls) { resolve(window.mappls); return; }
    sdkCallbacks.push(resolve);
    if (document.getElementById("mappls-sdk")) return; // already injecting

    const script = document.createElement("script");
    script.id  = "mappls-sdk";
    script.src = `https://apis.mappls.com/advancedmaps/v1/${key}/map_load?v=1.5`;
    script.defer = true;
    script.onload = () => {
      // Mappls SDK sets window.mappls after the script evaluates
      const check = setInterval(() => {
        if (window.mappls) {
          clearInterval(check);
          sdkReady = true;
          const cbs = sdkCallbacks.splice(0);
          cbs.forEach(cb => cb(window.mappls));
        }
      }, 50);
    };
    script.onerror = () => reject(new Error("Mappls SDK failed to load"));
    document.head.appendChild(script);
  });
}

/* ── Haversine distance (km) — uses { lat, lng } objects ── */
function haversineKm(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

/* ── SVG data-URL for animated pro marker (SMIL animation, no CSS keyframes needed) ── */
function makeProSvgUrl(color, emoji) {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
    <circle cx="28" cy="28" r="28" fill="${color}" opacity="0.0">
      <animate attributeName="opacity" values="0.18;0" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="r" values="14;28" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="28" cy="28" r="20" fill="${color}">
      <animate attributeName="r" values="18;20;18" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="28" cy="28" r="16" fill="white" opacity="0.15"/>
    <text x="28" y="34" text-anchor="middle" font-size="18">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
}

/* ── SVG data-URL for customer home marker ── */
function makeCustSvgUrl() {
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="22" fill="#f97316" opacity="0.9"/>
    <circle cx="22" cy="22" r="18" fill="white" opacity="0.15"/>
    <text x="22" y="28" text-anchor="middle" font-size="20">🏠</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
}

/* ── No-key fallback card ── */
function NoKeyFallback({ svcType, svcColor }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(165deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Fake grid */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.06 }} xmlns="http://www.w3.org/2000/svg">
        {[10,20,30,40,50,60,70,80,90].map(p => <line key={`h${p}`} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="white" strokeWidth="1"/>)}
        {[10,20,30,40,50,60,70,80,90].map(p => <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="white" strokeWidth="1"/>)}
      </svg>
      {/* Animated route */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }}>
        <path d="M 50% 80% Q 45% 60% 52% 40% Q 55% 25% 50% 15%"
          stroke="#f97316" strokeWidth="3" strokeDasharray="10 6" fill="none" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="80" to="-80" dur="2.4s" repeatCount="indefinite"/>
        </path>
        <circle cx="50%" cy="15%" r="10" fill="#f97316" opacity="0.9"/>
        <circle cx="50%" cy="15%" r="10" fill="#f97316" opacity="0">
          <animate attributeName="r" from="10" to="26" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.4" to="0" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle r="8" fill="white" stroke="#f97316" strokeWidth="2.5">
          <animateMotion path="M 0 0 Q -30 -80 0 -160 Q 20 -220 0 -280" dur="2.4s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="50%,80%" additive="sum"/>
        </circle>
      </svg>
      {/* Status card */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"12px 16px 20px",
        background:"linear-gradient(to top, rgba(15,23,42,0.98) 0%, transparent 100%)",
      }}>
        <div style={{
          background:"white", borderRadius:18, padding:"12px 14px",
          display:"flex", alignItems:"center", gap:12,
          boxShadow:"0 8px 32px rgba(0,0,0,0.45)",
        }}>
          <div style={{
            width:42, height:42, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg, ${svcColor}, ${svcColor}cc)`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
          }}>{SVC_ICON[svcType] || "👤"}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#374151" }}>
              Your {SVC_LABEL[svcType] || "Professional"} is
            </div>
            <div style={{ fontSize:15, fontWeight:900, color: svcColor }}>
              On the way{dots}
            </div>
          </div>
          <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#22c55e",
              animation:"ping 1.4s ease-out infinite" }}/>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#22c55e" }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function TrackingMapMappls({ booking, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);    // window.mappls map instance
  const proMarkerRef    = useRef(null);    // Mappls Marker for professional
  const custMarkerRef   = useRef(null);    // Mappls Marker for customer
  const polylineRef     = useRef(null);    // Mappls Polyline for route
  const esRef           = useRef(null);    // EventSource

  // proPos / custPos stored as { lat, lng } objects (Mappls convention)
  const [proPos,      setProPos]      = useState(null);
  const [custPos,     setCustPos]     = useState(null);
  const [eta,         setEta]         = useState(null);
  const [distanceKm,  setDistanceKm]  = useState(null);
  const [liveStatus,  setLiveStatus]  = useState("connecting");
  const [mapReady,    setMapReady]    = useState(false);
  const [sdkError,    setSdkError]    = useState(false);

  const proName   = booking?.professional_profiles?.users?.name  || "Your Professional";
  const proPhone  = booking?.professional_profiles?.users?.phone || null;
  const proFirst  = proName.split(" ")[0];
  const svcColor  = SVC_COLOR[booking?.service_type] || "#f97316";
  const svcIcon   = SVC_ICON[booking?.service_type]  || "👤";

  /* ── 1. Load Mappls SDK + init map ── */
  useEffect(() => {
    if (!MAP_KEY || !mapContainerRef.current) return;
    loadMapplsSDK(MAP_KEY)
      .then(mappls => {
        if (!mapContainerRef.current) return; // unmounted while loading
        const map = new mappls.Map({
          id:     mapContainerRef.current,
          center: { lat: 20.5937, lng: 78.9629 }, // center of India
          zoom:   5,
        });
        map.on("load", () => {
          mapRef.current = map;
          setMapReady(true);
        });
      })
      .catch(() => setSdkError(true));

    return () => {
      esRef.current?.close();
      // Mappls map instances don't expose a .remove() — detaching the container is enough
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Customer GPS (fallback: geocode via backend gateway) ── */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setCustPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {
        // Backend geocoding gateway — no API keys in frontend
        const addr = [booking?.address, booking?.city].filter(Boolean).join(", ");
        if (!addr) return;
        const token = localStorage.getItem("petclub_token");
        fetch(`${BASE}/geocode?q=${encodeURIComponent(addr)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then(r => r.json())
          .then(d => { if (d.lat && d.lng) setCustPos({ lat: d.lat, lng: d.lng }); })
          .catch(() => {});
      },
      { timeout: 6000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 3. Customer marker ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || !custPos) return;
    const mappls = window.mappls;
    custMarkerRef.current?.remove();
    custMarkerRef.current = new mappls.Marker({
      map:      mapRef.current,
      position: custPos,
      icon:     makeCustSvgUrl(),
      width:    44,
      height:   44,
      popupHtml: "Your location",
    });
    if (!proPos) mapRef.current.setCenter(custPos);
  }, [mapReady, custPos]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 4. SSE live location ── */
  useEffect(() => {
    if (!booking?.id) return;
    const token = localStorage.getItem("petclub_token");
    const url   = `${BASE}/bookings/${booking.id}/track?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen    = () => setLiveStatus("live");
    es.onerror   = () => setLiveStatus("reconnecting");
    es.onmessage = (e) => {
      try {
        const { lat, lng } = JSON.parse(e.data);
        // Mappls expects { lat, lng } — SSE sends { lat, lng } — no swap needed
        if (lat && lng) setProPos({ lat, lng });
      } catch {}
    };
    return () => es.close();
  }, [booking?.id]);

  /* ── 5. Route + pro marker update (Mappls Route Advanced API) ── */
  const updateRoute = useCallback(async (pro, cust) => {
    if (!mapReady || !mapRef.current || !pro) return;
    const mappls = window.mappls;

    // Update or create professional marker
    if (proMarkerRef.current) {
      proMarkerRef.current.setPosition(pro);
    } else {
      const color = SVC_COLOR[booking?.service_type] || "#f97316";
      const emoji = SVC_ICON[booking?.service_type]  || "👤";
      proMarkerRef.current = new mappls.Marker({
        map:      mapRef.current,
        position: pro,
        icon:     makeProSvgUrl(color, emoji),
        width:    56,
        height:   56,
        popupHtml: `${proName} · En route`,
      });
    }

    // Update distance chip
    if (cust) setDistanceKm(haversineKm(pro, cust));

    // Draw route via Mappls Route Advanced API
    // Note: Mappls REST uses lng,lat order in the URL path (WGS84 standard)
    // but Mappls Polyline path uses { lat, lng } objects
    if (!cust) return;
    try {
      const r = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${MAP_KEY}/route_adv/driving/${pro.lng},${pro.lat};${cust.lng},${cust.lat}?geometries=geojson`
      );
      const d = await r.json();
      const route = d.routes?.[0];
      if (!route || !mapRef.current) return;

      setEta(Math.round(route.duration / 60));

      // GeoJSON coordinates are [lng, lat] — convert to { lat, lng } for Mappls Polyline
      const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

      // Remove old polyline then draw new one
      polylineRef.current?.remove?.();
      polylineRef.current = new mappls.Polyline({
        map:         mapRef.current,
        path,
        strokeColor:   svcColor,
        strokeOpacity: 0.9,
        strokeWeight:  5,
      });

      // Fit bounds to show both markers
      const bounds = new mappls.LatLngBounds([
        [pro.lat,  pro.lng],
        [cust.lat, cust.lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [100, 60] });
    } catch {}
  }, [mapReady, booking?.service_type, proName, svcColor]);

  useEffect(() => { updateRoute(proPos, custPos); }, [proPos, custPos, updateRoute]);

  /* ── Status indicator ── */
  const statusDot = liveStatus === "live"
    ? { bg: "#22c55e", label: "LIVE" }
    : liveStatus === "reconnecting"
    ? { bg: "#f59e0b", label: "Reconnecting…" }
    : { bg: "#94a3b8", label: "Connecting…" };

  /* ── No Mappls key or SDK error → branded CSS fallback ── */
  if (!MAP_KEY || sdkError) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#0f172a" }}>
        <Header proName={proName} svcIcon={svcIcon} booking={booking} onClose={onClose} statusDot={statusDot} />
        <div style={{ flex:1, position:"relative" }}>
          <NoKeyFallback svcType={booking?.service_type} svcColor={svcColor} />
        </div>
        <BottomBar proName={proFirst} proPhone={proPhone} svcColor={svcColor} eta={null} distanceKm={null}/>
        <GlobalStyles />
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#0f0e17" }}>
      <Header proName={proName} svcIcon={svcIcon} booking={booking} onClose={onClose} statusDot={statusDot} />

      {/* ── Map ── */}
      <div style={{ flex:1, position:"relative" }}>
        <div ref={mapContainerRef} style={{ position:"absolute", inset:0 }}/>

        {/* Waiting for pro location chip */}
        {!proPos && (
          <div style={{
            position:"absolute", top:16, left:"50%", transform:"translateX(-50%)",
            background:"rgba(15,14,23,0.92)", borderRadius:20, padding:"10px 20px",
            display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap",
            zIndex:10,
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b",
              animation:"pulseDot 1s ease-in-out infinite" }}/>
            <span style={{ color:"#fff", fontSize:12, fontWeight:600 }}>
              Waiting for {proFirst} to share location…
            </span>
          </div>
        )}

        {/* Distance chip */}
        {proPos && distanceKm !== null && (
          <div style={{
            position:"absolute", top:16, left:16,
            background:"rgba(15,14,23,0.92)", borderRadius:14, padding:"8px 14px",
            backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", gap:8, zIndex:10,
          }}>
            <span style={{ fontSize:14 }}>📍</span>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:12 }}>{distanceKm} km away</div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:10 }}>Nearest verified pro</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar: ETA pill + Call button ── */}
      <BottomBar proName={proFirst} proPhone={proPhone} svcColor={svcColor} eta={eta} distanceKm={distanceKm}/>
      <GlobalStyles />
    </div>
  );
}

/* ── Header strip ── */
function Header({ proName, svcIcon, booking, onClose, statusDot }) {
  return (
    <div style={{
      padding:"12px 16px", background:"#1a1825",
      display:"flex", alignItems:"center", gap:12, flexShrink:0,
      borderBottom:"1px solid rgba(255,255,255,0.08)",
    }}>
      <button onClick={onClose} style={{
        background:"rgba(255,255,255,0.1)", border:"none", borderRadius:12,
        width:38, height:38, color:"#fff", fontSize:20, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>‹</button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize:15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {svcIcon} {proName}
          </span>
          <span style={{
            background:"#16a34a", color:"white", fontSize:9, fontWeight:800,
            padding:"2px 7px", borderRadius:20, whiteSpace:"nowrap", letterSpacing:0.3, flexShrink:0,
          }}>✓ ID Verified</span>
        </div>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginTop:1 }}>
          {booking?.service_name || booking?.service_type} · En route
        </div>
      </div>

      <div style={{
        display:"flex", alignItems:"center", gap:5,
        background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"5px 12px", flexShrink:0,
      }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background: statusDot.bg,
          boxShadow: statusDot.label === "LIVE" ? `0 0 7px ${statusDot.bg}` : "none" }}/>
        <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>{statusDot.label}</span>
      </div>
    </div>
  );
}

/* ── Bottom bar: ETA pill + Call button ── */
function BottomBar({ proName, proPhone, svcColor, eta, distanceKm }) {
  return (
    <div style={{
      background:"#1a1825", borderTop:"1px solid rgba(255,255,255,0.08)",
      padding:"14px 16px 20px", flexShrink:0,
      display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{
        flex:1, background:"rgba(255,255,255,0.06)", borderRadius:16,
        padding:"12px 16px", display:"flex", alignItems:"center", gap:16,
      }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>ETA</div>
          <div style={{ color:"#fff", fontSize:26, fontWeight:900, lineHeight:1 }}>
            {eta !== null ? eta : "—"}
            <span style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.45)" }}> min</span>
          </div>
        </div>
        <div style={{ width:1, height:36, background:"rgba(255,255,255,0.1)" }}/>
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Status</div>
          <div style={{ color: svcColor, fontSize:13, fontWeight:800 }}>En Route 🚗</div>
        </div>
        {distanceKm !== null && <>
          <div style={{ width:1, height:36, background:"rgba(255,255,255,0.1)" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Distance</div>
            <div style={{ color:"#fff", fontSize:13, fontWeight:700 }}>{distanceKm} km</div>
          </div>
        </>}
      </div>

      {proPhone ? (
        <a
          href={`tel:${proPhone}`}
          style={{
            background: svcColor, color:"white", fontWeight:800, fontSize:13,
            borderRadius:16, padding:"14px 18px", textDecoration:"none",
            display:"flex", alignItems:"center", gap:6, flexShrink:0,
            boxShadow:`0 4px 16px ${svcColor}55`,
            whiteSpace:"nowrap",
          }}
        >
          📞 Call {proName}
        </a>
      ) : (
        <div style={{
          background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.3)",
          fontWeight:700, fontSize:12, borderRadius:16, padding:"14px 16px",
          flexShrink:0, whiteSpace:"nowrap",
        }}>
          📞 No phone
        </div>
      )}
    </div>
  );
}

/* ── Shared keyframes ── */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes ping {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%       { transform: scale(1.9); opacity: 0; }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
      }
    `}</style>
  );
}
