# Puntata 6 — voce definitiva (Voce_6-mejorada-v2.wav, versione Adobe Podcast, 96,1 s, 27 frasi rilevate da detect6.py).
# Stesso metodo della puntata 5: ogni battuta della scaletta si appoggia sulla voce. Dove la voce è più lunga della battuta
# l'animazione rallenta; dove è più corta l'animazione va alla sua velocità e la pausa dopo si allunga (al massimo MAXP).
# In più alcuni eventi sono agganciati a parole precise (ANC: tempo di scaletta -> istante nella registrazione).
# Pause fra frasi della stessa battuta: come registrate, 0,7 s al massimo; fra battute circa 1 s (PB).
# Produce: voice_fx.wav, phrases.json (tempi nel video), warp6.json (tabella WARP), ../video/lip6.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('voce_in.wav', dtype='float64')
FPS = 30
PH = json.load(open('phrases_raw.json'))
# testo (trascrizione di controllo):
#  0 Ma una centrale nucleare può esplodere come una bomba atomica? | 1 No. | 2 E non perché qualcuno la tiene a bada: | 3 lo impedisce la fisica.
#  4 In una bomba | 5 l'uranio 235 | 6 è quasi puro: | 7 più di 90 nuclei su 100.
#  8 Ogni neutrone, anche se velocissimo, | 9 trova subito un nucleo da spaccare, | 10 e in meno di un milionesimo di secondo si libera tutta l'energia.
#  11 Per una centrale nucleare | 12 è completamente diverso. | 13 Nella pastiglia di una centrale infatti, l'uranio 235 è solo da 3 a 5 nuclei su 100.
#  14 Tutti gli altri sono uranio 238, | 15 e molti neutroni finiscono lì, | 16 assorbiti.
#  17 Per andare avanti, la reazione ha bisogno dell'acqua, | 18 che rallenta i neutroni. | 19 E i neutroni più sono lenti, | 20 più probabilità hanno di interagire con l'uranio 235.
#  21 E se il nocciolo si scalda troppo, l'acqua si dilata e frena meno i neutroni: | 22 la reazione rallenta da sola.
#  23 Un incidente è molto improbabile ma può succedere, | 24 ma un'esplosione atomica è fisicamente impossibile. | 25 Hai qualche domanda? | 26 Fammela nei commenti!
# battute: (inizio, fine di scaletta, frasi, ancore [(t scaletta, frase, istante nella registrazione)])
BLK = [
  (0.5, 4.0, [0], []),
  (4.5, 8.0, [1, 2, 3], []),                                                   # "No." apre la battuta (sopracciglia decise)
  (8.5, 12.8, [4, 5, 6, 7], []),
  (13.3, 20.3, [8, 9, 10], [(16.0, 9, 27.6),                                   # il primo nucleo della bomba si spacca su "spaccare"
                            (19.95, 10, 31.55),                                # lampo bianco pieno su "energia"
                            (20.6, 10, 32.45),                                 # v10: sotto il bianco si passa al fungo nel deserto
                            (21.6, 10, 34.85)]),                               #   il fungo sale per 2,4 s, poi lampo chiaro e centrale
  (21.8, 23.8, [11, 12], []),                                                  # v10: la voce riparte 0,5 s dopo l'arrivo sulla centrale
  (24.3, 28.9, [13], []),
  (29.4, 33.3, [14, 15, 16], [(30.6, 15, 52.7)]),                              # A si spacca subito dopo "uranio 238"
  (33.8, 37.9, [17, 18, 19, 20], [(34.6, 17, 60.4),                            # il neutrone esce dalla barra (dopo "Per andare avanti,")
                                   (36.22, 18, 63.34),                         # ultimo rimbalzo a fine "che rallenta i neutroni"
                                   (37.4, 20, 69.85),                          # tratto lento e cattura su "e i neutroni più sono lenti, più probabilità...":
                                   (37.9, 20, 70.45)]),                        #   BB si spacca su "interagire"; frammenti a velocità normale
  (38.4, 43.9, [21, 22], [(39.1, 21, 74.6),                                    # termometro su "si scalda"
                          (39.9, 21, 75.96),                                   # l'acqua si dilata su "l'acqua si dilata"
                          (40.8, 21, 77.5),                                    # neutrone veloce su "e frena meno i neutroni"
                          (42.7, 22, 79.68)]),                                 # termometro scende su "la reazione rallenta da sola"
  (44.4, 50.4, [23, 24], []),
  (50.9, 53.3, [25, 26], [(51.9, 26, 94.54), (52.8, 26, 95.52)]),              # la mascotte indica i commenti su "fammela nei commenti"
]
INTRA = 0.7                       # pausa massima fra frasi della stessa battuta
INTRA_K = {1: 0.6, 18: 0.6}      # dopo "No."; fra "che rallenta i neutroni" ed "E i neutroni più sono lenti"
PB = 1.0                          # v10 (richiesta dell'autore): piccola pausa fra una battuta e l'altra, circa 1 s (prima 0,35-1,0)
DOPO_ANCORA = 0.5                 # se la battuta finisce su un evento agganciato, la voce dopo riparte almeno 0,5 s più tardi
EXIT_DOPO, TAIL = 1.0, 1.5        # la mascotte esce 1,0 s dopo l'ultima parola; poi 1,5 s di paesaggio pulito
EXIT_S, END_S = 53.9, 55.4

starts = [None] * len(PH); W = [[0.0, 0.0]]
vt = lambda k, raw: starts[k] + raw - PH[k][0]       # istante della registrazione -> tempo nel video
r = BLK[0][0]
for bi, (ss, se, idx, anc) in enumerate(BLK):
    t = r
    for j, k in enumerate(idx):
        if j: t += min(PH[k][0] - PH[idx[j - 1]][1], INTRA_K.get(idx[j - 1], INTRA))
        starts[k] = round(t, 3); t += PH[k][1] - PH[k][0]
    vend = t
    W.append([ss, round(r, 3)])
    for (sa, k, raw) in anc: W.append([sa, round(vt(k, raw), 3)])
    s_a, v_a = W[-1]
    if bi + 1 == len(BLK): break
    ns = BLK[bi + 1][0]
    if s_a < se:                                  # l'animazione finisce la battuta alla sua velocità, o rallenta sulla voce
        v_se = max(vend, v_a + (se - s_a)); W.append([se, round(v_se, 3)])
        r = max(vend + PB, v_se + 0.3)
    else:                                         # la battuta finisce su un evento agganciato (lampo, fungo, cattura)
        r = max(vend + PB, v_a + max(DOPO_ANCORA, ns - s_a))
last = starts[26] + PH[26][1] - PH[26][0]
W.append([EXIT_S, round(last + EXIT_DOPO, 3)]); W.append([END_S, round(last + EXIT_DOPO + TAIL, 3)])
for p, q in zip(W, W[1:]): assert q[0] > p[0] and q[1] > p[1], (p, q)
TOTAL = W[-1][1]
print('WARP (scaletta -> video, velocità dell\'animazione):')
for p, q in zip(W, W[1:]): print('  %6.2f -> %6.2f   x%.2f' % (p[0], p[1], (q[0] - p[0]) / (q[1] - p[1])))
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
out = out[:int(TOTAL * sr)]
sf.write('voice_edit.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases.json', 'w')); json.dump(W, open('warp6.json', 'w'))
print('FRASI', newPH); print('TOTALE', round(TOTAL, 2))
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit.wav', '-af', flt, '-ar', '48000', 'voice_fx.wav'], check=True)
# labiale dal volume reale (stesso metodo delle puntate 2-5)
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
open('../video/lip6.js', 'w').write('// labiale della puntata 6, generato da audio/voice_ep6.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf)
