# Sottotitoli della puntata 7: testo effettivamente pronunciato (trascrizione di controllo) sui tempi reali delle frasi
# (../audio/phrases.json, voce montata). Numeri in cifre; punteggiatura secondo la regola del canale; righe di 22 caratteri al massimo.
# Dentro le frasi lunghe le righe si dividono in proporzione ai caratteri, ripartendo dalle pause fra le parole (TAGLI).
import json, re
PH = json.load(open('../audio/phrases.json')); RAW = json.load(open('../audio/phrases_raw.json')); RAW[24][0] = 95.62
TXT = [["La radioattività", "ti fa paura?"],
       ["Ma non l'abbiamo", "inventata noi", "esseri umani:", "esiste da sempre,", "ed è ovunque."], None,   # B2 riregistrata il 28/11/2026
       ["Viene dalle rocce,", "dal cibo e", "persino dallo spazio."], None,                                  # B3 riregistrata il 28/11/2026
       ["Anche il tuo corpo", "è un po' radioattivo:", "dentro di te,", "ogni secondo,", "circa 4000 atomi", "decadono."],
       ["Ma cosa vuol dire,", "radioattivo?"],
       ["Alcuni nuclei hanno", "troppi neutroni", "o troppi protoni:"], ["sono instabili."],
       ["Prima o poi", "si sistemano da soli,"], ["lanciando fuori", "un pezzetto di nucleo", "o un'onda", "elettromagnetica."],
       ["Quel lancio", "è la radiazione", "e questo processo", "si chiama decadimento."],
       ["Così il nucleo", "si trasforma", "in un altro atomo."], ["Questo può essere", "a sua volta", "ancora instabile,"], ["e quindi radioattivo,", "oppure stabile."],
       ["Ogni tipo di nucleo", "ha il suo ritmo:"], ["in un certo tempo", "se ne trasforma", "la metà."], ["Per alcuni", "bastano secondi,"], ["per altri servono", "miliardi di anni."],
       ["Quindi la domanda", "giusta non è", "se c'è radioattività,"], ["ma quanta", "ne riceviamo."],
       ["In un anno,", "dalla natura,", "ognuno di noi", "ne riceve circa", "2 o 3 millisievert,"], ["l'unità di misura", "delle radiazioni."],
       ["Un volo da Roma", "a New York", "equivale a circa", "una settimana", "di questa", "radioattività", "naturale."],
       ["E vivere accanto", "a una centrale", "nucleare?", "Molto meno", "di un volo,", "all'anno."],
       ["Dentro il reattore,", "però, i frammenti", "della fissione", "sono molto", "radioattivi:", "per questo restano", "chiusi nelle pastiglie,", "nelle barre,", "nel vessel", "e nella cupola."],
       ["E dove finiscono dopo?"], ["E perché ci possono", "fare male?"], ["Ne parleremo", "nella puntata", "dedicata alle scorie."],
       ["Hai qualche domanda?"], ["Fammela nei commenti!"]]
assert len(TXT) == len(PH)
RAW[1] = [1.85, 5.65]; RAW[3] = [6.95, 10.46]   # dalla registrazione nuova (voice_ep7.py)
# pause fra le parole nella registrazione: frase -> [(indice della riga che riparte, istante nella registrazione)]
TAGLI = {1: [(3, 3.92)], 3: [(1, 8.24), (2, 9.18)], 5: [(2, 20.28)], 10: [(2, 42.24)], 24: [(3, 97.96)], 25: [(1, 102.99), (5, 106.09), (7, 108.47), (8, 109.42), (9, 110.31)],
         23: [(3, 91.14)]}
TXT = [None if lines is None else [re.sub(r'[.,:;]+$', '', l.replace('«', '').replace('»', '')).strip() for l in lines] for lines in TXT]
assert all(len(l) <= 22 for ls in TXT if ls for l in ls)
def ts(t): h = int(t // 3600); m = int(t // 60) % 60; return '%d:%02d:%05.2f' % (h, m, t % 60)
cues = []
for k, (ph, lines) in enumerate(zip(PH, TXT)):
    if ph is None: continue
    s, e = ph
    cut = [(0, s)] + [(i, s + raw - RAW[k][0]) for i, raw in TAGLI.get(k, [])] + [(len(lines), e)]
    for (i0, t0), (i1, t1) in zip(cut, cut[1:]):
        part = lines[i0:i1]; w = [len(l) + 3 for l in part]; tot = sum(w); t = t0 - 0.05
        for l, q in zip(part, w):
            d = (t1 - t0) * q / tot; cues.append([t, t + d, l]); t += d
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
open('subs/ep7.ass', 'w').write(head + ev)
srt = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t // 60 % 60, t % 60, round(t % 1 * 1000) % 1000)
open('subs/ep7.srt', 'w').write(''.join('%d\n%s --> %s\n%s\n\n' % (i + 1, srt(a), srt(b), l) for i, (a, b, l) in enumerate(cues)))
print(len(cues), 'righe; più lunga:', max(len(l) for _, _, l in cues), 'caratteri')
