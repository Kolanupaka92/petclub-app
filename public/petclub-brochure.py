"""
PETclub Tri-Fold Marketing Brochure Generator
A4 landscape, 2 pages, 3 panels each (designed for tri-fold print + WhatsApp share).
No "Trusted by Pet Parents" — replaced with honest "Our Promise" panel.
"""
import io
import os
import qrcode
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# Real pet photos (Pexels — free for commercial use, no attribution)
ASSETS = os.path.dirname(os.path.abspath(__file__)) + "/brochure-assets"
IMG_DOG_HERO     = ASSETS + "/dog-hero.jpg"
IMG_CAT_HERO     = ASSETS + "/cat-hero.jpg"
IMG_CAT_GROOMING = ASSETS + "/cat-grooming.jpg"
IMG_CAT_PORTRAIT = ASSETS + "/cat-cute.jpg"


def draw_rounded_image(c, image_path, x, y, w, h, radius=8):
    """Draw an image clipped to a rounded rectangle."""
    if not os.path.exists(image_path):
        c.setFillColor(HexColor("#e2e8f0"))
        c.roundRect(x, y, w, h, radius, fill=1, stroke=0)
        return
    c.saveState()
    p = c.beginPath()
    p.moveTo(x + radius, y)
    p.lineTo(x + w - radius, y)
    p.arcTo(x + w - 2 * radius, y, x + w, y + 2 * radius, startAng=270, extent=90)
    p.lineTo(x + w, y + h - radius)
    p.arcTo(x + w - 2 * radius, y + h - 2 * radius, x + w, y + h, startAng=0, extent=90)
    p.lineTo(x + radius, y + h)
    p.arcTo(x, y + h - 2 * radius, x + 2 * radius, y + h, startAng=90, extent=90)
    p.lineTo(x, y + radius)
    p.arcTo(x, y, x + 2 * radius, y + 2 * radius, startAng=180, extent=90)
    p.close()
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(image_path, x, y, width=w, height=h,
                preserveAspectRatio=True, anchor='c', mask='auto')
    c.restoreState()

# ── Fonts (Arial — supports ₹ and emoji subset) ──────────────────────────────
FONT = "Arial"
FONT_B = "Arial-Bold"
try:
    pdfmetrics.registerFont(TTFont(FONT,   "C:/Windows/Fonts/arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_B, "C:/Windows/Fonts/arialbd.ttf"))
except Exception:
    FONT, FONT_B = "Helvetica", "Helvetica-Bold"

# ── Brand colors ─────────────────────────────────────────────────────────────
ORANGE       = HexColor("#f97316")
ORANGE_DARK  = HexColor("#ea580c")
ORANGE_LITE  = HexColor("#fff7ed")
DARK         = HexColor("#1e293b")  # slate-900
SLATE        = HexColor("#475569")
LIGHT        = HexColor("#f8fafc")
BORD         = HexColor("#e2e8f0")
WHITE        = white

# Service colors
GROOM_BG     = HexColor("#f97316")  # orange
TRAIN_BG     = HexColor("#3b82f6")  # blue
VET_BG       = HexColor("#ef4444")  # red
FOOD_BG      = HexColor("#10b981")  # green

PAGE_W, PAGE_H = landscape(A4)  # 842 x 595
PANEL_W = PAGE_W / 3            # ~280.67


# ── QR Code helper ───────────────────────────────────────────────────────────
def make_qr_image(url):
    qr = qrcode.QRCode(version=1, box_size=10, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    bio = io.BytesIO()
    img.save(bio, format='PNG')
    bio.seek(0)
    return ImageReader(bio)


# ── Drawing primitives ──────────────────────────────────────────────────────
def fill_panel(c, panel_idx, color):
    """Fill an entire panel (0=left, 1=middle, 2=right) with a color."""
    c.setFillColor(color)
    c.rect(panel_idx * PANEL_W, 0, PANEL_W, PAGE_H, fill=1, stroke=0)


def draw_paw(c, x, y, size, color):
    """Official PETclub paw: 4 ellipse toes + larger main pad (matches icon.svg)."""
    c.setFillColor(color)
    # Toes — ellipses at top, arranged in natural arc
    # SVG: cx=150,212,300,362 cy=210,165,165,210 rx=38 ry=34
    # Normalised to size (SVG canvas 512). Center pad at (256, 335).
    s = size / 512.0
    toes = [(150, 210), (212, 165), (300, 165), (362, 210)]
    for (cx, cy) in toes:
        c.ellipse(x + (cx - 256 - 38) * s, y + (335 - cy - 34) * s,
                  x + (cx - 256 + 38) * s, y + (335 - cy + 34) * s,
                  fill=1, stroke=0)
    # Main pad — larger, more dominant
    c.ellipse(x - 114 * s, y - 97 * s, x + 114 * s, y + 97 * s, fill=1, stroke=0)


def draw_logo_tile(c, x, y, size, bg_color=None):
    """Draw the official PETclub logo: rounded square with white paw inside.

    bg_color=None uses brand orange. Pass WHITE for inverted version on dark bg.
    """
    fill = ORANGE if bg_color is None else bg_color
    paw_color = WHITE if bg_color is None else ORANGE
    radius = size * 0.225  # matches SVG rx=115/512
    c.setFillColor(fill)
    c.roundRect(x, y, size, size, radius, fill=1, stroke=0)
    # Paw centered inside the tile
    draw_paw(c, x + size / 2, y + size / 2, size * 0.95, paw_color)


# ── Original pet illustrations (no copyright) ────────────────────────────
def draw_dog(c, x, y, size, color):
    """Cute dog silhouette — facing right."""
    c.setFillColor(color); s = size
    c.ellipse(x - s * 0.55, y - s * 0.10, x + s * 0.50, y + s * 0.20, fill=1, stroke=0)
    c.ellipse(x + s * 0.20, y - s * 0.35, x + s * 0.32, y - s * 0.05, fill=1, stroke=0)
    c.ellipse(x - s * 0.32, y - s * 0.35, x - s * 0.20, y - s * 0.05, fill=1, stroke=0)
    c.ellipse(x - s * 0.68, y + s * 0.05, x - s * 0.55, y + s * 0.35, fill=1, stroke=0)
    c.ellipse(x + s * 0.30, y + s * 0.10, x + s * 0.70, y + s * 0.45, fill=1, stroke=0)
    c.ellipse(x + s * 0.30, y + s * 0.05, x + s * 0.42, y + s * 0.35, fill=1, stroke=0)
    c.ellipse(x + s * 0.55, y + s * 0.15, x + s * 0.72, y + s * 0.28, fill=1, stroke=0)


def draw_cat(c, x, y, size, color):
    """Cute cat silhouette — sitting."""
    c.setFillColor(color); s = size
    c.ellipse(x - s * 0.30, y - s * 0.35, x + s * 0.30, y + s * 0.25, fill=1, stroke=0)
    c.ellipse(x - s * 0.27, y + s * 0.18, x + s * 0.27, y + s * 0.55, fill=1, stroke=0)
    p = c.beginPath()
    p.moveTo(x - s * 0.25, y + s * 0.45)
    p.lineTo(x - s * 0.12, y + s * 0.70)
    p.lineTo(x - s * 0.02, y + s * 0.50)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    p = c.beginPath()
    p.moveTo(x + s * 0.02, y + s * 0.50)
    p.lineTo(x + s * 0.12, y + s * 0.70)
    p.lineTo(x + s * 0.25, y + s * 0.45)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.ellipse(x + s * 0.25, y - s * 0.05, x + s * 0.42, y + s * 0.30, fill=1, stroke=0)
    c.ellipse(x - s * 0.15, y - s * 0.40, x - s * 0.02, y - s * 0.28, fill=1, stroke=0)
    c.ellipse(x + s * 0.02, y - s * 0.40, x + s * 0.15, y - s * 0.28, fill=1, stroke=0)


def draw_dotted_paw_bg(c, panel_idx, color, opacity_color):
    """Background paw print decoration."""
    c.setFillColor(opacity_color)
    x0 = panel_idx * PANEL_W
    # scattered paws
    for px, py, sz in [(x0 + 50, 480, 20), (x0 + 210, 100, 18),
                        (x0 + 240, 380, 24), (x0 + 90, 200, 16)]:
        draw_paw(c, px, py, sz, opacity_color)


# ══════════════════════════════════════════════════════════════════════════
# PAGE 1 — Outside (when folded: Back | Inside flap | Front cover)
# ══════════════════════════════════════════════════════════════════════════

def draw_back_panel(c):
    """LEFT panel of page 1 — back cover: dark slate with QR + contact."""
    fill_panel(c, 0, DARK)
    x0 = 0

    # Brand strip at top
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)

    # Official logo tile (white tile + orange paw on orange band)
    draw_logo_tile(c, x0 + 14, PAGE_H - 60, 36, bg_color=WHITE)

    # Brand text
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 20)
    c.drawString(x0 + 60, PAGE_H - 38, "PET")
    c.setFont(FONT, 20)
    c.drawString(x0 + 60 + 38, PAGE_H - 38, "club")
    c.setFont(FONT, 9)
    c.drawString(x0 + 60, PAGE_H - 53, "Paw Care at Your Doorstep")

    # QR code box (orange card)
    qr_box_y = PAGE_H - 320
    c.setFillColor(ORANGE)
    c.roundRect(x0 + 30, qr_box_y, PANEL_W - 60, 220, 14, fill=1, stroke=0)

    # QR image (white background)
    c.setFillColor(WHITE)
    c.roundRect(x0 + 60, qr_box_y + 65, 160, 140, 8, fill=1, stroke=0)
    qr_img = make_qr_image("https://app.mypetclub.app")
    c.drawImage(qr_img, x0 + 65, qr_box_y + 70, width=150, height=130,
                preserveAspectRatio=True, mask='auto')

    # "Scan to Download"
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 12)
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y + 45, "Scan to Download")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y + 28, "app.mypetclub.app")

    # Divider line
    c.setStrokeColor(WHITE)
    c.setLineWidth(0.5)
    c.line(x0 + 60, qr_box_y + 18, x0 + PANEL_W - 60, qr_box_y + 18)

    # Contact block
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 11)
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y - 12, "Contact Us")
    c.setFont(FONT, 8.5)
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y - 30, "support@mypetclub.app")
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y - 45, "Hyderabad, Telangana — India")
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y - 60, "www.mypetclub.app")

    # WhatsApp
    c.setFont(FONT, 8.5)
    c.drawCentredString(x0 + PANEL_W / 2, qr_box_y - 78, "WhatsApp: +1 609 721 5754")

    # Bottom footer band
    c.setFillColor(ORANGE)
    c.rect(x0, 0, PANEL_W, 40, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 9)
    c.drawCentredString(x0 + PANEL_W / 2, 25, "PETCLUB SERVICES LLP (Proposed)")
    c.setFont(FONT, 7.5)
    c.drawCentredString(x0 + PANEL_W / 2, 12, "© 2026 PETclub India · All Rights Reserved")


def draw_why_panel(c):
    """MIDDLE panel of page 1 — Why Choose PETclub features."""
    fill_panel(c, 1, WHITE)
    x0 = PANEL_W

    # Orange header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 45, "Why Choose PETclub?")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 62, "What makes us different")

    # Feature list — 6 items
    features = [
        ("🏠", "At-Home Service",     "No travel stress — we come to you"),
        ("✅", "Verified Professionals", "Background-checked experts only"),
        ("📱", "Easy App Booking",    "Book in under 60 seconds"),
        ("📍", "Live GPS Tracking",   "Track your professional in real-time"),
        ("📸", "Before & After Photos", "Full transparency every session"),
        ("🆘", "24×7 Support",         "Round-the-clock customer help"),
    ]

    y_start = PAGE_H - 115
    row_h = 70
    for i, (icon, title, desc) in enumerate(features):
        y = y_start - i * row_h
        # Feature box
        c.setFillColor(LIGHT)
        c.setStrokeColor(BORD)
        c.setLineWidth(0.6)
        c.roundRect(x0 + 15, y - 58, PANEL_W - 30, 60, 8, fill=1, stroke=1)

        # Orange accent square (left)
        c.setFillColor(ORANGE)
        c.roundRect(x0 + 22, y - 38, 18, 18, 3, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont(FONT_B, 11)
        c.drawCentredString(x0 + 31, y - 33, icon)

        # Title
        c.setFillColor(DARK)
        c.setFont(FONT_B, 10.5)
        c.drawString(x0 + 50, y - 25, title)

        # Description
        c.setFillColor(SLATE)
        c.setFont(FONT, 8.5)
        c.drawString(x0 + 50, y - 40, desc)


def draw_cover_panel(c):
    """RIGHT panel of page 1 — front cover: orange with logo."""
    fill_panel(c, 2, ORANGE)
    x0 = 2 * PANEL_W

    # Background paw decorations (lighter orange)
    light_paws = HexColor("#fb923c")  # orange-400
    for px, py, sz in [(x0 + 50, 500, 30), (x0 + 220, 80, 25),
                        (x0 + 220, 460, 20), (x0 + 60, 80, 22),
                        (x0 + 130, 280, 35)]:
        draw_paw(c, px, py, sz, light_paws)

    # Top: Logo + brand
    top_y = PAGE_H - 60
    draw_logo_tile(c, x0 + 22, top_y - 35, 35, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 22)
    cx_mid = x0 + PANEL_W / 2
    tw_pet = c.stringWidth("PET", FONT_B, 22)
    c.drawString(x0 + 68, top_y - 18, "PET")
    c.setFont(FONT, 22)
    c.drawString(x0 + 68 + tw_pet, top_y - 18, "club")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 68, top_y - 33, "Paw Care at Your Doorstep")

    # Two REAL photos side-by-side: Dog + Cat (each clearly labelled)
    photo_y = PAGE_H * 0.45
    photo_h = 140
    photo_w = (PANEL_W - 55) / 2 - 3

    # Dog photo
    draw_rounded_image(c, IMG_DOG_HERO,
                       x0 + 22, photo_y, photo_w, photo_h, radius=12)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 10)
    c.drawCentredString(x0 + 22 + photo_w / 2, photo_y - 16, "🐕  FOR DOGS")

    # Cat photo
    draw_rounded_image(c, IMG_CAT_HERO,
                       x0 + 33 + photo_w, photo_y, photo_w, photo_h, radius=12)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 10)
    c.drawCentredString(x0 + 33 + photo_w + photo_w / 2, photo_y - 16, "🐱  FOR CATS")

    # Divider line
    c.setStrokeColor(WHITE)
    c.setLineWidth(1.2)
    c.line(x0 + 50, photo_y - 38, x0 + PANEL_W - 50, photo_y - 38)

    # Services list
    services = ["✂️  Pet Grooming", "🐕  Pet Training",
                "🏥  Vet at Home", "🍖  Pet Food Delivery"]
    for i, s in enumerate(services):
        c.setFont(FONT_B, 12)
        c.drawCentredString(cx_mid, photo_y - 60 - i * 20, s)

    # Bottom CTA box
    c.setFillColor(WHITE)
    c.roundRect(x0 + 25, 35, PANEL_W - 50, 50, 8, fill=1, stroke=0)
    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT_B, 13)
    c.drawCentredString(x0 + PANEL_W / 2, 65, "www.mypetclub.app")
    c.setFillColor(ORANGE)
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, 50, "Download the App · Book in 60 Seconds")


# ══════════════════════════════════════════════════════════════════════════
# PAGE 2 — Inside (Services | How It Works | Our Promise)
# ══════════════════════════════════════════════════════════════════════════

def draw_services_panel(c):
    """LEFT panel of page 2 — Services with colored cards."""
    fill_panel(c, 0, WHITE)
    x0 = 0

    # Orange header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 45, "Our Services")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 62, "Everything your pet needs, at your door")

    # Service cards — 4 colored cards
    services = [
        ("✂️  Pet Grooming", GROOM_BG, [
            "Bath & Blow Dry", "Haircut & Styling",
            "Nail Trimming", "Ear Cleaning", "Deshedding & Tick Care",
        ]),
        ("🐕  Pet Training", TRAIN_BG, [
            "Puppy Basics", "Obedience Training",
            "Behaviour Correction", "Socialisation", "Agility Training",
        ]),
        ("🏥  Vet at Home", VET_BG, [
            "Health Check-ups", "Vaccinations",
            "Deworming", "Diet Consultation", "Emergency Advice",
        ]),
        ("🍖  Pet Food", FOOD_BG, [
            "Premium Brands", "Home Delivery",
            "Personalised Diet", "Treats & Chews", "Supplements",
        ]),
    ]

    y_start = PAGE_H - 105
    card_h = 110
    for i, (title, color, items) in enumerate(services):
        y = y_start - i * (card_h + 5)
        # Card
        c.setFillColor(color)
        c.roundRect(x0 + 15, y - card_h, PANEL_W - 30, card_h, 8, fill=1, stroke=0)
        # Title
        c.setFillColor(WHITE)
        c.setFont(FONT_B, 12)
        c.drawString(x0 + 25, y - 18, title)
        # Items
        c.setFont(FONT, 8.5)
        for j, item in enumerate(items):
            c.drawString(x0 + 28, y - 35 - j * 13, f"• {item}")


def draw_how_panel(c):
    """MIDDLE panel of page 2 — How It Works (dark slate, 5 steps)."""
    fill_panel(c, 1, DARK)
    x0 = PANEL_W

    # Orange header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 45, "How It Works")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 62, "Book. Relax. Enjoy.")

    # 5 steps with timeline
    steps = [
        ("1", "Download the App",  "Get PETclub from app.mypetclub.app"),
        ("2", "Create Your Profile", "Add your pet's details & address"),
        ("3", "Book a Service",     "Choose date, time & service in seconds"),
        ("4", "Track in Real-Time", "Live GPS updates on your professional"),
        ("5", "Pay & Review",       "Secure payment + share your feedback"),
    ]
    y_start = PAGE_H - 115
    step_gap = 55

    # Vertical timeline line
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1.5)
    c.setDash(3, 3)
    c.line(x0 + 38, y_start - 5, x0 + 38, y_start - (len(steps) - 1) * step_gap - 10)
    c.setDash()

    for i, (num, title, desc) in enumerate(steps):
        y = y_start - i * step_gap
        # Number circle
        c.setFillColor(ORANGE)
        c.circle(x0 + 38, y - 5, 16, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont(FONT_B, 14)
        c.drawCentredString(x0 + 38, y - 10, num)
        # Title
        c.setFillColor(WHITE)
        c.setFont(FONT_B, 11)
        c.drawString(x0 + 62, y - 4, title)
        # Desc
        c.setFillColor(HexColor("#94a3b8"))
        c.setFont(FONT, 8.5)
        c.drawString(x0 + 62, y - 18, desc)

    # Bottom CTA box (Now Available)
    c.setFillColor(ORANGE)
    c.roundRect(x0 + 20, 30, PANEL_W - 40, 70, 10, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont(FONT_B, 13)
    c.drawCentredString(x0 + PANEL_W / 2, 78, "🌟 Now Available")
    c.setFont(FONT_B, 16)
    c.drawCentredString(x0 + PANEL_W / 2, 58, "Hyderabad")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, 42, "Expanding to more cities soon")


def draw_promise_panel(c):
    """RIGHT panel of page 2 — REPLACES 'Trusted by Pet Parents'.

    New content: 'Our Promise' — honest commitments to customers + final CTA.
    """
    fill_panel(c, 2, LIGHT)
    x0 = 2 * PANEL_W

    # Orange header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 45, "Our Promise")
    c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, PAGE_H - 62, "Quality care, every single time")

    # Promise list — 6 items (honest, no fake testimonials)
    promises = [
        ("🛡️", "Sanitised Tools",       "Disinfected before every visit"),
        ("👨‍⚕️", "Trained Professionals",  "Certified & background-verified"),
        ("📸", "Photo Updates",         "Before & after every session"),
        ("💰", "Transparent Pricing",   "No hidden charges, ever"),
        ("🔄", "Reschedule Anytime",    "Up to 2 hours before booking"),
        ("⭐", "Quality Guarantee",     "Not satisfied? We make it right"),
    ]
    y_start = PAGE_H - 110
    row_h = 60
    for i, (icon, title, desc) in enumerate(promises):
        y = y_start - i * row_h
        # White card
        c.setFillColor(WHITE)
        c.setStrokeColor(BORD)
        c.setLineWidth(0.6)
        c.roundRect(x0 + 15, y - 50, PANEL_W - 30, 52, 8, fill=1, stroke=1)

        # Icon circle
        c.setFillColor(ORANGE_LITE)
        c.circle(x0 + 35, y - 23, 14, fill=1, stroke=0)
        c.setFillColor(ORANGE_DARK)
        c.setFont(FONT_B, 11)
        c.drawCentredString(x0 + 35, y - 27, icon)

        # Title
        c.setFillColor(DARK)
        c.setFont(FONT_B, 10.5)
        c.drawString(x0 + 56, y - 18, title)

        # Description
        c.setFillColor(SLATE)
        c.setFont(FONT, 8.5)
        c.drawString(x0 + 56, y - 32, desc)

    # Bottom CTA — download
    c.setFillColor(DARK)
    c.roundRect(x0 + 20, 30, PANEL_W - 40, 70, 10, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont(FONT_B, 13)
    c.drawCentredString(x0 + PANEL_W / 2, 78, "📱 Download Now")
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 11)
    c.drawCentredString(x0 + PANEL_W / 2, 60, "app.mypetclub.app")
    c.setFont(FONT, 8.5)
    c.drawCentredString(x0 + PANEL_W / 2, 42, "Book Pet Grooming • Vet • Training")


# ══════════════════════════════════════════════════════════════════════════
# BUILD
# ══════════════════════════════════════════════════════════════════════════

def build_brochure():
    out_path = r"C:\Users\14697\petclub-app\public\PETclub-Brochure.pdf"
    c = canvas.Canvas(out_path, pagesize=landscape(A4))
    c.setTitle("PETclub - Paw Care at Your Doorstep")
    c.setAuthor("PETclub")
    c.setSubject("Marketing brochure")

    # ─── PAGE 1 ───
    draw_back_panel(c)
    draw_why_panel(c)
    draw_cover_panel(c)
    c.showPage()

    # ─── PAGE 2 ───
    draw_services_panel(c)
    draw_how_panel(c)
    draw_promise_panel(c)
    c.save()

    print(f"Brochure created: {out_path}")
    return out_path


if __name__ == "__main__":
    build_brochure()
