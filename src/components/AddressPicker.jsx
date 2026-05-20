/**
 * AddressPicker — Uber/Ola-style address autocomplete with postal validation
 *
 * Features:
 *  - 🎯 GPS "Use my location" button with reverse geocoding
 *  - Live suggestions while typing (Mapbox primary, OpenStreetMap fallback)
 *  - Extracts postalCode / city / state from every suggestion
 *  - ✅ Shows a "Verified" badge: pincode · city · state after selection
 *  - ⚠️  Warns when user types free text without selecting from the list
 *  - 📍 Static map pin preview after selection (Mapbox only)
 *  - Mobile-safe: onPointerDown prevents blur-before-select race
 *
 * onChange({ address, lat, lng, postalCode, city, state }) — always an object
 */
import { useState, useEffect, useRef } from "react";

const MAPBOX = import.meta.env.VITE_MAPBOX_TOKEN;

/* ── Extract structured fields from Mapbox context array ── */
const fromMapbox = (f) => {
  const ctx = f.context || [];
  const get = (prefix) => ctx.find(c => c.id?.startsWith(prefix))?.text || "";
  return {
    id:         f.id,
    short:      f.text,
    full:       f.place_name,
    lat:        f.center?.[1],
    lng:        f.center?.[0],
    postalCode: get("postcode"),
    city:       get("place"),
    state:      get("region"),
    suburb:     get("locality") || get("neighborhood"),
  };
};

/* ── Extract structured fields from Nominatim response ── */
const fromNominatim = (f, i) => {
  const addr  = f.address || {};
  const parts = (f.display_name || "").split(", ");
  return {
    id:         f.place_id || i,
    short:      parts[0] || f.display_name,
    full:       f.display_name,
    lat:        parseFloat(f.lat),
    lng:        parseFloat(f.lon),
    postalCode: addr.postcode || "",
    city:       addr.city || addr.town || addr.village || addr.county || "",
    state:      addr.state || "",
    suburb:     addr.suburb || addr.neighbourhood || addr.quarter || "",
  };
};

export function AddressPicker({ value, onChange, placeholder, countryCode = "in", className }) {
  const [query,           setQuery]           = useState(value || "");
  const [suggestions,     setSuggestions]     = useState([]);
  const [searching,       setSearching]       = useState(false);
  const [gpsLoading,      setGpsLoading]      = useState(false);
  const [confirmedCoords, setConfirmedCoords] = useState(null);
  const [confirmedDetails,setConfirmedDetails]= useState(null); // { postalCode, city, state }
  const [showUnverified,  setShowUnverified]  = useState(false);
  const debounceRef  = useRef(null);
  const containerRef = useRef(null);

  /* Sync if parent clears the field */
  useEffect(() => {
    if (!value) {
      setQuery("");
      setConfirmedCoords(null);
      setConfirmedDetails(null);
      setShowUnverified(false);
    } else {
      setQuery(value);
    }
  }, [value]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([]);
        // If user has typed 3+ chars but never selected → show warning
        if (query.length >= 3 && !confirmedCoords) setShowUnverified(true);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [query, confirmedCoords]);

  /* ── Geocoding ── */
  const geocode = async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      let results = [];
      if (MAPBOX) {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?country=${countryCode.toUpperCase()}` +
          `&types=address,place,locality,neighborhood,poi,postcode` +
          `&access_token=${MAPBOX}&limit=7&language=en`;
        const d = await fetch(url).then(r => r.json());
        results = (d.features || []).map(fromMapbox);
      } else {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1` +
          `&countrycodes=${countryCode}&limit=7&accept-language=en`;
        const d = await fetch(url, { headers: { "Accept-Language": "en" } }).then(r => r.json());
        results = (d || []).map(fromNominatim);
      }
      setSuggestions(results);
    } catch { setSuggestions([]); }
    finally  { setSearching(false); }
  };

  /* ── Handlers ── */
  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setConfirmedCoords(null);
    setConfirmedDetails(null);
    setShowUnverified(false);
    onChange({ address: v, lat: null, lng: null, postalCode: "", city: "", state: "" });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => geocode(v), 300);
  };

  /* onPointerDown + preventDefault = stops blur before tap-select fires (mobile fix) */
  const select = (s) => {
    setQuery(s.full);
    setConfirmedCoords({ lat: s.lat, lng: s.lng });
    setConfirmedDetails({ postalCode: s.postalCode, city: s.city, state: s.state });
    setShowUnverified(false);
    onChange({
      address:    s.full,
      lat:        s.lat,
      lng:        s.lng,
      postalCode: s.postalCode,
      city:       s.city,
      state:      s.state,
    });
    setSuggestions([]);
  };

  const clearAddress = () => {
    setConfirmedCoords(null);
    setConfirmedDetails(null);
    setQuery("");
    setShowUnverified(false);
    onChange({ address: "", lat: null, lng: null, postalCode: "", city: "", state: "" });
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
          let postalCode = "", city = "", state = "";
          if (MAPBOX) {
            const d = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
              `?access_token=${MAPBOX}&limit=1&language=en`
            ).then(r => r.json());
            if (d.features?.[0]) {
              const r = fromMapbox(d.features[0]);
              addr = r.full; postalCode = r.postalCode; city = r.city; state = r.state;
            }
          } else {
            const d = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&accept-language=en`
            ).then(r => r.json());
            const r = fromNominatim(d, 0);
            addr = r.full; postalCode = r.postalCode; city = r.city; state = r.state;
          }
          setQuery(addr);
          setConfirmedCoords({ lat, lng });
          setConfirmedDetails({ postalCode, city, state });
          onChange({ address: addr, lat, lng, postalCode, city, state });
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
            className={`${inputClass}${showUnverified ? " border-amber-300 focus:border-amber-400 focus:ring-amber-100" : ""}`}
          />
          {searching
            ? <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin pointer-events-none"/>
            : confirmedCoords
              ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold pointer-events-none text-sm">✓</span>
              : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">📍</span>
          }
        </div>
      </div>

      {/* ── Unverified warning ── */}
      {showUnverified && !confirmedCoords && query.length >= 3 && (
        <div className="mt-1.5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span className="text-amber-500 text-sm shrink-0">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">
            Please select an address from the dropdown to verify pincode &amp; city.
          </p>
        </div>
      )}

      {/* ── Suggestions dropdown ── */}
      {suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ zIndex: 99999, top: "100%" }}>
          {suggestions.map(s => (
            <button
              key={s.id}
              type="button"
              onPointerDown={e => { e.preventDefault(); select(s); }}
              className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 active:bg-orange-100 border-b border-gray-50 last:border-0 transition-colors">
              <span className="text-orange-400 shrink-0 mt-0.5 text-sm">📍</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-800 truncate">{s.short}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug"
                  style={{ display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {s.full}
                </div>
                {/* Show postal/city/state inline in suggestion */}
                {(s.postalCode || s.city || s.state) && (
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {s.postalCode && (
                      <span className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-md">
                        📮 {s.postalCode}
                      </span>
                    )}
                    {s.city && (
                      <span className="text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-md">
                        {s.city}
                      </span>
                    )}
                    {s.state && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                        {s.state}
                      </span>
                    )}
                  </div>
                )}
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

      {/* ── Verified address badge after confirmed selection ── */}
      {confirmedDetails && confirmedCoords && (
        <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <span className="text-emerald-500 text-sm shrink-0 font-bold">✓</span>
          <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
            {confirmedDetails.postalCode && (
              <span className="text-[11px] font-extrabold bg-white border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-lg">
                📮 {confirmedDetails.postalCode}
              </span>
            )}
            {confirmedDetails.city && (
              <span className="text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg">
                {confirmedDetails.city}
              </span>
            )}
            {confirmedDetails.state && (
              <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                {confirmedDetails.state}
              </span>
            )}
            {!confirmedDetails.postalCode && !confirmedDetails.city && (
              <span className="text-xs text-emerald-700 font-medium">Address verified via GPS</span>
            )}
          </div>
          <button
            type="button"
            onClick={clearAddress}
            title="Clear address"
            className="text-xs text-gray-400 hover:text-red-400 shrink-0 font-bold transition ml-1">✕</button>
        </div>
      )}

      {/* ── Map pin preview after confirmed selection (Mapbox only) ── */}
      {mapUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm">
          <img
            src={mapUrl}
            alt="Selected location on map"
            className="w-full object-cover"
            style={{ height: 120 }}
            onError={e => e.target.parentElement.style.display = "none"}
          />
        </div>
      )}
    </div>
  );
}
