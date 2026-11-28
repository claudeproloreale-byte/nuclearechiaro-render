# Copertina della puntata 7 (28/11/2026, richiesta dell'autore): sfondo generato apposta (ep7.html?cover=1&pitch=0.09&back=2: lato natura
# di giorno, rocce e banane fosforescenti, niente mascotte), titolo nello stile del canale (righe bianche, ultima gialla, Poppins
# grassetto con contorno blu scuro e ombra) e sotto il titolo il simbolo della radioattività bianco, con lo stesso contorno e ombra.
# Tutto nella fascia visibile anche nella griglia 3:4 del profilo Instagram (da 240 a 1680 px di altezza).
# uso: python3 make_cover7.py sfondo.jpg copertina_ep7.jpg "RADIOATTIVITÀ" "NIENTE PAURA"
import sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, out, *lines = sys.argv[1:]
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'Poppins-Bold.ttf')
NAVY, YEL, WHITE = (12, 28, 74), (255, 210, 58), (255, 255, 255)
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
# simbolo della radioattività (trifoglio): disco centrale e tre pale a 60°, una in basso e due in alto; disegnato 4 volte più grande e ridotto
S, R = 4, 175; cx, cy = W // 2, y + 70 + R
def trifoglio(scale_r, fill):
    L = Image.new('L', (W * S, H * S), 0); g = ImageDraw.Draw(L)
    X, Y, r = cx * S, cy * S, scale_r * S
    g.ellipse([X - 0.2 * r, Y - 0.2 * r, X + 0.2 * r, Y + 0.2 * r], fill=255)
    for c in (90, 210, 330):   # centri delle pale (gradi, senso orario da destra, y verso il basso: 90 = in basso)
        g.pieslice([X - r, Y - r, X + r, Y + r], c - 30, c + 30, fill=255)
    g.ellipse([X - 0.3 * r, Y - 0.3 * r, X + 0.3 * r, Y + 0.3 * r], fill=0)
    g.ellipse([X - 0.2 * r, Y - 0.2 * r, X + 0.2 * r, Y + 0.2 * r], fill=255)
    return L.resize((W, H), Image.LANCZOS)
m = trifoglio(R, 255)
bordo = m.filter(ImageFilter.MaxFilter(33))
ombra = Image.new('L', (W, H), 0); ombra.paste(bordo, (6, 9))
im.paste(Image.new('RGB', (W, H), NAVY), (0, 0), ombra)
im.paste(Image.new('RGB', (W, H), NAVY), (0, 0), bordo)
im.paste(Image.new('RGB', (W, H), WHITE), (0, 0), m)
im.save(out, quality=94)
print('titolo fino a', y, 'px; simbolo da', cy - R, 'a', cy + R, 'px')
