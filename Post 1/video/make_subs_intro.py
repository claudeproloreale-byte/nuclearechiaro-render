# Sottotitoli impressi del video introduttivo: testo effettivamente pronunciato (controllato con la trascrizione
# automatica della voce) sui tempi reali delle frasi. Niente «» né punteggiatura a fine riga, tranne ? e !.
import json, re
PH = [[1.18,1.55],[1.90,2.98],[3.32,6.39],[7.18,7.56],[8.00,9.33],[9.67,10.81],[11.73,12.31],[12.69,14.59],[15.26,16.76],[17.09,17.62],
      [18.97,20.37],[20.67,22.15],[22.15,23.05],[23.17,24.80],[25.18,25.55],[25.56,26.43],[26.72,27.42],[27.57,28.16],
      [29.05,30.27],[30.50,30.98],[31.53,32.33],[33.02,33.81],[34.40,34.95]]
TXT = [["Ciao!"], ["Io sono un neutrone:"], ["una delle particelle", "che fanno funzionare", "i reattori nucleari."], ["Lo so:"],
       ["quando senti la parola", "«nucleare»,"], ["un po' di paura", "ti viene."], ["Ma sai cosa?"], ["Spesso abbiamo paura", "di ciò che", "non conosciamo."],
       ["E il modo migliore", "per vincere la paura"], ["è capire."], ["Per questo nasce", "questo canale."], ["Io e l'ingegnere", "nucleare"], ["che mi dà la voce"],
       ["ti spiegheremo", "come funziona davvero:"], ["la fissione,"], ["i reattori,"], ["la sicurezza"], ["e le scorie."],
       ["Con dei video brevi"], ["e chiari,"], ["un passo alla volta."], ["Allora, sei pronto?"], ["Dai, andiamo!"]]
assert len(TXT) == len(PH)
TXT = [[re.sub(r'[.,:;]+$', '', l.replace('«', '').replace('»', '')).strip() for l in lines] for lines in TXT]   # niente «» né punti, virgole e due punti a fine riga; ? e ! restano
json.dump(PH, open('subs/phrases_intro.json', 'w'))
def ts(t): h = int(t // 3600); m = int(t // 60) % 60; return '%d:%02d:%05.2f' % (h, m, t % 60)
cues = []
for (s, e), lines in zip(PH, TXT):
    w = [len(l) + 3 for l in lines]; tot = sum(w); t = s - 0.05
    for l, k in zip(lines, w):
        d = (e - s) * k / tot; cues.append([t, t + d, l]); t += d
    cues[-1][1] = e + 0.25
for a, b in zip(cues, cues[1:]): a[1] = min(a[1], b[0])
Y = 1526  # 79,5% dell'altezza: sotto la bocca della mascotte, sopra la zona dei comandi di Instagram
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Poppins,112,&H00FFFFFF,&H00FFFFFF,&H004A1C0C,&H804A1C0C,-1,0,0,0,100,100,0,0,1,9,3,5,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = ''.join('Dialogue: 0,%s,%s,S,,0,0,0,,{\\pos(540,%d)\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}%s\n' % (ts(a), ts(b), Y, l) for a, b, l in cues)
open('subs/intro.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/intro.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
