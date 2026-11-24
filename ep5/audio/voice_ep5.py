# Puntata 5 — voce definitiva (Voce_5-mejorada-v2.wav, versione Adobe Podcast, senza il "Ciao" iniziale:
# il video parte direttamente con lo zoom nella centrale, B2).
# Ogni battuta della scaletta (BLK) si appoggia sui tempi dell'animazione: dove la voce è più corta della battuta
# l'animazione va alla sua velocità e la pausa dopo si allunga; dove è più lunga l'animazione rallenta.
# Pause fra frasi della stessa battuta: come registrate, 0,7 s al massimo.
# Produce: voice_fx.wav, phrases.json (tempi reali), warp5.json (tabella WARP), ../video/lip5.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('voce_in.wav', dtype='float64')
FPS = 30
RAW = json.load(open('phrases_raw.json'))           # 23 frasi rilevate (detect5.py)
# frasi lunghe divise sulle pause interne: "le abbassi... | le alzi..." e "...elettromagneti | se dovesse mancare..."
PH = RAW[:19] + [[69.23, 71.31], [71.72, 73.12], [75.06, 77.91], [78.36, 83.17]] + RAW[21:]
BLK = [(1.3, 5.3, [0]), (5.8, 10.3, [1]), (13.6, 15.9, [2]), (16.05, 20.4, [3]), (20.9, 24.9, [4, 5]),
       (25.4, 29.4, [6]), (29.55, 33.0, [7]), (33.5, 36.0, [8, 9]), (36.5, 38.7, [10]), (38.85, 42.9, [11]),
       (43.4, 45.4, [12, 13]), (45.55, 47.9, [14, 15]), (48.4, 52.1, [16]), (52.25, 56.3, [17, 18]),
       (56.8, 58.3, [19]), (58.45, 60.6, [20]), (61.1, 63.9, [21]), (64.05, 69.1, [22]), (71.5, 73.9, [23, 24])]
T0, END_S, TAIL = 1.0, 76.9, 3.0                    # la scaletta parte da 1,0 (cupola chiusa, zoom che comincia)
MINP = {5: 1.0, 8: 1.0, 12: 1.1}                    # 5: un po' di pausa prima di "Per questo nel reattore..." (richiesta dell'autore)
MAXP = {3: 1.0}                                     # "Primo segreto:" e "i neutroni appena nati" non troppo distanti                            # pausa minima prima del blocco: dopo "che si spacca"; dopo "si spegne" (neutroni assorbiti)
starts = [None] * len(PH); W = [[T0, 0.0]]; r = (BLK[0][0] - T0) + 0.1
for bi, (ss, se, idx) in enumerate(BLK):
    t = r
    for j, k in enumerate(idx):
        if j: t += min(PH[k][0] - PH[idx[j - 1]][1], 0.7)
        starts[k] = round(t, 2); t += PH[k][1] - PH[k][0]
    vd = t - r; e_eff = ss + vd if vd <= se - ss else se
    W.append([ss, round(r, 2)])
    if ss == 33.5: W.append([34.7, round(starts[9] + 0.3, 2)])   # B7: il nucleo si spacca su "spacca"
    if ss != 33.5: W.append([round(e_eff, 2), round(t, 2)])   # in B7 i frammenti non accelerano dopo "spacca": si va dritti alla B8
    if bi + 1 == 2:   # dopo la B3 (pausa accorciata, richiesta dell'autore): zoom indietro 0,7 s, barre da lontano con la targhetta 1,0 s,
                      # poi zoom dentro la barra; "Primo segreto" comincia durante lo zoom (13,6 di scaletta)
        W.append([11.0, round(t + 0.7, 2)]); W.append([12.2, round(t + 1.7, 2)]); r = t + 1.7 + (13.6 - 12.2) * 0.75
    elif bi + 1 < len(BLK): r = t + min(MAXP.get(bi + 1, 99), max(MINP.get(bi + 1, 0.35), BLK[bi + 1][0] - e_eff))
W.append([END_S, round(t + TAIL, 2)])
for p, q in zip(W, W[1:]): assert q[0] > p[0] and q[1] > p[1], (p, q)
TOTAL = W[-1][1]
# livellamento per frase (±3 dB)
h = int(sr * 0.01)
def loud(s, e):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; rr = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); rr = rr[rr > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((rr ** 2).mean()))
L = [loud(s, e) for s, e in PH]; med = np.median(L); G = [float(np.clip(med - l, -3, 3)) for l in L]
out = np.zeros(int(TOTAL * sr)); newPH = []
PRE, POST = 0.08, 0.15
for k, (s, e) in enumerate(PH):
    seg = a[int((s - PRE) * sr):int((e + POST) * sr)].copy() * 10 ** (G[k] / 20)
    f1, f2 = int(0.02 * sr), int(0.08 * sr); seg[:f1] *= np.linspace(0, 1, f1); seg[-f2:] *= np.linspace(1, 0, f2)
    i0 = int((starts[k] - PRE) * sr); out[i0:i0 + len(seg)] += seg
    newPH.append([starts[k], round(starts[k] + e - s, 2)])
sf.write('voice_edit.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases.json', 'w')); json.dump(W, open('warp5.json', 'w'))
print('FRASI', newPH); print('WARP', json.dumps(W)); print('TOTALE', TOTAL)
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit.wav', '-af', flt, '-ar', '48000', 'voice_fx.wav'], check=True)
# labiale dal volume reale (stesso metodo delle puntate 2-4)
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
open('../video/lip5.js', 'w').write('// labiale della puntata 5, generato da audio/voice_ep5.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf)
