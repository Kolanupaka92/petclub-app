import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   PETclub Public Landing Page  v3.0
   Warm-gradient redesign — golden-hour palette
   Dark sections: deep warm brown (#0c0500)
   Light sections: warm cream (#fff8f0)
   Hero: dramatic burnt-orange → amber gradient
─────────────────────────────────────────────── */

const ORANGE  = "#f97316";
const ORANGE2 = "#ea580c";
const AMBER   = "#f59e0b";

/* Region-aware matching radius — 70 km in India, 30 miles in the USA. */
export const RADIUS = {
  IN: { stat: "70km", within: "70 km" },
  US: { stat: "30mi", within: "30 miles" },
};

/* Pre-auth pages have no phone country code, so guess the region via
 * timezone (same heuristic as the marketing site). This is only the
 * default — the landing page shows a manual IN/US toggle to override it. */
export function detectRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/America\/|US\/|Canada\//.test(tz)) return "US";
  } catch { /* default to India */ }
  return "IN";
}

/* Auto-detected default, for surfaces without a toggle (e.g. Login side panel). */
export const MATCH_RADIUS = RADIUS[detectRegion()];

// Warm dark palette (replaces cold blue-black)
const DARK    = "#0c0500";
const DARK2   = "#120700";
const DARK3   = "#1c0e00";

// Warm cream palette for light sections
const CREAM   = "#fff8f0";
const CREAM2  = "#fff1e0";

const WA_NUMBER = '16097215754';

/* ── Brand logo ── */
const PawMark = ({ size = 30 }) => (
  <img src="/icon.svg" alt="PETclub" width={size} height={size}
    style={{ borderRadius: size * 0.25, display: "block" }} />
);

/* ── Floating amber orb decoration ── */
const GlowOrb = ({ top, left, right, bottom, size = 400, color = ORANGE, opacity = 0.12 }) => (
  <div style={{
    position: "absolute", top, left, right, bottom,
    width: size, height: size, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2,"0")} 0%, transparent 70%)`,
    pointerEvents: "none", zIndex: 0,
  }} />
);

/* ── Animated phone mockup ── */
function PhoneMockup() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d % 3) + 1), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", width: 260, margin: "0 auto", filter: "drop-shadow(0 40px 60px rgba(249,115,22,0.30))" }}>
      <div style={{ position: "absolute", inset: -12, borderRadius: 52, background: `radial-gradient(ellipse at 50% 30%, ${ORANGE}33 0%, transparent 70%)`, pointerEvents: "none" }}/>
      <div style={{
        width: 260, height: 500, background: "#0d1117", borderRadius: 40, padding: "10px 7px",
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 2px ${ORANGE}33, 0 40px 80px rgba(0,0,0,0.5)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 88, height: 24, background: "#0d1117", borderRadius: "0 0 16px 16px", zIndex: 20 }}/>
        <div style={{ width: "100%", height: "100%", borderRadius: 33, overflow: "hidden", background: "#111827", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, #0d1b2e 0%, #0f2239 35%, #0a1a2d 70%, #0d1525 100%)" }}>
            {[22, 44, 63, 81].map((top, i) => (
              <div key={"h"+i} style={{ position: "absolute", top: `${top}%`, left: 0, right: 0, height: i % 2 === 0 ? 2 : 1.5, background: "rgba(255,255,255,0.06)" }}/>
            ))}
            {[18, 40, 62, 82].map((left, i) => (
              <div key={"v"+i} style={{ position: "absolute", left: `${left}%`, top: 0, bottom: 0, width: i % 2 === 0 ? 2 : 1.5, background: "rgba(255,255,255,0.05)" }}/>
            ))}
            <svg viewBox="0 0 246 480" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
              <path d="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" stroke={ORANGE} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.15"/>
              <path d="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 7" fill="none" opacity="0.95">
                <animate attributeName="stroke-dashoffset" from="100" to="-100" dur="2.8s" repeatCount="indefinite"/>
              </path>
              <circle cx="155" cy="48" r="6" fill={ORANGE}/>
              <circle cx="155" cy="48" r="12" fill={ORANGE} opacity="0.2">
                <animate attributeName="r" values="6;18;6" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="50" cy="440" r="7" fill="#3b82f6" stroke="white" strokeWidth="2"/>
              <circle r="7" fill="white" stroke={ORANGE} strokeWidth="2.5">
                <animateMotion path="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" dur="2.8s" repeatCount="indefinite"/>
              </circle>
              <circle r="3.5" fill={ORANGE}>
                <animateMotion path="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" dur="2.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <div style={{ position: "absolute", top: "19%", left: "42%", color: "rgba(255,255,255,0.14)", fontSize: 7, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>MG Road</div>
            <div style={{ position: "absolute", top: "50%", left: "5%", color: "rgba(255,255,255,0.12)", fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", transform: "rotate(-90deg)", transformOrigin: "left center" }}>Park St</div>
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "30px 14px 8px", background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}/>
                <span style={{ color: "white", fontSize: 9, fontWeight: 800, letterSpacing: 0.8 }}>LIVE</span>
              </div>
              <div style={{ background: `${ORANGE}33`, border: `1px solid ${ORANGE}66`, borderRadius: 20, padding: "2px 8px", color: ORANGE, fontSize: 8, fontWeight: 700 }}>ID Verified</div>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px 14px", background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)", zIndex: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 18, padding: "11px 13px", boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>✂️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>Sai Krishna · Groomer</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE, lineHeight: 1.2 }}>10 min away{".".repeat(dots)}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: `0 4px 12px ${ORANGE}55` }}>📞</div>
              </div>
              <div style={{ marginTop: 9, background: "#f1f5f9", borderRadius: 6, height: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "65%", background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE2})`, borderRadius: 6, animation: "progress 3s ease-in-out infinite alternate" }}/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes progress { from { width: 55%; } to { width: 80%; } }`}</style>
    </div>
  );
}

/* ── Service card — rendered on CREAM background ── */
function ServiceCard({ icon, title, desc, badge, badgeColor, isNew }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: "1 1 190px", minWidth: 0,
        background: hov ? "white" : "#fffcf8",
        border: `1.5px solid ${hov ? ORANGE+"88" : "#f3d5b5"}`,
        borderRadius: 20, padding: "26px 22px",
        transition: "all 0.2s", cursor: "default",
        boxShadow: hov ? `0 12px 36px ${ORANGE}22` : "0 2px 12px rgba(194,65,12,0.06)",
        position: "relative",
      }}
    >
      {isNew && (
        <div style={{ position: "absolute", top: 14, right: 14, fontSize: 9, fontWeight: 700, background: "rgba(34,197,94,0.12)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "2px 8px" }}>NEW</div>
      )}
      <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#1a0500" }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 700, background: `${badgeColor || ORANGE}18`, color: badgeColor || ORANGE2, border: `1px solid ${badgeColor || ORANGE}44`, borderRadius: 20, padding: "2px 7px" }}>{badge}</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ── How it works step ── */
function HowStep({ num, icon, title, body }) {
  return (
    <div style={{ flex: "1 1 200px", minWidth: 0, textAlign: "center", padding: "0 8px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${ORANGE}22, ${AMBER}11)`, border: `2px solid ${ORANGE}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>Step {num}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 10px", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#c2956a", lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

/* ── Trust card — rendered on CREAM background ── */
function TrustCard({ icon, title, body, accent }) {
  const col = accent || ORANGE;
  return (
    <div style={{ flex: "1 1 220px", minWidth: 0, background: "white", border: `1px solid ${col}22`, borderRadius: 20, padding: "28px 24px", borderTop: `3px solid ${col}`, boxShadow: `0 4px 20px ${col}0f` }}>
      <div style={{ fontSize: 34, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a0500", margin: "0 0 10px", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

/* ── Win card — rendered on CREAM background ── */
function WinCard({ icon, title, body, highlight }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: "1 1 260px", minWidth: 0,
        background: hov ? "white" : "#fffcf8",
        border: `1.5px solid ${hov ? ORANGE+"66" : "#f3d5b5"}`,
        borderRadius: 20, padding: "28px 24px",
        transition: "all 0.2s",
        boxShadow: hov ? `0 8px 32px ${ORANGE}18` : "0 2px 8px rgba(194,65,12,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${ORANGE}18`, border: `1px solid ${ORANGE}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a0500", margin: "0 0 6px", lineHeight: 1.3 }}>{title}</h3>
          <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.65, margin: "0 0 10px" }}>{body}</p>
          {highlight && (
            <span style={{ fontSize: 10, fontWeight: 700, color: ORANGE2, background: `${ORANGE}15`, border: `1px solid ${ORANGE}33`, borderRadius: 20, padding: "3px 10px" }}>{highlight}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── FAQ accordion ── */
const FAQS = [
  { q: "How does booking work?", a: "Choose your service, pick a time, add your pet's details — done. You'll get instant confirmation with your pro's photo, rating, and contact number. The whole thing takes under 2 minutes." },
  { q: "Can I cancel or reschedule?", a: "Yes — free cancellation up to 4 hours before the booking. Reschedule anytime with no fee. If a pro cancels on the day, you get a full refund automatically." },
  { q: "How are professionals verified?", a: "Every pro submits a government-issued photo ID plus their professional certification. Our team manually reviews and approves each application — no shortcuts. The ✅ Verified badge only shows after that review is complete (typically 24–48 hours)." },
  { q: "What does it cost? Are there hidden fees?", a: "Prices are shown upfront at checkout — no surprises. There's no subscription or platform fee for customers. For professionals, PETclub takes 30% and pays out 70% every Saturday." },
  { q: "Is there a live GPS on every booking?", a: "Yes — not just for dog walking. Every groomer, trainer, and boarding drop-off shows a live map from the moment they start their journey. You also get a push notification when they're 10 minutes away." },
  { q: "How do loyalty credits work?", a: "You earn credits on every booking. Bonus credits: +50 for writing a review, +200 for referring a friend. 1,000 credits = 1 Free Essential Bath — applied automatically at checkout, no codes needed." },
];

function FaqAccordion({ dark = false }) {
  const [open, setOpen] = useState(null);
  const headingColor = dark ? "white" : "#1a0500";
  const bodyColor    = dark ? "#c2956a" : "#92400e";
  const borderColor  = dark ? "rgba(255,255,255,0.08)" : "#f3d5b5";
  const activeColor  = ORANGE;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {FAQS.map((faq, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${borderColor}`, overflow: "hidden" }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: "20px 4px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: open === i ? activeColor : headingColor, lineHeight: 1.4, transition: "color 0.2s" }}>
              {faq.q}
            </span>
            <span style={{
              fontSize: 20, color: open === i ? activeColor : (dark ? "#6b4c2a" : "#c2956a"),
              transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.2s, color 0.2s",
              flexShrink: 0, lineHeight: 1,
            }}>+</span>
          </button>
          <div style={{ maxHeight: open === i ? 400 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
            <p style={{ fontSize: 14, color: bodyColor, lineHeight: 1.75, margin: "0 0 20px 0", paddingRight: 32 }}>
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LANDING PAGE ROOT
═══════════════════════════════════════════ */
/* ── Region toggle (IN / US) — controls the matching-radius copy ── */
function RegionToggle({ region, setRegion, size = "sm" }) {
  const pad = size === "sm" ? "5px 10px" : "6px 12px";
  const opts = [
    { id: "IN", label: "IN", flag: "/flags/in.svg" },
    { id: "US", label: "US", flag: "/flags/us.svg" },
  ];
  return (
    <div role="group" aria-label="Choose region"
      style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 100, padding: 2 }}>
      {opts.map(o => {
        const active = region === o.id;
        return (
          <button key={o.id} type="button" onClick={() => setRegion(o.id)} aria-pressed={active}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: pad, borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, transition: "all 0.15s",
              background: active ? ORANGE : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.7)" }}>
            <img src={o.flag} alt="" width="16" height="12" style={{ borderRadius: 2, display: "block" }} /> {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const howRef        = useRef(null);
  const servicesRef   = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [region, setRegion] = useState(detectRegion());
  const radius = RADIUS[region];

  const scrollToHow      = () => { howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); setMobileOpen(false); };
  const scrollToServices = () => { servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); setMobileOpen(false); };

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflowX: "hidden", color: "white" }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(12,5,0,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(249,115,22,0.12)",
      }}>
        <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PawMark size={32} />
            <span style={{ fontWeight: 900, fontSize: 20, color: "white" }}>
              PET<span style={{ color: ORANGE }}>club</span>
            </span>
          </div>

          <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { label: "Services", action: scrollToServices },
              { label: "How it works", action: scrollToHow },
              { label: "For Pros", action: () => onGetStarted("professional") },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                style={{ background: "none", border: "none", color: "#c2956a", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                {label}
              </button>
            ))}
          </div>

          <div className="nav-desktop-ctas" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RegionToggle region={region} setRegion={setRegion} />
            <button onClick={() => onGetStarted("professional")}
              style={{ padding: "8px 18px", borderRadius: 12, background: "transparent", color: "white", fontWeight: 700, fontSize: 13, border: `1px solid ${ORANGE}44`, cursor: "pointer" }}>
              Join as Pro
            </button>
            <button onClick={() => onGetStarted("customer")}
              style={{ padding: "8px 20px", borderRadius: 12, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: "white", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer", boxShadow: `0 4px 16px ${ORANGE}55` }}>
              Sign In →
            </button>
          </div>

          <div className="nav-mobile-controls" style={{ display: "none", alignItems: "center", gap: 10 }}>
            <button onClick={() => onGetStarted("customer")}
              style={{ padding: "7px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: "white", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer" }}>
              Sign In
            </button>
            <button onClick={() => setMobileOpen(o => !o)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}
              style={{ background: "none", border: `1px solid ${ORANGE}44`, borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: "block", width: 18, height: 2, background: "white", borderRadius: 2,
                  transform: mobileOpen ? (i === 0 ? "rotate(45deg) translate(3px, 3px)" : i === 2 ? "rotate(-45deg) translate(3px, -3px)" : "scale(0)") : "none",
                  transition: "transform 0.2s",
                }}/>
              ))}
            </button>
          </div>
        </div>

        <div style={{
          overflow: "hidden", maxHeight: mobileOpen ? 360 : 0, transition: "max-height 0.3s ease",
          borderTop: mobileOpen ? `1px solid ${ORANGE}22` : "none",
          background: "rgba(12,5,0,0.98)",
        }}>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "Services", action: scrollToServices },
              { label: "How it works", action: scrollToHow },
              { label: "For Pros", action: () => { onGetStarted("professional"); setMobileOpen(false); } },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                style={{ background: "none", border: "none", color: "#c2956a", fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "12px 0", textAlign: "left", borderBottom: `1px solid ${ORANGE}15` }}>
                {label}
              </button>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 4px" }}>
              <span style={{ color: "#c2956a", fontSize: 13, fontWeight: 600 }}>Region</span>
              <RegionToggle region={region} setRegion={setRegion} size="md" />
            </div>
            <button onClick={() => { onGetStarted("professional"); setMobileOpen(false); }}
              style={{ marginTop: 12, padding: "13px 20px", borderRadius: 12, background: `${ORANGE}18`, color: "white", fontWeight: 700, fontSize: 14, border: `1px solid ${ORANGE}44`, cursor: "pointer" }}>
              Join as a Pro →
            </button>
          </div>
        </div>

        <style>{`
          @media (max-width: 700px) {
            .nav-desktop-links { display: none !important; }
            .nav-desktop-ctas  { display: none !important; }
            .nav-mobile-controls { display: flex !important; }
            .hero-stats { display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px 24px !important; }
          }
        `}</style>
      </nav>

      {/* ══ HERO — warm golden gradient ══ */}
      <section style={{
        position: "relative", padding: "80px 24px 100px", overflow: "hidden",
        background: `linear-gradient(150deg, ${DARK} 0%, #3b0d00 28%, #7c2d12 55%, #c2410c 78%, #f97316 100%)`,
      }}>
        {/* Glow orbs */}
        <GlowOrb top={-100} right={-80} size={500} color={AMBER} opacity={0.18} />
        <GlowOrb bottom={-100} left={-80} size={400} color={ORANGE2} opacity={0.14} />
        <GlowOrb top="30%" left="40%" size={300} color={AMBER} opacity={0.08} />

        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", gap: 56, flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ flex: "1 1 420px", maxWidth: 560, minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 100, padding: "5px 14px", marginBottom: 28, backdropFilter: "blur(8px)" }}>
              <img src="/flags/in.svg" alt="India" width="20" height="15" style={{ borderRadius: 2, display: "block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,220,180,1)" }}>Pet Care for Dogs &amp; Cats</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>·</span>
              <img src="/flags/us.svg" alt="USA" width="20" height="15" style={{ borderRadius: 2, display: "block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,220,180,1)" }}>Launching in the USA</span>
            </div>

            <h1 style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 900, lineHeight: 1.08, color: "white", margin: "0 0 22px", letterSpacing: "-0.03em", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
              Real-Time Pet Care,{" "}
              <span style={{ color: "#fed7aa" }}>At Your Door.</span>
            </h1>

            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.80)", lineHeight: 1.75, margin: "0 0 40px", maxWidth: 480 }}>
              Book verified groomers, trainers, walkers, vets and boarders — then watch them arrive live on a real map. One platform, zero stress.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 44 }}>
              <button
                onClick={() => onGetStarted("customer")}
                style={{ padding: "16px 34px", background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: "white", fontWeight: 900, fontSize: 15, border: "none", borderRadius: 16, cursor: "pointer", boxShadow: `0 8px 32px ${ORANGE}55`, transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 14px 40px ${ORANGE}77`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 32px ${ORANGE}55`; }}
              >Book a Service 🐾</button>
              <button
                onClick={scrollToHow}
                style={{ padding: "16px 28px", background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 700, fontSize: 15, border: "1px solid rgba(255,255,255,0.25)", borderRadius: 16, cursor: "pointer", transition: "background 0.15s", backdropFilter: "blur(8px)" }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.20)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              >See how it works ↓</button>
            </div>

            <div className="hero-stats" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { v: "100%",  l: "Verified Pros" },
                { v: radius.stat, l: "Smart Matching" },
                { v: "GPS",   l: "Live Tracking" },
                { v: "Free",  l: "To Join" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ══ SERVICES — warm CREAM ══ */}
      <section ref={servicesRef} style={{ background: CREAM, borderBottom: `1px solid ${ORANGE}18`, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>What we offer</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#1a0500", margin: "0 0 12px" }}>
              Every service your pet needs.
            </h2>
            <p style={{ fontSize: 14, color: "#92400e", margin: 0 }}>All at-home or doorstep. No travel, no stress — for you or your pet.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            <ServiceCard icon="✂️" title="Grooming" badge="At Your Doorstep"
              desc="Full bath, haircut, nail trim & ear cleaning for dogs and cats. Certified groomers come to your door — no travel stress for you or your pet." />
            <ServiceCard icon="🐕‍🦺" title="Dog Training"
              desc="Obedience, behavior correction, agility & puppy socialization — certified trainers come to you for at-home sessions." />
            <ServiceCard icon="🦮" title="Dog Walking" isNew
              desc="GPS-tracked daily or scheduled walks by verified handlers. Live map so you watch exactly where your dog is." />
            <ServiceCard icon="🏠" title="Pet Boarding" isNew
              desc="Cage-free home boarding with verified hosts — for dogs & cats. Daily photo updates guaranteed." />
            <ServiceCard icon="🏥" title="Vet Care" badge="Cats too!" badgeColor="#8b5cf6"
              desc="In-home vet visits, vaccinations & digital health records for cats and dogs. No clinic trip needed." />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — warm dark ══ */}
      <section ref={howRef} style={{ padding: "80px 24px", background: DARK3, position: "relative", overflow: "hidden" }}>
        <GlowOrb top={-80} right={-80} size={400} color={ORANGE} opacity={0.10} />
        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Simple process</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: 0 }}>
              From booking to doorstep in 3 steps.
            </h2>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 28, left: "16%", right: "16%", height: 1, background: `linear-gradient(90deg, transparent, ${AMBER}44, transparent)`, pointerEvents: "none" }}/>
            <HowStep num={1} icon="🔍" title="Choose a service" body="Pick from 5 certified service types near you — filter by rating, availability, and specialty. Free to sign up in 60 seconds." />
            <HowStep num={2} icon="📅" title="Confirm your booking" body="Pick a time, add your pet's health notes, and pay securely. Instant confirmation with pro contact details." />
            <HowStep num={3} icon="📍" title="Track live until arrival" body="Watch your provider move on a real-time map. Get notified when they're 10 minutes out — then earn loyalty credits." />
          </div>
        </div>
      </section>

      {/* ══ WHY PETCLUB WINS — warm CREAM ══ */}
      <section style={{ background: CREAM2, borderTop: `1px solid ${ORANGE}15`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>vs. the competition</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#1a0500", margin: "0 0 12px" }}>
              Why pet owners choose PETclub.
            </h2>
            <p style={{ fontSize: 14, color: "#92400e", margin: 0 }}>Features other platforms haven't built yet.</p>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <WinCard icon="📍" title="Live GPS on every booking"
              body="Not just for walking — every groomer, trainer, and vet visit shows a live map from the moment they leave. Other apps send a text. We show you a dot."
              highlight="Unique to PETclub" />
            <WinCard icon="🔒" title="Verified reviews only"
              body="Every rating on our platform comes from a completed, paid booking. No fake 5-star farms, no anonymous drops. What you read is what the pro actually delivered."
              highlight="No fake ratings" />
            <WinCard icon="💰" title="Transparent earnings — 70% to pros"
              body="We publish our rate openly: pros keep 70% of every booking. No hidden deductions, no surge penalties. Other platforms hide their cut. We don't."
              highlight="70 / 30 split — published" />
            <WinCard icon="🌐" title="No app download required"
              body="Works in any browser on any device. Unlike apps that force a download before you can book, PETclub runs instantly — iPhone, Android, or desktop."
              highlight="Book in 60 seconds" />
            <WinCard icon="💬" title="Real human support on WhatsApp"
              body={`Questions before or after a booking? Chat directly with our team on WhatsApp — not a bot, not a ticket queue. Mon–Sat, 9 AM–8 PM ${region === "US" ? "CT" : "IST"}.`}
              highlight="Mon–Sat support" />
          </div>
        </div>
      </section>

      {/* ══ LOYALTY REWARDS — warm dark with green accent ══ */}
      <section style={{
        padding: "72px 24px", background: DARK,
        borderTop: `1px solid ${ORANGE}18`,
        position: "relative", overflow: "hidden",
      }}>
        <GlowOrb top="50%" left="50%" size={500} color="#22c55e" opacity={0.06} />
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 48, flexWrap: "wrap", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Loyalty Rewards</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
              Every booking earns you{" "}<span style={{ color: "#4ade80" }}>credits.</span>
            </h2>
            <p style={{ fontSize: 15, color: "#c2956a", margin: "0 0 24px", lineHeight: 1.7 }}>
              Earn credits on every booking. Bonus credits for reviews (+50) and referrals (+200). Hit 1,000 credits and get a Free Essential Bath — redeemed automatically, no codes needed.
            </p>
            <button
              onClick={() => onGetStarted("customer")}
              style={{ padding: "14px 30px", background: "rgba(34,197,94,0.12)", color: "#4ade80", fontWeight: 700, fontSize: 14, border: "1px solid rgba(34,197,94,0.3)", borderRadius: 14, cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(34,197,94,0.2)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
            >Start Earning Credits →</button>
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "💰", label: "Every Booking",  pts: "Earn credits"  },
              { icon: "⭐", label: "Write a Review",  pts: "+50"       },
              { icon: "👥", label: "Refer a Friend",  pts: "+200"      },
              { icon: "🎁", label: "Free Essential Bath", pts: "1,000 credits" },
            ].map(item => (
              <div key={item.label} style={{ flex: "1 1 120px", background: DARK3, border: "1px solid rgba(34,197,94,0.15)", borderRadius: 16, padding: "18px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: "#c2956a", fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{item.pts}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST SECTION — warm CREAM ══ */}
      <section style={{ background: CREAM, borderTop: `1px solid ${ORANGE}18`, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Built for trust</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#1a0500", margin: 0 }}>
              Your pet's safety is non-negotiable.
            </h2>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <TrustCard icon="🛡️" title="Rigorous Verification" accent={ORANGE}
              body="Every professional submits a government ID plus their certification license. Our admin team manually reviews and approves within 48 hours — no shortcuts, ever." />
            <TrustCard icon="📍" title="Live GPS Tracking" accent="#3b82f6"
              body="From the moment your provider starts their journey, you watch them move on a real-time map. Distance, ETA, and a direct call button — all one tap away." />
            <TrustCard icon="📋" title="Pet Health Profiles" accent="#8b5cf6"
              body="Attach vaccination records, allergy notes, and vet history to every booking. Your provider arrives fully briefed — no forms to fill in on the doorstep." />
            <TrustCard icon="🔐" title="Booking Protection" accent="#22c55e"
              body="Every completed booking is covered. If a session is cut short for safety or a pro cancels on the day, you get a full refund — automatically, no questions asked." />
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS — warm CREAM ══ */}
      <section style={{ background: CREAM2, borderTop: `1px solid ${ORANGE}15`, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Founding members</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#1a0500", margin: 0 }}>
              Get in before everyone else.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "🎖️", title: "Founding member badge", body: "Join before public launch and keep a founding-member badge on your profile — a permanent thank-you for backing us early." },
              { icon: "🏆", title: "Loyalty rewards from day one", body: "Earn credits on every booking from your very first visit. Hit 1,000 credits and your Free Essential Bath is on us." },
              { icon: "📍", title: "First pick of local pros", body: "Early members are matched first with the nearest verified groomers, vets, trainers, walkers and boarders." },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ background: "white", border: `1px solid ${ORANGE}22`, borderRadius: 20, padding: "28px 24px", borderTop: `3px solid ${ORANGE}`, boxShadow: `0 4px 20px ${ORANGE}0f` }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1a0500", marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRO SIGNUP CTA — warm gradient ══ */}
      <section style={{
        padding: "80px 24px",
        background: `linear-gradient(135deg, ${DARK} 0%, #3b0d00 40%, #7c2d12 70%, ${DARK} 100%)`,
        borderTop: `1px solid ${ORANGE}22`,
        position: "relative", overflow: "hidden",
      }}>
        <GlowOrb top="50%" left="50%" size={600} color={ORANGE} opacity={0.12} />
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.15 }}>
            Are you a groomer, trainer,{" "}
            <span style={{ color: "#fed7aa" }}>walker, or vet?</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.70)", margin: "0 0 40px", lineHeight: 1.7, maxWidth: 520, marginInline: "auto" }}>
            Join PETclub's verified professional network. Set your own schedule, reach pet owners near you, and receive payouts directly — transparent 30% platform rate, published openly.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, marginBottom: 32 }}>
            <button
              onClick={() => onGetStarted("professional")}
              style={{ padding: "17px 40px", background: "white", color: ORANGE2, fontWeight: 900, fontSize: 15, border: "none", borderRadius: 16, cursor: "pointer", boxShadow: "0 10px 36px rgba(0,0,0,0.3)", transition: "transform 0.15s" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >Apply as a Professional →</button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 20 }}>
            {["✓ Keep 70% of earnings", "✓ Set your own schedule", "✓ ID verified badge", "✓ Free to join", "✓ Earn on 5 service types"].map(f => (
              <span key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — warm dark ══ */}
      <section style={{ padding: "72px 24px", background: DARK3, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <GlowOrb top={-100} right={-100} size={400} color={AMBER} opacity={0.10} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 900, color: "white", margin: "0 0 14px" }}>
            Your pet deserves better.<br/>
            <span style={{ color: "#fed7aa" }}>Book in 60 seconds.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#c2956a", margin: "0 0 36px", lineHeight: 1.7 }}>
            No app download needed. Works right in your browser — India &amp; USA.
          </p>
          <button
            onClick={() => onGetStarted("customer")}
            style={{ padding: "18px 48px", background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: "white", fontWeight: 900, fontSize: 16, border: "none", borderRadius: 18, cursor: "pointer", boxShadow: `0 12px 40px ${ORANGE}55`, transition: "transform 0.15s" }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
          >Book a Service — Free 🐾</button>
          <p style={{ fontSize: 11, color: "#5c3010", marginTop: 20 }}>
            Secure · No credit card required · Available everywhere
          </p>
        </div>
      </section>

      {/* ══ FAQ — warm CREAM ══ */}
      <section style={{ padding: "80px 24px", background: CREAM, borderTop: `1px solid ${ORANGE}15` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Got questions?</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "#1a0500", margin: "0 0 12px" }}>
              Frequently asked questions.
            </h2>
            <p style={{ fontSize: 14, color: "#92400e", margin: 0 }}>Everything you need to know before your first booking.</p>
          </div>
          <FaqAccordion dark={false} />
        </div>
      </section>

      {/* ══ LET'S CONNECT — warm dark ══ */}
      <section style={{ padding: "clamp(40px,8vw,72px) 16px", background: DARK2, borderTop: `1px solid ${ORANGE}18` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Get in touch</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: "0 0 12px" }}>Let's connect.</h2>
            <p style={{ fontSize: 14, color: "#c2956a", margin: 0 }}>Questions? Partnerships? We're here — WhatsApp or email.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer"
              style={{ background: DARK3, border: "1.5px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "28px 20px", textDecoration: "none", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "all 0.2s", boxSizing: "border-box" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.6)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(34,197,94,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>💬</div>
              <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>WhatsApp</p>
                <p style={{ fontSize: "clamp(14px,3.5vw,16px)", fontWeight: 800, color: "white", margin: "0 0 4px" }}>+1 609 721 5754</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>{`Mon – Sat · 9 AM – 8 PM ${region === "US" ? "CT" : "IST"}`}</p>
              </div>
            </a>

            <a href="mailto:support@mypetclub.app"
              style={{ background: DARK3, border: `1.5px solid ${ORANGE}33`, borderRadius: 20, padding: "28px 20px", textDecoration: "none", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "all 0.2s", boxSizing: "border-box" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${ORANGE}88`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${ORANGE}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${ORANGE}33`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${ORANGE}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>✉️</div>
              <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>Email Support</p>
                <p style={{ fontSize: "clamp(12px,3.2vw,15px)", fontWeight: 800, color: "white", margin: "0 0 4px", wordBreak: "break-all" }}>support@mypetclub.app</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>We reply within 24 hours</p>
              </div>
            </a>

            <a href="mailto:support@mypetclub.app?subject=Partnership Inquiry"
              style={{ background: DARK3, border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 20, padding: "28px 20px", textDecoration: "none", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "all 0.2s", boxSizing: "border-box" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.6)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(251,191,36,0.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(251,191,36,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🤝</div>
              <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>Partnerships & Press</p>
                <p style={{ fontSize: "clamp(14px,3.5vw,15px)", fontWeight: 800, color: "white", margin: "0 0 4px" }}>Let's work together</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>Brands · Media · Clinics · Shelters</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        borderTop: `1px solid ${ORANGE}18`, padding: "24px 24px",
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12,
        background: "#080300",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PawMark size={22} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
            PET<span style={{ color: ORANGE }}>club</span>
          </span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} PETclub · India &amp; USA · All rights reserved
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Terms of Service", href: "/terms.html" },
            { label: "Privacy Policy",   href: "/privacy.html" },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", textDecoration: "none" }}
              onMouseEnter={e => e.target.style.color = ORANGE}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.40)"}>
              {label}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
