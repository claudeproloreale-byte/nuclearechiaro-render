# Sottotitoli impressi della puntata 2: testo effettivamente pronunciato (scaletta corretta con la trascrizione
# automatica della voce) sui tempi reali delle frasi (audio/phrases3.json).
# Ogni frase è divisa in righe brevi (max ~22 caratteri); dentro la frase il tempo è ripartito in base alla lunghezza.
import json
PH = json.load(open('../audio/phrases3.json'))
TXT = [["Ehi!"], ["Lo sapevi che l'Italia", "compra all'estero"], ["tre quarti", "dell'energia che usa?"], ["E la nostra corrente", "è tra le più care", "d'Europa."],
       ["Sole, vento e acqua", "ci danno già", "il 40%", "dell'elettricità,"], ["e devono ancora", "crescere!"], ["Ma di notte"], ["e quando non c'è vento,"], ["serve qualcun altro."],
       ["Oggi quel", "qualcun altro"], ["sono i combustibili", "fossili:"], ["soprattutto gas,"], ["e ancora un po'", "di carbone e petrolio."],
       ["Li compriamo", "all'estero,"], ["costano cari"], ["e inquinano."], ["Ecco dove entro", "in gioco io."], ["Una centrale nucleare", "produce", "giorno e notte,"],
       ["senza emettere", "anidride carbonica"], ["né inquinare l'aria."], ["E una parte", "della corrente", "che compriamo", "dai vicini", "nasce già così."],
       ["Costa,", "e ci vuole tempo:", "per questo", "se ne discute."], ["Ma da settembre", "l'Italia ha una legge", "per ricominciare", "a progettarlo."],
       ["Ti interessa", "saperne di più?"], ["Seguimi!"]]
assert len(TXT) == len(PH)
def ts(t): h = int(t // 3600); m = int(t // 60) % 60; return '%d:%02d:%05.2f' % (h, m, t % 60)
cues = []
for (s, e), lines in zip(PH, TXT):
    w = [len(l) + 3 for l in lines]; tot = sum(w); t = s - 0.05
    for l, k in zip(lines, w):
        d = (e - s) * k / tot; cues.append([t, t + d, l.rstrip(',.:;')]); t += d   # niente virgole, punti e due punti a fine riga (restano ? e !)
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
open('subs/ep2.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/ep2.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
