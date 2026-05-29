"""
PETclub Pricing Brochure — Tri-fold A4 landscape with REAL pet photos.
All images are from Pexels (free for commercial use, no attribution required).
Original photos cached in public/brochure-assets/.
"""
import io
import os
import qrcode
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# Fonts (Arial for ₹ symbol support)
FONT, FONT_B = "Arial", "Arial-Bold"
try:
    pdfmetrics.registerFont(TTFont(FONT,   "C:/Windows/Fonts/arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_B, "C:/Windows/Fonts/arialbd.ttf"))
except Exception:
    FONT, FONT_B = "Helvetica", "Helvetica-Bold"

# Brand colors
ORANGE      = HexColor("#f97316")
ORANGE_DARK = HexColor("#ea580c")
ORANGE_LITE = HexColor("#fff7ed")
ORANGE_BORD = HexColor("#fed7aa")
DARK        = HexColor("#1e293b")
SLATE       = HexColor("#475569")
LIGHT       = HexColor("#f8fafc")
BORD        = HexColor("#e2e8f0")
WHITE       = white

PAGE_W, PAGE_H = landscape(A4)
PANEL_W = PAGE_W / 3

# ── Image paths (downloaded to brochure-assets/) ─────────────────────────
ASSETS = os.path.dirname(os.path.abspath(__file__)) + "/brochure-assets"
IMG_DOG_HERO     = ASSETS + "/dog-hero.jpg"      # 2 golden puppies
IMG_CAT_HERO     = ASSETS + "/cat-hero.jpg"      # cute kitten
IMG_CAT_GROOMING = ASSETS + "/cat-grooming.jpg"  # cat being groomed
IMG_CAT_PORTRAIT = ASSETS + "/cat-cute.jpg"      # tabby portrait


# ── QR helper ────────────────────────────────────────────────────────────
def make_qr_image(url):
    qr = qrcode.QRCode(box_size=10, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    bio = io.BytesIO(); img.save(bio, format='PNG'); bio.seek(0)
    return ImageReader(bio)


# ── Official PETclub logo (rounded square + paw) ─────────────────────────
def draw_paw(c, x, y, size, color):
    c.setFillColor(color)
    s = size / 512.0
    for cx, cy in [(150, 210), (212, 165), (300, 165), (362, 210)]:
        c.ellipse(x + (cx - 256 - 38) * s, y + (335 - cy - 34) * s,
                  x + (cx - 256 + 38) * s, y + (335 - cy + 34) * s,
                  fill=1, stroke=0)
    c.ellipse(x - 114 * s, y - 97 * s, x + 114 * s, y + 97 * s, fill=1, stroke=0)


def draw_logo_tile(c, x, y, size, bg_color=None):
    fill = ORANGE if bg_color is None else bg_color
    paw_color = WHITE if bg_color is None else ORANGE
    c.setFillColor(fill)
    c.roundRect(x, y, size, size, size * 0.225, fill=1, stroke=0)
    draw_paw(c, x + size / 2, y + size / 2, size * 0.95, paw_color)


def fill_panel(c, panel_idx, color):
    c.setFillColor(color)
    c.rect(panel_idx * PANEL_W, 0, PANEL_W, PAGE_H, fill=1, stroke=0)


def draw_rounded_image(c, image_path, x, y, w, h, radius=8):
    """Draw an image clipped to a rounded rectangle."""
    if not os.path.exists(image_path):
        # Fallback: gray placeholder
        c.setFillColor(BORD)
        c.roundRect(x, y, w, h, radius, fill=1, stroke=0)
        return
    c.saveState()
    p = c.beginPath()
    # Manual rounded rect clipping path
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


# ══════════════════════════════════════════════════════════════════════════
# PAGE 1 — Cover | Complete Makeover | Luxury Makeover
# ══════════════════════════════════════════════════════════════════════════

def draw_cover_panel(c):
    """LEFT panel — Cover with real pet photos (dog + cat)."""
    fill_panel(c, 0, ORANGE)
    x0 = 0

    # Background paw decorations (subtle)
    light = HexColor("#fb923c")
    for cx, cy, sz in [(35, 510, 24), (245, 90, 20)]:
        draw_paw(c, x0 + cx, cy, sz, light)

    # Top: Logo + brand
    top_y = PAGE_H - 60
    draw_logo_tile(c, x0 + 22, top_y - 35, 35, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 22)
    c.drawString(x0 + 68, top_y - 18, "PET")
    c.setFont(FONT, 22)
    tw_pet = c.stringWidth("PET", FONT_B, 22)
    c.drawString(x0 + 68 + tw_pet, top_y - 18, "club")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 68, top_y - 33, "Paw Care at Your Doorstep")

    # Two photos side-by-side: Dog + Cat
    photo_y = PAGE_H * 0.40
    photo_h = 130
    photo_w = (PANEL_W - 50) / 2 - 5
    # Dog photo
    draw_rounded_image(c, IMG_DOG_HERO,
                       x0 + 20, photo_y, photo_w, photo_h, radius=10)
    # Dog caption strip
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 9)
    c.drawCentredString(x0 + 20 + photo_w / 2, photo_y - 14, "🐕  DOGS")

    # Cat photo
    draw_rounded_image(c, IMG_CAT_HERO,
                       x0 + 30 + photo_w, photo_y, photo_w, photo_h, radius=10)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 9)
    c.drawCentredString(x0 + 30 + photo_w + photo_w / 2, photo_y - 14, "🐱  CATS")

    # Divider line
    c.setStrokeColor(WHITE); c.setLineWidth(1.2)
    cx_mid = x0 + PANEL_W / 2
    c.line(x0 + 50, photo_y - 32, x0 + PANEL_W - 50, photo_y - 32)

    # Title
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 28)
    c.drawCentredString(cx_mid, photo_y - 65, "GROOMING")
    c.setFont(FONT_B, 18)
    c.drawCentredString(cx_mid, photo_y - 88, "PRICE LIST")
    c.setFont(FONT, 10)
    c.drawCentredString(cx_mid, photo_y - 105, "At-home grooming · Hyderabad")

    # Bottom CTA card
    c.setFillColor(WHITE)
    c.roundRect(x0 + 22, 30, PANEL_W - 44, 60, 10, fill=1, stroke=0)
    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT_B, 14)
    c.drawCentredString(cx_mid, 68, "📱 Book in 60 Seconds")
    c.setFillColor(ORANGE)
    c.setFont(FONT_B, 11)
    c.drawCentredString(cx_mid, 52, "app.mypetclub.app")
    c.setFillColor(SLATE)
    c.setFont(FONT, 8.5)
    c.drawCentredString(cx_mid, 40, "WhatsApp: +91 93474 11132")


def draw_complete_panel(c):
    """MIDDLE — Complete Makeover (Wahl) with dog photo."""
    fill_panel(c, 1, WHITE)
    x0 = PANEL_W

    # Header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 75, PANEL_W, 75, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 18, PAGE_H - 55, 28, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawString(x0 + 55, PAGE_H - 35, "Complete Makeover")
    c.setFont(FONT, 9.5)
    c.drawString(x0 + 55, PAGE_H - 50, "Full grooming with Wahl shampoo")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 55, PAGE_H - 63, "For dogs and cats · 1.5-2 hr service")

    # Hero photo at top
    photo_h = 95
    photo_y = PAGE_H - 90 - photo_h
    draw_rounded_image(c, IMG_DOG_HERO, x0 + 18, photo_y,
                       PANEL_W - 36, photo_h, radius=10)

    # Includes section
    cur_y = photo_y - 18
    c.setFillColor(SLATE)
    c.setFont(FONT_B, 9)
    c.drawString(x0 + 20, cur_y, "✨ INCLUDES")
    cur_y -= 12

    includes = [
        "Bath + Wahl shampoo · Blow dry",
        "Nail trim + nail grind · Sanitary trim",
        "Deshedding · Teeth brushing",
        "Paw moisturising · Ear cleaning",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 9)
    for line in includes:
        c.drawString(x0 + 25, cur_y, "✓ " + line)
        cur_y -= 12

    # Divider
    cur_y -= 5
    c.setStrokeColor(BORD); c.setLineWidth(0.5)
    c.line(x0 + 20, cur_y, x0 + PANEL_W - 20, cur_y)
    cur_y -= 14

    # Pricing label
    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 20, cur_y, "💰 PRICING")
    cur_y -= 16

    prices = [
        ("🐕  Big Dog",    "₹1,800 – ₹2,500"),
        ("🐩  Small Dog",  "₹1,700 – ₹2,000"),
        ("🐱  Cat",        "₹1,500 – ₹1,700"),
    ]
    for label, price in prices:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 22, cur_y, label)
        c.setFillColor(ORANGE); c.setFont(FONT_B, 11)
        c.drawRightString(x0 + PANEL_W - 20, cur_y, price)
        cur_y -= 18

    # Bottom info box
    c.setFillColor(ORANGE_LITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 18, 30, PANEL_W - 36, 38, 6, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 9)
    c.drawString(x0 + 28, 55, "💧 Wahl Premium Shampoo")
    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    c.drawString(x0 + 28, 42, "30ml per pet · ₹40/wash · Vet-recommended")


def draw_luxury_panel(c):
    """RIGHT — Luxury Makeover (Plus Puppy) with cat photo."""
    fill_panel(c, 2, ORANGE_LITE)
    x0 = 2 * PANEL_W

    # Header
    c.setFillColor(ORANGE_DARK)
    c.rect(x0, PAGE_H - 75, PANEL_W, 75, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 18, PAGE_H - 55, 28, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawString(x0 + 55, PAGE_H - 35, "Luxury Makeover ★")
    c.setFont(FONT, 9.5)
    c.drawString(x0 + 55, PAGE_H - 50, "Premium spa · Plus Puppy shampoo")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 55, PAGE_H - 63, "Salon-quality · Coat-specific care")

    # Hero photo (cat being groomed - shows cat services!)
    photo_h = 95
    photo_y = PAGE_H - 90 - photo_h
    draw_rounded_image(c, IMG_CAT_GROOMING, x0 + 18, photo_y,
                       PANEL_W - 36, photo_h, radius=10)

    # Includes
    cur_y = photo_y - 18
    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 20, cur_y, "✨ INCLUDES")
    cur_y -= 12

    includes = [
        "Everything in Complete Makeover",
        "Plus Puppy premium shampoo",
        "Coat-specific formula · Conditioning",
        "Salon-finish blow dry · Fragrance",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 9)
    for line in includes:
        c.drawString(x0 + 25, cur_y, "✓ " + line)
        cur_y -= 12

    # Divider
    cur_y -= 5
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.5)
    c.line(x0 + 20, cur_y, x0 + PANEL_W - 20, cur_y)
    cur_y -= 14

    # Pricing
    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 20, cur_y, "💰 PRICING")
    cur_y -= 16

    prices = [
        ("🐕  Big Dog",   "₹3,200 – ₹3,800"),
        ("🐩  Small Dog", "₹3,000 – ₹3,500"),
        ("🐱  Cat",       "₹3,000"),
    ]
    for label, price in prices:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 22, cur_y, label)
        c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 11)
        c.drawRightString(x0 + PANEL_W - 20, cur_y, price)
        cur_y -= 18

    # Bottom info box
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 18, 30, PANEL_W - 36, 38, 6, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 9)
    c.drawString(x0 + 28, 55, "✨ Plus Puppy Premium Shampoo")
    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    c.drawString(x0 + 28, 42, "₹250/wash · 1-2+ bottles by coat type")


# ══════════════════════════════════════════════════════════════════════════
# PAGE 2 — Bath+ | Quick Services | QR + Notes
# ══════════════════════════════════════════════════════════════════════════

def draw_bath_panel(c):
    """LEFT panel page 2 — Bath+ packages with photo."""
    fill_panel(c, 0, WHITE)
    x0 = 0

    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 75, PANEL_W, 75, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 18, PAGE_H - 55, 28, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawString(x0 + 55, PAGE_H - 35, "Bath+ Packages")
    c.setFont(FONT, 9.5)
    c.drawString(x0 + 55, PAGE_H - 50, "Bath + FREE ear clean & nail trim")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 55, PAGE_H - 63, "Quick refresh · 45-60 min")

    # Two cards
    # Essential Bath+ (Wahl) — orange
    cy = PAGE_H - 95
    card_h = 200

    c.setFillColor(LIGHT)
    c.setStrokeColor(BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 15, cy - card_h, PANEL_W - 30, card_h, 10, fill=1, stroke=1)
    # Title bar
    c.setFillColor(ORANGE)
    c.roundRect(x0 + 15, cy - 32, PANEL_W - 30, 32, 10, fill=1, stroke=0)
    c.rect(x0 + 15, cy - 32, PANEL_W - 30, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 12)
    c.drawString(x0 + 25, cy - 22, "ESSENTIAL BATH+")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 25, cy - 12, "Wahl shampoo · ₹40/wash")

    # Includes
    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    inc_y = cy - 48
    for line in ["✓ Bath with Wahl shampoo",
                  "✓ Blow dry · ✓ FREE ear cleaning",
                  "✓ FREE nail trimming"]:
        c.drawString(x0 + 25, inc_y, line)
        inc_y -= 11

    # Prices
    py = inc_y - 8
    for label, price in [("🐕  Big Dog", "₹1,000"),
                          ("🐩  Small Dog", "₹800"),
                          ("🐱  Cat", "₹1,000")]:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 28, py, label)
        c.setFillColor(ORANGE); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 28, py, price)
        py -= 18

    # Premium Bath+ (Plus Puppy)
    cy2 = cy - card_h - 15
    c.setFillColor(ORANGE_LITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 15, cy2 - card_h, PANEL_W - 30, card_h, 10, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK)
    c.roundRect(x0 + 15, cy2 - 32, PANEL_W - 30, 32, 10, fill=1, stroke=0)
    c.rect(x0 + 15, cy2 - 32, PANEL_W - 30, 18, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont(FONT_B, 12)
    c.drawString(x0 + 25, cy2 - 22, "PREMIUM BATH+")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 25, cy2 - 12, "Plus Puppy shampoo · ₹250/wash")

    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    inc_y = cy2 - 48
    for line in ["✓ Bath with Plus Puppy shampoo",
                  "✓ Premium blow dry · ✓ FREE ear clean",
                  "✓ FREE nail trimming"]:
        c.drawString(x0 + 25, inc_y, line)
        inc_y -= 11

    py = inc_y - 8
    for label, price in [("🐕  Big Dog", "₹2,500"),
                          ("🐩  Small Dog", "₹2,000"),
                          ("🐱  Cat", "₹2,000")]:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 28, py, label)
        c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 28, py, price)
        py -= 18


def draw_quick_panel(c):
    """MIDDLE — Quick services with photo."""
    fill_panel(c, 1, DARK)
    x0 = PANEL_W

    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 75, PANEL_W, 75, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 18, PAGE_H - 55, 28, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    c.drawString(x0 + 55, PAGE_H - 35, "Quick Services")
    c.setFont(FONT, 9.5)
    c.drawString(x0 + 55, PAGE_H - 50, "Haircuts · puppy care · add-ons")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 55, PAGE_H - 63, "For every age and breed")

    # Cat portrait photo top
    photo_h = 75
    photo_y = PAGE_H - 90 - photo_h
    draw_rounded_image(c, IMG_CAT_PORTRAIT, x0 + 18, photo_y,
                       PANEL_W - 36, photo_h, radius=10)

    # 4 service cards
    items = [
        ("✂️", "Trim & Style", "Haircut any size · dog or cat",
         "₹1,300 – ₹1,500"),
        ("💅", "Care Combo", "Nails + ear + face trim",
         "₹500"),
        ("🐶", "Puppy Dry Spa", "Gentle dry bath",
         "₹600"),
        ("🛁", "Puppy Wet Bath", "Gentle wet bath",
         "₹800 – ₹900"),
    ]
    cy = photo_y - 12
    for icon, title, desc, price in items:
        c.setFillColor(HexColor("#334155"))
        c.roundRect(x0 + 15, cy - 56, PANEL_W - 30, 56, 8, fill=1, stroke=0)
        # Orange stripe left
        c.setFillColor(ORANGE)
        c.roundRect(x0 + 15, cy - 56, 4, 56, 2, fill=1, stroke=0)
        # Icon
        c.setFillColor(ORANGE_LITE); c.setFont(FONT, 16)
        c.drawCentredString(x0 + 35, cy - 30, icon)
        # Title
        c.setFillColor(WHITE); c.setFont(FONT_B, 10)
        c.drawString(x0 + 50, cy - 18, title)
        # Desc
        c.setFillColor(HexColor("#cbd5e1")); c.setFont(FONT, 8)
        c.drawString(x0 + 50, cy - 30, desc)
        # Price right
        c.setFillColor(ORANGE); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 22, cy - 38, price)
        cy -= 62


def draw_qr_panel(c):
    """RIGHT — QR booking + cat portrait + notes."""
    fill_panel(c, 2, ORANGE_LITE)
    x0 = 2 * PANEL_W

    # Header
    c.setFillColor(ORANGE_DARK)
    c.rect(x0, PAGE_H - 75, PANEL_W, 75, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 18, PAGE_H - 55, 28, bg_color=WHITE)
    c.setFillColor(WHITE); c.setFont(FONT_B, 16)
    c.drawString(x0 + 55, PAGE_H - 35, "Book Now")
    c.setFont(FONT, 9.5)
    c.drawString(x0 + 55, PAGE_H - 50, "Scan & download the app")
    c.setFont(FONT, 8.5)
    c.drawString(x0 + 55, PAGE_H - 63, "Takes only 60 seconds")

    # QR card with cat hero photo + QR code side by side
    qr_y = PAGE_H - 240
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(1)
    c.roundRect(x0 + 18, qr_y, PANEL_W - 36, 150, 12, fill=1, stroke=1)

    # QR code on the left
    qr_img = make_qr_image("https://app.mypetclub.app")
    c.drawImage(qr_img, x0 + 30, qr_y + 20, width=110, height=110,
                preserveAspectRatio=True, mask='auto')

    # Cat photo on the right
    photo_x = x0 + 150
    photo_w = PANEL_W - 36 - 145
    draw_rounded_image(c, IMG_CAT_HERO, photo_x, qr_y + 25,
                       photo_w - 10, 100, radius=8)

    # CTA below QR
    c.setFillColor(DARK); c.setFont(FONT_B, 11)
    c.drawCentredString(x0 + PANEL_W / 2, qr_y - 12, "📱 app.mypetclub.app")
    c.setFillColor(SLATE); c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, qr_y - 26, "Scan code or visit website")

    # 'We Serve Cats Too!' callout — emphasize cat services
    callout_y = qr_y - 75
    c.setFillColor(ORANGE)
    c.roundRect(x0 + 18, callout_y, PANEL_W - 36, 35, 8, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 12)
    c.drawCentredString(x0 + PANEL_W / 2, callout_y + 18, "🐱 We Groom Cats Too!")
    c.setFont(FONT, 8.5)
    c.drawCentredString(x0 + PANEL_W / 2, callout_y + 6, "Gentle, low-stress grooming for felines")

    # Notes box
    notes_y = callout_y - 105
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(1)
    c.roundRect(x0 + 18, notes_y, PANEL_W - 36, 95, 10, fill=1, stroke=1)

    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 9.5)
    c.drawString(x0 + 28, notes_y + 78, "📝 GOOD TO KNOW")

    notes = [
        "• Prices vary by breed, coat & size",
        "• All services at YOUR home",
        "• Ear clean + nails FREE with Bath+",
        "• Sanitised tools every visit",
        "• Reschedule up to 2 hrs before",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 8)
    ny = notes_y + 64
    for note in notes:
        c.drawString(x0 + 28, ny, note)
        ny -= 11

    # Bottom contact
    c.setFillColor(DARK)
    c.rect(x0, 0, PANEL_W, 50, fill=1, stroke=0)
    c.setFillColor(ORANGE); c.setFont(FONT_B, 11)
    c.drawCentredString(x0 + PANEL_W / 2, 30, "💬 WhatsApp: +91 93474 11132")
    c.setFillColor(WHITE); c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, 15, "support@mypetclub.app · Hyderabad")


# ══════════════════════════════════════════════════════════════════════════
# BUILD
# ══════════════════════════════════════════════════════════════════════════

def build():
    out = r"C:\Users\14697\petclub-app\public\PETclub-Pricing.pdf"
    c = canvas.Canvas(out, pagesize=landscape(A4))
    c.setTitle("PETclub - Grooming Price List")
    c.setAuthor("PETclub")
    c.setSubject("At-home pet grooming pricing brochure")

    draw_cover_panel(c)
    draw_complete_panel(c)
    draw_luxury_panel(c)
    c.showPage()

    draw_bath_panel(c)
    draw_quick_panel(c)
    draw_qr_panel(c)
    c.save()
    print(f"Pricing brochure created: {out}")


if __name__ == "__main__":
    build()
