# Puntata 5 — musica ed effetti sonori sintetizzati. Stessi strumenti delle puntate precedenti (100 bpm, do maggiore, kalimba),
# struttura sulle scene della puntata. Gli effetti usano i tempi "di scaletta" di ep5.js convertiti con warp5.json;
# fissioni, catture e urti sulle molecole d'acqua vengono da events5.json (stampati da ep5.js all'avvio: video/print_events.js).
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

WARP = json.load(open('warp5.json')); EV = json.load(open('events5.json'))
SR = 48000; TOTAL = WARP[-1][1]; N = int(SR * TOTAL)
rng = np.random.default_rng(14)
BEAT = 0.6; BAR = 2.4
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def w(tau):  # tempo di scaletta -> tempo reale
    for (o0, n0), (o1, n1) in zip(WARP, WARP[1:]):
        if tau <= o1: return n0 + (n1 - n0) * (tau - o0) / (o1 - o0)
    return WARP[-1][1]
def put(bus, t0, x, amp=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    x = x[:N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(x), 0] += x * amp * l * 1.414; bus[i:i + len(x), 1] += x * amp * r * 1.414
def tt(dur): return np.arange(int(dur * SR)) / SR
def fade(x, a=0.004, r=0.02):
    na, nr = int(a * SR), int(r * SR); x = x.copy()
    x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x
def kal(m, dur=1.4, bright=1.0):
    f = midi(m); t = tt(dur)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 4.2) + 0.28 * bright * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 13) \
        + 0.10 * bright * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t * 30)
    return fade(x, 0.002, 0.05)
def pad(ms, dur, att=0.5, rel=0.6, trem=0.0):
    t = tt(dur + rel); x = np.zeros_like(t)
    for m in ms:
        f = midi(m)
        for d in (-0.35, 0.35):
            ff = f * 2 ** (d / 100 * 1.6)
            x += np.sin(2 * np.pi * ff * t + rng.uniform(0, 6)) + 0.22 * np.sin(2 * np.pi * 2 * ff * t) + 0.08 * np.sin(2 * np.pi * 3 * ff * t)
    env = np.minimum(1, t / att) * np.where(t > dur, np.exp(-(t - dur) / (rel / 3)), 1)
    if trem: env *= 1 - trem * (0.5 + 0.5 * np.sin(2 * np.pi * 4.2 * t))
    return x * env / (2 * len(ms))
def bass(m, dur=0.5):
    f = midi(m); t = tt(dur)
    return fade((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 3.5), 0.006, 0.05)
def kick(amp=1.0):
    t = tt(0.28); ph = 2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 28)) / SR
    return np.sin(ph) * np.exp(-t * 13) * amp
def noise(dur): return rng.standard_normal(int(dur * SR))
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=SR, output='sos'), x)
def shaker(amp=1.0):
    t = tt(0.09); return hp(noise(0.09), 6000) * np.exp(-t * 55) * amp
def snap(amp=1.0):
    t = tt(0.12); return bp(noise(0.12), 1200, 3800) * np.exp(-t * 42) * amp
def chime(f, dur=1.3):
    t = tt(dur)
    return fade((np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 6)) * np.exp(-t * 4.5), 0.002, 0.05)
def pop(f0, f1, dur=0.11):
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur)
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22), 0.002, 0.02)
def whoosh(dur, f0, f1, q=2.2, shape='hill'):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); lo = bd = 0.0
    fc = f0 * (f1 / f0) ** (np.arange(n) / n); k = 2 * np.sin(np.pi * fc / SR)
    for i in range(n):
        lo += k[i] * bd; hi_ = x[i] - lo - bd / q; bd += k[i] * hi_; y[i] = bd
    u = np.arange(n) / n
    env = np.sin(np.pi * u) ** 1.5 if shape == 'hill' else u ** 2.2 * np.minimum(1, (1 - u) * 30)
    return y * env / (np.abs(y).max() + 1e-9)
def sweep(t0, dur, f0, f1, amp, pan=0.0, shape=1.5):   # tono che sale o scende (termometro, ronzio)
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur)
    put(sfx, t0, fade((np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * t / dur) ** shape, 0.02, 0.05), amp, pan)
def boom(t0, amp=1.0, pan=0.0, big=True):   # fissione: colpo basso, soffio e campanelli
    put(sfx, t0, lp(noise(0.6 if big else 0.35), 160 if big else 260) * np.exp(-tt(0.6 if big else 0.35) * (7 if big else 12)), 0.5 * amp, pan)
    put(sfx, t0, hp(noise(1.2), 3000) * np.exp(-tt(1.2) * (4 if big else 7)), 0.06 * amp, pan)
    for i, m in enumerate([84, 91, 96] if big else [88, 95]): put(sfx, t0 + i * 0.04, chime(midi(m), 1.2), 0.05 * amp, pan=pan - 0.3 + i * 0.3)

CH = {'C': (36, [60, 64, 67]), 'G': (43, [59, 62, 67]), 'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]), 'Dm': (38, [57, 62, 65]), 'Em': (40, [59, 64, 67]), 'Fhi': (41, [60, 65, 69]), 'Ghi': (43, [62, 67, 71])}
def arp(t0, ch, amp, n8=8, up=False, cres=None):
    b, ts = CH[ch]; seq = [ts[0], ts[2], ts[1] + 12, ts[2], ts[0] + 12, ts[2], ts[1] + 12, ts[2]]
    if up: seq = [ts[0], ts[1], ts[2], ts[0] + 12, ts[1] + 12, ts[2] + 12, ts[0] + 24, ts[2] + 12]
    for i in range(n8):
        a = amp * (cres[0] + (cres[1] - cres[0]) * i / n8 if cres else 1) * (1.0 if i % 2 == 0 else 0.75)
        put(mus, t0 + i * BEAT / 2, kal(seq[i % 8]), a, pan=0.35 if i % 2 else -0.35)
MEL = {'C': [76, 79, 84, 79], 'G': [74, 79, 83, 79], 'Am': [72, 76, 81, 76], 'F': [72, 77, 81, 84]}
def groove(t0, ch, nb=4, mel=True, drums=1.0):
    b, ts = CH[ch]
    put(mus, t0, pad(ts + [ts[0] + 12], nb * BEAT, 0.15, 0.4), 0.17)
    arp(t0, ch, 0.36, n8=nb * 2)
    for bt, m in [(0, b), (1.5, b), (2, b + 7), (3, b), (3.5, b + 7)]:
        if bt < nb: put(mus, t0 + bt * BEAT, bass(m + (12 if b < 40 else 0), 0.45), 0.42)
    for bt in range(nb):
        if bt % 2 == 0: put(mus, t0 + bt * BEAT, kick(), 0.34 * drums)
        else: put(mus, t0 + bt * BEAT, snap(), 0.11 * drums, pan=0.1)
    for i in range(nb * 2): put(mus, t0 + i * 0.3, shaker(), (0.075 if i % 2 else 0.04) * drums, pan=-0.3)
    if mel and ch in MEL:
        for i, bt in enumerate([0, 1, 1.5, 2.5][:4 if nb == 4 else 2]): put(mus, t0 + bt * BEAT, kal(MEL[ch][i], 1.6, 1.2), 0.30, pan=0.15)
def calm(t0, ch, amp=0.3):   # battuta tranquilla: pad, arpeggio e basso, senza batteria
    b, ts = CH[ch]; put(mus, t0, pad(ts, BAR, 0.5, 0.6), 0.17); arp(t0, ch, amp); put(mus, t0, bass(b + 12, 1.0), 0.28)
def still(t0, ch, amp=0.2):  # battuta sospesa: pad scuro e tre note lente (nucleo, fissione, plutonio)
    b, ts = CH[ch]
    put(mus, t0, lp(pad(ts + [b + 12], BAR, 0.7, 0.8), 1800), 0.26); put(mus, t0, bass(b + 12, 1.6), 0.24)
    for i, m in enumerate([0, 2, 1]): put(mus, t0 + 0.3 + i * 0.75, kal(ts[m] + 12, 1.8, 0.6), amp, pan=-0.3 + i * 0.3)
def rise(t0, ch, amp=0.32, c=(0.6, 1.1)):  # battuta che sale (zoom, attesa)
    b, ts = CH[ch]; put(mus, t0, pad(ts + [b + 12], BAR, 0.4, 0.5), 0.22); arp(t0, ch, amp, up=True, cres=c); put(mus, t0, bass(b + (12 if b < 40 else 0), 2.0), 0.26)


B = lambda k: k * BAR
# ---------------- zoom nella centrale e reazione a catena nella pastiglia (0 – 9.6)
calm(B(0), 'C', 0.26); calm(B(1), 'Am', 0.32)
for i in range(8): put(mus, B(1) + i * 0.3, shaker(), 0.05 if i % 2 else 0.03)
groove(B(2), 'F', mel=False, drums=0.6); groove(B(3), 'G', mel=True, drums=0.75)
# ---------------- "chi la tiene sotto controllo?": zoom indietro fino alle barre (9.6 – 14.4)
rise(B(4), 'Am', 0.3, (0.6, 0.9)); rise(B(5), 'G', 0.32, (0.8, 1.2))
# ---------------- primo segreto: neutroni velocissimi (14.4 – 26.4)
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C']): groove(B(6 + k), ch, mel=k % 2 == 1, drums=0.6)
# ---------------- l'acqua rallenta il neutrone (26.4 – 33.6): raccolta, senza batteria
for k, ch in enumerate(['Am', 'F', 'Dm']): still(B(11 + k), ch)
# ---------------- il neutrone lento arriva e il nucleo si spacca (33.6 – 38.4)
rise(B(14), 'F', 0.28, (0.5, 0.8)); rise(B(15), 'G', 0.3, (0.8, 1.1))
# ---------------- secondo segreto: catena in equilibrio (38.4 – 48.0)
for k, ch in enumerate(['C', 'G', 'Am', 'F']): groove(B(16 + k), ch, mel=k % 2 == 0, drums=0.6)
# ---------------- di più (sale) / di meno (si spegne) (48.0 – 52.8)
groove(B(20), 'G', mel=True, drums=0.95); still(B(21), 'Am', 0.18)
# ---------------- barre di controllo (52.8 – 67.2)
calm(B(22), 'F', 0.3)
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C']): groove(B(23 + k), ch, mel=k % 2 == 0, drums=0.5)
# ---------------- elettromagneti e caduta delle barre (67.2 – 76.8)
groove(B(28), 'G', mel=False, drums=0.5); calm(B(29), 'Am', 0.28); still(B(30), 'Dm'); rise(B(31), 'G', 0.3, (0.7, 1.0))
# ---------------- chiusura sulla centrale in funzione (76.8 – fine)
groove(B(32), 'C'); groove(B(33), 'F', nb=3)
TF = w(75.2)                                   # la mascotte esce: accordo finale
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.36)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.28, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.45); put(mus, TF, kick(), 0.36)

# ---------------- effetti sonori (tempi di scaletta -> reali)
flash = lambda tg, a=0.05: (put(sfx, w(tg) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), a), put(sfx, w(tg), chime(midi(91), 0.7), 0.6 * a))
put(sfx, w(1.15), pop(320, 950), 0.2, pan=0.6)                                                          # la mascotte compare nell'angolo
put(sfx, w(1.0), whoosh(w(3.35) - w(1.0), 300, 1100), 0.09)                                             # la cupola si apre, la camera entra nel nocciolo
for tg, a in ((3.35, 0.05), (4.75, 0.05), (11.0, 0.03), (49.3, 0.04), (70.3, 0.05)): flash(tg, a)        # lampi di passaggio
put(sfx, w(3.4), whoosh(w(4.75) - w(3.4), 700, 2600), 0.07)                                              # dentro la pastiglia
put(sfx, w(4.9), whoosh(w(6.6) - w(4.9), 700, 2800, shape='rise'), 0.05, pan=-0.2)                      # il neutrone lento arriva dal basso
BIG = {6.6, 17.4, 34.7}
for j, tc in enumerate(EV['fiss']):                                                                      # fissioni
    big = any(abs(tc - b) < 0.01 for b in BIG)
    a = 1.2 if big else (0.45 * 0.9 ** min(j, 12) + 0.15 if tc < 12 else 0.55)
    boom(w(tc), a, pan=float(np.clip(np.sin(j * 2.1) * 0.6, -0.6, 0.6)), big=big)
for j, ta in enumerate(EV['abs']):                                                                       # neutroni assorbiti
    put(sfx, w(ta), lp(pop(320, 200, 0.12), 1400), 0.05 if ta < 12 else 0.08, pan=float(np.sin(j * 1.3) * 0.5))
for j, tm in enumerate(EV['mol']):                                                                       # urti sulle molecole d'acqua: goccia
    put(sfx, w(tm), pop(900, 1700, 0.06), 0.07, pan=float(np.sin(j * 1.9) * 0.4)); put(sfx, w(tm), chime(midi(93), 0.3), 0.012)
put(sfx, w(10.0), whoosh(w(11.0) - w(10.0), 1000, 350), 0.07)                                           # zoom all'indietro
put(sfx, w(12.2), whoosh(w(14.6) - w(12.2), 350, 1000), 0.07)                                           # e dentro una barra
for tg in (17.45, 21.4): put(sfx, w(tg), whoosh(1.2, 2500, 5500)[::-1], 0.07, pan=0.3)                   # neutroni velocissimi
bub = np.zeros(int(2.0 * SR))                                                                           # le molecole d'acqua "battono"
for i in range(30):
    t0 = rng.uniform(0, 1.8); f0 = rng.uniform(600, 1400); x = pop(f0, f0 * 1.8, 0.05); j = int(t0 * SR); bub[j:j + len(x)] += x * rng.uniform(0.4, 1)
put(sfx, w(25.7), bub * np.minimum(1, tt(2.0) / 0.3) * np.minimum(1, (2.0 - tt(2.0)) / 0.6), 0.05)
put(sfx, w(37.0), pop(420, 1050), 0.15, pan=-0.6)                                                       # bilancia
put(sfx, w(43.5), pop(420, 1050), 0.15, pan=-0.6)                                                       # termometro
sweep(w(43.7), w(44.8) - w(43.7) + 0.2, 500, 1300, 0.05, pan=-0.6); sweep(w(45.8), w(47.0) - w(45.8) + 0.2, 1300, 450, 0.05, pan=-0.6)
D = w(46.7) - w(45.5)                                                                                   # scende la barra di controllo fatta di atomi (voce 2: più forte)
put(sfx, w(45.5), whoosh(D, 900, 220), 0.26, pan=0.15)
put(sfx, w(45.5), lp(noise(D), 140) * np.minimum(1, tt(D) / 0.3) ** 2, 0.22)                            # rombo basso durante la discesa
sweep(w(45.5), D, 220, 70, 0.10)
put(sfx, w(46.7), lp(noise(0.7), 200) * np.exp(-tt(0.7) * 6), 0.75, pan=0.15); put(sfx, w(46.7), kick(), 0.6)   # colpo d'arresto
for i, m in enumerate([50, 57, 62]): put(sfx, w(46.7) + 0.01 * i, chime(midi(m + 24), 1.2), 0.05, pan=0.15)   # risonanza metallica
put(sfx, w(50.8), lp(hp(noise(w(53.3) - w(50.8)), 200), 900) * np.sin(np.pi * tt(w(53.3) - w(50.8)) / (w(53.3) - w(50.8))), 0.05)   # barre che scendono
sweep(w(57.0), w(57.9) - w(57.0), 400, 260, 0.04); sweep(w(58.6), w(59.8) - w(58.6), 260, 420, 0.04)   # le abbassi / le alzi
hum = np.sin(2 * np.pi * 100 * tt(w(64.1) - w(61.1))) * 0.6 + 0.4 * np.sin(2 * np.pi * 200 * tt(w(64.1) - w(61.1)))   # ronzio degli elettromagneti
put(sfx, w(61.1), hum * np.minimum(1, tt(len(hum) / SR) / 0.6), 0.015)
put(sfx, w(64.1), pop(900, 120, 0.25), 0.12)                                                            # magneti spenti
put(sfx, w(64.4), whoosh(w(65.8) - w(64.4), 1400, 300), 0.11)                                           # le barre cadono
put(sfx, w(65.8), lp(noise(0.5), 180) * np.exp(-tt(0.5) * 9), 0.55); put(sfx, w(65.8), kick(), 0.3)
put(sfx, w(69.3), whoosh(w(70.3) - w(69.3), 1000, 350), 0.07)                                           # zoom indietro dalle barre
put(sfx, w(70.3), whoosh(w(72.9) - w(70.3), 1100, 300), 0.09)                                           # e fino al paesaggio
put(sfx, w(72.6), pop(700, 1400, 0.08), 0.1, pan=0.6)                                                   # la mascotte indica i commenti
put(sfx, w(75.2), pop(950, 320, 0.16), 0.2, pan=0.6)                                                    # la mascotte esce

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music5.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx5.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'accordo finale', round(TF, 2))
