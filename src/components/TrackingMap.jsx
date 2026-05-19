/**
 * TrackingMap — Ola/Rapido-style live service tracking for PETclub customers.
 *
 * - Subscribes to Server-Sent Events from /api/bookings/:id/track
 * - Shows customer location (home pin) + professional location (animated dot)
 * - Draws a live route via Mapbox Directions API
 * - Displays ETA countdown and booking status
 *
 * Requires: VITE_MAPBOX_TOKEN environment variable
 */
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const BASE  = import.meta.env.VITE_API_URL || "https://api.mypetclub.app/api";
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const SVC_ICON  = { Groomer: "✂️", Trainer: "🎓", Vet: "🏥" };
const SVC_COLOR = { Groomer: "#7c3aed", Trainer: "#2563eb", Vet: "#059669" };

/* ── small helper — animated pro marker element ── */
function makeProEl(svcType) {
  const el = document.createElement("div");
  el.style.cssText = "position:relative;width:52px;height:52px;";
  el.innerHTML = `
    <div style="
      position:absolute;inset:0;border-radius:50%;
      border:2px solid ${SVC_COLOR[svcType] || "#f97316"};
      opacity:0.4;animation:ping 1.6s ease-out infinite;
    "></div>
    <div style="
      position:absolute;top:6px;left:6px;width:40px;height:40px;border-radius:50%;
      background:${SVC_COLOR[svcType] || "#f97316"};border:3px solid #fff;
      box-shadow:0 2px 16px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;z-index:1;
    ">${SVC_ICON[svcType] || "👤"}</div>
  `;
  return el;
}

function makeCustEl() {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="
      width:44px;height:44px;border-radius:50%;
      background:#f97316;border:3px solid #fff;
      box-shadow:0 2px 12px rgba(249,115,22,0.5);
      display:flex;align-items:center;justify-content:center;font-size:20px;
    ">🏠</div>
  `;
  return el;
}

export default function TrackingMap({ booking, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const proMarkerRef    = useRef(null);
  const custMarkerRef   = useRef(null);
  const esRef           = useRef(null);
  const routeStep       = useRef(0);
  const animFrameRef    = useRef(null);

  const [proPos,  setProPos]  = useState(null);
  const [custPos, setCustPos] = useState(null);
  const [eta,     setEta]     = useState(null);
  const [liveStatus, setLiveStatus] = useState("connecting");

  const proName   = booking?.professional_profiles?.users?.name || "Your Professional";
  const svcColor  = SVC_COLOR[booking?.service_type] || "#f97316";
  const svcIcon   = SVC_ICON[booking?.service_type]  || "👤";

  /* ── 1. Get customer GPS (fallback: geocode booking address) ── */
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setCustPos([p.coords.longitude, p.coords.latitude]),
      () => {
        const addr = [booking?.address, booking?.city].filter(Boolean).join(", ");
        if (!addr || !TOKEN) return;
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${TOKEN}&limit=1`)
          .then(r => r.json())
          .then(d => { if (d.features?.[0]?.center) setCustPos(d.features[0].center); });
      },
      { timeout: 6000 }
    );
  }, [booking?.address, booking?.city]);

  /* ── 2. Init Mapbox ── */
  useEffect(() => {
    if (!TOKEN || !mapContainerRef.current) return;
    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [78.4867, 17.3850],   // Hyderabad default
      zoom: 13,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
    };
  }, []);

  /* ── 3. Customer marker ── */
  useEffect(() => {
    if (!mapRef.current || !custPos || !TOKEN) return;
    custMarkerRef.current?.remove();
    custMarkerRef.current = new mapboxgl.Marker({ element: makeCustEl(), anchor: "center" })
      .setLngLat(custPos)
      .setPopup(new mapboxgl.Popup({ offset: 28, closeButton: false }).setText("Your location"))
      .addTo(mapRef.current);
    if (!proPos) mapRef.current.flyTo({ center: custPos, zoom: 14, duration: 1200 });
  }, [custPos]);

  /* ── 4. SSE — subscribe to professional's live location ── */
  useEffect(() => {
    if (!booking?.id) return;
    const token = localStorage.getItem("petclub_token");
    const url   = `${BASE}/bookings/${booking.id}/track?token=${encodeURIComponent(token)}`;

    const connect = () => {
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
    };

    connect();
    return () => esRef.current?.close();
  }, [booking?.id]);

  /* ── 5. Professional marker + live route ── */
  useEffect(() => {
    if (!mapRef.current || !proPos) return;
    const map = mapRef.current;

    // Move or create pro marker
    if (proMarkerRef.current) {
      proMarkerRef.current.setLngLat(proPos);
    } else {
      proMarkerRef.current = new mapboxgl.Marker({ element: makeProEl(booking?.service_type), anchor: "center" })
        .setLngLat(proPos)
        .setPopup(new mapboxgl.Popup({ offset: 30, closeButton: false }).setText(`${proName} · En route`))
        .addTo(map);
    }

    // Draw/update route between pro and customer
    if (!custPos || !TOKEN) return;
    const coords = `${proPos[0]},${proPos[1]};${custPos[0]},${custPos[1]}`;
    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`)
      .then(r => r.json())
      .then(d => {
        const route = d.routes?.[0];
        if (!route || !mapRef.current) return;

        setEta(Math.round(route.duration / 60));

        const geojson = { type: "Feature", geometry: route.geometry };

        if (mapRef.current.getSource("route")) {
          mapRef.current.getSource("route").setData(geojson);
        } else {
          // Wait for map style to load before adding layers
          const addLayers = () => {
            if (!mapRef.current) return;
            mapRef.current.addSource("route", { type: "geojson", data: geojson });
            // Casing (white outline)
            mapRef.current.addLayer({
              id: "route-casing", type: "line", source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.6 },
            });
            // Main route line
            mapRef.current.addLayer({
              id: "route", type: "line", source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": svcColor, "line-width": 5, "line-opacity": 0.9 },
            });
            // Animated dash overlay
            mapRef.current.addLayer({
              id: "route-dash", type: "line", source: "route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#ffffff", "line-width": 2,
                "line-opacity": 0.7, "line-dasharray": [0, 4, 3],
              },
            });
            // Animate dashes
            let step = 0;
            const dashSeq = [[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,3,3]];
            const animate = () => {
              if (!mapRef.current) return;
              mapRef.current.setPaintProperty("route-dash", "line-dasharray", dashSeq[step % dashSeq.length]);
              step++;
              animFrameRef.current = requestAnimationFrame(() => setTimeout(animate, 80));
            };
            animate();
          };
          mapRef.current.isStyleLoaded() ? addLayers() : mapRef.current.once("load", addLayers);
        }

        // Fit both markers in view
        const bounds = new mapboxgl.LngLatBounds().extend(proPos).extend(custPos);
        mapRef.current.fitBounds(bounds, { padding: { top: 90, bottom: 160, left: 60, right: 60 }, maxZoom: 16, duration: 900 });
      })
      .catch(() => {});
  }, [proPos, custPos]);

  /* ── Render ── */
  const statusDot = liveStatus === "live"
    ? { bg: "#22c55e", label: "Live" }
    : liveStatus === "reconnecting"
    ? { bg: "#f59e0b", label: "Reconnecting…" }
    : { bg: "#94a3b8", label: "Connecting…" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#0f0e17" }}>

      {/* ── Header ── */}
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
          <div style={{ color:"#fff", fontWeight:800, fontSize:15, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {svcIcon} {proName}
          </div>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginTop:1 }}>
            {booking?.service_name || booking?.service_type} · On the way
          </div>
        </div>

        {/* Live badge */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"5px 12px", flexShrink:0,
        }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: statusDot.bg,
            boxShadow: liveStatus === "live" ? `0 0 6px ${statusDot.bg}` : "none",
          }}/>
          <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>{statusDot.label}</span>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex:1, position:"relative" }}>
        <div ref={mapContainerRef} style={{ position:"absolute", inset:0 }}/>

        {/* No token overlay */}
        {!TOKEN && (
          <div style={{
            position:"absolute", inset:0, background:"#1a1825",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12,
          }}>
            <div style={{ fontSize:52 }}>🗺️</div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>Map unavailable</div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, textAlign:"center", maxWidth:260, lineHeight:1.5 }}>
              Add <code style={{ background:"rgba(255,255,255,0.1)", padding:"2px 6px", borderRadius:6 }}>VITE_MAPBOX_TOKEN</code> in Vercel to enable live tracking
            </div>
          </div>
        )}

        {/* Waiting for pro location */}
        {TOKEN && !proPos && (
          <div style={{
            position:"absolute", top:16, left:"50%", transform:"translateX(-50%)",
            background:"rgba(26,24,37,0.92)", borderRadius:20, padding:"10px 20px",
            display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b",
              animation:"pulse-dot 1s ease-in-out infinite" }}/>
            <span style={{ color:"#fff", fontSize:12, fontWeight:600 }}>
              Waiting for {proName.split(" ")[0]} to share location…
            </span>
          </div>
        )}

        {/* ── ETA + Status pill ── */}
        {eta !== null && (
          <div style={{
            position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)",
            background:"rgba(26,24,37,0.96)", borderRadius:28,
            padding:"14px 32px", boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", gap:20,
            border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(12px)",
          }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>ETA</div>
              <div style={{ color:"#fff", fontSize:32, fontWeight:900, lineHeight:1 }}>
                {eta}<span style={{ fontSize:14, fontWeight:500, color:"rgba(255,255,255,0.5)" }}> min</span>
              </div>
            </div>
            <div style={{ width:1, height:44, background:"rgba(255,255,255,0.12)" }}/>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Status</div>
              <div style={{ color: svcColor, fontSize:15, fontWeight:800 }}>En Route 🚗</div>
            </div>
            <div style={{ width:1, height:44, background:"rgba(255,255,255,0.12)" }}/>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:800,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Service</div>
              <div style={{ color:"#fff", fontSize:13, fontWeight:700 }}>
                {booking?.service_name?.split(" ").slice(0,2).join(" ") || booking?.service_type}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2);   opacity: 0; }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }
        .mapboxgl-ctrl-logo { display:none !important; }
      `}</style>
    </div>
  );
}
