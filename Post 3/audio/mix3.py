# Puntata 3 — mix: voce + musica (abbassata automaticamente sotto il parlato) + effetti.
# uso: python3 mix3.py [guadagno finale in dB] [guadagno voce in dB] [livello musica in dB]
#   versione definitiva (19/11/2026):  python3 mix3.py -1.6 0 -5   (-10 è sembrato troppo basso: via di mezzo)
import soundfile as sf, numpy as np, subprocess, sys
GAIN = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
VOICE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
# livello della musica ovunque, pause comprese: -10 dB, come deciso dall'autore per la puntata 2 (17/11/2026) e per le successive
MUSIC_DB = float(sys.argv[3]) if len(sys.argv) > 3 else -5.0
# la voce "enhanced" ha picchi molto alti rispetto al volume medio: si domano qui prima del mix
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice_fx.wav', '-af',
                'volume=9.5dB,alimiter=limit=0.7:level=false:attack=3:release=50', 'voice_lim.wav'], check=True)
v, sr = sf.read('voice_lim.wav'); m, _ = sf.read('music3.wav'); m = m * 10 ** (MUSIC_DB / 20); s, _ = sf.read('sfx3.wav'); N = len(m)
v = np.concatenate([v, np.zeros(max(0, N - len(v)))])[:N]
db = lambda x: 10 ** (x / 20)
v = v * db(VOICE)
h = int(0.01 * sr); n = N // h; r = np.sqrt((v[:n * h].reshape(n, h) ** 2).mean(1)); act = (r > db(-38)).astype(float)
env = np.zeros(n); e = 0
for i in range(n):
    e += (act[i] - e) * (0.25 if act[i] > e else 0.035); env[i] = e
env = np.interp(np.arange(N) / sr, (np.arange(n) + 0.5) * 0.01, env)
t = np.arange(N) / sr
TF = 64.40
mg = db(-12.5) * db(-5.0 * env)                        # musica: circa 13-18 dB sotto la voce
mg *= db(4.5 * np.clip((t - (TF - 0.6)) / 0.5, 0, 1))  # l'accordo finale sale
mix = m * mg[:, None] + s * db(-3.5) + np.stack([v, v], 1)
sf.write('mix3_pre.wav', mix, sr, subtype='FLOAT')
print('picco pre-mix', abs(mix).max(), ' voce rms nel parlato %.1f dB' % (20 * np.log10(np.sqrt((v[env > 0.8] ** 2).mean()))))
# volume finale: guadagno fisso + limitatore a -1,5 dBFS (obiettivo circa -14,5 LUFS, picco reale entro -1,3)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'mix3_pre.wav', '-af',
                'volume=%.2fdB,alimiter=limit=0.84:level=false:attack=3:release=60' % GAIN, '-c:a', 'pcm_s24le', 'mix3.wav'], check=True)
