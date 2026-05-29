"""
PETclub Pricing Brochure — Tri-fold A4 landscape.
Matches the marketing brochure visual style (logo, colors, layout).
"""
import io
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


# ══════════════════════════════════════════════════════════════════════════
# PAGE 1 — Cover | Complete Makeover | Luxury Makeover
# ══════════════════════════════════════════════════════════════════════════

def draw_cover_panel(c):
    """LEFT panel — Cover."""
    fill_panel(c, 0, ORANGE)
    x0 = 0

    # Background paw decorations
    light = HexColor("#fb923c")
    c.setFillColor(light)
    for cx, cy, sz in [(40, 500, 30), (240, 100, 25),
                        (240, 460, 22), (50, 100, 25),
                        (130, 280, 40)]:
        draw_paw(c, x0 + cx, cy, sz, light)

    # Big logo tile (white)
    cy_pos = PAGE_H * 0.65
    tile = 110
    draw_logo_tile(c, x0 + PANEL_W / 2 - tile / 2, cy_pos - tile / 2,
                   tile, bg_color=WHITE)

    # Brand name
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 36)
    tw_pet  = c.stringWidth("PET", FONT_B, 36)
    tw_club = c.stringWidth("club", FONT, 36)
    cx_mid = x0 + PANEL_W / 2
    c.drawString(cx_mid - (tw_pet + tw_club) / 2, cy_pos - 100, "PET")
    c.setFont(FONT, 36)
    c.drawString(cx_mid - (tw_pet + tw_club) / 2 + tw_pet, cy_pos - 100, "club")

    # Tagline
    c.setFont(FONT, 11)
    c.drawCentredString(cx_mid, cy_pos - 122, "Paw Care at Your Doorstep")

    # Divider
    c.setStrokeColor(WHITE); c.setLineWidth(1)
    c.line(x0 + 60, cy_pos - 140, x0 + PANEL_W - 60, cy_pos - 140)

    # Title
    c.setFont(FONT_B, 22)
    c.drawCentredString(cx_mid, cy_pos - 175, "GROOMING")
    c.drawCentredString(cx_mid, cy_pos - 200, "PRICE LIST")
    c.setFont(FONT, 10)
    c.drawCentredString(cx_mid, cy_pos - 220, "At-home grooming · Hyderabad")

    # Bottom CTA
    c.setFillColor(WHITE)
    c.roundRect(x0 + 25, 35, PANEL_W - 50, 55, 10, fill=1, stroke=0)
    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT_B, 13)
    c.drawCentredString(cx_mid, 68, "📱 app.mypetclub.app")
    c.setFillColor(ORANGE)
    c.setFont(FONT, 9)
    c.drawCentredString(cx_mid, 50, "Book in 60 seconds")


def draw_complete_panel(c):
    """MIDDLE — Complete Makeover (Wahl)."""
    fill_panel(c, 1, WHITE)
    x0 = PANEL_W

    # Header band
    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 14, PAGE_H - 62, 36, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 18)
    c.drawString(x0 + 60, PAGE_H - 35, "Complete Makeover")
    c.setFont(FONT, 10)
    c.drawString(x0 + 60, PAGE_H - 52, "Full grooming · Wahl shampoo")
    # WAHL badge
    c.setStrokeColor(WHITE); c.setLineWidth(1)
    c.roundRect(x0 + PANEL_W - 60, PAGE_H - 50, 45, 16, 4, fill=0, stroke=1)
    c.setFont(FONT_B, 8)
    c.drawCentredString(x0 + PANEL_W - 37, PAGE_H - 40, "WAHL")

    # Includes section
    cur_y = PAGE_H - 105
    c.setFillColor(SLATE)
    c.setFont(FONT_B, 9)
    c.drawString(x0 + 25, cur_y, "INCLUDES")
    cur_y -= 14

    includes = [
        "✓ Bathing with Wahl shampoo",
        "✓ Nail trimming + nail grind",
        "✓ Deshedding treatment",
        "✓ Teeth brushing",
        "✓ Paw moisturising",
        "✓ Sanitary trim",
        "✓ Blow dry & finish",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 10)
    for line in includes:
        c.drawString(x0 + 25, cur_y, line)
        cur_y -= 14

    # Pricing block
    cur_y -= 10
    c.setStrokeColor(BORD); c.setLineWidth(0.5)
    c.line(x0 + 25, cur_y, x0 + PANEL_W - 25, cur_y)
    cur_y -= 18

    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 25, cur_y, "PRICING")
    cur_y -= 18

    prices = [
        ("🐕  Big Dog",    "₹1,800 – ₹2,500"),
        ("🐩  Small Dog",  "₹1,700 – ₹2,000"),
        ("🐱  Cat",        "₹1,500 – ₹1,700"),
    ]
    for label, price in prices:
        c.setFillColor(DARK); c.setFont(FONT, 11)
        c.drawString(x0 + 25, cur_y, label)
        c.setFillColor(ORANGE); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 25, cur_y, price)
        cur_y -= 20

    # Note
    cur_y -= 10
    c.setFillColor(ORANGE_LITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.8)
    c.roundRect(x0 + 20, cur_y - 30, PANEL_W - 40, 35, 6, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 9)
    c.drawString(x0 + 30, cur_y - 10, "💧 Wahl shampoo")
    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    c.drawString(x0 + 30, cur_y - 22, "30ml per pet · ₹40/wash · Premium quality")


def draw_luxury_panel(c):
    """RIGHT — Luxury Makeover (Plus Puppy)."""
    fill_panel(c, 2, ORANGE_LITE)
    x0 = 2 * PANEL_W

    # Header band
    c.setFillColor(ORANGE_DARK)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 14, PAGE_H - 62, 36, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 18)
    c.drawString(x0 + 60, PAGE_H - 35, "Luxury Makeover ★")
    c.setFont(FONT, 10)
    c.drawString(x0 + 60, PAGE_H - 52, "Premium spa · Plus Puppy shampoo")
    c.setStrokeColor(WHITE); c.setLineWidth(1)
    c.roundRect(x0 + PANEL_W - 80, PAGE_H - 50, 65, 16, 4, fill=0, stroke=1)
    c.setFont(FONT_B, 8)
    c.drawCentredString(x0 + PANEL_W - 47, PAGE_H - 40, "PLUS PUPPY")

    cur_y = PAGE_H - 105
    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 25, cur_y, "INCLUDES")
    cur_y -= 14

    includes = [
        "✓ Everything in Complete Makeover",
        "✓ Plus Puppy premium shampoo",
        "✓ Coat-specific formula",
        "✓ Extra conditioning",
        "✓ Multiple shampoos if needed",
        "✓ Salon-finish blow dry",
        "✓ Premium fragrance",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 10)
    for line in includes:
        c.drawString(x0 + 25, cur_y, line)
        cur_y -= 14

    cur_y -= 10
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.5)
    c.line(x0 + 25, cur_y, x0 + PANEL_W - 25, cur_y)
    cur_y -= 18

    c.setFillColor(SLATE); c.setFont(FONT_B, 9)
    c.drawString(x0 + 25, cur_y, "PRICING")
    cur_y -= 18

    prices = [
        ("🐕  Big Dog",   "₹3,200 – ₹3,800"),
        ("🐩  Small Dog", "₹3,000 – ₹3,500"),
        ("🐱  Cat",       "₹3,000"),
    ]
    for label, price in prices:
        c.setFillColor(DARK); c.setFont(FONT, 11)
        c.drawString(x0 + 25, cur_y, label)
        c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 25, cur_y, price)
        cur_y -= 20

    # Note
    cur_y -= 10
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.8)
    c.roundRect(x0 + 20, cur_y - 30, PANEL_W - 40, 35, 6, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 9)
    c.drawString(x0 + 30, cur_y - 10, "✨ Plus Puppy shampoo")
    c.setFillColor(SLATE); c.setFont(FONT, 8.5)
    c.drawString(x0 + 30, cur_y - 22, "₹200–₹250/wash · 1–2+ bottles by coat")


# ══════════════════════════════════════════════════════════════════════════
# PAGE 2 — Bath+ | Quick Services | QR + Notes
# ══════════════════════════════════════════════════════════════════════════

def draw_bath_panel(c):
    """LEFT panel page 2 — Bath+ packages (Wahl + Plus Puppy)."""
    fill_panel(c, 0, WHITE)
    x0 = 0

    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 14, PAGE_H - 62, 36, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 18)
    c.drawString(x0 + 60, PAGE_H - 35, "Bath+ Packages")
    c.setFont(FONT, 10)
    c.drawString(x0 + 60, PAGE_H - 52, "Bath + FREE ear clean & nail trim")

    # Two cards
    # Essential Bath+ (Wahl)
    cy = PAGE_H - 95
    card_h = 180

    c.setFillColor(LIGHT)
    c.setStrokeColor(BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 15, cy - card_h, PANEL_W - 30, card_h, 10, fill=1, stroke=1)
    c.setFillColor(ORANGE)
    c.roundRect(x0 + 15, cy - 30, PANEL_W - 30, 30, 10, fill=1, stroke=0)
    c.rect(x0 + 15, cy - 30, PANEL_W - 30, 16, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 12)
    c.drawString(x0 + 25, cy - 20, "ESSENTIAL BATH+ · Wahl")

    # Includes
    c.setFillColor(SLATE); c.setFont(FONT_B, 8)
    c.drawString(x0 + 25, cy - 50, "✓ Bath  ✓ Blow dry  ✓ Ear cleaning (FREE)  ✓ Nails (FREE)")

    # Prices
    py = cy - 75
    for label, price in [("🐕  Big Dog", "₹1,000"),
                          ("🐩  Small Dog", "₹800"),
                          ("🐱  Cat", "₹1,000")]:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 28, py, label)
        c.setFillColor(ORANGE); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 28, py, price)
        py -= 18

    c.setFillColor(SLATE); c.setFont(FONT, 8)
    c.drawString(x0 + 28, py - 5, "💧 Wahl shampoo · ₹40/wash")

    # Premium Bath+ (Plus Puppy)
    cy2 = cy - card_h - 15
    c.setFillColor(ORANGE_LITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(0.6)
    c.roundRect(x0 + 15, cy2 - card_h, PANEL_W - 30, card_h, 10, fill=1, stroke=1)
    c.setFillColor(ORANGE_DARK)
    c.roundRect(x0 + 15, cy2 - 30, PANEL_W - 30, 30, 10, fill=1, stroke=0)
    c.rect(x0 + 15, cy2 - 30, PANEL_W - 30, 16, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont(FONT_B, 12)
    c.drawString(x0 + 25, cy2 - 20, "PREMIUM BATH+ · Plus Puppy")

    c.setFillColor(SLATE); c.setFont(FONT_B, 8)
    c.drawString(x0 + 25, cy2 - 50, "✓ Bath  ✓ Blow dry  ✓ Ear cleaning (FREE)  ✓ Nails (FREE)")

    py = cy2 - 75
    for label, price in [("🐕  Big Dog", "₹2,500"),
                          ("🐩  Small Dog", "₹2,000"),
                          ("🐱  Cat", "₹2,000")]:
        c.setFillColor(DARK); c.setFont(FONT, 10.5)
        c.drawString(x0 + 28, py, label)
        c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 12)
        c.drawRightString(x0 + PANEL_W - 28, py, price)
        py -= 18

    c.setFillColor(SLATE); c.setFont(FONT, 8)
    c.drawString(x0 + 28, py - 5, "✨ Plus Puppy shampoo · ₹250/wash")


def draw_quick_panel(c):
    """MIDDLE — Quick services (haircut, care combo, puppy)."""
    fill_panel(c, 1, DARK)
    x0 = PANEL_W

    c.setFillColor(ORANGE)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 14, PAGE_H - 62, 36, bg_color=WHITE)
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 18)
    c.drawString(x0 + 60, PAGE_H - 35, "Quick Services")
    c.setFont(FONT, 10)
    c.drawString(x0 + 60, PAGE_H - 52, "Add-on grooming · puppy care")

    items = [
        ("✂️", "TRIM & STYLE", "Haircut only — any size dog or cat",
         "₹1,300 – ₹1,500"),
        ("💅", "CARE COMBO", "Nail trim + ear cleaning + face trim",
         "₹500"),
        ("🐶", "PUPPY DRY SPA", "Gentle dry bath for tiny puppies",
         "₹600"),
        ("🛁", "PUPPY WET BATH", "Gentle wet bath for puppies",
         "₹800 – ₹900"),
    ]
    cy = PAGE_H - 100
    for icon, title, desc, price in items:
        c.setFillColor(HexColor("#334155"))  # slate-700
        c.setStrokeColor(HexColor("#475569"))
        c.setLineWidth(0.6)
        c.roundRect(x0 + 15, cy - 78, PANEL_W - 30, 78, 10, fill=1, stroke=1)
        # Orange accent
        c.setFillColor(ORANGE)
        c.roundRect(x0 + 15, cy - 78, 4, 78, 2, fill=1, stroke=0)
        # Icon
        c.setFillColor(ORANGE_LITE); c.setFont(FONT, 24)
        c.drawCentredString(x0 + 40, cy - 38, icon)
        # Title
        c.setFillColor(WHITE); c.setFont(FONT_B, 11)
        c.drawString(x0 + 60, cy - 18, title)
        # Desc
        c.setFillColor(HexColor("#cbd5e1")); c.setFont(FONT, 8.5)
        c.drawString(x0 + 60, cy - 32, desc)
        # Price (right)
        c.setFillColor(ORANGE); c.setFont(FONT_B, 14)
        c.drawRightString(x0 + PANEL_W - 25, cy - 58, price)
        cy -= 92


def draw_qr_panel(c):
    """RIGHT — QR booking + important notes."""
    fill_panel(c, 2, ORANGE_LITE)
    x0 = 2 * PANEL_W

    # Header
    c.setFillColor(ORANGE_DARK)
    c.rect(x0, PAGE_H - 80, PANEL_W, 80, fill=1, stroke=0)
    draw_logo_tile(c, x0 + 14, PAGE_H - 62, 36, bg_color=WHITE)
    c.setFillColor(WHITE); c.setFont(FONT_B, 18)
    c.drawString(x0 + 60, PAGE_H - 35, "Book Now")
    c.setFont(FONT, 10)
    c.drawString(x0 + 60, PAGE_H - 52, "Scan or visit app.mypetclub.app")

    # QR card
    qr_y = PAGE_H - 290
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(1)
    c.roundRect(x0 + 25, qr_y, PANEL_W - 50, 200, 12, fill=1, stroke=1)

    qr_img = make_qr_image("https://app.mypetclub.app")
    c.drawImage(qr_img, x0 + PANEL_W / 2 - 70, qr_y + 40, width=140, height=140,
                preserveAspectRatio=True, mask='auto')

    c.setFillColor(DARK); c.setFont(FONT_B, 12)
    c.drawCentredString(x0 + PANEL_W / 2, qr_y + 25, "Scan to Download")
    c.setFillColor(SLATE); c.setFont(FONT, 9)
    c.drawCentredString(x0 + PANEL_W / 2, qr_y + 10, "app.mypetclub.app")

    # Notes box
    notes_y = qr_y - 145
    c.setFillColor(WHITE)
    c.setStrokeColor(ORANGE_BORD); c.setLineWidth(1)
    c.roundRect(x0 + 20, notes_y, PANEL_W - 40, 130, 10, fill=1, stroke=1)

    c.setFillColor(ORANGE_DARK); c.setFont(FONT_B, 10)
    c.drawString(x0 + 32, notes_y + 108, "📝 IMPORTANT NOTES")

    notes = [
        "• Price varies by breed, coat type, size",
        "• Plus Puppy: 1–2+ bottles by coat thickness",
        "• All prices for AT-HOME service",
        "• Ear cleaning & nails FREE with all Bath+",
        "• Sanitised tools every visit",
        "• Cancel/reschedule up to 2 hrs before",
    ]
    c.setFillColor(DARK); c.setFont(FONT, 8.5)
    ny = notes_y + 92
    for note in notes:
        c.drawString(x0 + 32, ny, note)
        ny -= 13

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
