# Puntata 7 — tracce per l'app (voce, effetti, musica) già ai livelli del canale, più un mix di riferimento.
# Nell'app (Audio › Regolazione) 0 dB = questi livelli; il mix finale (circa -14,5 LUFS, picco -1,3 dBFS) si fa nel ciclo "finale".
# Musica a -5 dB ovunque e più bassa sotto la voce (stesso metodo di Post 6/audio/mix6.py); effetti -3,5 dB.
import soundfile as sf, numpy as np, subprocess, json, re, os
SUF = '_tt' if os.environ.get('VERSIONE') == 'tiktok' else ''   # versione TikTok (vedi voice_ep7.py)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_fx' + SUF + '.wav', '-af',
                'volume=9.5dB,alimiter=limit=0.7:level=false:attack=3:release=50', 'voice_lim' + SUF + '.wav'], check=True)
v, sr = sf.read('voice_lim' + SUF + '.wav'); m, _ = sf.read('music7' + SUF + '.wav'); s, _ = sf.read('sfx7' + SUF + '.wav'); N = len(m)
v = np.concatenate([v, np.zeros(max(0, N - len(v)))])[:N]
db = lambda x: 10 ** (x / 20)
h = int(0.01 * sr); n = N // h; r = np.sqrt((v[:n * h].reshape(n, h) ** 2).mean(1)); act = (r > db(-38)).astype(float)
env = np.zeros(n); e = 0
for i in range(n):
    e += (act[i] - e) * (0.25 if act[i] > e else 0.035); env[i] = e
env = np.interp(np.arange(N) / sr, (np.arange(n) + 0.5) * 0.01, env)
t = np.arange(N) / sr
W = json.load(open('warp7' + SUF + '.json'))
def w(tau):
    for (o0, n0), (o1, n1) in zip(W, W[1:]):
        if tau <= o1: return n0 + (n1 - n0) * (tau - o0) / (o1 - o0)
    return W[-1][1]
TF = w(92.9)
mg = db(-5.0) * db(-12.5) * db(-5.0 * env) * db(4.5 * np.clip((t - (TF - 0.6)) / 0.5, 0, 1))
M = m * mg[:, None]; S = s * db(-3.5); V = np.stack([v, v], 1)
sf.write('mix_pre' + SUF + '.wav', M + S + V, sr, subtype='FLOAT')
out = subprocess.run(['ffmpeg', '-i', 'mix_pre' + SUF + '.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
L = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
G = db(-14.5 - L)
pk = np.abs((M + S + V) * G).max()
print('LUFS prima %.1f, guadagno %.1f dB, picco della somma %.1f dBFS' % (L, 20 * np.log10(G), 20 * np.log10(pk)))
sf.write('t_voce' + SUF + '.wav', v * G, sr, subtype='PCM_24'); sf.write('t_effetti' + SUF + '.wav', S * G, sr, subtype='PCM_24'); sf.write('t_musica' + SUF + '.wav', M * G, sr, subtype='PCM_24')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'mix_pre' + SUF + '.wav', '-af',
                'volume=%.2fdB,alimiter=limit=0.84:level=false:attack=3:release=60' % (20 * np.log10(G)), '-c:a', 'pcm_s24le', 'mix7' + SUF + '.wav'], check=True)
