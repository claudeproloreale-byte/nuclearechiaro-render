# Puntata 3 — voce definitiva. Base: la versione "Adobe Podcast Enhance" dell'autore (pulita, picco -5,5 dBFS, fondo -70 dB).
# Montaggio: silenzio iniziale portato a 0,3 s; pause tra le frasi accorciate a 0,9 s al massimo
# (1,2 s prima della battuta 5, dove la camera entra nella cupola). Poi livellamento per frase, equalizzazione,
# compressione leggera come nella puntata 2. Dopo "e il ciclo ricomincia" si aggiungono 2 s di silenzio.
# Produce: voice_fx.wav, phrases.json (tempi reali delle frasi), ../video/lip3.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('../sorgenti/Voce_3-mejorada-v2.wav', dtype='float64')   # registrazione dell'autore (Adobe Podcast Enhance)
if a.ndim > 1: a = a.mean(1)
FPS = 30
# frasi rilevate sull'originale: parlato sopra -50 dB, pause più corte di 0,2 s unite alla frase (-> phrases_raw.json)
h = int(sr * 0.01); n = len(a) // h
db_ = 20 * np.log10(np.sqrt((a[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
act = db_ > -50; segs = []; i = 0
while i < n:
    if act[i]:
        j = i
        while j < n and (act[j] or (j + 12 < n and act[j:j + 12].any())): j += 1
        if j - i > 12: segs.append([i * 0.01, j * 0.01])
        i = j
    else: i += 1
PH = [segs[0][:]]
for s_, e_ in segs[1:]:
    if s_ - PH[-1][1] < 0.2: PH[-1][1] = e_
    else: PH.append([s_, e_])
PH = [[round(s_, 2), round(e_, 2)] for s_, e_ in PH]
json.dump(PH, open('phrases_raw.json', 'w'))
CAP = {6: 1.2}                                       # pausa massima prima della frase k (default 0,9 s)
# 1) livellamento per frase (±3 dB)
h = int(sr * 0.01)
def loud(s, e):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; r = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); r = r[r > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((r ** 2).mean()))
L = [loud(s, e) for s, e in PH]; med = np.median(L); g = [float(np.clip(med - l, -3, 3)) for l in L]
tt = [0] + [x for (s, e) in PH for x in (s, e)] + [len(a) / sr]; gg = [g[0]] + [x for q in g for x in (q, q)] + [g[-1]]
a = a * 10 ** (np.interp(np.arange(len(a)) / sr, tt, gg) / 20)
# 2) montaggio delle pause: si taglia al centro di ogni pausa troppo lunga, con dissolvenze incrociate di 30 ms
pieces, newPH, cur, src = [], [], 0.3, 0.0
for k, (s, e) in enumerate(PH):
    gap_src = s - (PH[k - 1][1] if k else 0.0)
    want = 0.3 if k == 0 else min(gap_src, CAP.get(k, 0.9))
    if k == 0: a0 = max(0, s - 0.3)
    else:
        mid = (PH[k - 1][1] + s) / 2; cut = gap_src - want
        pieces.append((src, mid - cut / 2)); src = mid + cut / 2
    if k == 0: src = a0
    newPH.append([round(cur, 2), round(cur + e - s, 2)]); cur += (e - s) + (min(PH[k + 1][0] - e, CAP.get(k + 1, 0.9)) if k + 1 < len(PH) else 0)
pieces.append((src, PH[-1][1] + 0.35))
x = int(0.03 * sr); out = np.zeros(0)
for s0, e0 in pieces:
    seg = a[int(s0 * sr):int(e0 * sr)].copy()
    if len(out) >= x:
        w = np.linspace(0, 1, x); out[-x:] = out[-x:] * (1 - w) + seg[:x] * w; out = np.concatenate([out, seg[x:]])
    else: out = seg
fo = int(0.25 * sr); out[-fo:] *= np.linspace(1, 0, fo)
# tempi reali ricalcolati sul montaggio (le dissolvenze accorciano ogni giunta di 30 ms)
newPH, t, prev_e = [], 0.0, None
for k, (s, e) in enumerate(PH):
    if k == 0: t = s - pieces[0][0]
    else: t = prev_end_new + min(s - PH[k - 1][1], CAP.get(k, 0.9)) - 0.03
    newPH.append([round(t, 2), round(t + e - s, 2)]); prev_end_new = t + e - s
# pause aggiunte (silenzio): 2 s prima della battuta 13, perché l'anello del ciclo resti a schermo
INS = {24: 2.0}
for k, d in sorted(INS.items(), reverse=True):
    pos = (newPH[k - 1][1] + newPH[k][0]) / 2; i = int(pos * sr)
    out = np.concatenate([out[:i], np.zeros(int(d * sr)), out[i:]])
    for j in range(k, len(newPH)): newPH[j] = [round(newPH[j][0] + d, 2), round(newPH[j][1] + d, 2)]
TOTAL = round(newPH[-1][1] + 1.85, 2)
out = np.concatenate([out, np.zeros(max(0, int(TOTAL * sr) - len(out)))])[:int(TOTAL * sr)]
sf.write('voice_edit.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases.json', 'w')); print('FRASI', newPH); print('TOTALE', TOTAL)
# 3) equalizzazione, de-esser, compressione leggera (stessa catena della puntata 2)
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit.wav', '-af', flt, '-ar', '48000', 'voice_fx.wav'], check=True)
# 4) labiale dal volume reale (stesso metodo della puntata 2)
v, sr = sf.read('voice_fx.wav'); PHR = newPH
band = sosfiltfilt(butter(2, [180, 3500], 'bandpass', fs=sr, output='sos'), v)
hop = sr // FPS; nf = int(TOTAL * FPS)
rms = np.array([np.sqrt((band[max(0, i * hop - hop):i * hop + hop] ** 2).mean()) for i in range(nf)])
env = np.zeros(nf)
for s, e in PHR:
    for i in range(nf):
        tq = i / FPS; env[i] = max(env[i], min(np.clip((tq - s + 0.1) / 0.2, 0, 1), np.clip((e + 0.12 - tq) / 0.2, 0, 1)))
ref = np.maximum(uniform_filter1d(rms, 45, mode='nearest') * 1.9, np.percentile(rms[rms > 0], 60) * 0.6)
opn = np.clip(rms / ref, 0, 1) ** 0.8 * (env > 0.05)
opn = np.clip(opn / max(1e-9, np.percentile(opn[opn > 0], 97)), 0, 1)
f_, t_, X = stft(v, sr, nperseg=2048, noverlap=2048 - hop); P = np.abs(X[(f_ > 150) & (f_ < 4000)]) ** 2; fq = f_[(f_ > 150) & (f_ < 4000)]
cen = (P * fq[:, None]).sum(0) / (P.sum(0) + 1e-12); cen = np.interp(np.arange(nf) / FPS, t_, cen)
lo, hi = np.percentile(cen[env > 0.5], [15, 85])
nar = env * np.clip(0.35 + 0.65 * (hi - cen) / (hi - lo), 0, 1)
lip = {'open': [round(float(q), 3) for q in opn], 'narrow': [round(float(q), 3) for q in nar], 'env': [round(float(q), 3) for q in env]}
open('../video/lip3.js', 'w').write('// labiale della puntata 3, generato da audio/voice_ep3.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf, 'apertura media nel parlato %.2f' % opn[env > 0.5].mean())
