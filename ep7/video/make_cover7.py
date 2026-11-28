# Copertina della puntata 7 (28/11/2026, richiesta dell'autore): sfondo generato apposta (ep7.html?cover=1&pitch=0.07&back=2.5: lato
# natura di giorno, rocce e banane fosforescenti, niente mascotte né nuvole), titolo nello stile del canale (righe bianche, ultima gialla,
# Poppins grassetto con contorno blu scuro e ombra) e sotto il titolo il simbolo della radioattività bianco, grande.
# Proporzioni del simbolo come la norma ISO 361: disco centrale di raggio r, pale da 1,5 r a 5 r, larghe 60°, una in basso.
# Stili (prove del 28/11; l'autore ha scelto «morbido»): classico (contorno blu e ombra), distintivo (su un disco blu con anello bianco), bagliore (alone verde
# fosforescente come le rocce), morbido (pale arrotondate, contorno blu e ombra).
# Tutto nella fascia visibile anche nella griglia 3:4 del profilo Instagram (da 240 a 1680 px di altezza).
# uso: python3 make_cover7.py sfondo.jpg copertina.jpg stile "RADIOATTIVITÀ" "NIENTE PAURA"
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, out, stile, *lines = sys.argv[1:]
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'Poppins-Bold.ttf')
NAVY, YEL, WHITE, GREEN = (12, 28, 74), (255, 210, 58), (255, 255, 255), (120, 255, 110)
im = Image.open(src).convert('RGB'); W, H = im.size; d = ImageDraw.Draw(im)
def line(txt, y, size, fill, stroke):
    f = ImageFont.truetype(F, size)
    while d.textlength(txt, font=f) > W - 140: size -= 4; f = ImageFont.truetype(F, size)
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2 + 6, y + 9), txt, font=f, fill=NAVY, stroke_width=stroke, stroke_fill=NAVY)   # ombra
    d.text(((W - w) / 2, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=NAVY)
    return size
y = 300
for i, txt in enumerate(lines):
    last = i == len(lines) - 1
    size = line(txt, y, 170 if last else 190, YEL if last else WHITE, 16 if last else 17)
    y += int(size * 1.15)
R = {'distintivo': 270}.get(stile, 310)          # raggio esterno delle pale (px)
cx, cy = W // 2, y + 60 + (R * 1.2 if stile == 'distintivo' else R)
S = 4
def trifoglio(Rp):
    L = Image.new('L', (W * S, H * S), 0); g = ImageDraw.Draw(L)
    X, Y, r = cx * S, cy * S, Rp * S / 5
    for c in (90, 210, 330):   # centri delle pale (gradi; y verso il basso, 90 = in basso)
        g.pieslice([X - 5 * r, Y - 5 * r, X + 5 * r, Y + 5 * r], c - 30, c + 30, fill=255)
    g.ellipse([X - 1.5 * r, Y - 1.5 * r, X + 1.5 * r, Y + 1.5 * r], fill=0)
    g.ellipse([X - r, Y - r, X + r, Y + r], fill=255)
    return L
def piccola(L): return L.resize((W, H), Image.LANCZOS)
def morbida(L, k):   # arrotonda gli spigoli: sfoca e risoglia
    return L.filter(ImageFilter.GaussianBlur(k * S)).point(lambda v: 255 if v > 128 else 0)
def tinta(col, mask): im.paste(Image.new('RGB', (W, H), col), (0, 0), mask)
def ombra(mask, dx=7, dy=11):
    o = Image.new('L', (W, H), 0); o.paste(mask, (dx, dy)); tinta(NAVY, o)
if stile in ('classico', 'morbido'):
    L = trifoglio(R)
    if stile == 'morbido': L = morbida(L, 9)
    m = piccola(L); bordo = m.filter(ImageFilter.MaxFilter(29))
    ombra(bordo); tinta(NAVY, bordo); tinta(WHITE, m)
elif stile == 'distintivo':
    D = Image.new('L', (W * S, H * S), 0); g = ImageDraw.Draw(D); X, Y, rr = cx * S, cy * S, R * 1.2 * S
    g.ellipse([X - rr, Y - rr, X + rr, Y + rr], fill=255); disco = piccola(D)
    anello = disco.filter(ImageFilter.MaxFilter(31)); bordo = anello.filter(ImageFilter.MaxFilter(17))
    ombra(bordo); tinta(NAVY, bordo); tinta(WHITE, anello); tinta(NAVY, disco); tinta(WHITE, piccola(trifoglio(R)))
elif stile == 'bagliore':
    m = piccola(trifoglio(R))
    alone = m.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(28))
    im = Image.composite(Image.new('RGB', (W, H), GREEN), im, alone.point(lambda v: min(255, int(v * 1.6))))
    bordo = m.filter(ImageFilter.MaxFilter(11)); tinta((30, 110, 40), bordo); tinta(WHITE, m)
im.save(out, quality=94)
print(stile, 'titolo fino a', y, 'px; simbolo centrato a', cy, 'px')
