import { useRef } from "react";

/* ─────────────────────────────────────────────
   PETclub Public Landing Page
   Dual-market (USA + India) marketing screen
   shown to unauthenticated visitors.
───────────────────────────────────────────── */

const ORANGE = "#f97316";

/* Small inline SVG paw — no external asset needed */
const PawMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill={ORANGE}/>
    <text x="16" y="22" textAnchor="middle" fontSize="18" fill="white">🐾</text>
  </svg>
);

/* ── CSS Smartphone Mockup with animated map interior ── */
function PhoneMockup() {
  return (
    <div style={{
      position: "relative",
      width: 240,
      margin: "0 auto",
      filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.22))",
    }}>
      {/* Phone outer shell */}
      <div style={{
        width: 240,
        height: 460,
        background: "#111827",
        borderRadius: 36,
        padding: "12px 8px",
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 0 0 3px #1f2937",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 80, height: 22, background: "#111827",
          borderRadius: "0 0 14px 14px", zIndex: 10,
        }}/>

        {/* Screen */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 28,
          overflow: "hidden",
          background: "#1e293b",
          position: "relative",
        }}>

          {/* ── Map background ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(165deg, #1e3a5f 0%, #1a2e4a 40%, #162540 100%)",
          }}>
            {/* Horizontal "roads" */}
            {[20, 45, 65, 82].map((top, i) => (
              <div key={i} style={{
                position: "absolute", top: `${top}%`, left: 0, right: 0,
                height: i % 2 === 0 ? 3 : 2,
                background: "rgba(255,255,255,0.07)",
              }}/>
            ))}
            {/* Vertical "roads" */}
            {[15, 38, 60, 80].map((left, i) => (
              <div key={i} style={{
                position: "absolute", left: `${left}%`, top: 0, bottom: 0,
                width: i % 2 === 0 ? 3 : 2,
                background: "rgba(255,255,255,0.07)",
              }}/>
            ))}

            {/* Animated orange route line using SVG */}
            <svg
              viewBox="0 0 224 400"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              preserveAspectRatio="none"
            >
              <path
                d="M 40 360 Q 90 300 112 240 Q 130 180 112 120 Q 100 80 130 50"
                stroke={ORANGE}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="12 8"
                fill="none"
                opacity="0.9"
              >
                <animate attributeName="stroke-dashoffset" from="100" to="-100" dur="3s" repeatCount="indefinite"/>
              </path>

              {/* Destination pin */}
              <circle cx="130" cy="50" r="8" fill={ORANGE} opacity="0.95"/>
              <circle cx="130" cy="50" r="14" fill={ORANGE} opacity="0.25">
                <animate attributeName="r" from="8" to="22" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>

              {/* Moving professional dot */}
              <circle r="6" fill="white" stroke={ORANGE} strokeWidth="2">
                <animateMotion
                  path="M 40 360 Q 90 300 112 240 Q 130 180 112 120 Q 100 80 130 50"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            {/* Map labels (fake streets) */}
            <div style={{ position: "absolute", top: "18%", left: "40%", color: "rgba(255,255,255,0.18)", fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Park Ave</div>
            <div style={{ position: "absolute", top: "42%", left: "14%", color: "rgba(255,255,255,0.18)", fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", transform: "rotate(-90deg)", transformOrigin: "left center" }}>Main St</div>
          </div>

          {/* ── Status bar ── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "28px 14px 6px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
            zIndex: 5,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}/>
              <span style={{ color: "white", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>LIVE TRACKING</span>
            </div>
          </div>

          {/* ── "Provider nearby" banner ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "10px 12px 16px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
            zIndex: 5,
          }}>
            {/* Banner card */}
            <div style={{
              background: "white",
              borderRadius: 16,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${ORANGE}, #ea580c)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>🐕‍🦺</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                  Your Trainer is
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: ORANGE }}>
                  10 minutes away
                </div>
              </div>
              {/* Animated ping indicator */}
              <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#22c55e",
                  animation: "ping 1.4s ease-in-out infinite",
                  position: "absolute",
                }}/>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", position: "absolute" }}/>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Glow beneath phone */}
      <div style={{
        position: "absolute", bottom: -20, left: "10%", right: "10%",
        height: 40, background: `radial-gradient(ellipse at center, ${ORANGE}55 0%, transparent 70%)`,
        filter: "blur(8px)",
      }}/>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Trust Feature Card ── */
function TrustCard({ icon, title, body }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      padding: "28px 24px",
      border: "1.5px solid #f1f5f9",
      boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
      flex: "1 1 240px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   LANDING PAGE ROOT
══════════════════════════════════════════ */
export default function LandingPage({ onGetStarted }) {
  const downloadRef = useRef(null);

  const scrollToDownload = () => {
    downloadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #f1f5f9",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PawMark size={32} />
          <span style={{ fontWeight: 900, fontSize: 20, color: "#111827" }}>
            PET<span style={{ color: ORANGE }}>club</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => onGetStarted("customer")}
            style={{
              padding: "8px 20px", borderRadius: 12,
              background: ORANGE, color: "white",
              fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            }}
          >
            Sign In →
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #f0f9ff 100%)",
        padding: "64px 24px 80px",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 48,
          flexWrap: "wrap",
          justifyContent: "center",
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: "1 1 420px", maxWidth: 520, minWidth: 0 }}>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff7ed", border: "1.5px solid #fed7aa",
              borderRadius: 100, padding: "5px 14px", marginBottom: 24,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c" }}>Now live in USA &amp; India</span>
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900, lineHeight: 1.12,
              color: "#111827", margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}>
              On-Demand Care for{" "}
              <span style={{ color: ORANGE, position: "relative" }}>
                Your Best Friend.
              </span>
            </h1>

            <p style={{
              fontSize: 17, color: "#475569", lineHeight: 1.7,
              margin: "0 0 36px", maxWidth: 460,
            }}>
              Connect with certified dog groomers, expert trainers, and vet doctors right in your neighborhood. Track your provider in real time with automated 10-minute arrival alerts.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 40 }}>
              <button
                onClick={scrollToDownload}
                style={{
                  padding: "16px 32px",
                  background: ORANGE, color: "white",
                  fontWeight: 800, fontSize: 15, border: "none",
                  borderRadius: 16, cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(249,115,22,0.40)",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.opacity = "0.88"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                Book a Service Now 🐾
              </button>

              <button
                onClick={() => onGetStarted("professional")}
                style={{
                  padding: "16px 28px",
                  background: "transparent", color: "#111827",
                  fontWeight: 800, fontSize: 15,
                  border: "2px solid #e2e8f0",
                  borderRadius: 16, cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.background = "#fff7ed"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "transparent"; }}
              >
                Join as a Service Provider →
              </button>
            </div>

            {/* Social proof micro-stats */}
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { v: "100%", l: "Verified Pros" },
                { v: "Live", l: "GPS Tracking" },
                { v: "48 hr", l: "Approval SLA" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Phone Mockup ── */}
          <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }}>
            <PhoneMockup />
          </div>

        </div>
      </section>

      {/* ── TRUST & SECURITY BANNER ── */}
      <section style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{
            textAlign: "center", fontSize: 11, fontWeight: 700,
            color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase",
            marginBottom: 10,
          }}>
            Built for trust
          </p>
          <h2 style={{
            textAlign: "center", fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 900, color: "#111827", margin: "0 0 48px",
          }}>
            Your pet is safe with every booking.
          </h2>

          <div style={{
            display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center",
          }}>
            <TrustCard
              icon="🛡️"
              title="100% Verified Professionals"
              body="Every groomer, trainer, and vet undergoes a rigorous 48-hour manual certification and credential review before gaining access to bookings."
            />
            <TrustCard
              icon="📍"
              title="Live Journey Tracking"
              body="Watch your provider navigate door-to-door on an interactive map. Receive proactive automated proximity updates the moment they are nearby."
            />
            <TrustCard
              icon="📋"
              title="Custom Health Profiling"
              body="No blind appointments. Share specific pet behavior warnings, medical health notes, or insurance data directly with your assigned provider ahead of time."
            />
          </div>
        </div>
      </section>

      {/* ── APP DOWNLOAD SECTION ── */}
      <section
        id="download"
        ref={downloadRef}
        style={{ padding: "72px 24px", background: "white" }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#111827", margin: "0 0 12px" }}>
            Book your first service today.
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 36px", lineHeight: 1.65 }}>
            Use the PETclub web app instantly — no download required. Available everywhere.
          </p>

          {/* Primary: use the web app */}
          <button
            onClick={() => onGetStarted("customer")}
            style={{
              display: "inline-block", padding: "18px 44px",
              background: ORANGE, color: "white",
              fontWeight: 900, fontSize: 16, border: "none",
              borderRadius: 18, cursor: "pointer",
              boxShadow: "0 10px 28px rgba(249,115,22,0.38)",
              marginBottom: 24,
            }}
          >
            Open Web App — Free →
          </button>

          {/* Store badges (placeholders until apps are published) */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            {[
              { label: "App Store", sub: "iOS · Coming soon", icon: "🍎" },
              { label: "Google Play", sub: "Android · Coming soon", icon: "▶" },
            ].map(b => (
              <div key={b.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 20px",
                background: "#f1f5f9", borderRadius: 14,
                border: "1.5px solid #e2e8f0",
                opacity: 0.6,
                userSelect: "none",
              }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 24 }}>
            Available in the United States and India · Secure · No credit card required to sign up
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #f1f5f9",
        padding: "24px",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        background: "#fafafa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PawMark size={22} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
            PET<span style={{ color: ORANGE }}>club</span>
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          © {new Date().getFullYear()} PETclub. United States &amp; India. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Terms of Service", "Privacy Policy"].map(l => (
            <span key={l} style={{ fontSize: 11, color: "#94a3b8", cursor: "default" }}>{l}</span>
          ))}
        </div>
      </footer>

    </div>
  );
}
