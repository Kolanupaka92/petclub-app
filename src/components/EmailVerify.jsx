import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";

/**
 * Confirms a new email address: sends a code to it, then checks the code.
 * The account's email only changes once the API accepts the code.
 */
export default function EmailVerify({ email, onVerified, onSkip, skipLabel = "Verify later" }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState("sending"); // sending | ready | checking
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const started = useRef(false);

  const send = useCallback(async () => {
    setState("sending"); setErr("");
    try { await api.requestEmailChange(email); setSent(true); setWait(60); }
    catch (e) { setErr(e.message || "Could not send the code."); }
    setState("ready");
  }, [email]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send();
  }, [send]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (e) => {
    e?.preventDefault();
    if (state !== "ready" || code.length !== 6) return;
    setState("checking"); setErr("");
    try { const r = await api.verifyEmailChange(email, code); onVerified(r.email); }
    catch (ex) { setErr(ex.message || "Could not verify the code."); setCode(""); setState("ready"); }
  };

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-sm text-gray-500">
        {sent ? <>We sent a 6-digit code to <strong className="text-gray-800 break-all">{email}</strong>. Check your spam folder too.</>
              : state === "sending" ? <>Sending a code to <strong className="text-gray-800 break-all">{email}</strong>…</>
              : <>We couldn&apos;t send a code to <strong className="text-gray-800 break-all">{email}</strong>.</>}
      </p>
      <label className="block">
        <span className="sr-only">6-digit code</span>
        <input
          autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
          value={code} disabled={!sent}
          onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(""); }}
          className="w-full h-14 border-2 border-gray-200 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-orange-500 disabled:bg-gray-50"
        />
      </label>
      {err && <p role="alert" className="text-red-600 text-sm font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>}
      <button type="submit" disabled={state !== "ready" || code.length !== 6}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl">
        {state === "checking" ? "Checking…" : "Confirm email"}
      </button>
      <div className="flex items-center justify-between text-xs font-semibold">
        <button type="button" onClick={onSkip} className="text-gray-400 hover:text-gray-700">{skipLabel}</button>
        {wait > 0 ? <span className="text-gray-400">Resend in {wait}s</span>
                  : <button type="button" onClick={send} disabled={state !== "ready"} className="text-orange-500 hover:text-orange-600 disabled:opacity-50">Resend code</button>}
      </div>
    </form>
  );
}
