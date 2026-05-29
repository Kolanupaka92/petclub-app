"""
PETclub Business Cards Generator
Standard 3.5" × 2" business cards, 2-up on A4 portrait.
Page 1: Front (Sai Krishna + Eshwar).  Page 2: Backs (PETclub branded).
"""
import io
import os
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

# Fonts (Arial — supports ₹ and special chars)
FONT, FONT_B = "Arial", "Arial-Bold"
try:
    pdfmetrics.registerFont(TTFont(FONT,   "C:/Windows/Fonts/arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_B, "C:/Windows/Fonts/arialbd.ttf"))
except Exception:
    FONT, FONT_B = "Helvetica", "Helvetica-Bold"

# Brand colors
ORANGE      = HexColor("#f97316")
ORANGE_DARK = HexColor("#ea580c")
ORANGE_LITE = HexColor("#fb923c")
DARK        = HexColor("#1e293b")
SLATE       = HexColor("#475569")
GRAY        = HexColor("#94a3b8")
BORD        = HexColor("#e2e8f0")
WHITE       = white

# Page + card dimensions
PAGE_W, PAGE_H = A4  # 595 x 842
INCH = 72
CARD_W = 3.5 * INCH  # 252pt
CARD_H = 2.0 * INCH  # 144pt

# Two cards side-by-side, vertically centered
CARDS_TOTAL_W = 2 * CARD_W + 20  # 20pt gap between cards
LEFT_MARGIN  = (PAGE_W - CARDS_TOTAL_W) / 2
TOP_MARGIN   = (PAGE_H - CARD_H) / 2 + 200  # bias toward top half


# ── QR helper ────────────────────────────────────────────────────────────
def make_qr_image(url):
    qr = qrcode.QRCode(box_size=10, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    bio = io.BytesIO(); img.save(bio, format='PNG'); bio.seek(0)
    return ImageReader(bio)


# ── Official PETclub logo ────────────────────────────────────────────────
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


# ── Decorative cut marks (dashed corners) ────────────────────────────────
def draw_cut_marks(c, x, y, w, h):
    """Dashed outline around the card for cutting."""
    c.saveState()
    c.setStrokeColor(GRAY)
    c.setLineWidth(0.4)
    c.setDash(2, 2)
    c.rect(x - 4, y - 4, w + 8, h + 8, fill=0, stroke=1)
    c.restoreState()


# ──────────────────────────────────────────────────────────────────────────
# BUSINESS CARD — FRONT
# ──────────────────────────────────────────────────────────────────────────

def draw_card_front(c, x, y, person):
    """Draw a single business card front.

    person = {
        'name': str, 'title': str, 'email': str,
        'whatsapp': str, 'location': str, 'qr_url': str,
    }
    """
    # Cut marks
    draw_cut_marks(c, x, y, CARD_W, CARD_H)

    # White card background
    c.setFillColor(WHITE)
    c.roundRect(x, y, CARD_W, CARD_H, 8, fill=1, stroke=0)

    # Left orange tile (1.0" wide)
    tile_w = 1.0 * INCH
    c.setFillColor(ORANGE)
    # Custom shape: rounded only on left side, flat on right edge
    c.roundRect(x, y, tile_w + 12, CARD_H, 8, fill=1, stroke=0)
    c.rect(x + tile_w, y, 12, CARD_H, fill=1, stroke=0)

    # Background paw decorations on tile
    c.setFillColor(ORANGE_LITE)
    draw_paw(c, x + 18, y + CARD_H - 25, 18, ORANGE_LITE)
    draw_paw(c, x + tile_w - 18, y + 25, 14, ORANGE_LITE)

    # Logo paw (large, centered on tile)
    draw_paw(c, x + tile_w / 2, y + CARD_H / 2, 38, WHITE)

    # ─── Right side: contact details ──────────────────────────────────────
    rx = x + tile_w + 20   # right column x-start
    rw = CARD_W - (tile_w + 20) - 12  # right column width

    # Name (bold, large)
    c.setFillColor(DARK)
    c.setFont(FONT_B, 11)
    c.drawString(rx, y + CARD_H - 22, person['name'])

    # Title (orange)
    c.setFillColor(ORANGE)
    c.setFont(FONT_B, 8.5)
    c.drawString(rx, y + CARD_H - 35, person['title'])

    # Divider
    c.setStrokeColor(BORD)
    c.setLineWidth(0.4)
    c.line(rx, y + CARD_H - 43, rx + rw - 10, y + CARD_H - 43)

    # Website
    c.setFillColor(DARK)
    c.setFont(FONT_B, 8)
    c.drawString(rx, y + CARD_H - 56, "www.mypetclub.app")

    # Email
    c.setFillColor(SLATE)
    c.setFont(FONT, 7)
    c.drawString(rx, y + CARD_H - 68, "✉  " + person['email'])

    # WhatsApp (NEW)
    c.setFillColor(HexColor("#16a34a"))  # WhatsApp green for accent
    c.setFont(FONT_B, 7)
    c.drawString(rx, y + CARD_H - 80, "💬  " + person['whatsapp'])

    # Location
    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT, 7)
    c.drawString(rx, y + CARD_H - 92, "📍  " + person['location'])

    # QR code bottom-right
    qr_size = 38
    qr_x = x + CARD_W - qr_size - 8
    qr_y = y + 8
    qr_img = make_qr_image(person['qr_url'])
    c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size,
                preserveAspectRatio=True, mask='auto')

    # "Scan" label below QR
    c.setFillColor(GRAY)
    c.setFont(FONT, 5.5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 4, "Scan to Download")


# ──────────────────────────────────────────────────────────────────────────
# BUSINESS CARD — BACK
# ──────────────────────────────────────────────────────────────────────────

def draw_card_back(c, x, y):
    """Branded back of card."""
    draw_cut_marks(c, x, y, CARD_W, CARD_H)

    # Orange background
    c.setFillColor(ORANGE)
    c.roundRect(x, y, CARD_W, CARD_H, 8, fill=1, stroke=0)

    # Background paw decorations
    for px, py, sz in [(30, CARD_H - 25, 22), (CARD_W - 28, 25, 18),
                        (CARD_W - 35, CARD_H - 30, 16), (35, 25, 14)]:
        draw_paw(c, x + px, y + py, sz, ORANGE_LITE)

    # Centered logo tile (white with orange paw)
    tile = 38
    draw_logo_tile(c, x + CARD_W / 2 - tile / 2, y + CARD_H / 2 + 5,
                   tile, bg_color=WHITE)

    # Brand name below logo
    c.setFillColor(WHITE)
    c.setFont(FONT_B, 16)
    cx_mid = x + CARD_W / 2
    tw_pet  = c.stringWidth("PET", FONT_B, 16)
    tw_club = c.stringWidth("club", FONT, 16)
    c.drawString(cx_mid - (tw_pet + tw_club) / 2, y + CARD_H / 2 - 22, "PET")
    c.setFont(FONT, 16)
    c.drawString(cx_mid - (tw_pet + tw_club) / 2 + tw_pet, y + CARD_H / 2 - 22, "club")

    # Tagline
    c.setFont(FONT, 8)
    c.drawCentredString(cx_mid, y + CARD_H / 2 - 36, "Paw Care at Your Doorstep")

    # URL at bottom
    c.setFont(FONT_B, 7.5)
    c.drawCentredString(cx_mid, y + 14, "www.mypetclub.app")


# ──────────────────────────────────────────────────────────────────────────
# BUILD
# ──────────────────────────────────────────────────────────────────────────

PEOPLE = [
    {
        'name':     'Sai Krishna Kolanupaka',
        'title':    'CEO & Founder',
        'email':    'saikrishna.kolanupaka@mypetclub.app',
        'whatsapp': 'WhatsApp: +1 609-721-5754',
        'location': 'USA Operations',
        'qr_url':   'https://app.mypetclub.app',
    },
    {
        'name':     'Eshwar Kolanupaka',
        'title':    'COO & Co-Founder',
        'email':    'eshwar.kolanupaka@mypetclub.app',
        'whatsapp': 'WhatsApp: +91 93474-11132',
        'location': 'Hyderabad, India',
        'qr_url':   'https://app.mypetclub.app',
    },
]


def build():
    out = r"C:\Users\14697\petclub-app\public\PETclub-Business-Cards.pdf"
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle("PETclub - Business Cards")
    c.setAuthor("PETclub")

    # ─── PAGE 1: Fronts (Sai left, Eshwar right) ───
    y_pos = TOP_MARGIN
    draw_card_front(c, LEFT_MARGIN, y_pos, PEOPLE[0])
    draw_card_front(c, LEFT_MARGIN + CARD_W + 20, y_pos, PEOPLE[1])

    # Footer note
    c.setFillColor(GRAY)
    c.setFont(FONT, 8)
    c.drawCentredString(PAGE_W / 2, y_pos - 30,
                        '— Cut along dashed lines · Standard 3.5" × 2" Business Card —')
    c.showPage()

    # ─── PAGE 2: Backs ───
    draw_card_back(c, LEFT_MARGIN, y_pos)
    draw_card_back(c, LEFT_MARGIN + CARD_W + 20, y_pos)

    c.setFillColor(GRAY)
    c.setFont(FONT, 8)
    c.drawCentredString(PAGE_W / 2, y_pos - 30,
                        '— Card Back · Cut along dashed lines —')

    c.save()
    print(f"Business cards created: {out}")
    return out


if __name__ == "__main__":
    build()
