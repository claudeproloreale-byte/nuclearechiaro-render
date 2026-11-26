# Copertina della puntata 6: sfondo (ep6.html?cover=1) + titolo nello stile del canale
# (righe bianche, ultima gialla, Poppins grassetto con contorno blu scuro e ombra), nella fascia visibile
# anche nella griglia 3:4 del profilo Instagram (da 240 a 1680 px di altezza). Come make_cover5.py.
# uso: python3 make_cover6.py copertina_sfondo.jpg copertina_ep6.jpg "CENTRALE" "o BOMBA"
import sys, os
from PIL import Image, ImageDraw, ImageFont
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
y = 330
for i, txt in enumerate(lines):
    last = i == len(lines) - 1
    size = line(txt, y, 170 if last else 190, YEL if last else WHITE, 16 if last else 17)
    y += int(size * 1.15)
im.save(out, quality=94)
