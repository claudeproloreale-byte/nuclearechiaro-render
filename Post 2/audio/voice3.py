# Puntata 2 — voce definitiva. Base: la versione "Adobe Podcast Enhance" dell'autore (già pulita, senza
# clipping e senza salto di rumore nella giunta tra le due riprese). Qui solo ritocchi leggeri:
# pausa di 0,5 s prima della battuta 5, livellamento per frase, equalizzazione, compressione leggera.
# Produce: voice3_fx.wav, phrases3.json (tempi reali delle frasi), ../video/lip2.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
SRC = "../sorgenti/Voce_video_2-mejorada-v2.wav"   # versione Adobe Podcast Enhance della registrazione
a, sr = sf.read(SRC, dtype='float64')
if a.ndim > 1: a = a.mean(1)
TOTAL = 58.4; FPS = 30

# 1) frasi
h = int(sr * 0.01); n = len(a) // h
db = 20 * np.log10(np.sqrt((a[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
act = db > -50; segs = []; i = 0
while i < n:
    if act[i]:
        j = i
        while j < n and (act[j] or (j + 12 < n and act[j:j + 12].any())): j += 1
        if j - i > 12: segs.append([i * 0.01, j * 0.01])
        i = j
    else: i += 1
ph = [segs[0][:]]
for s, e in segs[1:]:
    if s - ph[-1][1] < 0.2: ph[-1][1] = e
    else: ph.append([s, e])

# 2) livellamento per frase (±3 dB), rampe nelle pause
def loud(s, e):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; r = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); r = r[r > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((r ** 2).mean()))
L = [loud(s, e) for s, e in ph]; med = np.median(L)
g = [float(np.clip(med - l, -3, 3)) for l in L]
for (s, e), l, q in zip(ph, L, g): print('%.2f-%.2f  %.1f dB  guadagno %+.1f' % (s, e, l, q))
tt = [0] + [x for (s, e) in ph for x in (s, e)] + [len(a) / sr]
gg = [g[0]] + [x for q in g for x in (q, q)] + [g[-1]]
a *= 10 ** (np.interp(np.arange(len(a)) / sr, tt, gg) / 20)

# 3) pausa di 0,5 s prima della battuta 5 (punto già silenzioso: giunta con dissolvenza incrociata)
PAUSE_AT, PAUSE = 20.62, 0.5
c, k, x = int(PAUSE_AT * sr), int(PAUSE * sr), int(0.02 * sr)
w = np.linspace(0, 1, x); head = a[:c].copy(); head[-x:] *= 1 - w; tail = a[c:].copy(); tail[:x] *= w
a = np.concatenate([head, np.zeros(k), tail])
tsh = lambda t_: t_ + (PAUSE if t_ >= PAUSE_AT else 0)
PHR = [[round(tsh(s), 2), round(tsh(e), 2)] for s, e in ph]
end = int((PHR[-1][1] + 0.35) * sr); a = a[:end]; fo = int(0.25 * sr); a[-fo:] *= np.linspace(1, 0, fo)
a = np.concatenate([a, np.zeros(int(TOTAL * sr) - len(a))])
sf.write('voice3_edit.wav', a, sr, subtype='PCM_24')
json.dump(PHR, open('phrases3.json', 'w')); print('FRASI', PHR)

# 4) equalizzazione (la versione Adobe è un po' scura: più presenza e aria), de-esser, compressione leggera
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice3_edit.wav', '-af', flt, '-ar', '48000', 'voice3_fx.wav'], check=True)

# 5) labiale: apertura della bocca dal volume reale, a 30 fps (stesso formato di lip.json)
v, _ = sf.read('voice3_fx.wav')
band = sosfiltfilt(butter(2, [180, 3500], 'bandpass', fs=sr, output='sos'), v)
hop = sr // FPS; nf = int(TOTAL * FPS)
rms = np.array([np.sqrt((band[max(0, i * hop - hop):i * hop + hop] ** 2).mean()) for i in range(nf)])
env = np.zeros(nf)
for s, e in PHR:
    for i in range(nf):
        t = i / FPS; env[i] = max(env[i], min(np.clip((t - s + 0.1) / 0.2, 0, 1), np.clip((e + 0.12 - t) / 0.2, 0, 1)))
ref = np.maximum(uniform_filter1d(np.maximum.accumulate(rms) * 0 + rms, 45, mode='nearest') * 1.9, np.percentile(rms[rms > 0], 60) * 0.6)
opn = np.clip(rms / ref, 0, 1) ** 0.8 * (env > 0.05)
opn = np.clip(opn / max(1e-9, np.percentile(opn[opn > 0], 97)), 0, 1)
# bocca stretta sulle vocali scure (baricentro spettrale basso)
f_, t_, X = stft(v, sr, nperseg=2048, noverlap=2048 - hop); P = np.abs(X[(f_ > 150) & (f_ < 4000)]) ** 2; fq = f_[(f_ > 150) & (f_ < 4000)]
cen = (P * fq[:, None]).sum(0) / (P.sum(0) + 1e-12); cen = np.interp(np.arange(nf) / FPS, t_, cen)
lo, hi = np.percentile(cen[env > 0.5], [15, 85])
nar = env * np.clip(0.35 + 0.65 * (hi - cen) / (hi - lo), 0, 1)
lip = {'open': [round(float(x), 3) for x in opn], 'narrow': [round(float(x), 3) for x in nar], 'env': [round(float(x), 3) for x in env]}
open('../video/lip2.js', 'w').write('// labiale della puntata 2, generato da audio/voice3.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf, 'apertura media nel parlato %.2f' % opn[env > 0.5].mean())
