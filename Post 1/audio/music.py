import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; TOTAL = 37.0; N = int(SR * TOTAL)
rng = np.random.default_rng(7)
BEAT = 0.6; BAR = 2.4
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)

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

def kal(m, dur=1.4, bright=1.0):          # kalimba / marimba-like pluck
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
    for i in range(n):                      # state-variable band-pass with moving centre
        lo += k[i] * bd; hi_ = x[i] - lo - bd / q; bd += k[i] * hi_; y[i] = bd
    u = np.arange(n) / n
    env = np.sin(np.pi * u) ** 1.5 if shape == 'hill' else u ** 2.2 * np.minimum(1, (1 - u) * 30)
    return y * env / (np.abs(y).max() + 1e-9)

CH = {'C': (36, [60, 64, 67]), 'G': (43, [59, 62, 67]), 'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]), 'Fhi': (41, [60, 65, 69]), 'Ghi': (43, [62, 67, 71])}
def arp(t0, ch, amp, n8=8, up=False, cres=None):
    b, ts = CH[ch]; seq = [ts[0], ts[2], ts[1] + 12, ts[2], ts[0] + 12, ts[2], ts[1] + 12, ts[2]]
    if up: seq = [ts[0], ts[1], ts[2], ts[0] + 12, ts[1] + 12, ts[2] + 12, ts[0] + 24, ts[2] + 12]
    for i in range(n8):
        a = amp * (cres[0] + (cres[1] - cres[0]) * i / n8 if cres else 1) * (1.0 if i % 2 == 0 else 0.75)
        put(mus, t0 + i * BEAT / 2, kal(seq[i % 8]), a, pan=0.35 if i % 2 else -0.35)

# ---------------- intro (0 – 7.2): light and curious
for k, ch in enumerate(['C', 'Am', 'F']):
    t0 = k * BAR
    put(mus, t0, pad(CH[ch][1], BAR, 0.6), 0.16)
    arp(t0, ch, 0.34 if k else 0.28, n8=8 if k < 2 else 5)
    put(mus, t0, bass(CH[ch][0] + 12, 0.8), 0.30)
    if k >= 1:
        for i in range(8 if k < 2 else 5): put(mus, t0 + i * 0.3, shaker(), 0.05 if i % 2 else 0.03)
# descending "uh-oh" into the fear section
for i, m in enumerate([72, 68, 65, 62]): put(mus, 6.42 + i * 0.19, kal(m, 1.0, 0.6), 0.26 - i * 0.03, pan=0.2 - i * 0.15)

# ---------------- fear (7.2 – 14.4): dark, sparse
put(mus, 7.1, lp(pad([33, 40, 45, 48], 7.3, 0.9, 1.0, trem=0.35), 700), 0.60)
put(mus, 7.1, lp(pad([56, 57], 7.3, 1.5, 1.0, trem=0.2), 1200), 0.10)
for t0, m in [(7.5, 76), (8.7, 72), (10.3, 71), (11.4, 69), (12.9, 72), (13.7, 76)]: put(mus, t0, kal(m, 2.0, 0.5), 0.17, pan=rng.uniform(-0.5, 0.5))
for t0 in np.arange(7.2, 14.0, 1.2):
    put(mus, t0, kick(0.9), 0.20); put(mus, t0 + 0.26, kick(0.7), 0.13)

# ---------------- dawn build (14.4 – 19.2)
put(mus, 14.4, pad(CH['Fhi'][1] + [53], BAR, 1.2, 0.5) * np.linspace(0.3, 1, int((BAR + 0.5) * SR)), 0.30)
put(mus, 16.8, pad(CH['Ghi'][1] + [55], BAR, 0.4, 0.5) * np.linspace(0.7, 1.25, int((BAR + 0.5) * SR)), 0.34)
arp(14.4, 'F', 0.30, up=True, cres=(0.3, 0.8)); arp(16.8, 'G', 0.34, up=True, cres=(0.8, 1.25))
put(mus, 14.4, bass(41, 2.2), 0.22); put(mus, 16.8, bass(43, 2.2), 0.3)
sw = hp(noise(4.6), 5000) * np.linspace(0, 1, int(4.6 * SR)) ** 2.5; put(mus, 14.6, sw, 0.05)
for i in range(4): put(mus, 18.0 + i * 0.3, kick(), 0.18 + i * 0.05)       # pick-up into the groove
put(mus, 19.2, hp(noise(1.6), 4000) * np.exp(-tt(1.6) * 3.2), 0.07)          # soft crash

# ---------------- upbeat groove (19.2 – 34.4)
MEL = {'C': [76, 79, 84, 79], 'G': [74, 79, 83, 79], 'Am': [72, 76, 81, 76], 'F': [72, 77, 81, 84]}
prog = ['C', 'G', 'Am', 'F', 'C', 'G', 'F']
for k, ch in enumerate(prog):
    t0 = 19.2 + k * BAR; last = k == len(prog) - 1
    nb = 2 if last else 4                                                   # last bar: stop after 2 beats
    b, ts = CH[ch]
    put(mus, t0, pad(ts + [ts[0] + 12], nb * BEAT, 0.15, 0.4), 0.17)
    arp(t0, ch, 0.36, n8=nb * 2)
    for bt, m in [(0, b), (1.5, b), (2, b + 7), (3, b), (3.5, b + 7)]:
        if bt < nb: put(mus, t0 + bt * BEAT, bass(m + (12 if b < 40 else 0), 0.45), 0.42)
    for bt in range(nb):
        if bt % 2 == 0: put(mus, t0 + bt * BEAT, kick(), 0.34)
        else: put(mus, t0 + bt * BEAT, snap(), 0.11, pan=0.1)
    for i in range(nb * 2): put(mus, t0 + i * 0.3, shaker(), 0.075 if i % 2 else 0.04, pan=-0.3)
    mel = MEL[ch]
    for i, bt in enumerate([0, 1, 1.5, 2.5][:4 if not last else 2]):
        put(mus, t0 + bt * BEAT, kal(mel[i], 1.6, 1.2), 0.30, pan=0.15)
if True:                                                                    # G stab closing the phrase, then a break
    put(mus, 33.6 + 2 * BEAT, pad(CH['Ghi'][1], 0.5, 0.03, 0.3), 0.22)
    for m in (67, 71, 74, 79): put(mus, 33.6 + 2 * BEAT, kal(m, 0.9), 0.24)
    put(mus, 33.6 + 2 * BEAT, bass(43, 0.5), 0.42); put(mus, 33.6 + 2 * BEAT, kick(), 0.34)

# ---------------- final chord with the flash (35.55)
TF = 35.55
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.40)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.30, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.5); put(mus, TF, kick(), 0.4)
put(mus, TF, hp(noise(1.5), 3500) * np.exp(-tt(1.5) * 3.0), 0.10)

# ---------------- sound effects
t = tt(0.95); f = 1500 * (520 / 1500) ** (t / 0.95) * (1 + 0.012 * np.sin(2 * np.pi * 7 * t))
put(sfx, 0.15, fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.95) ** 0.6, 0.02, 0.05), 0.10)      # slide in
put(sfx, 0.15, whoosh(0.95, 2500, 500), 0.10)
put(sfx, 1.08, pop(320, 950), 0.30)                                                                                       # landing
for i, fq in enumerate([1568, 2093, 2637]): put(sfx, 1.6 + i * 0.07, chime(fq, 0.7), 0.05, pan=0.4)                      # wave
put(sfx, 6.4, whoosh(0.85, 1800, 180), 0.22); put(sfx, 7.15, lp(noise(0.9), 90) * np.exp(-tt(0.9) * 4), 0.9)              # world turns dark
th = lp(noise(2.6), 140) * np.minimum(1, tt(2.6) / 0.04) * np.exp(-tt(2.6) * 1.7) * (1 + 0.5 * np.sin(2 * np.pi * 5 * tt(2.6)))
put(sfx, 9.0, th, 1.1); put(sfx, 9.0, bp(noise(0.25), 800, 5000) * np.exp(-tt(0.25) * 25), 0.10)                          # lightning + thunder
put(sfx, 11.66, chime(1760, 0.9), 0.10, pan=0.3)                                                                           # "ma sai cosa?"
t = tt(1.5); hum = np.sin(2 * np.pi * np.cumsum(110 * (220 / 110) ** (t / 1.5)) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(220 * (440 / 220) ** (t / 1.5)) / SR)
put(sfx, 16.75, fade(hum * (t / 1.5) ** 1.5, 0.05, 0.25), 0.10)                                                            # reactor opens
for i in range(10): put(sfx, 17.2 + i * 0.09 + rng.uniform(0, 0.03), chime(midi(rng.choice([84, 88, 91, 96, 100])), 0.9), 0.045, pan=rng.uniform(-0.7, 0.7))
put(sfx, 21.08, whoosh(0.3, 3000, 900), 0.10)                                                                              # hard hat
t = tt(0.16); put(sfx, 21.38, np.sin(2 * np.pi * np.cumsum(520 * np.exp(-t * 6)) / SR) * np.exp(-t * 30) + 0.4 * bp(noise(0.16), 1500, 4000) * np.exp(-t * 80), 0.30)
for i, (ti, f0) in enumerate([(25.15, 500), (25.54, 600), (26.70, 720), (27.56, 860)]):                                    # icons
    put(sfx, ti, pop(f0, f0 * 2.2), 0.26, pan=-0.4 if i % 2 == 0 else 0.4); put(sfx, ti + 0.05, chime(f0 * 4, 0.5), 0.04, pan=-0.4 if i % 2 == 0 else 0.4)
put(sfx, 28.4, whoosh(0.7, 700, 3200), 0.12)                                                                               # icons and hat leave
put(sfx, 33.80, chime(2637, 0.9), 0.11, pan=0.3); put(sfx, 33.88, chime(3520, 0.8), 0.06, pan=0.3)                        # wink
put(sfx, 34.9, whoosh(0.68, 250, 5000, shape='rise'), 0.36)                                                                # fly to camera
put(sfx, TF, lp(noise(0.8), 110) * np.exp(-tt(0.8) * 5), 1.0)

# ---------------- reverb + export
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx.wav', sfx * endf, SR, subtype='PCM_24')
print('peaks', np.abs(mus).max(), np.abs(sfx).max())
