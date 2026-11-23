# Puntata 3 — musica ed effetti sonori sintetizzati. Stessi strumenti delle puntate precedenti (100 bpm, do maggiore,
# kalimba), struttura sulle scene della puntata. Gli effetti usano i tempi "di scaletta" di ep3.js convertiti con warp3.json.
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; TOTAL = 66.2; N = int(SR * TOTAL)
rng = np.random.default_rng(13)
BEAT = 0.6; BAR = 2.4
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
WARP = json.load(open('warp3.json'))
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
def calm(t0, ch, amp=0.3):   # battuta tranquilla: pad, arpeggio e basso, senza batteria
    b, ts = CH[ch]; put(mus, t0, pad(ts, BAR, 0.5, 0.6), 0.17); arp(t0, ch, amp); put(mus, t0, bass(b + 12, 1.0), 0.28)

B = lambda k: k * BAR
# ---------------- saluto e centrale che entra (0 – 4.8): leggera e curiosa
calm(B(0), 'C', 0.26); calm(B(1), 'Am', 0.32)
for i in range(8): put(mus, B(1) + i * 0.3, shaker(), 0.05 if i % 2 else 0.03)
# ---------------- l'idea di base e il ciclo (4.8 – 14.4): ritmo leggero
for k, ch in enumerate(['C', 'G', 'Am', 'F']): groove(B(2 + k), ch, mel=k % 2 == 1, drums=0.6)
# ---------------- verso la cupola (14.4 – 16.8): arpeggio che sale
put(mus, B(6), pad(CH['Ghi'][1] + [55], BAR, 0.4, 0.5), 0.22); arp(B(6), 'G', 0.32, up=True, cres=(0.6, 1.1)); put(mus, B(6), bass(43, 2.0), 0.26)
put(mus, B(7) - 1.5, hp(noise(1.5), 5000) * np.linspace(0, 1, int(1.5 * SR)) ** 2.5, 0.06)
# ---------------- nocciolo e fissione (16.8 – 26.4): più raccolta, senza batteria
for k, ch in enumerate(['Am', 'F', 'Dm', 'Am']):
    put(mus, B(7 + k), lp(pad(CH[ch][1] + [CH[ch][0] + 12], BAR, 0.7, 0.8), 1800), 0.26); put(mus, B(7 + k), bass(CH[ch][0] + 12, 1.6), 0.24)
    for i, m in enumerate([0, 2, 1]): put(mus, B(7 + k) + 0.3 + i * 0.75, kal(CH[ch][1][m] + 12, 1.8, 0.6), 0.2, pan=-0.3 + i * 0.3)
# ---------------- circuiti (26.4 – 40.8): ritmo regolare
for k, ch in enumerate(['C', 'G', 'Am', 'F', 'C', 'G']): groove(B(11 + k), ch, mel=k % 2 == 0, drums=0.55 + 0.05 * k)
# ---------------- vapore, turbina, elettricità (40.8 – 52.8): piena
for k, ch in enumerate(['Am', 'F', 'C', 'G', 'F']): groove(B(17 + k), ch, drums=0.9 + 0.03 * k)
# ---------------- il ciclo ricomincia (52.8 – 57.6)
put(mus, B(22), pad(CH['Fhi'][1] + [53], BAR, 0.3, 0.5), 0.22); arp(B(22), 'F', 0.3, up=True, cres=(0.7, 1.1)); put(mus, B(22), bass(41, 2.0), 0.26)
put(mus, B(23), pad(CH['Ghi'][1] + [55], BAR, 0.3, 0.5), 0.24); arp(B(23), 'G', 0.32, up=True, cres=(0.8, 1.2)); put(mus, B(23), bass(43, 2.0), 0.28)
# l'anello resta a schermo nella pausa (57.6 – 60.0): arpeggio che sale, senza batteria
put(mus, B(24), pad(CH['C'][1] + [48], BAR, 0.3, 0.5), 0.22); arp(B(24), 'C', 0.32, up=True, cres=(0.8, 1.2)); put(mus, B(24), bass(48, 2.0), 0.28)
for i in range(3): put(mus, B(25) - 0.9 + i * 0.3, kick(), 0.16 + i * 0.05)
# ---------------- chiusura (60.0 – 66.2)
groove(B(25), 'C'); groove(B(26), 'F')
TF = w(62.05)                                   # la mascotte esce: accordo finale
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.36)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.28, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.45); put(mus, TF, kick(), 0.36)

# ---------------- effetti sonori (tempi di scaletta -> reali)
put(sfx, w(0.0), pop(320, 950), 0.24)                                                                   # la mascotte compare
put(sfx, w(0.92), whoosh(w(1.45) - w(0.92) + 0.1, 2400, 600), 0.10, pan=0.3)                             # si rimpicciolisce e va nell'angolo
for i, (tg, f0) in enumerate([(1.55, 260), (1.85, 290), (2.15, 330), (2.45, 300), (2.85, 420), (3.1, 520)]):   # spuntano gli edifici
    put(sfx, w(tg), pop(f0, f0 * 2.6, 0.16), 0.17, pan=-0.5 + i * 0.2)
for i, tg in enumerate([7.1, 8.2, 9.6]): put(sfx, w(tg), pop(380 + i * 110, 950 + i * 220), 0.2, pan=-0.45 + i * 0.45)   # icone
sweep(w(7.3), w(8.1) - w(7.3) + 0.2, 500, 1100, 0.05, pan=-0.45)                                        # il termometro sale
put(sfx, w(8.4), hp(noise(0.7), 3000) * np.sin(np.pi * tt(0.7) / 0.7) ** 2, 0.035)                      # vapore
put(sfx, w(9.8), whoosh(0.8, 600, 2000), 0.07, pan=0.45)                                                # la turbina gira
put(sfx, w(11.9), whoosh(w(12.6) - w(11.9), 900, 1500), 0.07)                                           # le icone si dispongono ad anello
for k in range(4): put(sfx, w(12.55 + k * 0.33), pop(700 + k * 120, 1300 + k * 160, 0.07), 0.08)        # frecce
put(sfx, w(13.3), pop(600, 300, 0.14), 0.18)                                                            # goccia
for i in range(6): put(sfx, w(13.95) + i * 0.32, chime(midi([79, 84, 88, 84, 79, 84][i]), 0.6), 0.025, pan=-0.6 + i * 0.24)   # il ciclo gira
put(sfx, w(16.45), whoosh(0.5, 2200, 700), 0.06)                                                        # le icone spariscono
put(sfx, w(16.9), whoosh(w(18.7) - w(16.9), 300, 900), 0.11)                                            # la camera va verso la cupola
sweep(w(17.6), w(18.9) - w(17.6) + 0.4, 110, 220, 0.07, pan=0.2)                                        # la cupola si apre
for i in range(5): put(sfx, w(19.2) + i * 0.1, chime(midi([72, 76, 79, 84, 88][i]), 1.0), 0.04, pan=-0.4 + i * 0.2)   # il nocciolo si accende
put(sfx, w(20.0), whoosh(w(21.2) - w(20.0), 400, 1200), 0.08)                                           # zoom sul nocciolo
put(sfx, w(21.5), pop(330, 880, 0.14), 0.2)                                                             # lente
put(sfx, w(22.2), whoosh(0.5, 1500, 3000), 0.04); put(sfx, w(22.8), pop(500, 1200), 0.14, pan=0.3)     # una pastiglia esce
put(sfx, w(23.85), pop(380, 1000), 0.16)                                                                # atomo
put(sfx, w(25.3), whoosh(w(26.5) - w(25.3), 800, 3000, shape='rise'), 0.08, pan=-0.3)                   # arriva il neutrone
FIS = w(26.5)                                                                                           # fissione: lampo e calore
put(sfx, FIS, lp(noise(0.6), 160) * np.exp(-tt(0.6) * 7), 0.5); put(sfx, FIS, hp(noise(1.2), 3000) * np.exp(-tt(1.2) * 4), 0.06)
for i, m in enumerate([84, 91, 96]): put(sfx, FIS + i * 0.04, chime(midi(m), 1.2), 0.05, pan=-0.3 + i * 0.3)
put(sfx, w(28.4), whoosh(w(29.9) - w(28.4), 1000, 350), 0.09)                                           # la camera si allontana
sweep(w(29.2), 1.6, 160, 240, 0.05)                                                                     # il circuito primario si scalda
put(sfx, w(30.9), pop(420, 1050), 0.17, pan=-0.6); sweep(w(31.5), w(32.9) - w(31.5) + 0.2, 500, 1400, 0.05, pan=-0.6)   # termometro piccolo
put(sfx, w(34.1), pop(380, 950), 0.17, pan=-0.3)                                                        # manometro
for i in range(5): put(sfx, w(34.6) + i * 0.2, bp(noise(0.03), 2000, 5000) * np.exp(-tt(0.03) * 120), 0.06, pan=-0.3)   # lancetta che sale
for k in range(3): put(sfx, w(37.3) + k * 1.4, lp(pop(160, 120, 0.4), 600), 0.25)                       # il circuito chiuso pulsa
for k in range(4): put(sfx, w(42.3) + k * 0.9, hp(noise(0.5), 1500) * np.sin(np.pi * tt(0.5) / 0.5) ** 2, 0.025)   # il calore passa
bub = np.zeros(int(3.0 * SR))                                                                           # l'acqua bolle
for i in range(40):
    t0 = rng.uniform(0, 2.8); f0 = rng.uniform(600, 1400); x = pop(f0, f0 * 1.8, 0.05); j = int(t0 * SR); bub[j:j + len(x)] += x * rng.uniform(0.4, 1)
put(sfx, w(43.8), bub * np.minimum(1, tt(3.0) / 0.5) * np.minimum(1, (3.0 - tt(3.0)) / 0.6), 0.05, pan=0.3)
put(sfx, w(44.6), lp(hp(noise(2.6), 2500), 9000) * np.sin(np.pi * tt(2.6) / 2.6) ** 1.2, 0.03)           # vapore nel tubo
put(sfx, w(45.5), whoosh(w(47.3) - w(45.5), 350, 1000), 0.09)                                           # la camera va alla sala turbine
T0 = w(47.2); d = 7.0; t = tt(d)                                                                        # la turbina prende velocità
f = 70 + 150 * np.minimum(1, t / 1.6) ** 1.6
whir = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 5) / SR)) * np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 1.5)
put(sfx, T0, whir + 0.3 * lp(noise(d), 800) * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.5), 0.05)
G0 = w(49.4); t = tt(4.0)                                                                               # l'alternatore produce elettricità
put(sfx, G0, (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t)) * np.minimum(1, t / 0.4) * np.minimum(1, (4.0 - t) / 1.0), 0.03, pan=-0.3)
for i in range(8): put(sfx, w(49.7) + i * 0.25 + rng.uniform(0, 0.05), bp(noise(0.05), 3000, 8000) * np.exp(-tt(0.05) * 70), 0.06, pan=-0.6)   # scintille sul cavo
put(sfx, w(50.1), pop(420, 1050), 0.16, pan=-0.6); put(sfx, w(50.9), chime(1568, 0.9), 0.09, pan=-0.6); put(sfx, w(50.95), chime(2349, 0.8), 0.05, pan=-0.6)   # lampadina
sweep(w(52.5), 1.2, 1600, 700, 0.03)                                                                    # il condensatore raffredda
put(sfx, w(53.9), whoosh(w(56.4) - w(53.9), 900, 300), 0.08)                                            # la camera torna larga
for i in range(4): put(sfx, w(54.3 + i * 0.07), pop(450 + i * 110, 1050 + i * 220), 0.13, pan=-0.45 + i * 0.3)   # torna l'anello
for i in range(10): put(sfx, w(54.3) + 0.5 + i * 0.32, chime(midi(([79, 84, 88, 84] * 3)[i]), 0.6), 0.025, pan=-0.6 + (i % 5) * 0.3)   # il ciclo gira per tutta la pausa
put(sfx, w(57.6), pop(700, 1400, 0.08), 0.1, pan=0.6)                                                   # la mascotte indica i commenti
put(sfx, w(62.05), pop(950, 320, 0.16), 0.2, pan=0.6)                                                   # la mascotte esce

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music3.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx3.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'TF', TF)
