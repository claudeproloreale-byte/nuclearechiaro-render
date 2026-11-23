# Sottotitoli della puntata 4: testo effettivamente pronunciato (trascrizione automatica di controllo)
# sui tempi reali delle frasi (audio/phrases.json, voce montata). Numeri in cifre; punteggiatura secondo la regola del canale.
import json, re
PH = json.load(open('../audio/phrases.json'))
TXT = [["Ciao!"], ["Oggi ti porto dentro", "una pastiglia", "di uranio."],
       ["Gli atomi", "non sono tutti uguali:"], ["ci sono due isotopi,"], ["l'uranio 235", "e il 238."],
       ["Stessi protoni,", "ma il 238", "ha 3 neutroni in più."],
       ["Nel combustibile,", "il 235 è solo", "qualche atomo su 100."],
       ["Guarda cosa succede", "quando un neutrone", "lo colpisce."],
       ["Il nucleo", "si spacca in due:"], ["è la fissione."], ["E libera 2 o 3", "nuovi neutroni."],
       ["2 li cattura il 238", "o scappano", "dal reattore,"], ["il terzo spacca", "un altro atomo", "di 235."],
       ["Questo è fissile:"], ["si spacca e tiene viva", "la reazione a catena."],
       ["I 2 nuclei nuovi,", "i prodotti di fissione,", "schizzano via", "a circa 10 000", "chilometri al secondo."],
       ["Gli atomi vicini", "li frenano subito,"], ["e quella frenata", "diventa calore", "che scalda l'acqua."],
       ["E il 238?", "Con il neutrone", "catturato,", "in pochi giorni", "diventa plutonio."],
       ["Anche lui è fissile,", "ovvero può spaccarsi", "se colpito", "da un altro neutrone:"],
       ["alla fine,", "circa un terzo", "dell'energia", "di una centrale", "viene dal plutonio."],
       ["Domande?"], ["Scrivile", "nei commenti."]]
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
open('subs/ep4.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/ep4.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
