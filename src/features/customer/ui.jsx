import { useEffect } from "react";

export const Spinner = ({ sm }) => <div className={`border-2 border-orange-400 border-t-transparent rounded-full animate-spin ${sm ? "w-4 h-4" : "w-8 h-8"}`} />;

export const Skeleton = ({ h = "h-4", w = "w-full", cls = "" }) => <div className={`${h} ${w} bg-gray-200 rounded-xl animate-pulse ${cls}`} />;

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
    <div className="flex items-center gap-3"><Skeleton h="h-10" w="w-10" cls="rounded-xl shrink-0"/><div className="flex-1 space-y-2"><Skeleton h="h-4" w="w-3/4"/><Skeleton h="h-3" w="w-1/2"/></div></div>
    <Skeleton h="h-3" w="w-full"/><Skeleton h="h-3" w="w-2/3"/>
  </div>
);

export const Bdg = ({ text, cls }) => <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{text}</span>;

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition-colors">✕</button>
        </div>
        <div className="modal-scroll flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

export function Fld({ label, children }) {
  return <div className="mb-3.5"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>{children}</div>;
}

export function Inp(props) {
  return <input className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all touch-manipulation" {...props} />;
}

export function Sel({ opts, ...props }) {
  return <select className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-orange-400 bg-white touch-manipulation" {...props}>{opts.map(o => <option key={o}>{o}</option>)}</select>;
}

export function Txta(props) {
  return <textarea className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-orange-400 resize-none touch-manipulation" rows={3} {...props} />;
}

export function Stars({ n }) {
  return <span>{Array.from({length:5},(_,i)=><span key={i} className={i<n?"text-amber-400":"text-gray-200"}>★</span>)}</span>;
}

export function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const bg = type === "error" ? "bg-red-500" : "bg-green-500";
  return (
    <div className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 ${bg} text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-slide-up max-w-xs text-center`}>
      {msg}
    </div>
  );
}
