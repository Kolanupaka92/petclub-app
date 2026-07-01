import { useState, useRef } from "react";

/* ── Shared UI ── */
export const PawLogo = ({ sz = 36 }) => (
  <img src="/icon.svg" alt="PETclub" width={sz} height={sz} style={{ borderRadius: sz * 0.22 }} />
);

export const Bdg = ({ text, cls = "" }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>{text}</span>
);

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-2xl`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition">&times;</button>
      </div>
      <div className="px-6 py-5 max-h-[75dvh] modal-scroll">{children}</div>
    </div>
  </div>
);

export const Inp = ({ label, hint, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white placeholder-gray-400 touch-manipulation" {...p} />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const Sel = ({ label, opts, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white" {...p}>
      {opts.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Txta = ({ label, ...p }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none bg-white placeholder-gray-400" rows={3} {...p} />
  </div>
);

export const Spinner = ({ full }) => (
  <div className={`flex items-center justify-center ${full ? "min-h-screen" : "py-16"}`}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"/>
      <span className="text-sm text-gray-400 font-medium">Loading…</span>
    </div>
  </div>
);

export const EmptyState = ({ icon, title, desc }) => (
  <div className="text-center py-16 px-4">
    <div className="text-5xl mb-4">{icon}</div>
    <div className="font-bold text-gray-700 text-base mb-1">{title}</div>
    {desc && <div className="text-sm text-gray-400">{desc}</div>}
  </div>
);

export const StatCard = ({ icon, label, value, sub, gradient, onClick }) => (
  <div onClick={onClick} className={`rounded-2xl p-4 ${gradient} text-white ${onClick ? "cursor-pointer hover:opacity-90 transition" : ""}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl font-extrabold tracking-tight">{value}</div>
    <div className="text-xs font-semibold opacity-80 mt-0.5">{label}</div>
    {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
  </div>
);

/* ── Photo uploader (reusable) ── */
export const PhotoUpload = ({ value, onChange, label = "Upload photo", hint = "JPG / PNG · Max 5 MB" }) => {
  const fileRef = useRef(null);
  const handle = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("File too large — max 5 MB"); return; }
    const r = new FileReader();
    r.onload = ev => onChange(ev.target.result, f.name);
    r.readAsDataURL(f);
  };
  return (
    <div className="mb-4">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
          <img src={value} alt="upload" className="w-full h-32 object-cover"/>
          <button type="button" onClick={() => onChange(null, "")}
            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600">×</button>
          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Uploaded</div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:bg-gray-50 hover:border-orange-300 transition-all bg-white"
          onClick={() => fileRef.current?.click()}>
          <span className="text-3xl mb-2">📷</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-400 mt-1">{hint}</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handle}/>
        </label>
      )}
    </div>
  );
};
