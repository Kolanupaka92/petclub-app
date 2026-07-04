import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { api } from "../../api.js";
import { Spinner, Modal } from "./ui.jsx";

// Module-level cache — loadStripe must only be called once per publishable key
let _stripePromise = null;
const getStripe = (key) => {
  if (!_stripePromise) _stripePromise = loadStripe(key);
  return _stripePromise;
};

/* Inner form — must live inside <Elements> to use the hooks */
function PayForm({ amountLabel, onPaid, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErrMsg("");
    // Stay in-app when possible; card payments never redirect
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setErrMsg(error.message || "Payment failed. Please try again.");
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid(paymentIntent);
    } else {
      onError(new Error(`Unexpected payment status: ${paymentIntent?.status}`));
    }
    setPaying(false);
  };

  return (
    <div>
      {!ready && <div className="flex justify-center py-8"><Spinner /></div>}
      <PaymentElement onReady={() => setReady(true)} />
      {errMsg && <p className="text-xs text-red-500 font-semibold mt-3">{errMsg}</p>}
      {ready && (
        <button onClick={pay} disabled={paying || !stripe}
          className="btn-primary mt-4 flex items-center justify-center gap-2">
          {paying ? <Spinner sm /> : `Pay ${amountLabel}`}
        </button>
      )}
      <p className="text-[10px] text-gray-400 text-center mt-3">🔒 Secured by Stripe. Card details never touch PETclub servers.</p>
    </div>
  );
}

/* ── STRIPE PAY MODAL — USD bookings. Fetches config + PaymentIntent, then
     renders the Payment Element. Backend is env-gated: coming_soon shows a
     friendly placeholder instead of a checkout. ── */
export default function StripePayModal({ booking, onClose, onPaid, showToast }) {
  const [state, setState] = useState({ phase: "loading" }); // loading | coming_soon | ready | error

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cfg = await api.getStripeConfig();
        if (!alive) return;
        if (!cfg.enabled || cfg.coming_soon || !cfg.key) { setState({ phase: "coming_soon" }); return; }
        const intent = await api.createStripeIntent(booking.id);
        if (!alive) return;
        setState({ phase: "ready", stripe: getStripe(cfg.key), clientSecret: intent.client_secret });
      } catch (e) {
        if (!alive) return;
        // create-intent 503s with coming_soon while keys are unset
        if (/coming|not configured/i.test(e.message || "")) setState({ phase: "coming_soon" });
        else setState({ phase: "error", msg: e.message });
      }
    })();
    return () => { alive = false; };
  }, [booking.id]);

  const amountLabel = `$${parseFloat(booking.total_amount || booking.amount).toFixed(2)}`;

  return (
    <Modal title={`Pay ${amountLabel}`} onClose={onClose}>
      {state.phase === "loading" && (
        <div className="flex flex-col items-center py-10 gap-3">
          <Spinner />
          <p className="text-xs text-gray-400 font-semibold">Preparing secure checkout…</p>
        </div>
      )}

      {state.phase === "coming_soon" && (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">💳</div>
          <h4 className="font-extrabold text-gray-900 mb-1">Card payments coming soon</h4>
          <p className="text-sm text-gray-500 mb-5">In-app card payment is almost ready in your region. For now, pay your professional at the time of service.</p>
          <button onClick={onClose} className="btn-primary w-auto px-8 inline-flex">Got it</button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-sm text-gray-500 mb-5">{state.msg || "Couldn't start checkout. Please try again."}</p>
          <button onClick={onClose} className="btn-primary w-auto px-8 inline-flex">Close</button>
        </div>
      )}

      {state.phase === "ready" && (
        <Elements stripe={state.stripe} options={{
          clientSecret: state.clientSecret,
          appearance: { theme: "stripe", variables: { colorPrimary: "#f97316", borderRadius: "12px", fontFamily: "inherit" } },
        }}>
          <PayForm
            amountLabel={amountLabel}
            onPaid={() => { showToast("✅ Payment successful!"); onPaid(); }}
            onError={(e) => showToast(e.message || "Payment failed", "error")}
          />
        </Elements>
      )}
    </Modal>
  );
}
