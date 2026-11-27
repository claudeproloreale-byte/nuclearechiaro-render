# Puntata 7 — musica ed effetti sonori sintetizzati. Stessi strumenti delle puntate 5 e 6 (100 bpm, do maggiore, kalimba),
# struttura sulle scene della puntata 7. Musica ed effetti usano i tempi "di scaletta" convertiti con warp7.json.
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

WARP = json.load(open('warp7.json'))
SR = 48000; TOTAL = WARP[-1][1]; N = int(SR * TOTAL)
rng = np.random.default_rng(17)
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
# la musica segue le scene sui tempi di scaletta: ogni sezione riempie le battute (2,4 s) da dove comincia fino alla sezione dopo
def sezione(k, kind, ch, i):
    if kind == 'still': still(B(k), ch, 0.2)
    elif kind == 'calm': calm(B(k), ch, 0.28)
    elif kind == 'rise': rise(B(k), ch, 0.28, (0.6 + 0.1 * (i % 2), 0.9 + 0.1 * (i % 2)))
    elif kind == 'groove': groove(B(k), ch, mel=i % 2 == 1, drums=0.5)
SEZ = [(0.0, 'still', ['Am', 'F']),                      # B1: il simbolo nello spazio, «ti fa paura?»
       (4.25, 'calm', ['C', 'G', 'Am', 'F']),            # B2–B4: la collina, rocce, banane, raggi cosmici, l'omino
       (20.5, 'rise', ['Am']),                           # avvicinamento all'omino e zoom nel puntino
       (23.3, 'still', ['Am', 'Dm']),                    # B5–B6: gli atomi, il nucleo instabile trema
       (31.0, 'calm', ['Am', 'F', 'C', 'G']),            # B7: alfa, beta, gamma
       (38.5, 'calm', ['C', 'G']),                       # B8: il nucleo si calma
       (47.0, 'calm', ['F', 'C', 'G', 'Am']),            # B9: tempo di dimezzamento
       (55.1, 'groove', ['C', 'G', 'Am', 'F']),          # B10–B13: ritorno alla collina, i pesi, l'aereo, la centrale
       (77.5, 'still', ['Am', 'F', 'Dm', 'G']),          # B14: dentro la cupola, le barriere
       (86.6, 'calm', ['C', 'G']),                       # B15: la cupola si richiude, il fusto
       (90.0, 'groove', ['C', 'G'])]                     # B16: commenti
TF = w(92.9)
kend = int(TF / BAR)
for n, (ts, kind, chs) in enumerate(SEZ):
    k0 = int(round(w(ts) / BAR)); k1 = int(round(w(SEZ[n + 1][0]) / BAR)) if n + 1 < len(SEZ) else kend
    for i, k in enumerate(range(k0, k1)): sezione(k, kind, chs[i % len(chs)], i)
# la mascotte esce: accordo finale
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.36)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.28, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.45); put(mus, TF, kick(), 0.36)

# ---------------- effetti sonori: uno discreto per evento visivo (tempi di scaletta -> reali)
flash = lambda tg, a=0.05: (put(sfx, w(tg) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), a), put(sfx, w(tg), chime(midi(91), 0.7), 0.6 * a))
def glow_fx(t0, base, amp=0.05, pan=0.0):   # qualcosa si illumina di verde: tre campanelli e un soffio chiaro
    for i, m in enumerate([base, base + 7, base + 12]): put(sfx, t0 + i * 0.06, chime(midi(m), 1.2), amp, pan + (i - 1) * 0.2)
    put(sfx, t0, hp(noise(0.8), 4000) * np.sin(np.pi * tt(0.8) / 0.8) ** 2, amp * 0.6, pan)
put(sfx, w(0.2), pop(320, 950), 0.2, pan=0.6)                                                           # la mascotte compare nell'angolo
glow_fx(w(1.9), 79, 0.035)                                                                              # il simbolo lampeggia di verde
for tg in (4.25, 23.3, 55.1): flash(tg, 0.05)                                                           # lampi di passaggio fra i mondi
glow_fx(w(11.1), 72, 0.05, pan=-0.4)                                                                    # si illuminano le rocce
glow_fx(w(12.1), 76, 0.05, pan=0.4)                                                                     #   le banane
for i in range(7):                                                                                      #   i raggi cosmici arrivano da tutte le direzioni
    t0 = w(13.3 + i * 0.28); put(sfx, t0, whoosh(0.5, 5000, 1800), 0.025, pan=float(np.sin(i * 2.3) * 0.7))
put(sfx, w(14.2), hp(noise(1.6), 3500) * np.sin(np.pi * tt(1.6) / 1.6) ** 2, 0.02)
for i in range(6):                                                                                      # passi dell'omino sul prato
    t0 = w(15.75 + i * 0.36); put(sfx, t0, lp(noise(0.08), 900) * np.exp(-tt(0.08) * 45), 0.09, pan=-0.5 + i * 0.1)
put(sfx, w(17.9), whoosh(w(18.45) - w(17.9), 700, 1400), 0.03)                                          # si gira verso di noi
for i in range(10):                                                                                     # puntini che si accendono sul corpo
    put(sfx, w(18.4) + i * 0.22 + rng.uniform(0, 0.08), chime(midi(int(rng.choice([88, 91, 93, 96]))), 0.35), 0.012, pan=float(rng.uniform(-0.4, 0.4)))
put(sfx, w(22.0), whoosh(w(23.3) - w(22.0), 500, 2500, shape='rise'), 0.06)                             # zoom dentro il puntino
sweep(w(25.2), w(30.6) - w(25.2), 140, 150, 0.025, shape=0.5)                                           # il nucleo instabile trema (ronzio basso)
put(sfx, w(33.6), lp(noise(0.25), 600) * np.exp(-tt(0.25) * 18), 0.22); put(sfx, w(33.6), pop(500, 220, 0.14), 0.08)   # alfa: il grumetto parte
put(sfx, w(34.6), whoosh(0.35, 2500, 7000, shape='rise'), 0.04, pan=0.4)                                # beta: elettrone veloce
put(sfx, w(35.7), chime(midi(84), 1.4), 0.05); sweep(w(35.7), 0.9, 900, 1600, 0.02)                     # gamma: l'onda luminosa
put(sfx, w(39.4), chime(midi(72), 1.6), 0.04); put(sfx, w(39.6), chime(midi(79), 1.6), 0.03)            # il nucleo si calma
put(sfx, w(47.8), pop(420, 1050), 0.12, pan=-0.5)                                                       # compare il cronometro
for j, tg in enumerate((49.8, 51.6, 53.4)):                                                             # metà dei nuclei si calmano (sempre meno)
    for i in range([8, 4, 2][j]): put(sfx, w(tg) + i * 0.05, chime(midi(91 - 3 * j - (i % 3)), 0.5), 0.02 - 0.004 * j, pan=float(np.sin(i * 1.7) * 0.5))
put(sfx, w(54.7) - 0.15, pop(1050, 420), 0.09, pan=-0.5)                                                # il cronometro sparisce
put(sfx, w(55.4), pop(420, 1050), 0.14)                                                                 # compare la bilancia
for i in range(3): put(sfx, w(60.2) + i * 0.2, pop(500 + 150 * i, 1100 + 150 * i), 0.1, pan=-0.4 + 0.4 * i)   # le tre icone della B11
for i in range(52):                                                                                     # 52 pesi, uno per settimana
    put(sfx, w(61.0 + i * (3.2 / 52)), pop(1400 + 8 * i, 2100 + 8 * i, 0.04), 0.03, pan=float(-0.6 + 1.2 * (i % 13) / 12))
put(sfx, w(65.3) - 0.1, pop(1000, 400), 0.06)                                                           # le icone spariscono
DA = w(68.8) - w(65.8)                                                                                  # l'aereo passa alto nel cielo, da sinistra a destra
xa = lp(noise(DA), 900) * np.sin(np.pi * tt(DA) / DA) ** 2
pa = np.linspace(-0.8, 0.8, len(xa)); l, r = np.cos((pa + 1) * np.pi / 4), np.sin((pa + 1) * np.pi / 4); i0 = int(w(65.8) * SR)
sfx[i0:i0 + len(xa), 0] += xa * 0.08 * l * 1.414; sfx[i0:i0 + len(xa), 1] += xa * 0.08 * r * 1.414
put(sfx, w(67.15), whoosh(0.7, 1800, 700), 0.03); put(sfx, w(67.15) + 0.75, pop(900, 1500, 0.05), 0.09)   # il peso del volo cade e si posa
put(sfx, w(71.4), whoosh(w(73.8) - w(71.4), 400, 900), 0.05)                                            # la collina gira verso la centrale
put(sfx, w(74.0) + 0.4, pop(1800, 2600, 0.03), 0.06, pan=0.6)                                           # il granello della centrale
put(sfx, w(76.4), pop(1000, 400), 0.07)                                                                 # i pesi spariscono
put(sfx, w(77.8), whoosh(w(79.2) - w(77.8), 400, 1300), 0.07)                                           # la cupola si apre, zoom nel reattore
for j, (tg, m) in enumerate(((84.2, 72), (84.9, 76), (85.5, 79), (86.0, 84))):                          # le barriere si accendono una dopo l'altra
    put(sfx, w(tg), chime(midi(m), 1.3), 0.05); put(sfx, w(tg), lp(noise(0.2), 500) * np.exp(-tt(0.2) * 20), 0.08)
put(sfx, w(86.7), whoosh(w(87.6) - w(86.7), 1200, 400), 0.06)                                           # la cupola si richiude
put(sfx, w(87.6), lp(noise(0.3), 300) * np.exp(-tt(0.3) * 14), 0.18)
put(sfx, w(87.4), pop(420, 1050), 0.13); put(sfx, w(89.7) - 0.15, pop(1050, 420), 0.09)                 # il fusto compare e sparisce
put(sfx, w(90.9), pop(700, 1400, 0.08), 0.1, pan=0.6)                                                   # la mascotte indica i commenti
put(sfx, w(92.9) - 0.2, pop(950, 320, 0.16), 0.2, pan=0.6)                                              # la mascotte esce

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music7.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx7.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'accordo finale', round(TF, 2))
