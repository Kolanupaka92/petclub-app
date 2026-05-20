/**
 * AddressPicker — Simple address autocomplete (Uber/Swiggy style)
 *
 * Type → suggestions appear below the input (via React Portal, works inside any modal)
 * Tap suggestion → address filled, lat/lng/postal captured
 * 🎯 GPS button → reverse geocode to real street address
 *
 * onChange({ address, lat, lng, postalCode, city, state })
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const MAPBOX = import.meta.env.VITE_MAPBOX_TOKEN;

/* ─── helpers ─────────────────────────────────────────────── */
const fromMapbox = (f) => {
  const ctx = f.context || [];
  const get = (p) => ctx.find(c => c.id?.startsWith(p))?.text || "";
  return {
    id: f.id, short: f.text, full: f.place_name,
    lat: f.center?.[1], lng: f.center?.[0],
    postalCode: get("postcode"), city: get("place"), state: get("region"),
  };
};

const fromNominatim = (f, i) => {
  const a = f.address || {};
  return {
    id: f.place_id || i,
    short: (f.display_name || "").split(", ")[0],
    full: f.display_name,
    lat: parseFloat(f.lat), lng: parseFloat(f.lon),
    postalCode: a.postcode || "",
    city: a.city || a.town || a.village || a.county || "",
    state: a.state || "",
  };
};

/* ─── Main component ───────────────────────────────────────── */
export function AddressPicker({ value, onChange, placeholder, countryCode = "in", className }) {
  const [query,       setQuery]       = useState(value || "");
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [confirmed,   setConfirmed]   = useState(!!value); // true once selected from list
  const [dropStyle,   setDropStyle]   = useState(null);    // {top,left,width} for portal

  const inputRef  = useRef(null);
  const debounce  = useRef(null);
  const skipBlur  = useRef(false); // prevent blur closing dropdown on tap

  /* sync external clear */
  useEffect(() => {
    if (!value) { setQuery(""); setConfirmed(false); setResults([]); }
  }, [value]);

  /* ── compute dropdown position (fixed = viewport-relative, no scrollY needed) ── */
  const calcPos = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropStyle({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  /* reposition on scroll/resize while open */
  useEffect(() => {
    if (!results.length) return;
    const update = () => calcPos();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [results.length, calcPos]);

  /* ── geocode ── */
  const search = async (q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      let list = [];
      if (MAPBOX) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
          + `?country=${countryCode.toUpperCase()}&types=address,place,locality,neighborhood,poi,postcode`
          + `&access_token=${MAPBOX}&limit=6&language=en`;
        const d = await fetch(url).then(r => r.json());
        list = (d.features || []).map(fromMapbox);
      } else {
        const url = `https://nominatim.openstreetmap.org/search`
          + `?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&countrycodes=${countryCode}&limit=6&accept-language=en`;
        const d = await fetch(url, { headers: { "Accept-Language": "en" } }).then(r => r.json());
        list = (d || []).map(fromNominatim);
      }
      setResults(list);
      if (list.length) calcPos();
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  /* ── handlers ── */
  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    setConfirmed(false);
    onChange({ address: v, lat: null, lng: null, postalCode: "", city: "", state: "" });
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(v), 320);
  };

  const pick = (item) => {
    setQuery(item.full);
    setConfirmed(true);
    setResults([]);
    onChange({ address: item.full, lat: item.lat, lng: item.lng,
               postalCode: item.postalCode, city: item.city, state: item.state });
  };

  /* ── GPS ── */
  const gps = () => {
    if (!navigator.geolocation) return alert("GPS not available on this device");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        let addr = "", postalCode = "", city = "", state = "";
        if (MAPBOX) {
          const d = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX}&limit=1&language=en`
          ).then(r => r.json());
          if (d.features?.[0]) { const r = fromMapbox(d.features[0]); addr=r.full; postalCode=r.postalCode; city=r.city; state=r.state; }
        } else {
          const d = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&accept-language=en`
          ).then(r => r.json());
          const r = fromNominatim(d, 0); addr=r.full; postalCode=r.postalCode; city=r.city; state=r.state;
        }
        if (addr && !addr.match(/^-?\d+\.\d+/)) {   // reject raw coords
          setQuery(addr); setConfirmed(true);
          onChange({ address: addr, lat, lng, postalCode, city, state });
        } else {
          alert("Couldn't get street address. Please type your address.");
        }
      } catch { alert("Couldn't fetch address. Please type your address."); }
      setGpsLoading(false);
    }, () => { setGpsLoading(false); alert("Location access denied. Please type your address."); },
    { timeout: 12000, maximumAge: 30000 });
  };

  const inputCls = (className ||
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm " +
    "focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 " +
    "bg-white placeholder-gray-400 transition") +
    (confirmed ? " border-emerald-400 pr-9" : results.length ? " border-orange-300 pr-9" : " pr-9");

  return (
    <div className="relative">
      {/* ── Input row ── */}
      <div className="flex items-center gap-2">
        {/* GPS button */}
        <button type="button" onClick={gps} disabled={gpsLoading} title="Use my location"
          className="shrink-0 w-11 h-11 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-500
            flex items-center justify-center hover:bg-orange-100 active:scale-95 transition disabled:opacity-50">
          {gpsLoading
            ? <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/>
            : <span className="text-lg">🎯</span>}
        </button>

        {/* Text input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => { if (results.length) calcPos(); }}
            onBlur={() => { if (skipBlur.current) { skipBlur.current = false; return; } setTimeout(() => setResults([]), 150); }}
            placeholder={placeholder || "Type your address…"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={inputCls}
          />
          {/* Status icon */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm">
            {loading    ? <span className="inline-block w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/> :
             confirmed  ? "✅" : "📍"}
          </span>
        </div>
      </div>

      {/* ── Verified pill ── */}
      {confirmed && query && (
        <div className="mt-1.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
          <span className="text-xs text-emerald-700 font-medium flex-1">✓ Address verified</span>
          <button type="button" onClick={() => { setQuery(""); setConfirmed(false); onChange({ address:"", lat:null, lng:null, postalCode:"", city:"", state:"" }); }}
            className="text-xs text-gray-400 hover:text-red-400 font-bold">✕</button>
        </div>
      )}

      {/* ── Suggestions via React Portal (escapes any modal/overflow) ── */}
      {results.length > 0 && dropStyle && createPortal(
        <div
          onPointerDown={() => { skipBlur.current = true; }}
          style={{
            position:  "fixed",
            top:       dropStyle.top,
            left:      dropStyle.left,
            width:     dropStyle.width,
            zIndex:    2147483647, // max z-index
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border:    "1px solid #f3f4f6",
            overflow:  "hidden",
          }}
        >
          {results.map((item, i) => (
            <button
              key={item.id || i}
              type="button"
              onPointerDown={() => { skipBlur.current = true; pick(item); }}
              style={{ width:"100%", textAlign:"left", padding:"12px 16px",
                borderBottom: i < results.length-1 ? "1px solid #f9fafb" : "none",
                display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer",
                background:"transparent" }}
              onMouseEnter={e => e.currentTarget.style.background="#fff7ed"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <span style={{ color:"#f97316", marginTop:2, fontSize:14, flexShrink:0 }}>📍</span>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#1f2937",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {item.short}
                </div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2,
                  overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {item.full}
                </div>
                {(item.postalCode || item.city) && (
                  <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                    {item.postalCode && <span style={{ fontSize:10, fontWeight:700, background:"#fff7ed",
                      color:"#ea580c", border:"1px solid #fed7aa", padding:"2px 6px", borderRadius:6 }}>
                      📮 {item.postalCode}</span>}
                    {item.city && <span style={{ fontSize:10, fontWeight:600, background:"#f9fafb",
                      color:"#374151", border:"1px solid #e5e7eb", padding:"2px 6px", borderRadius:6 }}>
                      {item.city}</span>}
                    {item.state && <span style={{ fontSize:10, color:"#9ca3af",
                      border:"1px solid #f3f4f6", padding:"2px 6px", borderRadius:6 }}>
                      {item.state}</span>}
                  </div>
                )}
              </div>
            </button>
          ))}
          <div style={{ padding:"6px 16px", background:"#f9fafb", borderTop:"1px solid #f3f4f6" }}>
            <span style={{ fontSize:10, color:"#9ca3af" }}>
              {MAPBOX ? "© Mapbox · © OpenStreetMap" : "© OpenStreetMap contributors"}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
