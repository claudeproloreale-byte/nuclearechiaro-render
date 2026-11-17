# Labiale: apertura della bocca per ogni fotogramma (30 fps), ricavata dal volume della voce.
# Serve SOLO se si cambia la voce: i valori usati nel video pubblicato sono già dentro video/intro.js (costante LIP)
# e in video/lip.json. Uso: python3 lip.py voice_fx.wav ../video/lip_nuovo.json
import sys, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfiltfilt
a, sr = sf.read(sys.argv[1]); FPS = 30; N = int(37.0 * FPS)
lo = sosfiltfilt(butter(4, [100, 1200], 'bandpass', fs=sr, output='sos'), a)
w = int(0.04 * sr); op = []; cen = []
for f in range(N):
    c = int((f / FPS + 0.02) * sr); x = lo[max(0, c - w // 2):c + w // 2]; y = a[max(0, c - w // 2):c + w // 2]
    op.append(20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9))
    S = abs(np.fft.rfft(y * np.hanning(len(y)))) ** 2; fr = np.fft.rfftfreq(len(y), 1 / sr); m = (fr > 250) & (fr < 3200)
    cen.append((S[m] * fr[m]).sum() / (S[m].sum() + 1e-12))
op = np.array(op); cen = np.array(cen); p = -14.9
o = np.clip((op - (p - 24)) / 21, 0, 1) ** 0.85; o = np.convolve(o, [0.2, 0.6, 0.2], 'same')
nar = np.clip((1150 - cen) / 600, 0, 1) * (o > 0.05); nar = np.convolve(nar, [0.25, 0.5, 0.25], 'same')
act = (op > p - 30).astype(float); k = np.hanning(13); env = np.clip(np.convolve(act, k / k.sum(), 'same') * 1.3, 0, 1)
json.dump({'open': [round(float(v), 3) for v in o], 'narrow': [round(float(v), 3) for v in nar], 'env': [round(float(v), 3) for v in env]}, open(sys.argv[2], 'w'))
