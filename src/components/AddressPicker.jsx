/**
 * AddressPicker — Uber/Ola-style address autocomplete
 * - 🎯 GPS "Use my location" button
 * - Live suggestions while typing (Mapbox primary, OpenStreetMap fallback)
 * - 📍 Static map pin preview after selection
 * - Touch-safe: onPointerDown prevents blur-before-select on mobile
 *
 * onChange({ address, lat, lng }) — always called with full object
 */
import { useState, useEffect, useRef } from "react";

const MAPBOX = import.meta.env.VITE_MAPBOX_TOKEN;

export function AddressPicker({ value, onChange, placeholder, countryCode = "in", className }) {
  const [query,          setQuery]          = useState(value || "");
  const [suggestions,    setSuggestions]    = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [gpsLoading,     setGpsLoading]     = useState(false);
  const [confirmedCoords,setConfirmedCoords]= useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Sync if parent clears the field
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close dropdown on outside click / tap
  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  /* ── Geocoding ── */
  const geocode = async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      let results = [];

      if (MAPBOX) {
        /* Mapbox Geocoding (preferred — accurate, fast, India-optimised) */
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?country=${countryCode.toUpperCase()}` +
          `&types=address,place,locality,neighborhood,poi,postcode` +
          `&access_token=${MAPBOX}&limit=7&language=en`;
        const d = await fetch(url).then(r => r.json());
        results = (d.features || []).map(f => ({
          id:    f.id,
          short: f.text,
          full:  f.place_name,
          lat:   f.center?.[1],
          lng:   f.center?.[0],
        }));
      } else {
        /* OpenStreetMap Nominatim — free fallback, no key needed */
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1` +
          `&countrycodes=${countryCode}&limit=7&accept-language=en`;
        const d = await fetch(url, { headers: { "Accept-Language": "en" } }).then(r => r.json());
        results = (d || []).map((f, i) => {
          const parts = (f.display_name || "").split(", ");
          return {
            id:    f.place_id || i,
            short: parts[0] || f.display_name,
            full:  f.display_name,
            lat:   parseFloat(f.lat),
            lng:   parseFloat(f.lon),
          };
        });
      }
      setSuggestions(results);
    } catch { setSuggestions([]); }
    finally   { setSearching(false); }
  };

  /* ── Handlers ── */
  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setConfirmedCoords(null);
    onChange({ address: v, lat: null, lng: null });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(v), 300);
  };

  // onPointerDown + preventDefault = stops blur before tap-select fires (mobile fix)
  const select = (s) => {
    setQuery(s.full);
    setConfirmedCoords({ lat: s.lat, lng: s.lng });
    onChange({ address: s.full, lat: s.lat, lng: s.lng });
    setSuggestions([]);
  };

  /* ── GPS ── */
  const useGPS = () => {
    if (!navigator.geolocation)
      return alert("GPS is not available on this device.");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          let addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if (MAPBOX) {
            const d = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
              `?access_token=${MAPBOX}&limit=1&language=en`
            ).then(r => r.json());
            addr = d.features?.[0]?.place_name || addr;
          } else {
            const d = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`
            ).then(r => r.json());
            addr = d.display_name || addr;
          }
          setQuery(addr);
          setConfirmedCoords({ lat, lng });
          onChange({ address: addr, lat, lng });
        } catch { /* silently use raw coords */ }
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert("Location access denied. Please allow location access and try again.");
      },
      { timeout: 12000, maximumAge: 30000 }
    );
  };

  /* ── Static map preview (Mapbox only) ── */
  const mapUrl = confirmedCoords && MAPBOX
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-l+f97316(${confirmedCoords.lng.toFixed(6)},${confirmedCoords.lat.toFixed(6)})/` +
      `${confirmedCoords.lng.toFixed(6)},${confirmedCoords.lat.toFixed(6)},15,0/` +
      `400x140@2x?access_token=${MAPBOX}`
    : null;

  const inputClass = className ||
    "w-full border border-gray-200 rounded-xl px-4 py-3 pr-9 text-sm " +
    "focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 " +
    "bg-white placeholder-gray-400 transition";

  return (
    <div ref={containerRef} className="relative">

      {/* ── Input row + GPS button ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useGPS}
          disabled={gpsLoading}
          title="Use my current location"
          className="shrink-0 w-11 h-11 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-500 flex items-center justify-center hover:bg-orange-100 active:scale-95 transition disabled:opacity-50">
          {gpsLoading
            ? <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/>
            : <span className="text-lg">🎯</span>}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder || "Start typing your address…"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />
          {searching
            ? <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin pointer-events-none"/>
            : confirmedCoords
              ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold pointer-events-none text-sm">✓</span>
              : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">📍</span>
          }
        </div>
      </div>

      {/* ── Suggestions dropdown ── */}
      {suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ zIndex: 99999, top: "100%" }}>
          {suggestions.map(s => (
            <button
              key={s.id}
              type="button"
              // onPointerDown + e.preventDefault() is the mobile fix:
              // it prevents the input's blur from firing BEFORE the tap completes,
              // so the dropdown stays visible long enough for the selection to register.
              onPointerDown={e => { e.preventDefault(); select(s); }}
              className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 active:bg-orange-100 border-b border-gray-50 last:border-0 transition-colors">
              <span className="text-orange-400 shrink-0 mt-0.5 text-sm">📍</span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-800 truncate">{s.short}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug"
                  style={{ display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {s.full}
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-medium">
              {MAPBOX ? "© Mapbox · © OpenStreetMap" : "© OpenStreetMap contributors"}
            </span>
          </div>
        </div>
      )}

      {/* ── Map pin preview after confirmed selection ── */}
      {mapUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm">
          <img
            src={mapUrl}
            alt="Selected location on map"
            className="w-full object-cover"
            style={{ height: 130 }}
            onError={e => e.target.parentElement.style.display = "none"}
          />
          <div className="bg-emerald-50 px-3 py-2 flex items-center gap-2">
            <span className="text-emerald-500 shrink-0 text-sm">📍</span>
            <p className="text-xs font-semibold text-emerald-800 truncate flex-1">{query}</p>
            <button
              type="button"
              onClick={() => { setConfirmedCoords(null); setQuery(""); onChange({ address: "", lat: null, lng: null }); }}
              className="text-xs text-gray-400 hover:text-red-400 shrink-0 font-bold transition">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
