import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   PETclub Public Landing Page  v2
   Dark-premium design · USA + India
─────────────────────────────────────────────── */

const ORANGE  = "#f97316";
const ORANGE2 = "#ea580c";
const DARK    = "#0a0f1a";
const DARK2   = "#111827";
const DARK3   = "#1e293b";

/* ── Inline SVG paw logo ── */
const PawMark = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill={ORANGE}/>
    <text x="16" y="22" textAnchor="middle" fontSize="17" fill="white">🐾</text>
  </svg>
);

/* ── Animated CSS phone with dark map + "Sai on the way" card ── */
function PhoneMockup() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d % 3) + 1), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", width: 260, margin: "0 auto", filter: "drop-shadow(0 40px 60px rgba(249,115,22,0.18))" }}>

      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: -6,
        borderRadius: 46,
        background: `radial-gradient(ellipse at 50% 30%, ${ORANGE}22 0%, transparent 70%)`,
        pointerEvents: "none",
      }}/>

      {/* Phone shell */}
      <div style={{
        width: 260, height: 500,
        background: "#0d1117",
        borderRadius: 40,
        padding: "10px 7px",
        boxShadow: `
          inset 0 0 0 1px rgba(255,255,255,0.10),
          0 0 0 2px #1f2937,
          0 32px 64px rgba(0,0,0,0.6)
        `,
        position: "relative", overflow: "hidden",
      }}>

        {/* Dynamic island / notch */}
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: 88, height: 24,
          background: "#0d1117",
          borderRadius: "0 0 16px 16px",
          zIndex: 20,
        }}/>

        {/* Screen */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 33,
          overflow: "hidden",
          background: "#111827",
          position: "relative",
        }}>

          {/* ── Dark map background ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(170deg, #0d1b2e 0%, #0f2239 35%, #0a1a2d 70%, #0d1525 100%)",
          }}>
            {/* Road grid */}
            {[22, 44, 63, 81].map((top, i) => (
              <div key={"h"+i} style={{
                position: "absolute", top: `${top}%`, left: 0, right: 0,
                height: i % 2 === 0 ? 2 : 1.5,
                background: "rgba(255,255,255,0.06)",
              }}/>
            ))}
            {[18, 40, 62, 82].map((left, i) => (
              <div key={"v"+i} style={{
                position: "absolute", left: `${left}%`, top: 0, bottom: 0,
                width: i % 2 === 0 ? 2 : 1.5,
                background: "rgba(255,255,255,0.05)",
              }}/>
            ))}

            {/* Block fills (city blocks) */}
            {[
              { top: "5%",  left: "42%", w: "18%", h: "14%", bg: "rgba(255,255,255,0.03)" },
              { top: "23%", left: "20%", w: "16%", h: "17%", bg: "rgba(255,255,255,0.025)" },
              { top: "47%", left: "42%", w: "17%", h: "13%", bg: "rgba(255,255,255,0.03)" },
              { top: "66%", left: "20%", w: "17%", h: "12%", bg: "rgba(255,255,255,0.025)" },
            ].map((b, i) => (
              <div key={"b"+i} style={{
                position: "absolute", top: b.top, left: b.left,
                width: b.w, height: b.h,
                background: b.bg, borderRadius: 2,
              }}/>
            ))}

            {/* Animated orange route */}
            <svg viewBox="0 0 246 480" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
              {/* Route glow */}
              <path d="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" stroke={ORANGE} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.15"/>
              {/* Route main */}
              <path d="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 7" fill="none" opacity="0.95">
                <animate attributeName="stroke-dashoffset" from="100" to="-100" dur="2.8s" repeatCount="indefinite"/>
              </path>

              {/* Destination pulse */}
              <circle cx="155" cy="48" r="6" fill={ORANGE}/>
              <circle cx="155" cy="48" r="12" fill={ORANGE} opacity="0.2">
                <animate attributeName="r" values="6;18;6" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
              </circle>

              {/* Home pin (customer) */}
              <circle cx="50" cy="440" r="7" fill="#3b82f6" stroke="white" strokeWidth="2"/>

              {/* Moving pro dot */}
              <circle r="7" fill="white" stroke={ORANGE} strokeWidth="2.5">
                <animateMotion path="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" dur="2.8s" repeatCount="indefinite"/>
              </circle>
              <circle r="3.5" fill={ORANGE}>
                <animateMotion path="M 50 440 C 80 380 100 310 123 255 C 140 205 135 155 148 110 C 155 85 160 68 155 48" dur="2.8s" repeatCount="indefinite"/>
              </circle>
            </svg>

            {/* Map labels */}
            <div style={{ position: "absolute", top: "19%", left: "42%", color: "rgba(255,255,255,0.14)", fontSize: 7, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>MG Road</div>
            <div style={{ position: "absolute", top: "50%", left: "5%", color: "rgba(255,255,255,0.12)", fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", transform: "rotate(-90deg)", transformOrigin: "left center" }}>Park St</div>
          </div>

          {/* ── Top status bar ── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "30px 14px 8px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
            zIndex: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}/>
                <span style={{ color: "white", fontSize: 9, fontWeight: 800, letterSpacing: 0.8 }}>LIVE</span>
              </div>
              <div style={{
                background: "rgba(249,115,22,0.2)",
                border: "1px solid rgba(249,115,22,0.4)",
                borderRadius: 20, padding: "2px 8px",
                color: ORANGE, fontSize: 8, fontWeight: 700,
              }}>✓ ID Verified</div>
            </div>
          </div>

          {/* ── Bottom card ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "8px 10px 14px",
            background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
            zIndex: 10,
          }}>
            {/* Provider card */}
            <div style={{
              background: "rgba(255,255,255,0.97)",
              borderRadius: 18,
              padding: "11px 13px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 19,
                }}>✂️</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>Sai Krishna · Groomer</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE, lineHeight: 1.2 }}>
                    10 min away{".".repeat(dots)}
                  </div>
                </div>

                {/* Call button */}
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, boxShadow: `0 4px 12px ${ORANGE}55`,
                }}>📞</div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 9, background: "#f1f5f9", borderRadius: 6, height: 5, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: "65%",
                  background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE2})`,
                  borderRadius: 6,
                  animation: "progress 3s ease-in-out infinite alternate",
                }}/>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 55%; } to { width: 80%; } }
        @keyframes ping2 { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(2); opacity:0; } }
      `}</style>
    </div>
  );
}

/* ── Services strip card ── */
function ServiceCard({ icon, title, desc, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: "1 1 200px", minWidth: 0,
        background: hov ? "linear-gradient(135deg, #1e293b, #0f172a)" : "#0f172a",
        border: `1.5px solid ${hov ? ORANGE+"55" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 20,
        padding: "28px 24px",
        transition: "all 0.2s",
        cursor: "default",
        boxShadow: hov ? `0 8px 32px ${ORANGE}22` : "none",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 700, background: `${ORANGE}22`, color: ORANGE, border: `1px solid ${ORANGE}44`, borderRadius: 20, padding: "2px 8px" }}>{badge}</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ── How it works step ── */
function HowStep({ num, icon, title, body }) {
  return (
    <div style={{ flex: "1 1 220px", minWidth: 0, textAlign: "center", padding: "0 8px" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: `linear-gradient(135deg, ${ORANGE}22, ${ORANGE}11)`,
        border: `2px solid ${ORANGE}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, margin: "0 auto 16px",
      }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>Step {num}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 10px", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

/* ── Trust card (dark theme) ── */
function TrustCard({ icon, title, body }) {
  return (
    <div style={{
      flex: "1 1 240px", minWidth: 0,
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "28px 24px",
    }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 10px", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{body}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LANDING PAGE ROOT
═══════════════════════════════════════════ */
export default function LandingPage({ onGetStarted }) {
  const howRef   = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToHow = () => howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden", color: "white" }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,15,26,0.90)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 62,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PawMark size={32} />
          <span style={{ fontWeight: 900, fontSize: 20, color: "white" }}>
            PET<span style={{ color: ORANGE }}>club</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="desktop-nav">
          <button onClick={scrollToHow} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>How it works</button>
          <button onClick={() => onGetStarted("professional")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>For Pros</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => onGetStarted("professional")}
            style={{
              padding: "8px 18px", borderRadius: 12,
              background: "transparent", color: "white",
              fontWeight: 700, fontSize: 13, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
            }}
          >
            Join as Pro
          </button>
          <button
            onClick={() => onGetStarted("customer")}
            style={{
              padding: "8px 20px", borderRadius: 12,
              background: ORANGE, color: "white",
              fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer",
              boxShadow: `0 4px 16px ${ORANGE}44`,
            }}
          >
            Sign In →
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        position: "relative",
        padding: "80px 24px 96px",
        overflow: "hidden",
      }}>
        {/* Background radial glows */}
        <div style={{ position: "absolute", top: -120, left: "60%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${ORANGE}14 0%, transparent 65%)`, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #3b82f614 0%, transparent 65%)", pointerEvents: "none" }}/>

        <div style={{
          maxWidth: 1120, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 56,
          flexWrap: "wrap", justifyContent: "center",
        }}>

          {/* LEFT */}
          <div style={{ flex: "1 1 420px", maxWidth: 560, minWidth: 0 }}>

            {/* Live badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 100, padding: "5px 14px", marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>Now live in USA &amp; India</span>
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 58px)",
              fontWeight: 900, lineHeight: 1.08,
              color: "white", margin: "0 0 22px",
              letterSpacing: "-0.03em",
            }}>
              Real-Time Pet Care,{" "}
              <span style={{
                color: ORANGE,
                textDecoration: "none",
              }}>
                At Your Door.
              </span>
            </h1>

            <p style={{
              fontSize: 17, color: "#94a3b8", lineHeight: 1.75,
              margin: "0 0 40px", maxWidth: 480,
            }}>
              Book verified groomers, trainers, and vets — then track them live on a real map until they arrive. No guessing, no anxiety.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 44 }}>
              <button
                onClick={() => onGetStarted("customer")}
                style={{
                  padding: "16px 34px",
                  background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
                  color: "white", fontWeight: 800, fontSize: 15,
                  border: "none", borderRadius: 16, cursor: "pointer",
                  boxShadow: `0 8px 28px ${ORANGE}44`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 36px ${ORANGE}55`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 28px ${ORANGE}44`; }}
              >
                Book a Service 🐾
              </button>
              <button
                onClick={scrollToHow}
                style={{
                  padding: "16px 28px",
                  background: "rgba(255,255,255,0.05)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 16, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                See how it works ↓
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { v: "100%", l: "Verified Pros" },
                { v: "Live GPS", l: "Real-Time Map" },
                { v: "48 hr", l: "Approval SLA" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Phone */}
          <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ══ SERVICES STRIP ══ */}
      <section style={{
        background: DARK2,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>What we offer</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: 0 }}>
              Every service your pet needs.
            </h2>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <ServiceCard icon="✂️" title="Dog Grooming" badge="Most Popular" desc="Professional bath, haircut, nail trim, and ear cleaning. Book at-home or mobile grooming sessions." />
            <ServiceCard icon="🐕‍🦺" title="Dog Training" desc="Obedience, behavior correction, agility, and puppy socialization classes with certified trainers." />
            <ServiceCard icon="🏥" title="Veterinary Visit" desc="At-home vet consultations, vaccinations, check-ups, and follow-up care. Coming soon." badge="Soon" />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section ref={howRef} style={{ padding: "80px 24px", background: DARK }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Simple process</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: 0 }}>
              From booking to doorstep in 3 steps.
            </h2>
          </div>

          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
            {/* Connecting line (desktop) */}
            <div style={{
              position: "absolute", top: 28, left: "16%", right: "16%",
              height: 1, background: `linear-gradient(90deg, transparent, ${ORANGE}44, transparent)`,
              pointerEvents: "none",
            }}/>

            <HowStep num={1} icon="🔍" title="Choose a service" body="Browse certified groomers, trainers, or vets near you. Filter by rating, availability, and specialty." />
            <HowStep num={2} icon="📅" title="Confirm your booking" body="Pick a time, share your pet's health notes, and pay securely. Instant confirmation every time." />
            <HowStep num={3} icon="📍" title="Track in real time" body="Watch your provider's live location on the map. Get notified the moment they're 10 minutes out." />
          </div>
        </div>
      </section>

      {/* ══ TRUST SECTION ══ */}
      <section style={{
        background: DARK2,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Built for trust</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: 0 }}>
              Your pet's safety is non-negotiable.
            </h2>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <TrustCard
              icon="🛡️"
              title="Rigorous Verification"
              body="Every professional submits a government ID plus their certification license. Our admin team manually reviews and approves within 48 hours — no shortcuts."
            />
            <TrustCard
              icon="📍"
              title="Live GPS Tracking"
              body="The moment your provider starts their journey, you see them move on a real-time map. Distance, ETA, and a direct call button — all in one glance."
            />
            <TrustCard
              icon="📋"
              title="Pet Health Profiles"
              body="Attach vaccination records, behavior notes, and vet history directly to your booking so the provider arrives fully prepared — not guessing."
            />
          </div>
        </div>
      </section>

      {/* ══ PRO SIGNUP CTA ══ */}
      <section style={{
        padding: "80px 24px",
        background: `linear-gradient(135deg, #0f172a 0%, #1a0a00 50%, #0f172a 100%)`,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: `radial-gradient(ellipse at center, ${ORANGE}18 0%, transparent 65%)`, pointerEvents: "none" }}/>

        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.15 }}>
            Are you a groomer, trainer,{" "}
            <span style={{ color: ORANGE }}>or vet?</span>
          </h2>
          <p style={{ fontSize: 16, color: "#94a3b8", margin: "0 0 40px", lineHeight: 1.7, maxWidth: 520, marginInline: "auto" }}>
            Join PETclub's verified professional network. Set your own schedule, reach pet owners near you, and receive payouts directly — no middleman fees beyond our transparent 30% platform rate.
          </p>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, marginBottom: 32 }}>
            <button
              onClick={() => onGetStarted("professional")}
              style={{
                padding: "17px 40px",
                background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
                color: "white", fontWeight: 900, fontSize: 15,
                border: "none", borderRadius: 16, cursor: "pointer",
                boxShadow: `0 10px 32px ${ORANGE}44`,
                transition: "transform 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              Apply as a Professional →
            </button>
          </div>

          {/* Mini feature list */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 20 }}>
            {["✓ Keep 70% of earnings", "✓ Set your own schedule", "✓ ID verified badge", "✓ Free to join"].map(f => (
              <span key={f} style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ padding: "72px 24px", background: DARK, textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 900, color: "white", margin: "0 0 14px" }}>
            Your pet deserves better.<br/>
            <span style={{ color: ORANGE }}>Book in 60 seconds.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 36px", lineHeight: 1.7 }}>
            No app download needed. Works right in your browser — USA &amp; India.
          </p>
          <button
            onClick={() => onGetStarted("customer")}
            style={{
              padding: "18px 48px",
              background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
              color: "white", fontWeight: 900, fontSize: 16,
              border: "none", borderRadius: 18, cursor: "pointer",
              boxShadow: `0 12px 36px ${ORANGE}44`,
              transition: "transform 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Open Web App — Free 🐾
          </button>
          <p style={{ fontSize: 11, color: "#1e293b", marginTop: 20 }}>
            <span style={{ color: "#475569" }}>Secure · No credit card required · Available everywhere</span>
          </p>
        </div>
      </section>

      {/* ══ LET'S CONNECT ══ */}
      <section style={{
        padding: "72px 24px",
        background: DARK2,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Get in touch</p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, color: "white", margin: "0 0 12px" }}>
              Let's Connect
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Questions? Partnerships? We're here — reach us on WhatsApp or email.
            </p>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>

            {/* India WhatsApp */}
            <a
              href="https://wa.me/919347411132"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: "1 1 240px", maxWidth: 300,
                background: "#111827",
                border: "1.5px solid rgba(34,197,94,0.25)",
                borderRadius: 20, padding: "28px 24px",
                textDecoration: "none", color: "white",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                transition: "all 0.2s", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.6)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(34,197,94,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>💬</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>WhatsApp · India</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 4px" }}>+91 93474 11132</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Mon – Sat · 9 AM – 8 PM IST</p>
              </div>
            </a>

            {/* Email support */}
            <a
              href="mailto:support@mypetclub.app"
              style={{
                flex: "1 1 240px", maxWidth: 300,
                background: "#111827",
                border: `1.5px solid ${ORANGE}33`,
                borderRadius: 20, padding: "28px 24px",
                textDecoration: "none", color: "white",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                transition: "all 0.2s", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${ORANGE}88`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${ORANGE}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${ORANGE}33`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${ORANGE}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✉️</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>Email Support</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 4px" }}>support@mypetclub.app</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>We reply within 24 hours</p>
              </div>
            </a>

            {/* Pro enquiries */}
            <a
              href="mailto:pro@mypetclub.app"
              style={{
                flex: "1 1 240px", maxWidth: 300,
                background: "#111827",
                border: "1.5px solid rgba(139,92,246,0.25)",
                borderRadius: 20, padding: "28px 24px",
                textDecoration: "none", color: "white",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                transition: "all 0.2s", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(139,92,246,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🐾</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>Join as a Pro</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 4px" }}>pro@mypetclub.app</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Groomers · Trainers · Vets</p>
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 24px",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        background: "#060b14",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PawMark size={22} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
            PET<span style={{ color: ORANGE }}>club</span>
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#374151" }}>
          © {new Date().getFullYear()} PETclub · United States &amp; India · All rights reserved
          <span style={{ marginLeft: 8, color: "#1f2937", fontFamily: "monospace" }}>v{__APP_VERSION__}</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#6b7280", textDecoration: "none", cursor: "pointer" }}
            onMouseEnter={e => e.target.style.color = ORANGE}
            onMouseLeave={e => e.target.style.color = "#6b7280"}>
            Terms of Service
          </a>
          <span style={{ fontSize: 11, color: "#374151", cursor: "default" }}>Privacy Policy</span>
        </div>
      </footer>

    </div>
  );
}
