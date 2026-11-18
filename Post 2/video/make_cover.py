# Copertina di una puntata: fotogramma di sfondo + titolo su due righe nello stile del canale
# (prima riga bianca, seconda gialla, Poppins grassetto con contorno blu scuro).
# Lo sfondo della puntata 2 si ottiene con:  PAGE='ep2.html?cover=1' VW=1080 VH=1920 PREFIX=cov node render.js still 0
# uso: python3 make_cover.py sfondo.jpg "PERCHÉ" "ci serve?" copertina.jpg
import sys, os
from PIL import Image, ImageDraw, ImageFont
src, l1, l2, out = sys.argv[1:5]
F = os.path.join(os.environ.get('FONTS', 'fonts'), 'Poppins-Bold.ttf')
NAVY, YEL = (12, 28, 74), (255, 210, 58)
im = Image.open(src).convert('RGB'); W, H = im.size; d = ImageDraw.Draw(im)
def line(txt, y, size, fill, stroke):
    f = ImageFont.truetype(F, size)
    while d.textlength(txt, font=f) > W - 140: size -= 4; f = ImageFont.truetype(F, size)
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2 + 5, y + 8), txt, font=f, fill=NAVY, stroke_width=stroke, stroke_fill=NAVY)   # ombra
    d.text(((W - w) / 2, y), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=NAVY)
line(l1, 205, 210, (255, 255, 255), 17)
line(l2, 445, 170, YEL, 15)
im.save(out, quality=94)
