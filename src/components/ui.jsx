import { useEffect } from "react";

export const Stars = ({ n }) => (
  <span className="text-amber-400 text-xs tracking-tight" aria-label={`${n} out of 5 stars`}>
    {"★".repeat(n)}
    <span className="text-gray-200">{"★".repeat(5 - n)}</span>
  </span>
);

export const Badge = ({ text, cls }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{text}</span>
);

export const Spinner = ({ className = "w-5 h-5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = ({ variant = "primary", loading, children, className = "", ...props }) => {
  const base =
    variant === "primary"
      ? "btn-primary flex items-center justify-center gap-2"
      : variant === "secondary"
        ? "btn-secondary"
        : "text-sm font-semibold text-brand-500 hover:text-brand-600 py-2 transition-colors";
  const { disabled, onClick, ...rest } = props;
  return (
    <button
      type="button"
      className={`${base} ${className}`}
      disabled={loading || disabled}
      onClick={onClick}
      {...rest}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
};

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
    <span className="text-5xl mb-4 opacity-80">{icon}</span>
    <p className="font-bold text-gray-700 mb-1">{title}</p>
    <p className="text-sm text-gray-400 max-w-xs mb-4">{description}</p>
    {action}
  </div>
);

export const Toast = ({ message, type = "success", onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles =
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-500" : "bg-gray-800";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] ${styles} text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 animate-slide-up max-w-[calc(100%-2rem)]`}
      role="status"
    >
      <span>{type === "success" ? "✓" : type === "error" ? "!" : "ℹ"}</span>
      {message}
    </div>
  );
};

export const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-slide-up sm:animate-fade-in-scale">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden shrink-0" aria-hidden="true" />
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h3 id="modal-title" className="font-bold text-gray-800 text-lg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
    {children}
  </div>
);

export const Input = ({ ...p }) => <input className="input-field" {...p} />;

export const Select = ({ opts, ...p }) => (
  <select className="input-field py-2.5" {...p}>
    {opts.map((o) => (
      <option key={o} value={o}>
        {o.charAt(0).toUpperCase() + o.slice(1)}
      </option>
    ))}
  </select>
);

export const Textarea = ({ ...p }) => <textarea className="input-field resize-none" rows={2} {...p} />;
