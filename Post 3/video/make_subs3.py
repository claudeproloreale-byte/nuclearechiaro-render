# Sottotitoli della puntata 3: testo effettivamente pronunciato (scaletta corretta con la trascrizione automatica)
# sui tempi reali delle frasi (audio/phrases.json, voce montata). Stile identico alla puntata 2.
# Punteggiatura (regola del canale, 17/11/2026): si scrive normale, poi a fine riga si tolgono . , : ; e le «»;
# ? e ! restano, e resta tutta la punteggiatura in mezzo alla riga.
import json, re
PH = json.load(open('../audio/phrases.json'))
TXT = [["Ciao!"], ["Ti spiego", "il funzionamento", "di una centrale", "nucleare."],
       ["L'idea alla base", "è semplice:"], ["scaldi dell'acqua,"], ["generi del vapore", "e fai girare", "una turbina."],
       ["In pratica si sfrutta", "un ciclo", "termodinamico", "chiamato", "ciclo Rankine."],
       ["La fonte del calore", "che scalda l'acqua", "si trova nel nocciolo:"], ["migliaia di barrette", "piene di pastiglie", "di uranio."],
       ["Al loro interno,", "gli atomi subiscono", "una reazione nucleare."],
       ["Il calore generato", "passa all'acqua", "del circuito primario,"], ["a circa 320 gradi."],
       ["Non bolle,", "perché è tenuta", "ad altissima", "pressione."],
       ["Questo circuito", "è chiuso:"], ["la sua acqua", "non esce mai"], ["e non si mescola", "con altra."],
       ["Cede solo il calore", "a un secondo circuito,"], ["dove l'acqua,"], ["a pressione più bassa,"], ["diventa vapore."],
       ["Il vapore fa girare", "una turbina"], ["e l'alternatore", "produce elettricità."],
       ["Infine"], ["il vapore si condensa"], ["e il ciclo ricomincia."],
       ["Se hai qualche", "domanda, fammela", "nei commenti:"], ["ti risponderò,", "e magari", "ci faccio un video."]]
assert len(TXT) == len(PH)
def ts(t): h = int(t // 3600); m = int(t // 60) % 60; return '%d:%02d:%05.2f' % (h, m, t % 60)
TXT = [[re.sub(r'[.,:;]+$', '', l.replace('«', '').replace('»', '')).strip() for l in lines] for lines in TXT]   # niente «» né . , : ; a fine riga; ? e ! restano
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
open('subs/ep3.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/ep3.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
