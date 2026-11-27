# Puntata 7 — voce definitiva (p7-voce-enhanced-v2.mp3 caricato nell'app il 27/11/2026, versione migliorata, 124,4 s, 31 frasi
# rilevate a -50 dB come in detect6.py -> phrases_raw.json). Stesso metodo delle puntate 5 e 6 (Post 6/audio/voice_ep6.py):
# ogni battuta della scaletta si appoggia sulla voce; dove la voce è più lunga l'animazione rallenta, dove è più corta
# l'animazione va alla sua velocità e la pausa dopo si allunga. Alcuni eventi sono agganciati a parole (ANC: tempo di scaletta,
# frase, istante nella registrazione; istanti dalle pause fra le parole e dalla trascrizione di controllo con Whisper small).
# Pause fra frasi della stessa battuta: come registrate, 0,7 s al massimo; fra battute circa 1 s (PB).
# Produce: voice_fx.wav, phrases.json (tempi nel video), warp7.json (tabella WARP), ../video/lip7.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('voce_in.wav', dtype='float64')
if a.ndim > 1: a = a.mean(1)
FPS = 30
PH = json.load(open('phrases_raw.json'))
PH[24][0] = 95.62    # «E vivere accanto…»: il respiro prima (da 95,0) resta fuori
# testo (trascrizione di controllo, Whisper small):
#  0 La radioattività ti fa paura? | 1 Ma la radioattività non l'abbiamo inventata noi esseri umani: | 2 esiste da sempre, ed è ovunque.
#  3 Viene dalle rocce, dal cibo e | 4 perfino dallo spazio. | 5 Anche il tuo corpo è un po' radioattivo: dentro di te, ogni secondo, circa 4000 atomi decadono.
#  6 Ma cosa vuol dire, radioattivo? | 7 Alcuni nuclei hanno troppi neutroni o troppi protoni: | 8 sono instabili.
#  9 Prima o poi si sistemano da soli, | 10 lanciando fuori un pezzetto di nucleo o un'onda elettromagnetica. | 11 Quel lancio è la radiazione e questo processo si chiama decadimento.
#  12 Così il nucleo si trasforma in un altro atomo. | 13 Questo può essere a sua volta ancora instabile, | 14 e quindi radioattivo, oppure stabile.   (senza «più stabile»)
#  15 Ogni tipo di nucleo ha il suo ritmo: | 16 in un certo tempo se ne trasforma la metà. | 17 Per alcuni bastano secondi, | 18 per altri servono miliardi di anni.
#  19 Quindi la domanda giusta non è se c'è radioattività, | 20 ma quanta ne riceviamo. | 21 In un anno, dalla natura, ognuno di noi ne riceve circa 2 o 3 millisievert, | 22 l'unità di misura delle radiazioni.
#  23 Un volo da Roma a New York equivale a circa una settimana di questa radioattività naturale.
#  24 E vivere accanto a una centrale nucleare? Molto meno di un volo, all'anno.
#  25 Dentro il reattore, però, i frammenti della fissione sono molto radioattivi: per questo restano chiusi nelle pastiglie, nelle barre, nel vessel e nella cupola.
#  26 E dove finiscono dopo? | 27 E perché ci possono fare male? | 28 Ne parleremo nella puntata dedicata alle scorie.   («dedicata alle», non «sulle»)
#  29 Hai qualche domanda? | 30 Fammela nei commenti!
# battute: (inizio, fine di scaletta (ep7/video/tempi.js, B), frasi, ancore [(t scaletta, frase, istante nella registrazione)])
BLK = [
  (0.5, 4.0, [0], [(1.9, 0, 1.55)]),                                          # il simbolo lampeggia di verde su «ti fa paura?»
  (4.5, 10.0, [1, 2], []),
  (10.5, 15.0, [3, 4], [(11.1, 3, 12.62),                                     # si illuminano le rocce su «rocce»
                        (12.1, 3, 13.45),                                     #   le banane su «cibo»
                        (13.3, 4, 15.07)]),                                   #   arrivano i raggi cosmici su «spazio»
  (15.5, 21.5, [5], [(18.4, 5, 20.28)]),                                      # l'omino si è girato e si accendono i puntini su «dentro»
  (22.0, 24.5, [6], []),
  (25.0, 30.5, [7, 8], []),
  (31.0, 38.0, [9, 10, 11], [(33.6, 10, 40.99),                               # alfa su «pezzetto di nucleo»
                             (35.7, 10, 42.45)]),                             # gamma su «un'onda elettromagnetica» (beta in mezzo)
  (38.5, 46.5, [12, 13, 14], []),
  (47.0, 54.5, [15, 16, 17, 18], []),
  (55.0, 59.5, [19, 20], []),
  (60.0, 65.0, [21, 22], []),
  (65.5, 70.5, [23], [(67.15, 23, 91.14)]),                                   # il peso del volo cade su «una settimana»
  (71.0, 77.0, [24], [(74.0, 24, 97.96)]),                                    # il granello della centrale su «Molto meno di un volo»
  (77.5, 86.0, [25], [(84.2, 25, 107.74),                                     # barriere: «pastiglie»
                      (84.9, 25, 108.85),                                     #   «barre»
                      (85.5, 25, 109.6),                                      #   «vessel»
                      (86.0, 25, 110.6)]),                                    #   «cupola»
  (86.5, 89.5, [26, 27, 28], []),
  (90.0, 92.4, [29, 30], [(90.9, 30, 123.29), (91.8, 30, 124.1)]),            # la mascotte indica i commenti su «fammela nei commenti»
]
INTRA = 0.7          # pausa massima fra frasi della stessa battuta
PB = 1.0             # pausa fra una battuta e l'altra, circa 1 s (richiesta dell'autore del 26/11/2026)
DOPO_ANCORA = 0.5
EXIT_DOPO, TAIL = 1.0, 1.5
EXIT_S, END_S = 92.9, 94.4

starts = [None] * len(PH); W = [[0.0, 0.0]]
vt = lambda k, raw: starts[k] + raw - PH[k][0]
r = BLK[0][0]
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
    ns = BLK[bi + 1][0]
    if s_a < se:
        v_se = max(vend, v_a + (se - s_a)); W.append([se, round(v_se, 3)])
        r = max(vend + PB, v_se + 0.3)
    else:
        r = max(vend + PB, v_a + max(DOPO_ANCORA, ns - s_a))
last = starts[30] + PH[30][1] - PH[30][0]
W.append([EXIT_S, round(last + EXIT_DOPO, 3)]); W.append([END_S, round(last + EXIT_DOPO + TAIL, 3)])
for p, q in zip(W, W[1:]): assert q[0] > p[0] and q[1] > p[1], (p, q)
TOTAL = W[-1][1]
print('WARP (scaletta -> video, velocità dell\'animazione):')
for p, q in zip(W, W[1:]): print('  %6.2f -> %6.2f   x%.2f' % (p[0], p[1], (q[0] - p[0]) / (q[1] - p[1])))
# battute nel video (per l'app): dalla prima all'ultima frase di ogni battuta
BAT = [[round(starts[idx[0]], 2), round(starts[idx[-1]] + PH[idx[-1]][1] - PH[idx[-1]][0], 2)] for (_, _, idx, _) in BLK]
json.dump(BAT, open('battute.json', 'w'))
# livellamento per frase (±3 dB)
h = int(sr * 0.01)
def loud(s, e):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; rr = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); rr = rr[rr > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((rr ** 2).mean()))
L = [loud(s, e) for s, e in PH]; med = np.median(L); G = [float(np.clip(med - l, -3, 3)) for l in L]
out = np.zeros(int((TOTAL + 0.5) * sr)); newPH = []
PRE, POST = 0.08, 0.15
for k, (s, e) in enumerate(PH):
    seg = a[int((s - PRE) * sr):int((e + POST) * sr)].copy() * 10 ** (G[k] / 20)
    f1, f2 = int(0.02 * sr), int(0.08 * sr); seg[:f1] *= np.linspace(0, 1, f1); seg[-f2:] *= np.linspace(1, 0, f2)
    i0 = int((starts[k] - PRE) * sr); out[i0:i0 + len(seg)] += seg
    newPH.append([round(starts[k], 3), round(starts[k] + e - s, 3)])
# v11 (nota audio dell'autore: «silenzio improvviso dopo "paura"»): la versione migliorata chiude di colpo la fine delle frasi
# (da -33 a -80 dB in 0,1 s). Una coda d'ambiente leggera (stanza piccola, 0,7 s, -20 dB) fa spegnere le parole in modo naturale.
from scipy.signal import fftconvolve
rg = np.random.default_rng(7); ti = np.arange(int(0.7 * sr)) / sr
ir = rg.standard_normal(len(ti)) * np.exp(-ti * 7.5); ir = sosfiltfilt(butter(2, [250, 5000], 'bandpass', fs=sr, output='sos'), ir); ir /= np.sqrt((ir ** 2).sum())
out = out + 10 ** (-20 / 20) * fftconvolve(out, ir)[:len(out)]
out = out[:int(TOTAL * sr)]
sf.write('voice_edit.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases.json', 'w')); json.dump(W, open('warp7.json', 'w'))
print('BATTUTE', BAT); print('TOTALE', round(TOTAL, 2))
# la voce è già la versione migliorata: stessa catena leggera delle puntate 5 e 6 (tono invariato)
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit.wav', '-af', flt, '-ar', '48000', 'voice_fx.wav'], check=True)
v, sr = sf.read('voice_fx.wav'); PHR = newPH
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
open('../video/lip7.js', 'w').write('// labiale della puntata 7, generato da audio/voice_ep7.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf)
