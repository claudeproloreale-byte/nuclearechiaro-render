# Titolo e pillola della copertina del video introduttivo sopra un fotogramma 1080x1920.
# uso: python3 make_cover_intro.py sfondo.jpg copertina.png
# Sfondo: fotogramma a 34,8 s ->
#   PAGE=intro.html VW=1080 VH=1920 PREFIX=t node render.js still 34.8   (crea t_34.8.jpg)
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, out = sys.argv[1:3]
im = Image.open(src).convert('RGB'); W, H = im.size
FD = os.environ.get('FONTS', 'fonts')
bold = os.path.join(FD, 'Poppins-ExtraBold.ttf') if os.path.exists(os.path.join(FD, 'Poppins-ExtraBold.ttf')) else os.path.join(FD, 'Poppins-Bold.ttf')
semi = os.path.join(FD, 'Poppins-SemiBold.ttf') if os.path.exists(os.path.join(FD, 'Poppins-SemiBold.ttf')) else os.path.join(FD, 'Poppins-Bold.ttf')
NAVY = (12, 28, 74); YEL = (255, 210, 58)
def fit(txt, path, maxw, size):
    while True:
        f = ImageFont.truetype(path, size); b = f.getbbox(txt)
        if b[2] - b[0] <= maxw: return f
        size -= 4
def text(d, txt, f, y, fill, stroke, sw):
    b = d.textbbox((0, 0), txt, font=f, stroke_width=sw); x = (W - (b[2] - b[0])) // 2 - b[0]
    d.text((x, y), txt, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
f1 = fit('NUCLEARE', bold, 940, 220); f2 = fit('chiaro per tutti', bold, 860, 120)
text(ds, 'NUCLEARE', f1, 262, (5, 12, 40, 170), (5, 12, 40, 170), 16); text(ds, 'chiaro per tutti', f2, 262 + f1.size * 0.98 + 14, (5, 12, 40, 170), (5, 12, 40, 170), 12)
sh = sh.filter(ImageFilter.GaussianBlur(14)); im.paste(sh, (0, 10), sh)
d = ImageDraw.Draw(im)
text(d, 'NUCLEARE', f1, 250, (255, 255, 255), NAVY, 14)
text(d, 'chiaro per tutti', f2, 250 + f1.size * 0.98 + 14, YEL, NAVY, 11)
f3 = ImageFont.truetype(semi, 64); t = 'Ciao, mi presento!'; b = d.textbbox((0, 0), t, font=f3); tw = b[2] - b[0]
pw, ph = tw + 110, 128; x0 = (W - pw) // 2; y0 = 1440
d.rounded_rectangle((x0, y0 + 8, x0 + pw, y0 + ph + 8), ph // 2, fill=(20, 70, 40))
d.rounded_rectangle((x0, y0, x0 + pw, y0 + ph), ph // 2, fill=(255, 255, 255), outline=NAVY, width=6)
d.text(((W - tw) // 2 - b[0], y0 + (ph - (b[3] - b[1])) // 2 - b[1]), t, font=f3, fill=NAVY)
im.save(out)
