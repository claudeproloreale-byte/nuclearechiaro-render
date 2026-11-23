# Puntata 4 — voce definitiva. Base: la versione "Adobe Podcast Enhance" dell'autore (Voce_4-mejorada-v2.wav:
# picco -5,4 dBFS, fondo -75 dB). "Ciao" originale (le versioni rese più vivaci con ciao4.py sono state scartate).
# Montaggio: ogni pausa tra le frasi viene portata alla durata voluta (GAP): accorciata tagliando al centro
# con una dissolvenza di 30 ms, oppure allungata con silenzio, dove l'animazione ha bisogno di tempo.
# Poi livellamento per frase, equalizzazione, compressione leggera (stessa catena della puntata 3).
# Produce: voice_fx.wav, phrases.json (tempi reali delle 23 frasi), ../video/lip4.js (labiale a 30 fps).
import soundfile as sf, numpy as np, subprocess, json, sys
from scipy.signal import butter, sosfiltfilt, stft
from scipy.ndimage import uniform_filter1d
a, sr = sf.read('../sorgenti/Voce_4-mejorada-v2.wav', dtype='float64')
if a.ndim > 1: a = a.mean(1)
FPS = 30
PH = json.load(open('phrases_raw.json'))           # frasi rilevate sull'originale (soglia -50 dB, pause interne < 0,35 s unite)
CIAO = sys.argv[1] if len(sys.argv) > 1 else None   # 'ciao_B.wav' per la versione più alta (scartata dall'autore: innaturale)
if CIAO:
    c, _ = sf.read(CIAO); i0, i1 = int(0.28 * sr), int(1.02 * sr)
    a[i0:i1] = 0; a[i0:i0 + len(c)] = c[:i1 - i0]
    PH[0] = [0.36, round(0.28 + len(c) / sr - 0.12, 2)]
# pausa voluta prima della frase k (secondi). Le altre restano come registrate, con 0,9 s al massimo.
GAP = {2: 1.18,    # zoom dalla barretta agli atomi
       8: 2.3,     # "...quando un neutrone lo colpisce": la mascotte vola, urta A (silenzio ed effetto) e ricompare nell'angolo
       15: 2.1,    # zoom dalla reazione a catena sulla fissione F
       18: 7.9}    # zoom indietro fino alle barrette che si scaldano e ritorno in un'altra pastiglia
LEAD, TAIL = 0.3, 3.05                              # silenzio iniziale; dopo l'ultima frase (saluto e paesaggio)
# 1) livellamento per frase (±3 dB)
h = int(sr * 0.01)
def loud(s, e):
    x = a[int(s * sr):int(e * sr)]; m = len(x) // h; r = np.sqrt((x[:m * h].reshape(m, h) ** 2).mean(1)); r = r[r > 10 ** (-45 / 20)]
    return 20 * np.log10(np.sqrt((r ** 2).mean()))
L = [loud(s, e) for s, e in PH]; med = np.median(L); g = [float(np.clip(med - l, -3, 3)) for l in L]
tt = [0] + [x for (s, e) in PH for x in (s, e)] + [len(a) / sr]; gg = [g[0]] + [x for q in g for x in (q, q)] + [g[-1]]
a = a * 10 ** (np.interp(np.arange(len(a)) / sr, tt, gg) / 20)
# 2) montaggio: frase per frase, con la pausa voluta prima di ognuna
x = int(0.03 * sr); out = np.zeros(int(LEAD * sr)); newPH = []
def seg(s, e): return a[int(max(0, s) * sr):int(e * sr)].copy()
for k, (s, e) in enumerate(PH):
    if k:
        g0 = s - PH[k - 1][1]; want = GAP.get(k, min(g0, 0.9))
        if want >= g0: out = np.concatenate([out, seg(PH[k - 1][1], (PH[k - 1][1] + s) / 2), np.zeros(int((want - g0) * sr)), seg((PH[k - 1][1] + s) / 2, s)])
        else:   # taglio al centro della pausa, dissolvenza incrociata di 30 ms
            mid = (PH[k - 1][1] + s) / 2; cut = g0 - want
            A1 = seg(PH[k - 1][1], mid - cut / 2); A2 = seg(mid + cut / 2 - 0.03, s)
            w = np.linspace(0, 1, x); A1[-x:] = A1[-x:] * (1 - w) + A2[:x] * w
            out = np.concatenate([out, A1, A2[x:]])
    if k == 0: out = np.concatenate([out[:-int(0.08 * sr)], seg(s - 0.08, s)])
    t0 = len(out) / sr; out = np.concatenate([out, seg(s, e)]); newPH.append([round(t0, 2), round(len(out) / sr, 2)])
out = np.concatenate([out, seg(PH[-1][1], PH[-1][1] + 0.35)])
fo = int(0.25 * sr); out[-fo:] *= np.linspace(1, 0, fo)
TOTAL = round(newPH[-1][1] + TAIL, 2)
out = np.concatenate([out, np.zeros(max(0, int(TOTAL * sr) - len(out)))])[:int(TOTAL * sr)]
sf.write('voice_edit.wav', out, sr, subtype='PCM_24')
json.dump(newPH, open('phrases.json', 'w')); print('FRASI', newPH); print('TOTALE', TOTAL)
# 3) equalizzazione, de-esser, compressione leggera (stessa catena della puntata 3)
flt = ("highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-2.5,equalizer=f=3800:t=q:w=0.9:g=3,highshelf=f=9000:g=2.5,"
       "deesser=i=0.2,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5,alimiter=limit=0.8:level=false")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_edit.wav', '-af', flt, '-ar', '48000', 'voice_fx.wav'], check=True)
# 4) labiale dal volume reale (stesso metodo delle puntate 2 e 3)
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
open('../video/lip4.js', 'w').write('// labiale della puntata 4, generato da audio/voice_ep4.py\nexport default ' + json.dumps(lip) + ';\n')
print('lip: fotogrammi', nf, 'apertura media nel parlato %.2f' % opn[env > 0.5].mean())
