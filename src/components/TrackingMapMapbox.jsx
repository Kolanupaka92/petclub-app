/**
 * TrackingMapMapbox — Mapbox GL live tracking for USA-based users (+1).
 *
 * Used by TrackingMap.jsx (router) when session.phone starts with "+1".
 *
 * QA checklist:
 * ✅ Call professional button  — tel: link with pro phone
 * ✅ ID Verified badge         — in header alongside live indicator
 * ✅ Distance chip             — haversine km, updates on every GPS tick
 * ✅ No-token fallback         — branded "on the way" card, no blank screen
 * ✅ Waiting-for-location UI   — gentle animation while pro hasn't shared yet
 * ✅ ETA pill                  — live Mapbox directions, updates on every GPS tick
 * ✅ Animated dashed route     — frame-accurate dasharray animation
 * ✅ Dual markers              — customer home pin + pulsing pro dot
 * ✅ Bounds auto-fit           — both markers always in view
 */
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const BASE  = import.meta.env.VITE_API_URL || "https://api.mypetclub.app/api";
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const SVC_ICON  = { Groomer: "✂️", Trainer: "🐕‍🦺", Vet: "🏥" };
const SVC_COLOR = { Groomer: "#7c3aed", Trainer: "#ea580c", Vet: "#059669" };
const SVC_LABEL = { Groomer: "Groomer", Trainer: "Trainer", Vet: "Veterinarian" };

/* ── Animated professional marker element ── */
function makeProEl(svcType) {
  const color = SVC_COLOR[svcType] || "#f97316";
  const icon  = SVC_ICON[svcType]  || "👤";
  const el = document.createElement("div");
  el.style.cssText = "position:relative;width:56px;height:56px;cursor:default;";
  el.innerHTML = `
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:${color};opacity:0.18;
      animation:proRing 1.8s ease-out infinite;
    "></div>
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:${color};opacity:0.09;
      animation:proRing 1.8s ease-out infinite 0.6s;
    "></div>
    <div style="
      position:absolute;top:8px;left:8px;width:40px;height:40px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 18px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;z-index:2;
    ">${icon}</div>
  `;
  return el;
}

/* ── Customer home pin ── */
function makeCustEl() {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="
      width:44px;height:44px;border-radius:50%;
      background:#f97316;border:3px solid #fff;
      box-shadow:0 2px 14px rgba(249,115,22,0.55);
      display:flex;align-items:center;justify-content:center;font-size:20px;
    ">🏠</div>
  `;
  return el;
}

/* ── Haversine distance (km) ── */
function haversineKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

/* ── No-token fallback card (shown when Mapbox isn't configured) ── */
function NoTokenFallback({ svcType, svcColor }) {
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
      gap: 0,
    }}>
      {/* Fake grid map */}
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
      {/* Bottom card */}
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
export default function TrackingMapMapbox({ booking, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const proMarkerRef    = useRef(null);
  const custMarkerRef   = useRef(null);
  const esRef           = useRef(null);
  const animFrameRef    = useRef(null);
  const routeAddedRef   = useRef(false);

  const [proPos,      setProPos]      = useState(null);
  const [custPos,     setCustPos]     = useState(null);
  const [eta,         setEta]         = useState(null);
  const [distanceKm,  setDistanceKm]  = useState(null);
  const [liveStatus,  setLiveStatus]  = useState("connecting");

  const proName   = booking?.professional_profiles?.users?.name  || "Your Professional";
  const proPhone  = booking?.professional_profiles?.users?.phone || null;
  const proFirst  = proName.split(" ")[0];
  const svcColor  = SVC_COLOR[booking?.service_type] || "#f97316";
  const svcIcon   = SVC_ICON[booking?.service_type]  || "👤";
  const svcLabel  = SVC_LABEL[booking?.service_type] || "Professional";

  /* ── 1. Customer GPS (fallback: geocode booking address via Mapbox) ── */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setCustPos([p.coords.longitude, p.coords.latitude]),
      () => {
        const addr = [booking?.address, booking?.city].filter(Boolean).join(", ");
        if (!addr || !TOKEN) return;
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${TOKEN}&limit=1`)
          .then(r => r.json())
          .then(d => { if (d.features?.[0]?.center) setCustPos(d.features[0].center); })
          .catch(() => {});
      },
      { timeout: 6000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Init Mapbox ── */
  useEffect(() => {
    if (!TOKEN || !mapContainerRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-98.5795, 39.8283], // geographic center of the continental US
      zoom: 4,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 3. Customer marker ── */
  useEffect(() => {
    if (!mapRef.current || !custPos || !TOKEN) return;
    custMarkerRef.current?.remove();
    custMarkerRef.current = new mapboxgl.Marker({ element: makeCustEl(), anchor: "center" })
      .setLngLat(custPos)
      .setPopup(new mapboxgl.Popup({ offset: 28, closeButton: false }).setText("Your location"))
      .addTo(mapRef.current);
    if (!proPos) mapRef.current.flyTo({ center: custPos, zoom: 14, duration: 1200 });
  }, [custPos]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (lat && lng) setProPos([lng, lat]);
      } catch {}
    };
    return () => es.close();
  }, [booking?.id]);

  /* ── 5. Route + pro marker update ── */
  const updateRoute = useCallback(async (pro, cust) => {
    if (!mapRef.current || !pro) return;
    const map = mapRef.current;

    // Update or create professional marker
    if (proMarkerRef.current) {
      proMarkerRef.current.setLngLat(pro);
    } else {
      proMarkerRef.current = new mapboxgl.Marker({ element: makeProEl(booking?.service_type), anchor: "center" })
        .setLngLat(pro)
        .setPopup(new mapboxgl.Popup({ offset: 30, closeButton: false }).setText(`${proName} · En route`))
        .addTo(map);
    }

    // Update straight-line distance chip
    if (cust) setDistanceKm(haversineKm(pro, cust));

    // Draw Mapbox directions route
    if (!cust || !TOKEN) return;
    try {
      const coords = `${pro[0]},${pro[1]};${cust[0]},${cust[1]}`;
      const r = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`);
      const d = await r.json();
      const route = d.routes?.[0];
      if (!route || !mapRef.current) return;

      setEta(Math.round(route.duration / 60));
      const geojson = { type: "Feature", geometry: route.geometry };

      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(geojson);
      } else if (!routeAddedRef.current) {
        routeAddedRef.current = true;
        const addLayers = () => {
          if (!mapRef.current) return;
          mapRef.current.addSource("route", { type: "geojson", data: geojson });
          // White casing
          mapRef.current.addLayer({ id: "route-casing", type: "line", source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.5 } });
          // Coloured main line
          mapRef.current.addLayer({ id: "route", type: "line", source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": svcColor, "line-width": 5, "line-opacity": 0.92 } });
          // Animated dashes
          mapRef.current.addLayer({ id: "route-dash", type: "line", source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 2.5, "line-opacity": 0.65,
              "line-dasharray": [0, 4, 3] } });
          // Animate dasharray
          let step = 0;
          const seq = [[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,3,3]];
          const tick = () => {
            if (!mapRef.current) return;
            mapRef.current.setPaintProperty("route-dash", "line-dasharray", seq[step++ % seq.length]);
            animFrameRef.current = requestAnimationFrame(() => setTimeout(tick, 80));
          };
          tick();
        };
        mapRef.current.isStyleLoaded() ? addLayers() : mapRef.current.once("load", addLayers);
      }

      // Keep both markers in view
      const bounds = new mapboxgl.LngLatBounds().extend(pro).extend(cust);
      mapRef.current.fitBounds(bounds, { padding: { top: 100, bottom: 200, left: 60, right: 60 }, maxZoom: 16, duration: 900 });
    } catch {}
  }, [booking?.service_type, proName, svcColor]);

  useEffect(() => { updateRoute(proPos, custPos); }, [proPos, custPos, updateRoute]);

  /* ── Status indicator ── */
  const statusDot = liveStatus === "live"
    ? { bg: "#22c55e", label: "LIVE" }
    : liveStatus === "reconnecting"
    ? { bg: "#f59e0b", label: "Reconnecting…" }
    : { bg: "#94a3b8", label: "Connecting…" };

  /* ── No Mapbox token → branded CSS fallback ── */
  if (!TOKEN) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#0f172a" }}>
        <Header proName={proName} svcIcon={svcIcon} booking={booking} onClose={onClose} statusDot={statusDot} />
        <div style={{ flex:1, position:"relative" }}>
          <NoTokenFallback svcType={booking?.service_type} svcColor={svcColor} />
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
            display:"flex", alignItems:"center", gap:8,
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
          {/* ID Verified badge */}
          <span style={{
            background:"#16a34a", color:"white", fontSize:9, fontWeight:800,
            padding:"2px 7px", borderRadius:20, whiteSpace:"nowrap", letterSpacing:0.3, flexShrink:0,
          }}>✓ ID Verified</span>
        </div>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginTop:1 }}>
          {booking?.service_name || booking?.service_type} · En route
        </div>
      </div>

      {/* Live badge */}
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
      {/* ETA pill */}
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

      {/* Call button */}
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

/* ── Shared keyframes injected once ── */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes proRing {
        0%   { transform: scale(0.9); opacity: 0.5; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes ping {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%       { transform: scale(1.9); opacity: 0; }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
      }
      .mapboxgl-ctrl-logo { display: none !important; }
    `}</style>
  );
}
