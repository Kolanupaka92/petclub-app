# Author: Sai Kolanupaka
"""
PETclub Pricing Brochure Generator
Generates a professional A4 PDF brochure for at-home pet grooming services.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts that support the ₹ Indian rupee symbol (U+20B9).
# Default Helvetica doesn't include this glyph — it renders as a black box.
# Arial (ships with Windows) has full Unicode coverage including ₹.
FONT_REG  = "Arial"
FONT_BOLD = "Arial-Bold"
FONT_ITAL = "Arial-Italic"
FONT_BI   = "Arial-BoldItalic"
try:
    pdfmetrics.registerFont(TTFont(FONT_REG,  "C:/Windows/Fonts/arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, "C:/Windows/Fonts/arialbd.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_ITAL, "C:/Windows/Fonts/ariali.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BI,   "C:/Windows/Fonts/arialbi.ttf"))
except Exception as e:
    print(f"Font registration failed, falling back to Helvetica: {e}")
    FONT_REG  = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"
    FONT_ITAL = "Helvetica-Oblique"
    FONT_BI   = "Helvetica-BoldOblique"

# Brand colors
ORANGE      = HexColor("#f97316")
ORANGE_DARK = HexColor("#ea580c")
ORANGE_LITE = HexColor("#fff7ed")
ORANGE_BORD = HexColor("#fed7aa")
SLATE_DARK  = HexColor("#1e293b")
SLATE_MID   = HexColor("#475569")
SLATE_LITE  = HexColor("#f8fafc")
SLATE_BORD  = HexColor("#e2e8f0")
GOLD        = HexColor("#fbbf24")

PAGE_W, PAGE_H = A4

def draw_header(c):
    """Top orange band with brand + tagline"""
    # Orange band
    c.setFillColor(ORANGE)
    c.rect(0, PAGE_H - 80, PAGE_W, 80, fill=1, stroke=0)

    # Paw print decoration (right side)
    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT_REG, 32)
    c.drawRightString(PAGE_W - 25, PAGE_H - 55, "🐾")

    # Brand name
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 26)
    c.drawString(25, PAGE_H - 42, "PET")
    c.setFont(FONT_REG, 26)
    c.drawString(25 + 47, PAGE_H - 42, "club")

    # Tagline
    c.setFont(FONT_ITAL, 10)
    c.drawString(25, PAGE_H - 60, "Premium at-home pet grooming — we come to you!")

    # Sub-tagline
    c.setFont(FONT_BOLD, 9)
    c.drawString(25, PAGE_H - 73, "GROOMING SERVICES • PRICE LIST")


def draw_card(c, x, y, w, h, title, badge_text, includes_lines, prices, note=None, accent=ORANGE):
    """Draw a package card with title bar, includes, and pricing rows"""
    # Card border + bg
    c.setFillColor(white)
    c.setStrokeColor(SLATE_BORD)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)

    # Title bar
    c.setFillColor(accent)
    c.roundRect(x, y + h - 28, w, 28, 8, fill=1, stroke=0)
    # Cover bottom corners of title bar (so only top is rounded)
    c.setFillColor(accent)
    c.rect(x, y + h - 28, w, 14, fill=1, stroke=0)

    # Title text
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 11)
    c.drawString(x + 10, y + h - 19, title)

    # Badge (right of title)
    if badge_text:
        c.setFont(FONT_REG, 7)
        text_w = c.stringWidth(badge_text, FONT_REG, 7)
        c.setFillColor(white)
        c.roundRect(x + w - text_w - 18, y + h - 22, text_w + 10, 14, 4, fill=0, stroke=1)
        c.setStrokeColor(white)
        c.roundRect(x + w - text_w - 18, y + h - 22, text_w + 10, 14, 4, fill=0, stroke=1)
        c.drawString(x + w - text_w - 13, y + h - 18, badge_text)

    # Includes section
    cur_y = y + h - 42
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_BOLD, 7.5)
    c.drawString(x + 10, cur_y, "INCLUDES")
    cur_y -= 11

    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_REG, 8.5)
    for line in includes_lines:
        c.drawString(x + 10, cur_y, line)
        cur_y -= 10

    # Divider
    cur_y -= 4
    c.setStrokeColor(SLATE_BORD)
    c.setLineWidth(0.5)
    c.line(x + 10, cur_y, x + w - 10, cur_y)
    cur_y -= 12

    # Pricing rows
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_BOLD, 7.5)
    c.drawString(x + 10, cur_y, "PRICING")
    cur_y -= 12

    for label, price in prices:
        # Label
        c.setFillColor(SLATE_DARK)
        c.setFont(FONT_REG, 9)
        c.drawString(x + 10, cur_y, label)
        # Price (right-aligned)
        c.setFillColor(accent)
        c.setFont(FONT_BOLD, 10)
        c.drawRightString(x + w - 10, cur_y, price)
        cur_y -= 13

    # Note at bottom
    if note:
        cur_y -= 2
        c.setFillColor(SLATE_MID)
        c.setFont(FONT_ITAL, 7)
        c.drawString(x + 10, cur_y, note)


def draw_compact_card(c, x, y, w, h, title, desc, price, accent=ORANGE):
    """Smaller card for add-on services"""
    c.setFillColor(white)
    c.setStrokeColor(SLATE_BORD)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)

    # Accent stripe on left
    c.setFillColor(accent)
    c.rect(x, y, 4, h, fill=1, stroke=0)

    # Title
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(x + 14, y + h - 18, title)

    # Description
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_REG, 8)
    c.drawString(x + 14, y + h - 32, desc)

    # Price
    c.setFillColor(accent)
    c.setFont(FONT_BOLD, 16)
    c.drawRightString(x + w - 12, y + h - 24, price)


def draw_footer(c):
    """Bottom strip with booking info"""
    # Notes box
    y_notes = 100
    c.setFillColor(ORANGE_LITE)
    c.setStrokeColor(ORANGE_BORD)
    c.setLineWidth(1)
    c.roundRect(20, y_notes, PAGE_W - 40, 50, 6, fill=1, stroke=1)

    c.setFillColor(ORANGE_DARK)
    c.setFont(FONT_BOLD, 9)
    c.drawString(30, y_notes + 36, "📝 IMPORTANT NOTES")

    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_REG, 8)
    c.drawString(30, y_notes + 22, "• Price range depends on breed, coat type, and pet size       • Plus Puppy shampoo: 1–2+ bottles based on coat thickness")
    c.drawString(30, y_notes + 10, "• All prices are for AT-HOME service       • Ear cleaning & nail trimming FREE with all Bath+ packages       • GST extra if applicable")

    # Footer band
    c.setFillColor(SLATE_DARK)
    c.rect(0, 0, PAGE_W, 60, fill=1, stroke=0)

    # Book now CTA
    c.setFillColor(ORANGE)
    c.setFont(FONT_BOLD, 13)
    c.drawString(25, 38, "📱 BOOK NOW")

    c.setFillColor(white)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, 22, "app.mypetclub.app")

    # Contact details (right)
    c.setFillColor(white)
    c.setFont(FONT_REG, 8.5)
    c.drawRightString(PAGE_W - 25, 42, "WhatsApp: +1 609 721 5754")
    c.drawRightString(PAGE_W - 25, 30, "Email: support@mypetclub.app")
    c.setFont(FONT_ITAL, 7.5)
    c.drawRightString(PAGE_W - 25, 16, "Serving Hyderabad • Premium grooming at your doorstep 🐾")


def build_brochure():
    out_path = r"C:\Users\14697\petclub-app\public\petclub-pricing-brochure.pdf"
    c = canvas.Canvas(out_path, pagesize=A4)
    c.setTitle("PETclub - Pet Grooming Price List")
    c.setAuthor("PETclub")
    c.setSubject("At-home pet grooming pricing brochure")

    # ─── PAGE 1 ───────────────────────────────────────────────────────
    draw_header(c)

    # Section label
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, PAGE_H - 100, "🛁  FULL GROOMING PACKAGES")
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_REG, 8)
    c.drawString(25, PAGE_H - 112, "Complete spa experience for your pet")

    # Two big cards side by side — Full Grooming
    card_w = (PAGE_W - 60) / 2
    card_h = 230
    card_y = PAGE_H - 360

    # 1) Complete Makeover (Wahl)
    draw_card(
        c, 25, card_y, card_w, card_h,
        title="COMPLETE MAKEOVER",
        badge_text="WAHL",
        includes_lines=[
            "✓ Bathing with Wahl shampoo",
            "✓ Nail trimming + nail grind",
            "✓ Deshedding treatment",
            "✓ Teeth brushing",
            "✓ Paw moisturising",
            "✓ Sanitary trim",
            "✓ Blow dry & finish",
        ],
        prices=[
            ("🐕  Big Dog", "₹1,800 – ₹2,500"),
            ("🐩  Small Dog", "₹1,700 – ₹2,000"),
            ("🐱  Cat", "₹1,500 – ₹1,700"),
        ],
        note="Wahl shampoo: 30ml per pet • ₹40/wash",
        accent=ORANGE,
    )

    # 2) Luxury Makeover (Plus Puppy)
    draw_card(
        c, 25 + card_w + 10, card_y, card_w, card_h,
        title="LUXURY MAKEOVER ★",
        badge_text="PLUS PUPPY",
        includes_lines=[
            "✓ Everything in Complete Makeover",
            "✓ Plus Puppy premium shampoo",
            "✓ Coat-specific formula",
            "✓ Extra conditioning",
            "✓ Multiple shampoos if needed",
            "✓ Salon-finish blow dry",
            "✓ Premium experience",
        ],
        prices=[
            ("🐕  Big Dog", "₹3,200 – ₹3,800"),
            ("🐩  Small Dog", "₹3,000 – ₹3,500"),
            ("🐱  Cat", "₹3,000"),
        ],
        note="Plus Puppy shampoo: ₹200–₹250/wash • 1–2+ as needed",
        accent=ORANGE_DARK,
    )

    # Bath+ section
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, PAGE_H - 380, "🚿  BATH+ PACKAGES")
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_REG, 8)
    c.drawString(25, PAGE_H - 392, "Includes FREE ear cleaning & nail trimming")

    bath_y = PAGE_H - 600
    bath_h = 200

    # 3) Essential Bath+ (Wahl)
    draw_card(
        c, 25, bath_y, card_w, bath_h,
        title="ESSENTIAL BATH+",
        badge_text="WAHL",
        includes_lines=[
            "✓ Bath with Wahl shampoo",
            "✓ Blow dry",
            "✓ FREE ear cleaning",
            "✓ FREE nail trimming",
        ],
        prices=[
            ("🐕  Big Dog", "₹1,000"),
            ("🐩  Small Dog", "₹800"),
            ("🐱  Cat", "₹1,000"),
        ],
        note="Wahl shampoo: ₹40/wash",
        accent=ORANGE,
    )

    # 4) Premium Bath+ (Plus Puppy)
    draw_card(
        c, 25 + card_w + 10, bath_y, card_w, bath_h,
        title="PREMIUM BATH+",
        badge_text="PLUS PUPPY",
        includes_lines=[
            "✓ Bath with Plus Puppy shampoo",
            "✓ Premium blow dry",
            "✓ FREE ear cleaning",
            "✓ FREE nail trimming",
        ],
        prices=[
            ("🐕  Big Dog", "₹2,500"),
            ("🐩  Small Dog", "₹2,000"),
            ("🐱  Cat", "₹2,000"),
        ],
        note="Plus Puppy shampoo: ₹250/wash",
        accent=ORANGE_DARK,
    )

    draw_footer(c)
    c.showPage()

    # ─── PAGE 2 ───────────────────────────────────────────────────────
    draw_header(c)

    # Quick services section
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, PAGE_H - 100, "✂️  QUICK SERVICES & PUPPY CARE")
    c.setFillColor(SLATE_MID)
    c.setFont(FONT_REG, 8)
    c.drawString(25, PAGE_H - 112, "Specialised services & gentle care for puppies")

    # 2x2 grid of compact cards
    grid_w = (PAGE_W - 60) / 2
    grid_h = 90

    # Top-left: Trim & Style
    draw_compact_card(
        c, 25, PAGE_H - 220, grid_w, grid_h,
        title="✂️  TRIM & STYLE",
        desc="Haircut only — any size dog or cat",
        price="₹1,300 – ₹1,500",
        accent=ORANGE,
    )

    # Top-right: Care Combo
    draw_compact_card(
        c, 25 + grid_w + 10, PAGE_H - 220, grid_w, grid_h,
        title="💅  CARE COMBO",
        desc="Nail trim + ear cleaning + face trim",
        price="₹500",
        accent=ORANGE_DARK,
    )

    # Bottom-left: Puppy Dry Spa
    draw_compact_card(
        c, 25, PAGE_H - 320, grid_w, grid_h,
        title="🐶  PUPPY DRY SPA",
        desc="Gentle dry bath for tiny puppies",
        price="₹600",
        accent=ORANGE,
    )

    # Bottom-right: Puppy Wet Bath
    draw_compact_card(
        c, 25 + grid_w + 10, PAGE_H - 320, grid_w, grid_h,
        title="🛁  PUPPY WET BATH",
        desc="Gentle wet bath for puppies",
        price="₹800 – ₹900",
        accent=ORANGE_DARK,
    )

    # Why PETclub section
    why_y = PAGE_H - 450
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, why_y + 100, "💜  WHY PETclub?")

    # 4 feature boxes in a row
    feat_w = (PAGE_W - 70) / 4
    feat_y = why_y
    features = [
        ("🏠", "AT YOUR DOOR", "Groomer comes\nto your home"),
        ("✅", "VERIFIED PROS", "Trained &\nbackground checked"),
        ("🛁", "PREMIUM PRODUCTS", "Wahl & Plus Puppy\nshampoos"),
        ("📍", "LIVE TRACKING", "Track your groomer\nin real-time"),
    ]
    for i, (icon, title, desc) in enumerate(features):
        x = 25 + i * (feat_w + 10)
        c.setFillColor(ORANGE_LITE)
        c.setStrokeColor(ORANGE_BORD)
        c.setLineWidth(1)
        c.roundRect(x, feat_y, feat_w, 90, 8, fill=1, stroke=1)

        c.setFillColor(ORANGE_DARK)
        c.setFont(FONT_REG, 22)
        c.drawCentredString(x + feat_w/2, feat_y + 60, icon)

        c.setFillColor(SLATE_DARK)
        c.setFont(FONT_BOLD, 8.5)
        c.drawCentredString(x + feat_w/2, feat_y + 40, title)

        c.setFillColor(SLATE_MID)
        c.setFont(FONT_REG, 7.5)
        for j, line in enumerate(desc.split('\n')):
            c.drawCentredString(x + feat_w/2, feat_y + 26 - j*10, line)

    # Process steps
    proc_y = PAGE_H - 570
    c.setFillColor(SLATE_DARK)
    c.setFont(FONT_BOLD, 11)
    c.drawString(25, proc_y + 80, "📋  HOW IT WORKS — 4 SIMPLE STEPS")

    steps = [
        ("1", "BOOK", "Pick service\non the app"),
        ("2", "MATCH", "Verified groomer\nassigned to you"),
        ("3", "TRACK", "Live GPS until\nthey arrive"),
        ("4", "ENJOY", "Pamper session\nat your home"),
    ]
    step_w = (PAGE_W - 70) / 4
    for i, (num, title, desc) in enumerate(steps):
        x = 25 + i * (step_w + 10)
        c.setFillColor(SLATE_LITE)
        c.setStrokeColor(SLATE_BORD)
        c.setLineWidth(1)
        c.roundRect(x, proc_y, step_w, 70, 8, fill=1, stroke=1)

        # Number circle
        c.setFillColor(ORANGE)
        c.circle(x + 18, proc_y + 50, 12, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 13)
        c.drawCentredString(x + 18, proc_y + 46, num)

        # Title
        c.setFillColor(SLATE_DARK)
        c.setFont(FONT_BOLD, 9)
        c.drawString(x + 38, proc_y + 50, title)

        # Desc
        c.setFillColor(SLATE_MID)
        c.setFont(FONT_REG, 7.5)
        for j, line in enumerate(desc.split('\n')):
            c.drawString(x + 12, proc_y + 28 - j*10, line)

    draw_footer(c)
    c.save()

    print(f"Brochure created: {out_path}")
    return out_path


if __name__ == "__main__":
    build_brochure()
