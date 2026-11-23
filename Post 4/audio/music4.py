# Puntata 4 — musica ed effetti sonori sintetizzati. Stessi strumenti delle puntate precedenti (100 bpm, do maggiore,
# kalimba), struttura sulle scene della puntata. Gli effetti usano i tempi "di scaletta" di ep4.js convertiti con warp4.json;
# i tempi delle fissioni della catena e delle catture vengono da events4.json (stampati da ep4.js all'avvio).
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

WARP = json.load(open('warp4.json')); EV = json.load(open('events4.json'))
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
# ---------------- saluto e zoom nella pastiglia (0 – 4.8): leggera e curiosa
calm(B(0), 'C', 0.26); calm(B(1), 'Am', 0.32)
for i in range(8): put(mus, B(1) + i * 0.3, shaker(), 0.05 if i % 2 else 0.03)
# ---------------- isotopi (4.8 – 16.8): ritmo leggero
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C']): groove(B(2 + k), ch, mel=k % 2 == 1, drums=0.5)
# ---------------- vista larga, poche U-235 (16.8 – 21.6)
groove(B(7), 'G', mel=False, drums=0.55); groove(B(8), 'Am', mel=True, drums=0.55)
# ---------------- "guarda cosa succede": attesa e volo della mascotte fino all'urto (21.6 – 26.4)
rise(B(9), 'F', 0.3, (0.6, 0.9)); rise(B(10), 'G', 0.32, (0.8, 1.2))
HIT = w(23.0)
put(mus, HIT - 1.5, hp(noise(1.5), 5000) * np.linspace(0, 1, int(1.5 * SR)) ** 2.5, 0.06)
# ---------------- la fissione spiegata (26.4 – 33.6): raccolta, senza batteria
for k, ch in enumerate(['Am', 'F', 'Dm']): still(B(11 + k), ch)
# ---------------- neutroni e reazione a catena (33.6 – 45.6): ritmo che cresce
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C']): groove(B(14 + k), ch, mel=k % 2 == 0, drums=0.65 + 0.08 * k)
# ---------------- frammenti e calore (45.6 – 60.0)
for k, ch in enumerate(['Am', 'F', 'C', 'G', 'Am', 'F']): groove(B(19 + k), ch, mel=k % 2 == 1, drums=0.8)
# ---------------- barrette che si scaldano, senza voce (60.0 – 67.2): arpeggi che salgono
rise(B(25), 'F', 0.34, (0.7, 1.0)); rise(B(26), 'G', 0.36, (0.8, 1.1)); rise(B(27), 'C', 0.34, (0.9, 0.8))
# ---------------- plutonio (67.2 – 84.0): sospesa, poi riprende il ritmo
still(B(28), 'Am'); still(B(29), 'Em'); still(B(30), 'F'); still(B(31), 'Dm')
groove(B(32), 'Am', mel=False, drums=0.4); groove(B(33), 'F', mel=True, drums=0.5); rise(B(34), 'G', 0.32, (0.8, 1.2))
# ---------------- chiusura (84.0 – fine)
groove(B(35), 'C'); groove(B(36), 'F', nb=3)
TF = w(82.7)                                   # la mascotte esce: accordo finale
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.36)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.28, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.45); put(mus, TF, kick(), 0.36)

# ---------------- effetti sonori (tempi di scaletta -> reali)
put(sfx, w(0.0), pop(320, 950), 0.24)                                                                   # la mascotte compare
put(sfx, w(0.92), whoosh(w(1.45) - w(0.92) + 0.1, 2400, 600), 0.10, pan=0.3)                             # si rimpicciolisce e va nell'angolo
put(sfx, w(1.3), whoosh(w(3.35) - w(1.3), 300, 1100), 0.09)                                              # la camera entra nel nocciolo
for tg in (3.35, 4.75): put(sfx, w(tg) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), 0.05); put(sfx, w(tg), chime(midi(91), 0.7), 0.03)   # lampi di passaggio
put(sfx, w(3.4), whoosh(w(4.75) - w(3.4), 700, 2600), 0.07)                                              # dentro la pastiglia
put(sfx, w(8.9), pop(500, 1250), 0.15, pan=-0.2); put(sfx, w(10.9), pop(420, 1000), 0.15, pan=0.2)       # targhette Uranio 235 / 238
for i in range(3): put(sfx, w(14.45) + i * 0.7, chime(midi(88 + 3 * i), 0.5), 0.035, pan=-0.2 + i * 0.2)   # i 3 neutroni in più lampeggiano
put(sfx, w(16.5), whoosh(w(17.9) - w(16.5), 900, 350), 0.07)                                             # la camera si allontana
put(sfx, w(20.3), whoosh(w(21.5) - w(20.3), 350, 900), 0.06)                                             # e torna vicina
put(sfx, w(21.7), whoosh(HIT - w(21.7), 600, 3200, shape='rise'), 0.10, pan=0.4)                        # la mascotte vola verso A
boom(HIT, 1.7)                                                                                          # urto e prima fissione
put(sfx, w(23.8), pop(950, 420, 0.14), 0.16, pan=0.6)                                                   # la mascotte ricompare nell'angolo, stordita
for i in range(3): put(sfx, w(23.85) + 0.18 + i * 0.16, chime(midi([96, 93, 98][i]), 0.4), 0.02, pan=0.6)
for i, a in enumerate([-0.5, 0.3]): put(sfx, w(29.5), whoosh(0.7, 900 + 300 * i, 2500), 0.05, pan=a)       # partono neutroni e frammenti
put(sfx, w(EV['n3'][0]), lp(pop(300, 180, 0.2), 1200), 0.18, pan=-0.3)                                  # il primo è catturato da B
put(sfx, w(EV['go3']), whoosh(w(EV['n3'][2]) - w(EV['go3']), 900, 2600, shape='rise'), 0.06, pan=0.2)   # il terzo parte verso C
for j, tc in enumerate(EV['chain']):                                                                     # reazione a catena
    a = 1.0 if j == 0 else 0.45 * (0.85 ** max(0, j - 3)) + 0.18
    boom(w(tc), a, pan=float(np.clip(np.sin(j * 2.1) * 0.6, -0.6, 0.6)), big=j == 0)
for j, ta in enumerate(EV['abs']):                                                                       # neutroni assorbiti dagli U-238
    if ta < 41.5: put(sfx, w(ta), lp(pop(320, 200, 0.12), 1400), 0.06, pan=float(np.sin(j * 1.3) * 0.5))
put(sfx, w(35.7), whoosh(w(37.8) - w(35.7), 1000, 350), 0.08)                                           # zoom all'indietro sulla catena
put(sfx, w(41.3), whoosh(w(43.0) - w(41.3), 350, 1100), 0.08)                                           # zoom sulla fissione F
boom(w(43.0), 0.8)                                                                                      # fissione F
F0, F1 = w(46.3), w(53.0); GO_OUT = 33.0                                                                               # i frammenti schizzano via, rimbalzano e frenano
put(sfx, F0, whoosh(0.9, 1800, 4200, shape='rise')[::-1], 0.10)
for k, tb in enumerate(EV['f_bounce']):                                                                  # urti dei frammenti sui nuclei (rimbalzi)
    put(sfx, w(tb), lp(pop(420, 220, 0.09), 2500), 0.16, pan=float(np.sin(k * 2.3) * 0.5))
    put(sfx, w(tb), bp(noise(0.05), 1500, 5000) * np.exp(-tt(0.05) * 80), 0.10, pan=float(np.sin(k * 2.3) * 0.5))
for k, tb in enumerate(EV['na_bounce']):
    if tb < GO_OUT: put(sfx, w(tb), lp(pop(420, 220, 0.09), 2500), 0.10, pan=float(np.sin(k * 1.7) * 0.5))
put(sfx, w(50.2), pop(420, 1050), 0.16, pan=-0.6); sweep(w(50.8), w(53.6) - w(50.8) + 0.2, 500, 1300, 0.05, pan=-0.6)   # termometro
put(sfx, w(54.9), whoosh(w(56.6) - w(54.9), 1100, 350), 0.08)                                           # zoom indietro fino alle barrette
put(sfx, w(56.6) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), 0.04)
bub = np.zeros(int(4.4 * SR))                                                                           # l'acqua scorre e si scalda
for i in range(60):
    t0 = rng.uniform(0, 4.2); f0 = rng.uniform(600, 1400); x = pop(f0, f0 * 1.8, 0.05); j = int(t0 * SR); bub[j:j + len(x)] += x * rng.uniform(0.4, 1)
put(sfx, w(56.6), bub * np.minimum(1, tt(4.4) / 0.6) * np.minimum(1, (4.4 - tt(4.4)) / 0.8), 0.05, pan=0.2)
put(sfx, w(56.8), lp(hp(noise(4.0), 300), 1500) * np.sin(np.pi * tt(4.0) / 4.0) ** 1.2, 0.03)
put(sfx, w(61.0) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), 0.04); put(sfx, w(61.0), whoosh(w(62.6) - w(61.0), 400, 1500), 0.07)   # si rientra in una pastiglia
put(sfx, w(62.5), pop(420, 1000), 0.15, pan=0.2)                                                        # targhetta Uranio 238
put(sfx, w(63.0), whoosh(w(64.2) - w(63.0), 900, 2600, shape='rise'), 0.05, pan=-0.4)           # arriva un neutrone da fuori
put(sfx, w(64.2), lp(pop(300, 180, 0.2), 1200), 0.2)                                                    # catturato da G
for tf in (65.1, 66.7):                                                                                  # decadimenti beta
    put(sfx, w(tf), chime(midi(86), 0.8), 0.06); put(sfx, w(tf) + 0.02, whoosh(0.35, 2500, 6000), 0.03, pan=0.3)
for i, m in enumerate([72, 76, 79, 83]): put(sfx, w(67.4) + i * 0.06, chime(midi(m + 12), 1.0), 0.04, pan=-0.3 + i * 0.2)   # plutonio: alone verde
put(sfx, w(67.6), pop(500, 1200), 0.15, pan=0.2)                                                        # targhetta Plutonio 239
put(sfx, w(70.9), whoosh(w(72.6) - w(70.9), 800, 2800, shape='rise'), 0.06)                             # arriva il neutrone
boom(w(72.6), 0.9)                                                                                      # il plutonio si spacca
put(sfx, w(73.4), pop(420, 1050), 0.16); sweep(w(74.2), w(75.0) - w(74.2) + 0.3, 700, 1400, 0.04)       # torta
put(sfx, w(78.4), pop(700, 1400, 0.08), 0.1, pan=0.6)                                                   # la mascotte indica i commenti
for tg in (78.85, 79.95): put(sfx, w(tg) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), 0.04)    # lampi di passaggio in uscita
put(sfx, w(78.6), whoosh(w(82.4) - w(78.6), 1100, 300), 0.09)                                           # zoom all'indietro fino al paesaggio
put(sfx, w(82.7), pop(950, 320, 0.16), 0.2, pan=0.6)                                                    # la mascotte esce

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music4.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx4.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'urto', round(HIT, 2), 'accordo finale', round(TF, 2))
