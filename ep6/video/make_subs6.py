# Sottotitoli della puntata 6: testo effettivamente pronunciato (trascrizione automatica di controllo)
# sui tempi reali delle frasi (audio/phrases.json, voce montata). Numeri in cifre; punteggiatura secondo la regola del canale.
import json, re
PH = json.load(open('../audio/phrases.json'))
TXT = [["Ma una centrale", "nucleare può esplodere", "come una bomba", "atomica?"],
       ["No."], ["E non perché qualcuno", "la tiene a bada:"], ["lo impedisce la fisica."],
       ["In una bomba"], ["l'uranio 235"], ["è quasi puro:"], ["più di 90 nuclei", "su 100."],
       ["Ogni neutrone,", "anche se velocissimo,"], ["trova subito", "un nucleo da spaccare,"],
       ["e in meno", "di un milionesimo", "di secondo", "si libera", "tutta l'energia."],
       ["Per una centrale", "nucleare"], ["è completamente", "diverso."],
       ["Nella pastiglia", "di una centrale", "infatti,", "l'uranio 235", "è solo da 3 a 5", "nuclei su 100."],
       ["Tutti gli altri", "sono uranio 238,"], ["e molti neutroni", "finiscono lì,"], ["assorbiti."],
       ["Per andare avanti,", "la reazione", "ha bisogno dell'acqua,"], ["che rallenta", "i neutroni."],
       ["E i neutroni", "più sono lenti,"], ["più probabilità", "hanno di interagire", "con l'uranio 235."],
       ["E se il nocciolo", "si scalda troppo,", "l'acqua si dilata", "e frena meno", "i neutroni:"],
       ["la reazione", "rallenta da sola."],
       ["Un incidente", "è molto improbabile", "ma può succedere,"], ["ma un'esplosione", "atomica", "è fisicamente", "impossibile."],
       ["Hai qualche domanda?"], ["Fammela nei commenti!"]]
assert len(TXT) == len(PH)
# regola del canale (17/11/2026): a fine riga si tolgono . , : ; (e sempre le virgolette «»); restano ? e ! e la punteggiatura in mezzo alla riga
TXT = [[re.sub(r'[.,:;]+$', '', l.replace('«', '').replace('»', '')).strip() for l in lines] for lines in TXT]
def ts(t): h = int(t // 3600); m = int(t // 60) % 60; return '%d:%02d:%05.2f' % (h, m, t % 60)
cues = []
for (s, e), lines in zip(PH, TXT):
    w = [len(l) + 3 for l in lines]; tot = sum(w); t = s - 0.05
    for l, k in zip(lines, w):
        d = (e - s) * k / tot; cues.append([t, t + d, l]); t += d
    cues[-1][1] = e + 0.25
for a, b in zip(cues, cues[1:]): a[1] = min(a[1], b[0])
Y = 1526  # 79,5% dell'altezza
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
open('subs/ep6.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/ep6.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
