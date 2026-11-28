# Puntata 7 — voce definitiva: seconda registrazione completa dell'autore (p7-voce_2-mejorada-v2.mp3, mandata in chat il
# 28/11/2026, versione migliorata, 120,3 s, 29 frasi rilevate a -50 dB come in detect6.py -> phrases_raw.json). Sostituisce la
# registrazione del 27/11 e le B2–B3 rifatte la mattina del 28/11. Stesso metodo delle puntate 5 e 6 (Post 6/audio/voice_ep6.py):
# ogni battuta della scaletta si appoggia sulla voce; dove la voce è più lunga l'animazione rallenta, dove è più corta
# l'animazione va alla sua velocità e la pausa dopo si allunga. Alcuni eventi sono agganciati a parole (ANC: tempo di scaletta,
# frase, istante nella registrazione; istanti dalle pause fra le parole e dalla trascrizione di controllo con Whisper turbo).
# Pause fra frasi della stessa battuta: come registrate, 0,7 s al massimo; fra battute circa 1 s (PB). Niente riverbero sulla voce.
# Produce: voice_fx.wav, phrases.json (tempi nel video), warp7.json (tabella WARP), battute.json, ../video/lip7.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json, os
# VERSIONE=tiktok (28/11/2026, esperimento dell'autore): montaggio più veloce solo per TikTok, file con suffisso _tt
TT = os.environ.get('VERSIONE') == 'tiktok'; SUF = '_tt' if TT else ''
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('voce_in.wav', dtype='float64')
if a.ndim > 1: a = a.mean(1)
FPS = 30
PH = json.load(open('phrases_raw.json'))
# testo (trascrizione di controllo, Whisper turbo; i sottotitoli in ../video/make_subs7.py):
#  0 La radioattività ti fa paura? | 1 Ma non l'abbiamo inventata noi esseri umani: esiste da sempre, ed è ovunque.
#  2 Viene dalle rocce, dal cibo e persino dallo spazio. | 3 Anche il tuo corpo è un po' radioattivo: dentro di te, ogni secondo, circa 4000 atomi decadono.
#  4 Ma cosa vuol dire, radioattivo? | 5 Alcuni nuclei hanno troppi neutroni o troppi protoni: | 6 ciò li rende instabili.
#  7 Prima o poi si sistemano da soli, lanciando fuori un pezzetto di nucleo o un'onda elettromagnetica. Quel lancio è la radiazione e questo processo si chiama decadimento.
#  8 Così il nucleo si trasforma in un altro atomo. | 9 Questo può essere a sua volta ancora instabile, e quindi radioattivo, oppure stabile.
#  10 Ogni tipo di nucleo ha il suo ritmo: | 11 in un certo tempo se ne trasforma la metà. | 12 Per alcuni bastano secondi, | 13 per altri servono miliardi di anni.
#  14 Quindi la domanda giusta non è se c'è radioattività, | 15 ma quanta ne riceviamo.
#  16 In un anno, dalla natura, ognuno di noi ne riceve circa 2 o 3 millisievert, | 17 l'unità di misura della radiazione.
#  18 Un volo da Roma a New York equivale a circa una settimana di questa radioattività naturale.
#  19 E vivere accanto a una centrale nucleare? | 20 Molto meno di un volo, all'anno.
#  21 Dentro il reattore, però, i frammenti della fissione sono molto radioattivi: | 22 per questo restano chiusi nelle pastiglie, | 23 nelle barre, nel vessel e nella cupola.
#  24 E dove finiscono dopo? | 25 E perché ci possono fare male? | 26 Ne parleremo nella puntata dedicata alle scorie.
#  27 Hai qualche domanda? | 28 Fammela nei commenti!
# battute: (inizio, fine di scaletta (ep7/video/tempi.js, B), frasi, ancore [(t scaletta, frase, istante nella registrazione)])
BLK = [
  (0.5, 4.0, [0], [(1.9, 0, 1.28)]),                                          # il simbolo lampeggia di verde su «ti fa paura?»
  (4.5, 10.0, [1], []),
  (10.5, 15.0, [2], [(11.1, 2, 10.15),                                        # si illuminano le rocce su «rocce»
                     (12.1, 2, 10.9),                                         #   le banane su «cibo»
                     (13.3, 2, 12.5)]),                                       #   arrivano i raggi cosmici su «spazio»
  (15.5, 21.5, [3], [(18.4, 3, 16.82)]),                                      # l'omino si è girato e si accendono i puntini su «dentro»
  (22.0, 24.5, [4], []),
  (25.0, 30.5, [5, 6], []),
  (31.0, 38.0, [7], [(33.6, 7, 36.95),                                        # alfa su «pezzetto di nucleo»
                     (35.7, 7, 38.4)]),                                       # gamma su «un'onda elettromagnetica» (beta in mezzo)
  (38.5, 46.5, [8, 9], []),
  (47.0, 54.5, [10, 11, 12, 13], []),
  (55.0, 59.5, [14, 15], []),
  (60.0, 65.0, [16, 17], []),
  (65.5, 70.5, [18], [(67.15, 18, 86.55)]),                                   # il peso del volo cade su «una settimana»
  (71.0, 77.0, [19, 20], [(74.0, 20, 93.04)]),                                # il granello della centrale su «Molto meno di un volo»
  (77.5, 86.0, [21, 22, 23], [(84.2, 22, 102.57),                             # barriere: «pastiglie»
                              (84.9, 23, 104.15),                             #   «barre»
                              (85.5, 23, 105.25),                             #   «vessel»
                              (86.0, 23, 106.41)]),                           #   «cupola»
  (86.5, 89.5, [24, 25, 26], []),
  (90.0, 92.4, [27, 28], [(90.9, 28, 119.01), (91.8, 28, 119.8)]),            # la mascotte indica i commenti su «fammela nei commenti»
]
INTRA = 0.7          # pausa massima fra frasi della stessa battuta
PB = 1.0             # pausa fra una battuta e l'altra, circa 1 s (richiesta dell'autore del 26/11/2026)
DOPO_ANCORA = 0.5
# battute dopo cui la pausa si accorcia (l'animazione finisce insieme alla voce, un po' più veloce): richiesta dell'autore del
# 28/11/2026, fra B2 e B3 a schermo non succede nulla (prima 1,4 s di pausa)
CORTA = {1: 0.75}
VMAX = 1.0           # quanto l'animazione può accelerare per stare dietro alla voce (1 = mai più veloce della scaletta)
EXIT_DOPO, TAIL = 1.0, 1.5
EXIT_S, END_S = 92.9, 94.4
R0 = BLK[0][0]
if TT:
    # Versione TikTok: «carta bianca» dall'autore per un montaggio più veloce. Si tagliano le frasi che non portano un'informazione
    # nuova o che ripetono ciò che si vede; pause brevi; l'animazione può andare fino a 1,7 volte più veloce della scaletta.
    #  B2: solo «esiste da sempre, ed è ovunque» (la pausa dopo «esseri umani» è a 5,95 s nella registrazione)
    #  B8: solo «Così il nucleo si trasforma in un altro atomo.»   B11: senza «l'unità di misura della radiazione»
    #  B15: senza «E perché ci possono fare male?»
    PH[1] = [5.95, PH[1][1]]
    BLK = [list(x) for x in BLK]
    BLK[7][2] = [8]; BLK[10][2] = [16]; BLK[14][2] = [24, 26]
    INTRA, PB, DOPO_ANCORA, CORTA, VMAX = 0.3, 0.3, 0.25, {}, 1.7
    EXIT_DOPO, TAIL, R0 = 0.6, 1.0, 0.25
    VMAXB = {1: 3.0, 7: 2.6}   # B2 (collina calma) e B8 (il nucleo si calma): lì non succede quasi nulla, si può correre di più
VMAXB = globals().get('VMAXB', {})
USATE = {k for b in BLK for k in b[2]}

starts = [None] * len(PH); W = [[0.0, 0.0]]
vt = lambda k, raw: starts[k] + raw - PH[k][0]
r = R0
for bi, (ss, se, idx, anc) in enumerate(BLK):
    t = r
    for j, k in enumerate(idx):
        if j: t += min(PH[k][0] - PH[idx[j - 1]][1], INTRA)
        starts[k] = round(t, 3); t += PH[k][1] - PH[k][0]
    vend = t
    W.append([ss, round(r, 3)])
    for (sa, k, raw) in anc: W.append([sa, round(vt(k, raw), 3)])
    s_a, v_a = W[-1]
    if bi + 1 == len(BLK): break
    vm = VMAXB.get(bi, VMAX)
    ns = BLK[bi + 1][0]
    if bi in CORTA and s_a < se:
        v_se = vend; W.append([se, round(v_se, 3)]); r = vend + CORTA[bi]
    elif s_a < se:
        v_se = max(vend, v_a + (se - s_a) / vm); W.append([se, round(v_se, 3)])
        r = max(vend + PB, v_se + ((ns - se) / vm if TT else 0.3))
    else:
        r = max(vend + PB, v_a + max(DOPO_ANCORA, (ns - s_a) / vm))
last = starts[28] + PH[28][1] - PH[28][0]
W.append([EXIT_S, round(last + EXIT_DOPO, 3)]); W.append([END_S, round(last + EXIT_DOPO + TAIL, 3)])
for p, q in zip(W, W[1:]): assert q[0] > p[0] and q[1] > p[1], (p, q)
TOTAL = W[-1][1]
print('WARP (scaletta -> video, velocità dell\'animazione):')
for p, q in zip(W, W[1:]): print('  %6.2f -> %6.2f   x%.2f' % (p[0], p[1], (q[0] - p[0]) / (q[1] - p[1])))
# battute nel video (per l'app): dalla prima all'ultima frase di ogni battuta
BAT = [[round(starts[idx[0]], 2), round(starts[idx[-1]] + PH[idx[-1]][1] - PH[idx[-1]][0], 2)] for (_, _, idx, _) in BLK]
json.dump(BAT, open('battute' + SUF + '.json', 'w'))
# livellamento per frase (±3 dB)
h = int(sr * 0.01)
def loud(s, e, a):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; rr = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); rr = rr[rr > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((rr ** 2).mean()))
L = [loud(s, e, a) if k in USATE else 0.0 for k, (s, e) in enumerate(PH)]; med = np.median([l for k, l in enumerate(L) if k in USATE]); G = [float(np.clip(med - l, -3, 3)) for l in L]
out = np.zeros(int((TOTAL + 0.5) * sr)); newPH = []
PRE, POST = 0.08, 0.15
for k, (s, e) in enumerate(PH):
    if k not in USATE: newPH.append(None); continue
    seg = a[int((s - PRE) * sr):int((e + POST) * sr)].copy() * 10 ** (G[k] / 20)
    f1, f2 = int(0.02 * sr), int(0.08 * sr); seg[:f1] *= np.linspace(0, 1, f1); seg[-f2:] *= np.linspace(1, 0, f2)
    i0 = int((starts[k] - PRE) * sr); out[i0:i0 + len(seg)] += seg
    newPH.append([round(starts[k], 3), round(starts[k] + e - s, 3)])
out = out[:int(TOTAL * sr)]
sf.write('voice_edit' + SUF + '.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases' + SUF + '.json', 'w')); json.dump(W, open('warp7' + SUF + '.json', 'w'))
print('BATTUTE', BAT); print('TOTALE', round(TOTAL, 2))
# la voce è già la versione migliorata: stessa catena leggera delle puntate 5 e 6 (tono invariato)
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit' + SUF + '.wav', '-af', flt, '-ar', '48000', 'voice_fx' + SUF + '.wav'], check=True)
v, sr = sf.read('voice_fx' + SUF + '.wav'); PHR = [q for q in newPH if q]
band = sosfiltfilt(butter(2, [180, 3500], 'bandpass', fs=sr, output='sos'), v)
hop = sr // FPS; nf = int(TOTAL * FPS)
rms = np.array([np.sqrt((band[max(0, i * hop - hop):i * hop + hop] ** 2).mean()) for i in range(nf)])
env = np.zeros(nf); tq = np.arange(nf) / FPS
for s, e in PHR: env = np.maximum(env, np.minimum(np.clip((tq - s + 0.1) / 0.2, 0, 1), np.clip((e + 0.12 - tq) / 0.2, 0, 1)))
ref = np.maximum(uniform_filter1d(rms, 45, mode='nearest') * 1.9, np.percentile(rms[rms > 0], 60) * 0.6)
opn = np.clip(rms / ref, 0, 1) ** 0.8 * (env > 0.05)
opn = np.clip(opn / max(1e-9, np.percentile(opn[opn > 0], 97)), 0, 1)
f_, t_, X = stft(v, sr, nperseg=2048, noverlap=2048 - hop); P = np.abs(X[(f_ > 150) & (f_ < 4000)]) ** 2; fq = f_[(f_ > 150) & (f_ < 4000)]
cen = (P * fq[:, None]).sum(0) / (P.sum(0) + 1e-12); cen = np.interp(tq, t_, cen)
lo, hi = np.percentile(cen[env > 0.5], [15, 85])
nar = env * np.clip(0.35 + 0.65 * (hi - cen) / (hi - lo), 0, 1)
lip = {'open': [round(float(q), 3) for q in opn], 'narrow': [round(float(q), 3) for q in nar], 'env': [round(float(q), 3) for q in env]}
open('../video/lip7' + SUF + '.js', 'w').write('// labiale della puntata 7, generato da audio/voice_ep7.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf)
