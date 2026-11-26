# Puntata 6 — musica ed effetti sonori sintetizzati. Stessi strumenti della puntata 5 (100 bpm, do maggiore, kalimba),
# struttura sulle scene della puntata 6. Gli effetti usano i tempi "di scaletta" convertiti con warp6.json;
# fissioni, neutroni assorbiti e urti sulle molecole d'acqua vengono da events6.json (video/print_events.js).
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve

WARP = json.load(open('warp6.json')); EV = json.load(open('events6.json'))
SR = 48000; TOTAL = WARP[-1][1]; N = int(SR * TOTAL)
rng = np.random.default_rng(16)
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
# v10: la musica segue le scene sui tempi di scaletta (il video è più lungo per le pause fra le battute e il fungo).
# Ogni sezione riempie le battute (2,4 s) da dove comincia fino alla sezione dopo, ripetendo i suoi accordi.
def sezione(k, kind, ch, i):
    if kind == 'still': still(B(k), ch, 0.2)
    elif kind == 'calm': calm(B(k), ch, 0.28)
    elif kind == 'rise': rise(B(k), ch, 0.28, (0.6 + 0.1 * (i % 2), 0.9 + 0.1 * (i % 2)))
    elif kind == 'groove': groove(B(k), ch, mel=i % 2 == 1, drums=0.5)
    elif kind == 'chain': groove(B(k), ch, mel=i % 2 == 1, drums=0.9 + 0.1 * (i % 2))
SEZ = [(0.0, 'still', ['Am', 'F']),                      # la bomba fra i carri armati, la domanda
       (4.4, 'rise', ['Dm', 'G']),                       # "No." e zoom dentro la bomba
       (8.55, 'calm', ['Am', 'F', 'Am', 'G']),           # atomi della bomba: quasi tutto uranio 235
       (15.3, 'rise', ['Am']),                           # il neutrone entra
       (16.0, 'chain', ['F', 'G', 'F', 'G']),            # catena velocissima fino al lampo (poi silenzio sotto il bianco e il fungo)
       (21.6, 'calm', ['C', 'G']),                       # la centrale: "completamente diverso"
       (23.3, 'rise', ['Am']), (25.5, 'still', ['F', 'C', 'Am']),   # zoom nel nocciolo, barre, pastiglia
       (29.4, 'groove', ['Am', 'F']),                    # un U-235 si spacca, gli U-238 assorbono
       (33.8, 'still', ['Am', 'F', 'Dm', 'Am']),         # l'acqua rallenta il neutrone, il neutrone lento si avvicina
       (36.9, 'rise', ['G']),                            # cattura
       (37.4, 'calm', ['C']),                            # BB si spacca
       (38.4, 'rise', ['Am', 'F']), (42.7, 'still', ['Dm', 'G']),   # il nocciolo si scalda; la reazione rallenta da sola
       (44.4, 'groove', ['C', 'G', 'Am', 'F'])]          # ritorno alla centrale fino alla fine
TF = w(53.9)
kend = int(TF / BAR)
for n, (ts, kind, chs) in enumerate(SEZ):
    k0 = int(round(w(ts) / BAR)); k1 = int(round(w(SEZ[n + 1][0]) / BAR)) if n + 1 < len(SEZ) else kend
    for i, k in enumerate(range(k0, k1)): sezione(k, kind, chs[i % len(chs)], i)
TFL = w(19.95)                                   # lampo pieno: la musica si ferma qui
# ---------------- la mascotte esce: accordo finale
put(mus, TF, pad([48, 55, 60, 64, 67, 72], 0.5, 0.02, 1.4), 0.36)
for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]): put(mus, TF + i * 0.035, kal(m, 1.6, 1.2), 0.28, pan=-0.5 + i * 0.16)
put(mus, TF, bass(36, 1.2), 0.45); put(mus, TF, kick(), 0.36)
# la musica tace sotto il lampo bianco (da "energia" fino a quando il bianco si dirada) e riprende con la centrale
tm = np.arange(N) / SR
mus *= (1 - np.clip((tm - TFL + 0.05) / 0.12, 0, 1) * np.clip((w(21.6) + 0.3 - tm) / 0.5, 0, 1))[:, None]   # v10: tace anche sul fungo

# ---------------- effetti sonori (tempi di scaletta -> reali)
flash = lambda tg, a=0.05: (put(sfx, w(tg) - 0.05, hp(noise(0.5), 2500) * np.exp(-tt(0.5) * 7), a), put(sfx, w(tg), chime(midi(91), 0.7), 0.6 * a))
put(sfx, w(0.2), pop(320, 950), 0.2, pan=0.6)                                                           # la mascotte compare nell'angolo
D0 = w(8.6)                                                                                             # carri armati in lontananza: rombo basso e cingoli, discreto
put(sfx, 0, lp(noise(D0), 120) * np.minimum(1, tt(D0) / 0.8) * np.clip((D0 - tt(D0)) / 1.5, 0, 1), 0.10)
clank = np.zeros(int(D0 * SR))
for i in range(int(D0 / 0.19)):
    x = bp(noise(0.04), 1800, 4200) * np.exp(-tt(0.04) * 90); j = int(i * 0.19 * SR + rng.uniform(0, 0.03) * SR); clank[j:j + len(x)] += x[:len(clank) - j] * rng.uniform(0.5, 1)
put(sfx, 0, clank * np.clip((D0 - tt(D0)) / 1.5, 0, 1), 0.012, pan=-0.3)
put(sfx, w(4.4), whoosh(w(8.6) - w(4.4), 300, 1500), 0.08)                                              # zoom dentro la bomba fino all'uranio
for tg, a in ((8.55, 0.05), (21.6, 0.05), (25.5, 0.05), (44.5, 0.05)): flash(tg, a)                                    # lampi di passaggio
put(sfx, w(8.6), whoosh(w(11.3) - w(8.6), 1200, 500), 0.05)                                             # la camera si avvicina agli atomi
put(sfx, w(15.36), whoosh(w(16.0) - w(15.36), 2500, 6000, shape='rise'), 0.06, pan=-0.4)               # il neutrone entra velocissimo
BIG = {16.0, 30.6, 37.4}
nb = 0
for j, tc in enumerate(EV['fiss']):                                                                      # fissioni: nella bomba una pioggia fitta
    big = any(abs(tc - b) < 0.01 for b in BIG)
    if big: boom(w(tc), 1.2, pan=0.0, big=True); continue
    nb += 1; boom(w(tc), 0.16 + 0.12 * min(1, nb / 40), pan=float(np.clip(np.sin(j * 2.1) * 0.7, -0.7, 0.7)), big=False)
R = w(19.95) - w(17.0)                                                                                  # la catena sale verso il lampo
put(sfx, w(17.0), whoosh(R, 200, 3000, shape='rise'), 0.16)
put(sfx, w(17.0), lp(noise(R), 150) * (tt(R) / R) ** 2, 0.35)
TB = w(19.95)                                                                                            # lampo bianco: colpo pieno e morbido, scintillio che si spegne
put(sfx, TB, lp(noise(2.5), 90) * np.exp(-tt(2.5) * 1.6), 0.9); put(sfx, TB, kick(), 0.7)
put(sfx, TB, hp(noise(3.0), 2500) * np.exp(-tt(3.0) * 1.3), 0.06)
for i, m in enumerate([72, 79, 84, 88, 91, 96]): put(sfx, TB + 0.05 + i * 0.07, chime(midi(m), 2.5), 0.04, pan=-0.5 + i * 0.2)
DF = w(21.6) - w(20.6)                                                                                  # v10: il fungo sale: rombo basso e morbido che si allarga e si spegne
put(sfx, w(20.6), lp(noise(DF + 0.6), 110) * np.minimum(1, tt(DF + 0.6) / 0.3) * np.clip((DF + 0.6 - tt(DF + 0.6)) / 1.0, 0, 1), 0.45)
put(sfx, w(20.6), whoosh(DF, 180, 600), 0.06)
for j, ta in enumerate(EV['abs']):                                                                       # neutroni assorbiti
    put(sfx, w(ta), lp(pop(320, 200, 0.12), 1400), 0.03 if ta < 25 else 0.08, pan=float(np.sin(j * 1.3) * 0.5))
for j, tm_ in enumerate(EV['mol']):                                                                      # urti sulle molecole d'acqua: goccia
    put(sfx, w(tm_), pop(900, 1700, 0.06), 0.07, pan=float(np.sin(j * 1.9) * 0.4)); put(sfx, w(tm_), chime(midi(93), 0.3), 0.012)
put(sfx, w(23.3), whoosh(w(24.9) - w(23.3), 400, 1300), 0.08)                                           # la cupola si apre, zoom nel nocciolo
put(sfx, w(25.6), whoosh(w(28.3) - w(25.6), 1100, 400), 0.07)                                           # dentro la barra e la pastiglia
put(sfx, w(28.0), whoosh(w(30.6) - w(28.0), 600, 1800, shape='rise'), 0.04, pan=0.4)                   # il neutrone lento arriva (B7)
for tc, tg in ((30.6, 30.45), (37.4, 37.164)):                                                           # cattura: l'alone "tira" dentro il neutrone lento
    sweep(w(tg) - 0.1, w(tc) - w(tg) + 0.15, 500, 1200, 0.05, shape=0.8)
    put(sfx, w(tg), chime(midi(84), 1.0), 0.03)
put(sfx, w(37.6), whoosh(w(38.9) - w(37.6), 900, 400), 0.05)                                            # la camera passa all'acqua della B9
TH0 = w(38.5); put(sfx, TH0, pop(420, 1050), 0.15, pan=-0.6)                                            # il termometro compare
sweep(w(39.1), w(40.5) - w(39.1) + 0.2, 500, 1300, 0.05, pan=-0.6); sweep(w(42.7), w(43.8) - w(42.7) + 0.2, 1300, 450, 0.05, pan=-0.6)
bub = np.zeros(int(2.0 * SR))                                                                           # le molecole d'acqua si allontanano e tremano
for i in range(30):
    t0 = rng.uniform(0, 1.8); f0 = rng.uniform(600, 1400); x = pop(f0, f0 * 1.8, 0.05); j = int(t0 * SR); bub[j:j + len(x)] += x * rng.uniform(0.4, 1)
put(sfx, w(39.9), bub * np.minimum(1, tt(2.0) / 0.3) * np.minimum(1, (2.0 - tt(2.0)) / 0.6), 0.05)
put(sfx, w(40.8), whoosh(w(42.6) - w(40.8), 2500, 5500)[::-1], 0.06, pan=0.3)                           # il neutrone veloce passa senza rimbalzare
put(sfx, w(44.2) - 0.15, pop(1050, 420), 0.1, pan=-0.6)                                                  # il termometro sparisce
put(sfx, w(45.8), whoosh(w(46.8) - w(45.8), 1200, 400), 0.06)                                           # la cupola si richiude
put(sfx, w(46.8), lp(noise(0.3), 300) * np.exp(-tt(0.3) * 14), 0.25)
put(sfx, w(51.9), pop(700, 1400, 0.08), 0.1, pan=0.6)                                                   # la mascotte indica i commenti
put(sfx, w(53.9) - 0.2, pop(950, 320, 0.16), 0.2, pan=0.6)                                              # la mascotte esce

# ---------------- riverbero ed esportazione
ir = rng.standard_normal((int(1.1 * SR), 2)) * np.exp(-tt(1.1) * 5.5)[:, None]; ir = hp(ir.T, 300).T; ir /= np.sqrt((ir ** 2).sum(0))
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir[:, c])[:N] for c in (0, 1)], 1)
mus = verb(mus, 0.22); sfx = verb(sfx, 0.18)
endf = np.clip((TOTAL - np.arange(N) / SR) / 0.5, 0, 1)[:, None]
sf.write('music6.wav', mus * endf, SR, subtype='PCM_24'); sf.write('sfx6.wav', sfx * endf, SR, subtype='PCM_24')
print('picchi', np.abs(mus).max(), np.abs(sfx).max(), 'lampo', round(TFL, 2), 'accordo finale', round(TF, 2))
