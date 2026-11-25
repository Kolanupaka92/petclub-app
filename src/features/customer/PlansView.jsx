// Author: Sai Kolanupaka
import { useState, useEffect } from "react";
import { api } from "../../api.js";
import { fmtDate } from "../../data/mockData.js";
import { Spinner, SkeletonCard, Bdg, Modal } from "./ui.jsx";

// Icon + accent per plan service_type (grooming | walking | boarding | membership)
const PLAN_META = {
  grooming:   { icon: "🛁", bg: "bg-violet-50",  accent: "border-l-violet-500",  chip: "bg-violet-100 text-violet-700" },
  walking:    { icon: "🦮", bg: "bg-green-50",   accent: "border-l-green-500",   chip: "bg-green-100 text-green-700" },
  boarding:   { icon: "🏠", bg: "bg-amber-50",   accent: "border-l-amber-500",   chip: "bg-amber-100 text-amber-700" },
  membership: { icon: "👑", bg: "bg-orange-50",  accent: "border-l-orange-500",  chip: "bg-orange-100 text-orange-700" },
};

const INTERVAL_LABEL = { monthly: "mo", quarterly: "qtr", yearly: "yr" };

/* ── PLANS VIEW — recurring care plans: browse, subscribe, cancel ── */
export default function PlansView({ isUSD, currencySymbol, numLocale, showToast }) {
  const [plans, setPlans] = useState(null);          // null = loading, [] = loaded empty
  const [mySubs, setMySubs] = useState([]);
  const [loadErr, setLoadErr] = useState(false);
  const [subscribing, setSubscribing] = useState(null);   // plan_id in flight
  const [cancelSub, setCancelSub] = useState(null);       // subscription pending cancel confirm
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = () => {
    setLoadErr(false);
    Promise.all([
      api.getSubscriptionPlans(),
      api.getMySubscriptions().catch(() => ({ subscriptions: [] })),
    ]).then(([p, s]) => {
      setPlans(p.plans || []);
      setMySubs(s.subscriptions || []);
    }).catch(() => { setPlans([]); setLoadErr(true); });
  };
  useEffect(load, []);

  const planPrice = (plan) => isUSD ? plan.price_usd : plan.price_inr;
  const activeSubFor = (planId) => mySubs.find(s => s.plan_id === planId && s.status === "active")
    // /subscriptions/me embeds the plan instead of returning plan_id — match by name too
    || mySubs.find(s => s.status === "active" && s.subscription_plans?.name === plans?.find(p => p.id === planId)?.name);

  const doSubscribe = async (plan) => {
    setSubscribing(plan.id);
    try {
      await api.subscribe(plan.id);
      showToast(`✅ Subscribed to ${plan.name}!`);
      load();
    } catch (e) { showToast(e.message || "Could not subscribe", "error"); }
    setSubscribing(null);
  };

  const doCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await api.cancelSubscription(cancelSub.id);
      showToast(res.message || "Subscription canceled");
      setCancelSub(null);
      load();
    } catch (e) { showToast(e.message || "Could not cancel", "error"); }
    setCancelLoading(false);
  };

  return (
    <div className="p-4 animate-fade-in">
      <h1 className="text-xl font-black text-gray-900 mb-1">Care Plans 💎</h1>
      <p className="text-sm text-gray-400 mb-4">Save on the care your pet gets every month.</p>

      {plans === null && <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}

      {loadErr && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-2">📡</div>
          <p className="font-bold text-gray-500 mb-3">Couldn't load plans</p>
          <button onClick={load} className="text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 rounded-xl px-5 py-2 hover:bg-orange-100 transition">↻ Retry</button>
        </div>
      )}

      <div className="space-y-3">
        {plans?.map(plan => {
          const meta = PLAN_META[plan.service_type] || PLAN_META.membership;
          const sub = activeSubFor(plan.id);
          const canceled = sub && sub.canceled_at;
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden border-l-4 ${meta.accent}`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 ${meta.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-extrabold text-gray-900 leading-tight">{plan.name}</div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-gray-900">{currencySymbol}{parseFloat(planPrice(plan)).toLocaleString(numLocale)}</span>
                        <span className="text-[11px] text-gray-400 font-semibold">/{INTERVAL_LABEL[plan.interval] || plan.interval}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  </div>
                </div>

                {plan.discount_pct > 0 && (
                  <div className="mt-2.5"><Bdg text={`${plan.discount_pct}% off pay-as-you-go bookings`} cls={meta.chip} /></div>
                )}

                {Array.isArray(plan.perks) && plan.perks.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {plan.perks.map(perk => (
                      <li key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-emerald-500 font-black">✓</span>{perk}
                      </li>
                    ))}
                  </ul>
                )}

                {sub ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold text-emerald-700">✅ Active{canceled ? " (canceled)" : ""}</span>
                      {sub.current_period_end && (
                        <span className="text-[10px] text-emerald-600">{canceled ? "Benefits until" : "Renews"} {fmtDate(sub.current_period_end)}</span>
                      )}
                    </div>
                    {!canceled && (
                      <button onClick={() => setCancelSub({ ...sub, planName: plan.name })}
                        className="w-full text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                        ✕ Cancel Plan
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => doSubscribe(plan)} disabled={subscribing === plan.id}
                    className="mt-3 w-full btn-primary py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                    {subscribing === plan.id ? <Spinner sm /> : "Subscribe"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {plans?.length > 0 && (
        <p className="text-[10px] text-gray-400 text-center mt-4">
          Founding pricing — plans activate instantly, recurring billing starts at launch. Cancel anytime; benefits continue until the period end.
        </p>
      )}

      {/* Cancel confirmation */}
      {cancelSub && (
        <Modal title="Cancel plan?" onClose={() => setCancelSub(null)}>
          <p className="text-sm text-gray-600 mb-1">Cancel <strong>{cancelSub.planName}</strong>?</p>
          <p className="text-xs text-gray-400 mb-5">Your benefits stay active until {cancelSub.current_period_end ? fmtDate(cancelSub.current_period_end) : "the end of the current period"}. No further renewals.</p>
          <div className="flex gap-2">
            <button onClick={() => setCancelSub(null)} className="flex-1 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition">Keep Plan</button>
            <button onClick={doCancel} disabled={cancelLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl py-2.5 transition disabled:opacity-60 flex items-center justify-center">
              {cancelLoading ? <Spinner sm /> : "Cancel Plan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
