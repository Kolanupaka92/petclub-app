"""
PETclub Engineering Reference Guide — PDF Generator
Run: python generate_guide.py
Output: public/petclub-engineering-guide.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import HexColor
from datetime import datetime
import os

# ── Brand colours ────────────────────────────────────────────────
ORANGE      = HexColor('#f97316')
DARK        = HexColor('#1e293b')
LIGHT_BG    = HexColor('#fff7ed')
ORANGE_DARK = HexColor('#ea6c0a')
SLATE       = HexColor('#64748b')
WHITE       = HexColor('#ffffff')
RED_BG      = HexColor('#fef2f2')
RED_TXT     = HexColor('#dc2626')
YELLOW_BG   = HexColor('#fefce8')
YELLOW_TXT  = HexColor('#d97706')
GREEN_BG    = HexColor('#f0fdf4')
GREEN_TXT   = HexColor('#16a34a')
CODE_BG     = HexColor('#1e293b')
CODE_TXT    = HexColor('#e2e8f0')
TABLE_HDR   = HexColor('#f97316')
TABLE_ROW   = HexColor('#fff7ed')
TABLE_ALT   = HexColor('#ffffff')

W, H = A4

# ── Page template with header + footer ──────────────────────────
def make_header_footer(canvas, doc):
    canvas.saveState()

    # Header bar
    canvas.setFillColor(DARK)
    canvas.rect(0, H - 22*mm, W, 22*mm, fill=1, stroke=0)

    # Paw + PETclub
    canvas.setFont('Helvetica-Bold', 14)
    canvas.setFillColor(ORANGE)
    canvas.drawString(15*mm, H - 14*mm, '🐾')
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica-Bold', 13)
    canvas.drawString(24*mm, H - 14*mm, 'PET')
    canvas.setFont('Helvetica', 13)
    canvas.drawString(39*mm, H - 14*mm, 'club')

    # Title right side
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(HexColor('#94a3b8'))
    title_text = 'Engineering Reference Guide'
    canvas.drawRightString(W - 15*mm, H - 14*mm, title_text)

    # Orange accent line under header
    canvas.setFillColor(ORANGE)
    canvas.rect(0, H - 23*mm, W, 1*mm, fill=1, stroke=0)

    # Footer
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    canvas.setFillColor(HexColor('#94a3b8'))
    canvas.setFont('Helvetica', 7.5)
    canvas.drawString(15*mm, 4.5*mm, 'PETclub Engineering  |  Confidential  |  mypetclub.app  |  support@mypetclub.app')
    canvas.setFont('Helvetica', 7.5)
    canvas.drawRightString(W - 15*mm, 4.5*mm, f'Page {doc.page}')

    canvas.restoreState()


# ── Styles ───────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        'cover_title': s('cover_title', fontName='Helvetica-Bold', fontSize=30,
                         textColor=WHITE, leading=36, alignment=TA_CENTER),
        'cover_sub':   s('cover_sub', fontName='Helvetica', fontSize=13,
                         textColor=HexColor('#cbd5e1'), leading=20, alignment=TA_CENTER),
        'cover_ver':   s('cover_ver', fontName='Helvetica', fontSize=10,
                         textColor=HexColor('#94a3b8'), leading=14, alignment=TA_CENTER),
        'h1':  s('h1', fontName='Helvetica-Bold', fontSize=16, textColor=WHITE,
                 leading=20, spaceBefore=4, spaceAfter=2),
        'h2':  s('h2', fontName='Helvetica-Bold', fontSize=12, textColor=ORANGE,
                 leading=16, spaceBefore=10, spaceAfter=4),
        'h3':  s('h3', fontName='Helvetica-Bold', fontSize=10, textColor=DARK,
                 leading=14, spaceBefore=8, spaceAfter=3),
        'body': s('body', fontName='Helvetica', fontSize=9.5, textColor=DARK,
                  leading=15, spaceAfter=4),
        'bullet': s('bullet', fontName='Helvetica', fontSize=9.5, textColor=DARK,
                    leading=15, leftIndent=12, spaceAfter=2,
                    bulletText='•', bulletIndent=0),
        'step':   s('step', fontName='Helvetica', fontSize=9.5, textColor=DARK,
                    leading=15, leftIndent=18, spaceAfter=3),
        'code':   s('code', fontName='Courier', fontSize=8.5, textColor=CODE_TXT,
                    backColor=CODE_BG, leading=13, leftIndent=6, rightIndent=6,
                    spaceBefore=2, spaceAfter=2),
        'note':   s('note', fontName='Helvetica', fontSize=9, textColor=SLATE,
                    leading=13, leftIndent=8, spaceAfter=4),
        'toc':    s('toc', fontName='Helvetica', fontSize=10, textColor=DARK,
                    leading=18, leftIndent=8),
        'toc_num':s('toc_num', fontName='Helvetica-Bold', fontSize=10, textColor=ORANGE,
                    leading=18),
    }


# ── Helpers ──────────────────────────────────────────────────────
def section_header(title, num, styles):
    """Orange banner with section number + title."""
    data = [[
        Paragraph(f'<font color="#f97316"><b>{num}</b></font>', styles['h1']),
        Paragraph(f'<b>{title}</b>', styles['h1']),
    ]]
    t = Table(data, colWidths=[12*mm, W - 30*mm - 12*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',(0,0), (-1,-1), 6),
        ('RIGHTPADDING',(0,0),(-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return t


def data_table(headers, rows, styles, col_widths=None):
    """Styled table with orange header."""
    header_row = [Paragraph(f'<b>{h}</b>', ParagraphStyle(
        'th', fontName='Helvetica-Bold', fontSize=8.5,
        textColor=WHITE, leading=12)) for h in headers]
    body_rows = []
    for row in rows:
        body_rows.append([
            Paragraph(str(c), ParagraphStyle(
                'td', fontName='Helvetica', fontSize=8.5,
                textColor=DARK, leading=12)) for c in row
        ])
    data = [header_row] + body_rows
    usable = W - 30*mm
    if col_widths is None:
        cw = usable / len(headers)
        col_widths = [cw] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ('BACKGROUND',    (0,0), (-1,0),  TABLE_HDR),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [TABLE_ROW, TABLE_ALT]),
        ('GRID',          (0,0), (-1,-1), 0.4, HexColor('#e2e8f0')),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]
    t.setStyle(TableStyle(style))
    return t


def code_block(lines, styles):
    """Dark background code block."""
    joined = '<br/>'.join(
        line.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
        for line in lines
    )
    data = [[Paragraph(joined, styles['code'])]]
    t = Table(data, colWidths=[W - 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CODE_BG),
        ('LEFTPADDING',(0,0), (-1,-1), 10),
        ('RIGHTPADDING',(0,0),(-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return t


def alert(icon, label, text, bg, fg, styles):
    """Coloured alert box (red/yellow/green)."""
    content = Paragraph(
        f'<b>{icon} {label}:</b>  {text}',
        ParagraphStyle('alert', fontName='Helvetica', fontSize=9,
                       textColor=fg, leading=14))
    data = [[content]]
    t = Table(data, colWidths=[W - 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), bg),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 10),
        ('TOPPADDING',   (0,0),(-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return t


def sp(n=4):
    return Spacer(1, n*mm)


# ── BUILD ────────────────────────────────────────────────────────
def build():
    out = 'C:/Users/14697/petclub-app/public/petclub-engineering-guide.pdf'
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=28*mm, bottomMargin=18*mm,
    )
    S = make_styles()
    story = []

    # ════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════
    def cover_page(canvas, doc):
        canvas.saveState()
        # full-page dark bg
        canvas.setFillColor(DARK)
        canvas.rect(0, 0, W, H, fill=1, stroke=0)
        # orange top band
        canvas.setFillColor(ORANGE)
        canvas.rect(0, H - 28*mm, W, 28*mm, fill=1, stroke=0)
        # paw + PETclub
        canvas.setFillColor(WHITE)
        canvas.setFont('Helvetica-Bold', 18)
        canvas.drawString(15*mm, H - 18*mm, 'PET')
        canvas.setFont('Helvetica', 18)
        canvas.drawString(36*mm, H - 18*mm, 'club')
        canvas.setFont('Helvetica', 14)
        canvas.drawString(56*mm, H - 18*mm, ' 🐾')
        # decorative circles
        canvas.setFillColor(HexColor('#ffffff10'))
        canvas.circle(W - 20*mm, 30*mm, 50*mm, fill=1, stroke=0)
        canvas.circle(20*mm, H//2, 35*mm, fill=1, stroke=0)
        # footer
        canvas.setFillColor(ORANGE)
        canvas.rect(0, 0, W, 10*mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont('Helvetica', 7.5)
        canvas.drawString(15*mm, 3.5*mm,
            'PETclub Engineering  |  Confidential  |  mypetclub.app  |  support@mypetclub.app')
        canvas.restoreState()

    doc.onFirstPage = cover_page
    doc.onLaterPages = make_header_footer

    # Cover content (positioned by spacers)
    story.append(Spacer(1, 50*mm))

    # Orange accent line
    story.append(HRFlowable(width='100%', thickness=3, color=ORANGE, spaceAfter=8*mm))

    story.append(Paragraph('PETclub Platform', S['cover_title']))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('Engineering Reference Guide', ParagraphStyle(
        'ct2', fontName='Helvetica-Bold', fontSize=20,
        textColor=ORANGE, leading=26, alignment=TA_CENTER)))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('Architecture · Setup · Deployment · Troubleshooting',
                            S['cover_sub']))
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width='60%', thickness=1, color=SLATE,
                             hAlign='CENTER', spaceAfter=8*mm))
    story.append(Paragraph('Frontend v1.40.2  |  Backend v2.x  |  June 2026',
                            S['cover_ver']))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Cloud Run: petclub-backend  (us-west1 Oregon)',
                            S['cover_ver']))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('Last updated: June 27, 2026  —  Soft delete · Realtime · Pino · httpOnly auth · Monitoring',
                            S['cover_ver']))
    story.append(PageBreak())

    # ════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ════════════════════════════════════════════
    story.append(sp(4))
    story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle(
        'toc_title', fontName='Helvetica-Bold', fontSize=15,
        textColor=DARK, leading=20, spaceAfter=6)))
    story.append(HRFlowable(width='100%', thickness=2, color=ORANGE, spaceAfter=4*mm))

    toc_items = [
        ('1', 'System Overview'),
        ('2', 'Architecture Diagram'),
        ('3', 'Authentication Flow'),
        ('4', 'New Laptop Setup'),
        ('5', 'Environment Variables'),
        ('6', 'Key Operational Commands'),
        ('7', 'Deployment Flow'),
        ('8', 'Troubleshooting Guide'),
        ('9', 'Known Issues & Action Items'),
        ('10', 'Service Dashboards'),
    ]
    for num, title in toc_items:
        row_data = [[
            Paragraph(f'<b><font color="#f97316">{num}</font></b>', S['toc_num']),
            Paragraph(title, S['toc']),
        ]]
        t = Table(row_data, colWidths=[12*mm, W - 42*mm])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0),(-1,-1),'MIDDLE'),
            ('LEFTPADDING',(0,0),(-1,-1),4),
            ('BOTTOMPADDING',(0,0),(-1,-1),1),
            ('TOPPADDING',(0,0),(-1,-1),1),
        ]))
        story.append(t)

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 1 — SYSTEM OVERVIEW
    # ════════════════════════════════════════════
    story.append(section_header('System Overview', '01', S))
    story.append(sp(3))

    story.append(Paragraph(
        'PETclub is a premium pet care booking platform for India, connecting pet owners '
        'with verified professionals across grooming, training, vet care, dog walking, '
        'and boarding services.', S['body']))
    story.append(sp(2))

    story.append(Paragraph('User Roles', S['h2']))
    for role, desc in [
        ('Customer', 'Books services, manages pets, earns and redeems loyalty points'),
        ('Professional', 'Receives booking assignments, manages schedule, tracks earnings'),
        ('Admin', 'Manages users, bookings, payouts, platform configuration'),
    ]:
        story.append(Paragraph(
            f'<b><font color="#f97316">{role}</font></b> — {desc}', S['bullet']))

    story.append(sp(3))
    story.append(Paragraph('Tech Stack', S['h2']))
    story.append(data_table(
        ['Layer', 'Technology', 'Hosting / Provider'],
        [
            ['Frontend',            'React 19 + Vite 6',           'Vercel'],
            ['Backend',             'Node.js + Express 4 + Pino',  'Google Cloud Run (us-west1 Oregon)'],
            ['Database',            'Supabase — Postgres 17',      'AWS us-west-2 Oregon  |  RLS ✓  |  Realtime ✓'],
            ['Phone Auth',          'Firebase Authentication',      'Google'],
            ['Push Notifications',  'Firebase FCM',                'Google'],
            ['Error Tracking',      'Sentry (active when DSN set)', 'sentry.io'],
            ['Logging',             'Pino structured JSON',        'Cloud Logging (GCP)'],
            ['Uptime Monitoring',   'Cloud Monitoring (every 5m)', 'GCP — alerts to admin email'],
            ['Transactional Email', 'Resend API',                  'Cloud'],
            ['Admin Email',         'Zoho SMTP',                   'Cloud'],
            ['SMS',                 'Twilio (currently stubbed)',   'Cloud'],
            ['Geocoding',           'Mappls / MapmyIndia',         'India CDN'],
            ['Payments',            'Razorpay (pending LLC)',       '—'],
        ],
        S,
        col_widths=[42*mm, 65*mm, 63*mm]
    ))
    story.append(sp(3))

    story.append(Paragraph('GitHub Repositories', S['h2']))
    story.append(code_block([
        'Frontend:  github.com/Kolanupaka92/petclub-app',
        'Backend:   github.com/Kolanupaka92/petclub-backend',
        '',
        'Branches:  main    → production  (Cloud Build auto-deploy)',
        '           develop → staging     (Cloud Build auto-deploy)',
    ], S))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 2 — ARCHITECTURE
    # ════════════════════════════════════════════
    story.append(section_header('Architecture Diagram', '02', S))
    story.append(sp(3))

    story.append(code_block([
        '                    USER (Browser / Mobile)',
        '                          |',
        '                       HTTPS',
        '                          |',
        '         ┌────────────────▼────────────────────┐',
        '         │   FRONTEND  —  app.mypetclub.app    │',
        '         │       React 19 + Vite 6             │',
        '         │       Hosted on Vercel              │',
        '         └────────────────┬────────────────────┘',
        '                          │',
        '                     REST API calls',
        '                          │',
        '         ┌────────────────▼────────────────────┐',
        '         │   BACKEND   —  api.mypetclub.app    │',
        '         │   Node.js + Express 4 + Pino        │',
        '         │   Google Cloud Run  (us-west1 OR)   │',
        '         │                                     │',
        '         │  Auth | Bookings | Admin | Notifs   │',
        '         └──────────────┬──────────────────────┘',
        '                        │  Supabase JS v2 (REST + Realtime)',
        '         ┌──────────────▼──────────────────────┐',
        '         │   SUPABASE POSTGRES  (us-west-2 OR) │',
        '         │   users, bookings, pets (soft del)  │',
        '         │   otp_tokens, rate_limits,          │',
        '         │   professional_profiles, loyalty    │',
        '         │   Realtime: bookings pub/sub ✓      │',
        '         └─────────────────────────────────────┘',
        '',
        '  Staging: develop branch → petclub-backend-staging (us-west1, min=0)',
        '',
        '  External services connected to Backend:',
        '  ├── Firebase    → Phone OTP (India +91) + FCM push notifications',
        '  ├── Twilio      → SMS (US +1, currently stubbed)',
        '  ├── Resend      → Transactional email (OTP, booking alerts)',
        '  ├── Zoho SMTP   → Admin / support emails',
        '  ├── Mappls      → India geocoding + address autocomplete',
        '  ├── Cloud Monitoring → uptime check every 5 min → email alert',
        '  └── Razorpay    → Payments (BLOCKED — pending LLC registration)',
    ], S))

    story.append(sp(4))
    story.append(Paragraph('CI / CD Pipeline', S['h2']))
    story.append(code_block([
        'git push origin main',
        '   │',
        '   ├── Frontend → GitHub triggers Vercel webhook',
        '   │              Vercel: npm run build (vite build)',
        '   │              Live at app.mypetclub.app in ~2 minutes',
        '   │',
        '   └── Backend  → GitHub triggers Cloud Build',
        '                  Cloud Build: docker build → Artifact Registry',
        '                  Cloud Run deploys new revision',
        '                  Live at api.mypetclub.app in ~4-5 minutes',
    ], S))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 3 — AUTH FLOW
    # ════════════════════════════════════════════
    story.append(section_header('Authentication Flow', '03', S))
    story.append(sp(3))

    story.append(Paragraph('3.1  Phone Login — India (+91), Primary Method', S['h2']))
    for i, step in enumerate([
        'User enters +91 phone number on the login screen',
        'Frontend initialises Firebase reCAPTCHA verifier (invisible)',
        'Firebase sends OTP SMS directly to the user\'s phone',
        'User enters the 6-digit code',
        'Firebase confirms OTP → returns a signed ID token',
        'Frontend calls  POST /api/auth/firebase-verify  with the ID token',
        'Backend verifies the token with Firebase Admin SDK',
        'Backend finds or creates the user row in Supabase users table',
        'Backend issues a PETclub JWT (30d expiry) as an httpOnly cookie',
        'Cookie is set with Secure; SameSite=Strict — JS cannot read it (XSS-safe)',
    ], 1):
        story.append(Paragraph(
            f'<font color="#f97316"><b>{i}.</b></font>  {step}', S['step']))

    story.append(sp(3))
    story.append(Paragraph('3.2  Email OTP Login — Fallback Method', S['h2']))
    for i, step in enumerate([
        'User enters email address',
        'Frontend calls  POST /api/auth/send-email-otp',
        'Backend generates 6-digit OTP, stores in otp_tokens table (10 min TTL)',
        'Resend API delivers OTP email to user',
        'User enters the 6-digit code',
        'Frontend calls  POST /api/auth/verify-email-otp',
        'Backend verifies OTP → issues PETclub JWT as httpOnly cookie',
    ], 1):
        story.append(Paragraph(
            f'<font color="#f97316"><b>{i}.</b></font>  {step}', S['step']))

    story.append(sp(3))
    story.append(Paragraph('3.3  JWT Details', S['h2']))
    story.append(data_table(
        ['Property', 'Value'],
        [
            ['Algorithm',    'HS256'],
            ['Secret',       '64-byte random hex  (JWT_SECRET env var)'],
            ['Payload',      '{ id, role }'],
            ['Expiry',       '30d  (JWT_EXPIRES_IN env var)'],
            ['Storage',      'httpOnly; Secure; SameSite=Strict cookie — not readable by JS'],
            ['On 401',       'petclub:unauthorized event fired → re-login (cookie cleared by POST /api/auth/logout)'],
            ['Logout',       'POST /api/auth/logout — backend expires the cookie explicitly'],
            ['OTP Rate limit','5 sends per 3 minutes per IP'],
            ['Secret rotation','Immediately invalidates ALL tokens — do during off-peak hours'],
        ],
        S, col_widths=[55*mm, 115*mm]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 4 — NEW LAPTOP SETUP
    # ════════════════════════════════════════════
    story.append(section_header('New Laptop Setup', '04', S))
    story.append(sp(3))

    story.append(Paragraph('Prerequisites', S['h2']))
    for item in [
        'Node.js v20 LTS — nodejs.org',
        'Git — git-scm.com',
        'Google Cloud CLI — cloud.google.com/sdk',
        'VS Code (recommended editor)',
    ]:
        story.append(Paragraph(item, S['bullet']))

    story.append(sp(3))
    story.append(Paragraph('Step 1 — Authenticate with Google Cloud', S['h2']))
    story.append(code_block([
        'gcloud auth login',
        'gcloud config set project YOUR_GCP_PROJECT_ID',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Step 2 — Clone Repositories', S['h2']))
    story.append(code_block([
        'git clone https://github.com/Kolanupaka92/petclub-app.git',
        'git clone https://github.com/Kolanupaka92/petclub-backend.git',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Step 3 — Backend Setup', S['h2']))
    story.append(code_block([
        'cd petclub-backend',
        'npm install',
        'copy .env.example .env       # fill in real values (see Section 5)',
        'npm run dev                  # starts on http://localhost:5000',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Step 4 — Frontend Setup', S['h2']))
    story.append(code_block([
        'cd petclub-app',
        'npm install',
        'copy .env.example .env.local',
        '# Edit .env.local and set:',
        'VITE_API_URL=http://localhost:5000/api',
        '',
        'npm run dev                  # starts on http://localhost:5173',
    ], S))

    story.append(sp(3))
    story.append(Paragraph('Daily Development Workflow', S['h2']))
    story.append(code_block([
        '# Terminal 1 — backend',
        'cd petclub-backend',
        'npm run dev',
        '',
        '# Terminal 2 — frontend',
        'cd petclub-app',
        'npm run dev',
        '',
        '# Open browser → http://localhost:5173',
    ], S))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 5 — ENV VARS
    # ════════════════════════════════════════════
    story.append(section_header('Environment Variables', '05', S))
    story.append(sp(3))

    story.append(Paragraph('Backend — Cloud Run Variables', S['h2']))
    story.append(data_table(
        ['Variable', 'Purpose', 'Where to get'],
        [
            ['JWT_SECRET',
             'Signs all auth tokens',
             'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'],
            ['JWT_EXPIRES_IN',
             'Token lifetime (set 30d)',
             '⚠ Currently 07d — update to 30d'],
            ['SUPABASE_URL',
             'Supabase API URL',
             'Supabase Dashboard → Settings → API'],
            ['SUPABASE_SERVICE_KEY',
             'REST API JWT key  (→ Secret Manager)',
             'Supabase Dashboard → Settings → API'],
            ['SUPABASE_DB_PASSWORD',
             'Direct Postgres password  (→ Secret Manager)',
             'Supabase Dashboard → Settings → Database'],
            ['FIREBASE_SERVICE_ACCOUNT_JSON',
             'FCM + phone auth  (already in Secret Manager)',
             'Firebase Console → Service Accounts'],
            ['RESEND_API_KEY',
             'Transactional email  (→ Secret Manager)',
             'resend.com → API Keys'],
            ['SENTRY_DSN',
             'Error tracking (activates Sentry)',
             'sentry.io → New Project → Node.js → DSN'],
            ['TWILIO_ACCOUNT_SID',
             'SMS (optional, stubbed)',
             'console.twilio.com'],
            ['ADMIN_SECRET',
             'Admin bootstrap  (→ Secret Manager)',
             'Generate: node -e "...randomBytes(32)..."'],
        ],
        S, col_widths=[52*mm, 48*mm, 70*mm]
    ))

    story.append(sp(4))
    story.append(Paragraph('Frontend — .env.local (dev) / Vercel Dashboard (prod)', S['h2']))
    story.append(data_table(
        ['Variable', 'Local dev value', 'Notes'],
        [
            ['VITE_API_URL',          'http://localhost:5000/api',  'Must change for local dev'],
            ['VITE_FIREBASE_API_KEY', 'same as prod',               'From Firebase Console → Project Settings'],
            ['VITE_MAPBOX_TOKEN',     'same as prod',               'From account.mapbox.com → Tokens'],
            ['VITE_SENTRY_DSN',       'unset locally',              'sentry.io → New Project → React → DSN'],
            ['VITE_SUPPORT_EMAIL',    'support@mypetclub.app',      'Shown in error messages'],
        ],
        S, col_widths=[58*mm, 58*mm, 54*mm]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 6 — OPERATIONAL COMMANDS
    # ════════════════════════════════════════════
    story.append(section_header('Key Operational Commands', '06', S))
    story.append(sp(2))
    story.append(Paragraph(
        'All commands are PowerShell on Windows. Run from any directory.', S['note']))
    story.append(sp(2))

    story.append(Paragraph('Rotate JWT Secret', S['h2']))
    story.append(code_block([
        '# Step 1 — generate new secret',
        'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
        '',
        '# Step 2 — update Cloud Run (redeploys automatically)',
        'gcloud run services update petclub-backend `',
        '  --region=us-west1 `',
        '  --update-env-vars JWT_SECRET=PASTE_NEW_SECRET_HERE',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Update Any Cloud Run Variable', S['h2']))
    story.append(code_block([
        'gcloud run services update petclub-backend `',
        '  --region=us-west1 `',
        '  --update-env-vars VAR_NAME=VALUE,VAR2=VALUE2',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('View Live Backend Logs', S['h2']))
    story.append(code_block([
        'gcloud logging read `',
        '  "resource.type=cloud_run_revision AND resource.labels.service_name=petclub-backend" `',
        '  --limit=50 --format="value(timestamp,textPayload)"',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Filter Logs by Feature', S['h2']))
    story.append(code_block([
        '# Pipe the log command above into:',
        '| Select-String "FirebaseVerify|EmailOTP|RateLimit|BookingDispatch"',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Check Current Deployed Revision', S['h2']))
    story.append(code_block([
        'gcloud run services describe petclub-backend `',
        '  --region=us-west1 `',
        '  --format="value(status.latestReadyRevisionName,status.conditions[0].lastTransitionTime)"',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Force Redeploy Backend (no code change)', S['h2']))
    story.append(code_block([
        'gcloud run deploy petclub-backend `',
        '  --region=us-west1 `',
        '  --source=C:\\Users\\14697\\petclub-backend',
    ], S))

    story.append(sp(2))
    story.append(Paragraph('Health Check', S['h2']))
    story.append(code_block([
        'curl https://api.mypetclub.app/api/health',
        '# Returns: firebase_auth, email, supabase, fcm status',
    ], S))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 7 — DEPLOYMENT FLOW
    # ════════════════════════════════════════════
    story.append(section_header('Deployment Flow', '07', S))
    story.append(sp(3))

    story.append(Paragraph('Frontend — Vercel (Auto)', S['h2']))
    for i, step in enumerate([
        'git push origin main',
        'GitHub triggers Vercel webhook automatically',
        'Vercel runs:  npm run build  (vite build)',
        'Live at app.mypetclub.app in approximately 2 minutes',
        'Monitor: vercel.com/kolanupaka92-s-projects/petclub-app',
    ], 1):
        story.append(Paragraph(
            f'<font color="#f97316"><b>{i}.</b></font>  {step}', S['step']))

    story.append(sp(3))
    story.append(Paragraph('Backend — Cloud Run (Auto)', S['h2']))
    for i, step in enumerate([
        'git push origin main',
        'GitHub triggers Cloud Build automatically',
        'Cloud Build: docker build → push image to Artifact Registry',
        'Cloud Run creates a new revision, old revision stays as rollback',
        'Live at api.mypetclub.app in approximately 4-5 minutes',
        'Monitor: GCP Console → Cloud Run → petclub-backend',
    ], 1):
        story.append(Paragraph(
            f'<font color="#f97316"><b>{i}.</b></font>  {step}', S['step']))

    story.append(sp(3))
    story.append(alert(
        '⚠', 'Note',
        'Semantic-release bot commits are tagged [skip ci] — they do NOT trigger a deploy. '
        'Only your own code commits deploy.',
        YELLOW_BG, YELLOW_TXT, S
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 8 — TROUBLESHOOTING
    # ════════════════════════════════════════════
    story.append(section_header('Troubleshooting Guide', '08', S))
    story.append(sp(3))

    issues = [
        ('"Too many OTP requests"',
         'Rate limiter triggered (5 requests / 3 min / IP). Currently using in-memory fallback because SUPABASE_DB_PASSWORD is not set.',
         'Wait 3 minutes and retry.\nPermanent fix: add SUPABASE_DB_PASSWORD to Cloud Run env vars.'),
        ('"Verification failed" on phone OTP',
         'POST /api/auth/firebase-verify returning HTTP 500.',
         'Check Cloud Run logs, filter [FirebaseVerify].\nCheckpoints logged: Looking up user → inserting → Signing JWT → success.\nCommon causes: Supabase unreachable, Firebase Admin not initialised.'),
        ('"Firebase not configured on server" (503)',
         'FIREBASE_SERVICE_ACCOUNT_JSON env var is missing or malformed.',
         'Update Cloud Run env var with valid single-line JSON from Firebase Console → Service Accounts.'),
        ('All users logged out suddenly',
         'JWT_SECRET was rotated — all existing tokens invalidated immediately.',
         'Expected behaviour. Users must re-login via OTP.\nAlways rotate secrets during off-peak hours.'),
        ('Vercel deploy not triggering',
         'Semantic-release bot commits include [skip ci] — these correctly skip deployment.',
         'Your own code commits always trigger. Manual deploy: vercel deploy --prod\n(run from petclub-app directory)'),
        ('Cloud Run revision stuck deploying',
         'Crash on startup: bad env var, missing npm package, or syntax error.',
         'Check Cloud Build logs in GCP Console.\nEnsure REQUIRED_ENV vars are set: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY.'),
        ('Supabase 500 errors across all endpoints',
         'Supabase project may be paused (free plan pauses after 1 week of inactivity).',
         'Go to app.supabase.com → click Restore.\nVerify: curl https://api.mypetclub.app/api/health'),
    ]

    for title, cause, fix in issues:
        story.append(KeepTogether([
            Paragraph(f'<b><font color="#f97316">Issue:</font></b>  {title}', S['h3']),
            Paragraph(f'<b>Cause:</b>  {cause}', S['body']),
            Paragraph(f'<b>Fix:</b>  {fix.replace(chr(10), "  |  ")}', S['body']),
            HRFlowable(width='100%', thickness=0.5, color=HexColor('#e2e8f0'), spaceAfter=4),
        ]))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 9 — KNOWN ISSUES
    # ════════════════════════════════════════════
    story.append(section_header('Known Issues & Action Items', '09', S))
    story.append(sp(3))

    # ── Completed ──────────────────────────────────────────────────────────────
    story.append(Paragraph('Completed — June 2026', S['h2']))
    BLUE_BG  = HexColor('#eff6ff')
    BLUE_TXT = HexColor('#1d4ed8')
    for item, fix in [
        ('RLS on all 21 Supabase tables + grant migration',
         'Done June 1, 2026. service_role bypass policies applied. Explicit PostgREST GRANTs applied ahead of Oct 30, 2026 deadline.'),
        ('Sentry error tracking — frontend + backend',
         'Active when SENTRY_DSN (Cloud Run) and VITE_SENTRY_DSN (Vercel) are set. Both confirmed set.'),
        ('SUPABASE_DB_PASSWORD added — rate limiter uses Postgres',
         'Rate limit store now shared across all Cloud Run instances. Added June 27, 2026.'),
        ('JWT_EXPIRES_IN = 30d',
         'Tokens now last 30 days. Confirmed set on Cloud Run.'),
        ('Cloud Run migrated to us-west1 Oregon',
         'Co-located with Supabase (us-west-2 Oregon). Eliminates ~20ms cross-region latency. IAM allUsers binding preserved.'),
        ('Cloud Build trigger uses cloudbuild.yaml from GitHub',
         'No more hardcoded inline build config. Both main (prod) and develop (staging) branches have their own build files.'),
        ('Pino structured JSON logging',
         'Replaced 144 console.log/error/warn calls with pino logger. pino-http middleware logs all HTTP requests. Searchable in Cloud Logging.'),
        ('Supabase Realtime replaces SSE polling on booking tracking',
         'GET /api/bookings/:id/track now subscribes to postgres_changes on the bookings table. Tracking latency: 100ms vs 3000ms.'),
        ('API versioning — /api/v1/* supported',
         'Middleware rewrites /api/v1/* to /api/*. X-API-Version: 1 header on all responses.'),
        ('Staging environment',
         'develop branch → petclub-backend-staging Cloud Run service (us-west1, min-instances=0). Separate build trigger: cloudbuild-staging.yaml.'),
        ('httpOnly cookie auth — localStorage removed',
         'JWT issued as httpOnly; Secure; SameSite=Strict cookie. JS cannot read it. All fetches use credentials: include. Logout calls POST /api/auth/logout to expire cookie server-side.'),
        ('Soft delete — users, bookings, pets',
         'deleted_at TIMESTAMPTZ column added to all 3 tables. All admin/cron deletes now set deleted_at. Hard-purge cron runs daily and permanently erases records deleted >90 days ago (GDPR).'),
        ('DELETE /api/pets/:id route added',
         'Customers can now soft-delete their own pets. Verifies ownership, 404 if already deleted.'),
        ('Cloud Monitoring uptime check + alert',
         '/api/health checked every 5 minutes from multiple regions. Email alert to ksk.dev87@gmail.com when backend goes down.'),
    ]:
        story.append(alert('✅', item, fix, BLUE_BG, BLUE_TXT, S))
        story.append(sp(2))

    story.append(sp(2))

    # ── Action Required ────────────────────────────────────────────────────────
    story.append(Paragraph('Action Required', S['h2']))
    for item, fix in [
        ('Secret Manager not fully populated',
         'Only firebase-service-account is in Secret Manager. JWT_SECRET, SUPABASE_SERVICE_KEY, RESEND_API_KEY, TWILIO_AUTH_TOKEN, ADMIN_SECRET are still plain Cloud Run env vars. '
         'Run migrate-to-secret-manager.ps1 after updating it with current (rotated) values. '
         'WARNING: do NOT run the old script — it has pre-rotation values and will overwrite current secrets.'),
        ('No refresh token mechanism',
         '30d JWT expiry forces a full re-login via OTP when it expires. Plan: add /auth/refresh endpoint + refresh_tokens table in Supabase. Deferred post-Razorpay.'),
    ]:
        story.append(alert('🔴', item, fix, RED_BG, RED_TXT, S))
        story.append(sp(2))

    story.append(sp(2))
    story.append(Paragraph('Deferred — Post Razorpay Integration', S['h2']))
    for item, fix in [
        ('Razorpay payments disabled',
         'Entire payment module is blocked pending LLC registration. No user-facing impact until payments are needed. Pricing architecture defined: SP never sees prices, ₹150 subsidy, RBAC stripping on SP endpoints.'),
    ]:
        story.append(alert('🟡', item, fix, YELLOW_BG, YELLOW_TXT, S))
        story.append(sp(2))

    story.append(sp(2))
    story.append(Paragraph('Watch — Not Urgent', S['h2']))
    for item, fix in [
        ('Twilio SMS stubbed',
         'US +1 phone logins log a warning and do not send real SMS. Fine while the platform is India-only.'),
        ('Vercel Hobby plan bandwidth limit',
         '100 GB/month. Upgrade to Pro plan before sustained marketing campaigns or when traffic grows.'),
        ('Admin panel has no soft-delete recovery UI',
         'Soft-deleted users/bookings/pets can be restored via Supabase SQL editor (SET deleted_at = NULL). No admin panel UI for this yet.'),
    ]:
        story.append(alert('🟢', item, fix, GREEN_BG, GREEN_TXT, S))
        story.append(sp(2))

    story.append(PageBreak())

    # ════════════════════════════════════════════
    # SECTION 10 — DASHBOARDS
    # ════════════════════════════════════════════
    story.append(section_header('Service Dashboards', '10', S))
    story.append(sp(3))

    story.append(data_table(
        ['Service', 'Dashboard URL', 'Used for'],
        [
            ['Supabase',      'app.supabase.com',                    'Database, SQL editor, RLS policies, API logs'],
            ['Firebase',      'console.firebase.google.com',         'Phone auth, FCM push, service accounts'],
            ['Google Cloud',  'console.cloud.google.com/run',        'Cloud Run, Cloud Build, Secret Manager, GCP logs'],
            ['Cloud Monitor', 'console.cloud.google.com/monitoring',  'Uptime checks, alert policies — /api/health every 5 min'],
            ['Vercel',        'vercel.com/kolanupaka92-s-projects',  'Frontend deploys, env vars, analytics'],
            ['Sentry',        'sentry.io',                           'Error tracking — frontend + backend crashes'],
            ['Resend',        'resend.com',                          'Email delivery logs, API keys'],
            ['Twilio',        'console.twilio.com',                  'SMS logs, phone numbers'],
            ['Mapbox',        'account.mapbox.com',                  'Geocoding API tokens'],
            ['Razorpay',      'dashboard.razorpay.com',              'Payments — when LLC is registered'],
            ['GitHub',        'github.com/Kolanupaka92',             'Source code, both repos, CI/CD triggers'],
        ],
        S, col_widths=[32*mm, 70*mm, 68*mm]
    ))

    story.append(sp(6))
    story.append(HRFlowable(width='100%', thickness=2, color=ORANGE, spaceAfter=4*mm))
    story.append(Paragraph(
        'This document is confidential and intended for PETclub engineering staff only.',
        ParagraphStyle('footer_note', fontName='Helvetica', fontSize=8.5,
                       textColor=SLATE, alignment=TA_CENTER, leading=12)))
    story.append(Paragraph(
        f'Generated {datetime.now().strftime("%B %d, %Y")}  |  mypetclub.app',
        ParagraphStyle('footer_date', fontName='Helvetica', fontSize=8,
                       textColor=HexColor('#94a3b8'), alignment=TA_CENTER, leading=12)))

    # ── Build ──
    doc.build(story)
    print(f'PDF saved to: {out}')


if __name__ == '__main__':
    build()
