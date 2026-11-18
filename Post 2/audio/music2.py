# Puntata 2 — musica ed effetti sonori sintetizzati. Stessi strumenti di music.py (100 bpm, do maggiore, kalimba),
# struttura sulle scene della puntata. Gli effetti usano i tempi "di scaletta" di ep2.js convertiti con warp2.json.
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; TOTAL = 58.4; N = int(SR * TOTAL)
rng = np.random.default_rng(11)
BEAT = 0.6; BAR = 2.4
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
WARP = json.load(open('warp2.json'))
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
def clink(f=3200):  # monetina
    t = tt(0.35); return fade((np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.52 * t) + 0.3 * np.sin(2 * np.pi * f * 2.4 * t)) * np.exp(-t * 16), 0.001, 0.03)

CH = {'C': (36, [60, 64, 67]), 'G': (43, [59, 62, 67]), 'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]), 'Dm': (38, [57, 62, 65]), 'Fhi': (41, [60, 65, 69]), 'Ghi': (43, [62, 67, 71])}
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
    if mel:
        for i, bt in enumerate([0, 1, 1.5, 2.5][:4 if nb == 4 else 2]): put(mus, t0 + bt * BEAT, kal(MEL[ch][i], 1.6, 1.2), 0.30, pan=0.15)

B = lambda k: k * BAR
# ---------------- battuta 1 (0 – 7.2): leggera e curiosa
for k, ch in enumerate(['C', 'Am', 'F']):
    put(mus, B(k), pad(CH[ch][1], BAR, 0.6), 0.16); arp(B(k), ch, 0.34 if k else 0.28); put(mus, B(k), bass(CH[ch][0] + 12, 0.8), 0.30)
    if k >= 1:
        for i in range(8): put(mus, B(k) + i * 0.3, shaker(), 0.05 if i % 2 else 0.03)
# ---------------- battuta 2 (7.2 – 9.6): un po' preoccupata
put(mus, B(3), pad(CH['Dm'][1], BAR, 0.5), 0.17); put(mus, B(3), bass(50, 1.2), 0.26)
for i, m in enumerate([77, 74, 72, 69]): put(mus, B(3) + 0.3 + i * 0.45, kal(m, 1.2, 0.6), 0.25 - i * 0.02, pan=0.2 - i * 0.12)
# ---------------- battuta 3 (9.6 – 16.8): rinnovabili, luminosa
put(mus, B(4), pad(CH['Fhi'][1] + [53], BAR, 0.5, 0.5), 0.24); arp(B(4), 'F', 0.32, up=True, cres=(0.6, 1.0)); put(mus, B(4), bass(41, 2.0), 0.26)
put(mus, B(5), pad(CH['Ghi'][1] + [55], BAR, 0.4, 0.5), 0.26); arp(B(5), 'G', 0.34, up=True, cres=(0.8, 1.15)); put(mus, B(5), bass(43, 2.0), 0.28)
for i in range(16): put(mus, B(4) + i * 0.3, shaker(), 0.06 if i % 2 else 0.035, pan=-0.3)
groove(B(6), 'C', drums=0.75)
# ---------------- battuta 4 (16.8 – 21.6): notte, sospesa
put(mus, B(7), lp(pad([45, 52, 57, 60], BAR * 2 - 0.4, 0.8, 1.0), 1400), 0.36)
for t0, m in [(17.1, 76), (18.2, 72), (19.3, 69), (20.4, 64)]: put(mus, t0, kal(m, 2.0, 0.5), 0.20, pan=rng.uniform(-0.4, 0.4))
# ---------------- battuta 5 (21.6 – 33.0): fossili, scura e rada
DK = 21.3
put(mus, DK, lp(pad([33, 40, 45, 48], 11.2, 0.9, 1.0, trem=0.35), 700), 0.58)
put(mus, DK, lp(pad([56, 57], 11.2, 1.5, 1.0, trem=0.2), 1200), 0.09)
for t0, m in [(22.0, 72), (23.6, 69), (25.6, 71), (27.2, 68), (29.2, 69), (30.6, 65), (31.8, 64)]: put(mus, t0, kal(m, 2.0, 0.5), 0.16, pan=rng.uniform(-0.5, 0.5))
for t0 in np.arange(21.6, 32.2, 1.2): put(mus, t0, kick(0.9), 0.20); put(mus, t0 + 0.26, kick(0.7), 0.13)
# ---------------- ritorno al sereno (32.4 – 33.6)
sw = hp(noise(1.5), 5000) * np.linspace(0, 1, int(1.5 * SR)) ** 2.5; put(mus, 32.1, sw, 0.07)
for i, m in enumerate([55, 59, 62, 67, 71, 74]): put(mus, 32.4 + i * 0.2, kal(m, 1.2), 0.16 + i * 0.03, pan=-0.4 + i * 0.16)
for i in range(3): put(mus, 32.7 + i * 0.3, kick(), 0.18 + i * 0.05)
put(mus, B(14), hp(noise(1.6), 4000) * np.exp(-tt(1.6) * 3.2), 0.07)
# ---------------- battute 6-7 (33.6 – 45.6): nucleare, ritmo allegro
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C']): groove(B(14 + k), ch)
# ---------------- battuta 8, prima frase (45.6 – 50.4): pausa più seria, senza batteria
put(mus, B(19), pad(CH['Am'][1] + [52], BAR, 0.4, 0.6), 0.22); arp(B(19), 'Am', 0.24); put(mus, B(19), bass(45, 1.6), 0.26)
put(mus, B(20), pad(CH['Fhi'][1] + [53], BAR, 0.4, 0.5), 0.24); arp(B(20), 'F', 0.26, up=True, cres=(0.7, 1.1)); put(mus, B(20), bass(41, 1.6), 0.28)
for i in range(3): put(mus, B(21) - 0.9 + i * 0.3, kick(), 0.16 + i * 0.05)
# ---------------- battuta 8 seconda frase e battuta 9 (50.4 – 56.4)
groove(B(21), 'F'); groove(B(22), 'G'); groove(B(23), 'C', nb=2)
ST = B(23) + 2 * BEAT
put(mus, ST, pad(CH['Ghi'][1], 0.3, 0.03, 0.25), 0.22)
for m in (67, 71, 74, 79): put(mus, ST, kal(m, 0.8), 0.24)
put(mus, ST, bass(43, 0.4), 0.42); put(mus, ST, kick(), 0.34)
# ---------------- accordo finale con il lampo
TF = w(52.85)
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.40)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.30, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.5); put(mus, TF, kick(), 0.4)
put(mus, TF, hp(noise(1.5), 3500) * np.exp(-tt(1.5) * 3.0), 0.10)

# ---------------- effetti sonori (tempi di scaletta -> reali)
t = tt(0.7); f = 1500 * (520 / 1500) ** (t / 0.7) * (1 + 0.012 * np.sin(2 * np.pi * 7 * t))
put(sfx, 0.1, fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.7) ** 0.6, 0.02, 0.05), 0.09); put(sfx, 0.1, whoosh(0.7, 2500, 500), 0.09)   # ingresso
put(sfx, w(0.95), pop(320, 950), 0.26)
for i in range(4): put(sfx, w(1.9 + i * 0.12), pop(500 + i * 90, 1100 + i * 200), 0.16, pan=-0.5 + i * 0.33)                 # 4 lampadine
put(sfx, w(2.5), chime(1568, 0.8), 0.08, pan=0.5)                                                                        # quella verde si accende
for i in range(2): put(sfx, w(2.75 + i * 0.5), pop(380 + i * 120, 900 + i * 250), 0.22, pan=-0.5 if i == 0 else 0.5)     # nave, gasdotto
for i in range(3): put(sfx, w(3.6 + i * 0.32), chime([1175, 1319, 1568][i], 0.8), 0.08, pan=-0.5 + i * 0.33)             # si accendono le altre tre
put(sfx, w(4.95), whoosh(0.4, 1200, 3000), 0.06)
put(sfx, w(5.2), pop(300, 760), 0.22, pan=-0.3)                                                                          # casetta
for i in range(5): put(sfx, w(6.0 + i * 0.5), clink(3000 + 250 * (i % 3)), 0.07, pan=0.1 + 0.15 * (i % 3))               # monetine
def turn(t0, t1, up): put(sfx, t0, whoosh(t1 - t0, 500 if up else 1600, 1600 if up else 300), 0.13)                    # la collina ruota (tempi reali, come T.rot in ep2.js)
turn(9.0, 10.45, True); turn(20.55, 22.0, False); turn(32.6, 33.95, True)
for i in range(10): put(sfx, w(11.3 + i * 0.05), pop(900, 1500, 0.06), 0.07, pan=-0.6 + i * 0.13)                        # 10 lampadine
for i in range(4): put(sfx, w(12.05 + i * 0.16), chime([1047, 1319, 1568, 2093][i], 0.7), 0.07, pan=-0.6 + i * 0.13)
put(sfx, w(13.4), pop(260, 1040, 0.2), 0.22, pan=0.2); put(sfx, w(13.6), chime(2093, 0.7), 0.05, pan=0.2)                # spunta la quarta pala
t = tt(1.6); put(sfx, w(15.0), fade(np.sin(2 * np.pi * np.cumsum(330 * (150 / 330) ** (t / 1.6)) / SR) * np.sin(np.pi * t / 1.6), 0.05, 0.2), 0.08)   # cala la notte
for i in range(9): put(sfx, w(16.65 + i * 0.1) + rng.uniform(0, 0.02), bp(noise(0.035), 2500, 7000) * np.exp(-tt(0.035) * 90), 0.10, pan=-0.4)        # sfarfallio
put(sfx, w(17.45), pop(700, 220, 0.25), 0.14, pan=-0.3)                                                                  # si spengono
put(sfx, w(21.5), whoosh(0.45, 300, 2200, shape='rise'), 0.16, pan=0.0)                                                   # si accende la fiamma
fl = lp(hp(noise(3.0), 200), 1400) * np.minimum(1, tt(3.0) / 0.2) * np.exp(-tt(3.0) * 0.9); put(sfx, w(21.55), fl, 0.035)
d = w(23.9) - w(22.6); t = tt(d + 0.3)                                                                                    # camion
eng = lp(noise(d + 0.3), 180) * (1 + 0.6 * np.sin(2 * np.pi * 23 * t)) + 0.3 * np.sin(2 * np.pi * np.cumsum(75 - 25 * t / (d + 0.3)) / SR)
put(sfx, w(22.6), fade(eng * np.sin(np.pi * np.minimum(1, t / (d + 0.3))) ** 0.7, 0.2, 0.3), 0.50, pan=0.5)
put(sfx, w(23.9), bp(noise(0.3), 2500, 6000) * np.exp(-tt(0.3) * 14), 0.05, pan=0.4)
for i in range(2): put(sfx, w(25.0 + i * 0.2), pop(380 + i * 120, 900 + i * 250), 0.18, pan=-0.5 if i == 0 else 0.5)
for i in range(6): put(sfx, w(26.4 + i * 0.22), clink(3000 + 250 * (i % 3)), 0.07, pan=0.0 + 0.2 * (i % 3))
put(sfx, w(27.5), lp(noise(1.6), 120) * np.sin(np.pi * tt(1.6) / 1.6), 0.7)                                                # fumo che si addensa
t = tt(1.4); hum = np.sin(2 * np.pi * np.cumsum(110 * (220 / 110) ** (t / 1.4)) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(220 * (440 / 220) ** (t / 1.4)) / SR)
put(sfx, w(31.5), fade(hum * (t / 1.4) ** 1.5, 0.05, 0.25), 0.09, pan=0.3)                                                 # si apre il reattore
for i in range(8): put(sfx, w(32.2) + i * 0.09 + rng.uniform(0, 0.03), chime(midi(rng.choice([84, 88, 91, 96, 100])), 0.9), 0.04, pan=rng.uniform(-0.7, 0.7))
for i in range(4): put(sfx, w(32.6 + i * 0.1), pop(500 + i * 90, 1100 + i * 200), 0.13, pan=-0.5 + i * 0.33)
for i in range(4): put(sfx, w(33.0 + i * 0.1), chime([1047, 1319, 1568, 2093][i], 0.8), 0.07, pan=-0.5 + i * 0.33)
put(sfx, w(38.3), pop(280, 900, 0.16), 0.20, pan=0.5); put(sfx, w(38.6), pop(500, 1100), 0.14, pan=0.5)                    # traliccio, lampadina
for i in range(7): put(sfx, w(38.9 + i * 0.22), bp(noise(0.05), 3000, 8000) * np.exp(-tt(0.05) * 70), 0.06, pan=0.6 - i * 0.03)  # corrente sul cavo
put(sfx, w(40.4), chime(1568, 0.9), 0.10, pan=0.5); put(sfx, w(40.45), chime(2349, 0.8), 0.05, pan=0.5)
put(sfx, w(42.5), clink(2600), 0.12, pan=0.45); put(sfx, w(42.5), pop(500, 1000), 0.12, pan=0.45)                          # moneta
put(sfx, w(43.3), pop(420, 840), 0.14, pan=-0.45)                                                                         # clessidra
put(sfx, w(44.3), whoosh(0.5, 900, 2400), 0.05, pan=-0.45)
put(sfx, w(45.75), whoosh(0.3, 3000, 900), 0.10)                                                                          # casco
t = tt(0.16); put(sfx, w(46.1), np.sin(2 * np.pi * np.cumsum(520 * np.exp(-t * 6)) / SR) * np.exp(-t * 30) + 0.4 * bp(noise(0.16), 1500, 4000) * np.exp(-t * 80), 0.28)
put(sfx, w(46.25), hp(noise(0.5), 2500) * np.sin(np.pi * tt(0.5) / 0.5) ** 2, 0.045)                                       # si srotola il foglio
put(sfx, w(49.75), hp(noise(0.35), 2500) * np.sin(np.pi * tt(0.35) / 0.35) ** 2, 0.04); put(sfx, w(50.0), whoosh(0.5, 700, 3200), 0.10)
put(sfx, w(52.45) - 0.12, whoosh(w(53.0) - w(52.45) + 0.12, 250, 5000, shape='rise'), 0.34)                                # volo verso la camera
put(sfx, TF, lp(noise(0.8), 110) * np.exp(-tt(0.8) * 5), 1.0)

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music2.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx2.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'TF', TF)
