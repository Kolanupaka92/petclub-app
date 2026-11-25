// Author: Sai Kolanupaka
import { useState, useEffect } from "react";
import { api } from "../../api.js";
import { AddressPicker } from "../../components/AddressPicker.jsx";
import EmailVerify from "../../components/EmailVerify.jsx";
import { getIdTypes, ROLE_CONFIG, SVC_OPTS } from "../../shared/proData.js";
import { Inp, Sel, Txta, PhotoUpload, PawLogo } from "../../shared/ui.jsx";

/* ══════════════════════════════════════════════
   PROFESSIONAL ONBOARDING (4 steps)
══════════════════════════════════════════════ */
export const ProfessionalOnboarding = ({ session, onComplete }) => {
  const subRole  = session.subRole || "Groomer";
  const idTypes  = getIdTypes(session.phone);
  const isIndia  = session.phone?.startsWith("+91");
  const currencySymbol = isIndia ? "₹" : "$";

  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);
  // If sub_role is missing (null in DB), let user pick it on Step 1
  const [pickedRole, setPickedRole] = useState(subRole !== "Groomer" || session.subRole ? subRole : null);
  // Use pickedRole if the user changed it in step 1; fall back to session-derived subRole
  const effectiveRole = pickedRole || subRole;
  const cfg      = ROLE_CONFIG[effectiveRole] || ROLE_CONFIG.Groomer;
  const [addrMeta, setAddrMeta] = useState({ lat: null, lng: null, postalCode: "", city: "", state: "" });

  const [form, setForm] = useState({
    name: session.name || "", email: session.email || "", dob: "", gender: "Male",
    address: "", area: "", city: session.city || "", pincode: "",
    services: [], pet_types: [], bio: "", langs: "", service_areas: "", experience: "<1 year",
    certification: "", license_number: "", clinic_name: "",
    has_salon: false, home_visit: false, mobile_van: false,
    group_classes: false, board_train: false, telemedicine: false, "24_7": false,
    priceA: "", priceB: "", priceC: "",
    idType: idTypes[0]?.value || "passport", idNumber: "",
  });

  const [addrLoading, setAddrLoading] = useState(false);

  const sf  = k => e  => setForm(f => ({ ...f, [k]: e.target.value }));
  const stg = k => ()  => setForm(f => ({ ...f, [k]: !f[k] }));
  const toggleSvc     = s => setForm(f => ({ ...f, services:  f.services.includes(s)  ? f.services.filter(x => x !== s)  : [...f.services,  s] }));
  const togglePetType = t => setForm(f => ({ ...f, pet_types: f.pet_types.includes(t) ? f.pet_types.filter(x => x !== t) : [...f.pet_types, t] }));

  // Auto-fill city/area from pincode or ZIP code
  useEffect(() => {
    const pin = form.pincode.trim();
    // 5s cap — postal lookup APIs are third-party and best-effort; don't hang the form on a slow network
    const withTimeout = url => fetch(url, { signal: AbortSignal.timeout(5000) });
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      // India — 6-digit pincode
      setAddrLoading(true);
      withTimeout(`https://api.postalpincode.in/${pin}`)
        .then(r => r.json())
        .then(data => {
          const po = data?.[0]?.PostOffice?.[0];
          if (po) {
            setForm(f => ({
              ...f,
              area: po.Name || f.area,
              city: po.District || po.Division || f.city,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setAddrLoading(false));
    } else if (pin.length === 5 && /^\d{5}$/.test(pin)) {
      // US — 5-digit ZIP
      setAddrLoading(true);
      withTimeout(`https://api.zippopotam.us/us/${pin}`)
        .then(r => r.json())
        .then(data => {
          const place = data?.places?.[0];
          if (place) {
            setForm(f => ({
              ...f,
              city:  place['place name'] || f.city,
              area:  (place['state abbreviation'] ? `${place['state abbreviation']}` : '') || f.area,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setAddrLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode]);

  const STEPS = [
    { n:"Basic Info",      icon:"👤" },
    { n:"Pro Details",     icon:"🎯" },
    { n:"Government ID",   icon:"🪪" },
    { n:"Review",          icon:"✅" },
  ];

  const canNext = [
    !!(form.name.trim() && form.city.trim() && (pickedRole || session.subRole)),
    !!(form.services.length > 0 && form.experience && form.bio.trim()),
    !!(form.idNumber.trim()),
    true,
  ];

  const [verifyEmail, setVerifyEmail] = useState(null); // new address awaiting its code

  const handleSubmit = async () => {
    setSaving(true);
    setSaveErr("");
    try {
      const saved = await api.updateMyProProfile({
        sub_role: pickedRole || subRole,    // always save sub_role so DB stays correct
        name: form.name, email: form.email?.trim().toLowerCase() || undefined, city: addrMeta.city || form.city, area: form.area,
        address: form.address, pincode: addrMeta.postalCode || form.pincode,
        address_lat: addrMeta.lat, address_lng: addrMeta.lng,
        address_postal_code: addrMeta.postalCode, address_state: addrMeta.state,
        bio: form.bio, experience: form.experience,
        services: form.services, pet_types: form.pet_types, service_areas: form.service_areas, langs: form.langs,
        certification: form.certification, license_number: form.license_number,
        clinic_name: form.clinic_name,
        price_basic: form.priceA, price_full: form.priceB, price_custom: form.priceC,
      });
      // Verification can't start without the ID, so never hide a failed upload.
      if (form.idNumber.trim()) {
        try {
          await api.uploadIdPhoto({
            docType: form.idType, docNumber: form.idNumber.trim(), docPhoto: idPhoto || undefined,
          });
        } catch {
          setSaving(false);
          setSaveErr("Your profile was saved, but your ID didn't upload. Please press Submit again.");
          return;
        }
      }
      setSaving(false);
      if (saved?.email_verification_required) { setVerifyEmail(form.email.trim().toLowerCase()); return; }
      onComplete(); // only called after a successful save
    } catch (e) {
      setSaving(false);
      setSaveErr(e.message || "Failed to save profile. Please check your connection and try again.");
    }
  };

  const selectedIdType = idTypes.find(t => t.value === form.idType) || idTypes[0];

  if (verifyEmail) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-extrabold text-gray-900">Confirm your email</h1>
        <EmailVerify email={verifyEmail} onVerified={() => onComplete()} onSkip={() => onComplete()} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.grad} px-5 pt-safe-top pb-6`}>
        <div className="max-w-xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-6">
            <PawLogo sz={28}/>
            <div>
              <span className="font-extrabold text-white text-base">PETclub</span>
              <span className="text-xs text-white/70 ml-2">Professional Setup</span>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${i < step-1 ? "bg-white text-emerald-600" : i === step-1 ? "bg-white/20 border-2 border-white text-white" : "bg-white/10 text-white/40"}`}>
                    {i < step-1 ? "✓" : s.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${i === step-1 ? "text-white" : "text-white/40"}`}>{s.n}</span>
                </div>
                {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step-1 ? "bg-white" : "bg-white/20"}`}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Basic Information</h2>

            {/* Role picker — shown if sub_role wasn't set in DB */}
            {!session.subRole ? (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 mb-2">I am a… *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{id:"Groomer",icon:"✂️"},{id:"Trainer",icon:"🐕‍🦺"},{id:"Vet",icon:"🏥"},{id:"Walker",icon:"🦮"},{id:"Boarding",icon:"🏠"}].map(r => (
                    <button key={r.id} type="button" onClick={() => setPickedRole(r.id)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${pickedRole === r.id ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <span className="text-xl">{r.icon}</span>{r.id}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-5">Registering as <strong className="text-orange-500">{pickedRole || subRole}</strong></p>
            )}
            <Inp label="Full Name *" placeholder="e.g. Arjun Kumar Mehta" value={form.name} onChange={sf("name")}/>
            <Inp label="Email Address" type="email" placeholder="you@gmail.com" value={form.email} onChange={sf("email")}/>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Date of Birth" type="date" max={new Date().toISOString().split("T")[0]} value={form.dob} onChange={sf("dob")}/>
              <Sel label="Gender" opts={["Male","Female","Other"]} value={form.gender} onChange={sf("gender")}/>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Address *</label>
              <AddressPicker
                value={form.address}
                onChange={({ address, lat, lng, postalCode, city, state }) => {
                  setForm(f => ({
                    ...f,
                    address,
                    pincode: postalCode || f.pincode,
                    city: city || f.city,
                  }));
                  setAddrMeta({ lat: lat || null, lng: lng || null, postalCode: postalCode || "", city: city || "", state: state || "" });
                }}
                placeholder="Start typing your address…"
                token={session.token}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Inp label="PIN / ZIP" placeholder={isIndia ? "500074" : "90210"} maxLength={6} value={form.pincode} onChange={sf("pincode")}/>
                {addrLoading && <div className="absolute right-3 top-9 w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"/>}
                {!addrLoading && form.city && form.pincode.length >= 5 && <div className="absolute right-3 top-9 text-emerald-500 text-sm">✓</div>}
              </div>
              <Inp label="Area / Locality" placeholder={isIndia ? "LB Nagar" : "Uptown"} value={form.area} onChange={sf("area")}/>
              <Inp label="City *" placeholder={isIndia ? "Hyderabad" : "Richardson"} value={form.city} onChange={sf("city")}/>
            </div>
          </div>
        )}

        {/* ── STEP 2: Role-Specific Professional Details ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">
              {({ Groomer:"Grooming Profile", Trainer:"Training Profile", Vet:"Veterinary Profile", Walker:"Dog Walker Profile", Boarding:"Pet Boarding Profile" })[effectiveRole] || "Professional Profile"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">Services, expertise & pricing</p>

            {/* Services */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Services Offered * (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {(SVC_OPTS[effectiveRole] || []).map(s => (
                  <button key={s} type="button" onClick={() => toggleSvc(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.services.includes(s) ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={form.services.includes(s) ? { background: cfg.accent } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Animals / Pet Types Served */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">🐾 Animals You Work With (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {(effectiveRole === "Vet"
                  ? ["🐕 Dogs","🐈 Cats","🐦 Birds","🐇 Rabbits","🐹 Small Animals","🦎 Reptiles / Exotics","🐟 Fish / Aquatic"]
                  : ["🐕 Dogs","🐈 Cats","🐦 Birds","🐇 Small Animals (rabbits, guinea pigs…)","🦜 Exotic Pets"]
                ).map(t => (
                  <button key={t} type="button" onClick={() => togglePetType(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${form.pet_types.includes(t) ? "text-white border-transparent shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    style={form.pet_types.includes(t) ? { background: cfg.accent } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Role-specific fields */}
            {cfg.fields.map(f => f.type === "select"
              ? <Sel key={f.key} label={f.label + " *"} opts={f.opts} value={form[f.key]} onChange={sf(f.key)}/>
              : <Inp key={f.key} label={f.label} placeholder={f.placeholder} value={form[f.key]} onChange={sf(f.key)}/>
            )}

            {/* Bio */}
            <Txta label={`About You / Bio *`} placeholder={cfg.bioHint} value={form.bio} onChange={sf("bio")} rows={4}/>

            {/* Pricing */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Pricing per session ({currencySymbol})</label>
              <div className="grid grid-cols-3 gap-2">
                <Inp label={cfg.pricing.a} type="number" placeholder={isIndia?"599":"29"}  value={form.priceA} onChange={sf("priceA")}/>
                <Inp label={cfg.pricing.b} type="number" placeholder={isIndia?"999":"59"}  value={form.priceB} onChange={sf("priceB")}/>
                <Inp label={cfg.pricing.c} type="number" placeholder={isIndia?"1499":"99"} value={form.priceC} onChange={sf("priceC")}/>
              </div>
            </div>

            {/* Extras / capabilities */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Additional capabilities</label>
              <div className="space-y-2">
                {cfg.extras.map(e => (
                  <label key={e.key} className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${form[e.key] ? "border-transparent" : "border-gray-300"}`}
                      style={form[e.key] ? { background: cfg.accent } : {}}
                      onClick={stg(e.key)}>
                      {form[e.key] && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-gray-700">{e.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Government ID ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Government ID Verification</h2>
            <p className="text-sm text-gray-400 mb-5">
              Required to get verified on PETclub. Your ID is reviewed only by admins and never shared publicly.
            </p>

            {/* Country badge */}
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-5 ${isIndia ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200"}`}>
              <span className="text-2xl">{isIndia ? "🇮🇳" : "🇺🇸"}</span>
              <div>
                <div className="text-xs font-bold text-gray-700">{isIndia ? "India — Accepted IDs" : "USA — Accepted IDs"}</div>
                <div className="text-xs text-gray-500">{isIndia ? "Aadhar, PAN, Passport, Driving License" : "Passport, Driver's License, State ID"}</div>
              </div>
            </div>

            <Sel label="ID Type *"
              opts={idTypes.map(t => ({ value: t.value, label: t.label }))}
              value={form.idType} onChange={sf("idType")}/>

            <Inp label={`${selectedIdType?.label} Number *`}
              placeholder={selectedIdType?.hint || "Enter ID number"}
              value={form.idNumber} onChange={sf("idNumber")}/>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Upload Photo of ID * (front side)</label>
              <PhotoUpload
                value={idPhoto}
                onChange={(base64) => setIdPhoto(base64)}
                label="Tap to upload ID photo"
                hint="Clear, readable photo · JPG / PNG · Max 5 MB"/>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">🔒</span>
              <span>Your ID is stored securely and used only for identity verification. It will never be shown to customers or other professionals.</span>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-5">Review & Submit</h2>

            {/* Profile card preview */}
            <div className={`bg-gradient-to-br ${cfg.grad} rounded-2xl p-5 text-white text-center mb-5`}>
              <div className="text-5xl mb-2">{({ Groomer:"✂️", Trainer:"🐕‍🦺", Vet:"🏥", Walker:"🦮", Boarding:"🏠", Admin:"🛡️", customer:"🐕" })[effectiveRole] || "👤"}</div>
              <div className="font-bold text-xl">{form.name || "—"}</div>
              <div className="text-white/80 text-sm">{effectiveRole} · {form.city || "—"}</div>
              {form.experience && <div className="text-white/60 text-xs mt-1">{form.experience} experience</div>}
            </div>

            {/* Summary rows */}
            <div className="space-y-0 divide-y divide-gray-50 mb-5">
              {[
                ["📱", "Phone",      session.phone],
                ["📧", "Email",      form.email || "—"],
                ["📍", "City",       form.city || "—"],
                ["💼", "Experience", form.experience || "—"],
                ["🎯", "Services",   form.services.length ? `${form.services.slice(0,3).join(", ")}${form.services.length > 3 ? ` +${form.services.length-3} more` : ""}` : "—"],
                ["🪪", "ID Type",    selectedIdType?.label || "—"],
                ["🔢", "ID Number",  form.idNumber ? `${form.idNumber.slice(0,4)}••••` : "—"],
              ].map(([icon, l, v]) => (
                <div key={l} className="flex items-center gap-3 py-3 text-sm">
                  <span className="text-base w-6 shrink-0">{icon}</span>
                  <span className="text-gray-400 font-medium w-24 shrink-0">{l}</span>
                  <span className="font-semibold text-gray-700 truncate">{v}</span>
                </div>
              ))}
            </div>

            {/* Availability control highlight */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 mb-4">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">🟢</span>
                <div>
                  <strong className="block mb-1">Your schedule, your terms.</strong>
                  Take total control of your schedule. Toggle your status to <strong>Active</strong> or <strong>Offline</strong> with a single tap to instantly manage your local {isIndia ? "70 km" : "30 mile"} radius booking broadcasts — no calls, no back-and-forth.
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-5">
              <strong>⏳ What happens next?</strong><br/>
              Your profile will be reviewed within <strong>24–48 hours</strong>. We'll send you a confirmation by email and SMS once approved.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)}
              className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => canNext[step-1] && setStep(s => s+1)}
              className={`flex-1 font-bold py-3 rounded-2xl transition-all text-sm ${canNext[step-1] ? `bg-gradient-to-r ${cfg.grad} text-white shadow-sm hover:opacity-90` : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className={`flex-1 bg-gradient-to-r ${cfg.grad} text-white font-bold py-3 rounded-2xl shadow-sm hover:opacity-90 disabled:opacity-60 transition text-sm`}>
              {saving ? "Submitting…" : "Submit Profile 🐾"}
            </button>
          )}
        </div>
        {saveErr && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">
            <span>⚠️</span><span>{saveErr}</span>
          </div>
        )}
        {step === 3 && (
          <button onClick={() => setStep(4)} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 py-2 text-center transition-colors">
            Skip ID upload for now →
          </button>
        )}
      </div>
    </div>
  );
};
