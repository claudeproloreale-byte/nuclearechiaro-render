# Copertina della puntata 3: sfondo (ep3.html?cover=1) + titolo su più righe nello stile del canale
# (righe bianche, ultima gialla, Poppins grassetto con contorno blu scuro e ombra). Il titolo sta nella fascia
# che resta visibile anche nella griglia 3:4 del profilo Instagram (da 240 a 1680 px di altezza).
# uso: python3 make_cover3.py sfondo.jpg copertina.jpg "CENTRALE" "NUCLEARE" "come funziona"
import sys
from PIL import Image, ImageDraw, ImageFont
src, out, *lines = sys.argv[1:]
F = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
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
    size = 150 if last else 190
    line(txt, y, size, YEL if last else WHITE, 15 if last else 17)
    y += int(size * 1.12) + (30 if i == len(lines) - 2 else 0)
im.save(out, quality=94)
