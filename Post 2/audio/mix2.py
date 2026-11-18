# Puntata 2 — mix: voce + musica (abbassata automaticamente sotto il parlato) + effetti.
# uso: python3 mix2.py [guadagno finale dB] [ritocco voce dB] [file musica] [file di uscita] [abbassamento musica sotto la voce, dB] [livello musica dB]
#   versione definitiva (17/11/2026, sera):  python3 mix2.py -1.4 0 music2.wav mix2.wav 5 -5
import soundfile as sf, numpy as np, subprocess, sys
GAIN = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
VOICE = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
MUSIC = sys.argv[3] if len(sys.argv) > 3 else 'music2.wav'
OUT = sys.argv[4] if len(sys.argv) > 4 else 'mix2.wav'
DUCK = float(sys.argv[5]) if len(sys.argv) > 5 else 5.0   # di quanti dB scende la musica mentre la voce parla
# livello della musica ovunque, pause comprese. L'autore l'ha scelto a -10 dB (17/11/2026): a -3/-6 dB solo sotto la voce
# la differenza non si sentiva, perché la musica era già circa 18,6 dB sotto il parlato; si sentiva soprattutto nelle pause.
MUSIC_DB = float(sys.argv[6]) if len(sys.argv) > 6 else -5.0   # -10 è sembrato troppo basso: scelta a metà strada (17/11 sera)
# la voce "enhanced" ha picchi molto alti rispetto al volume medio: si domano qui prima del mix
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'voice3_fx.wav', '-af',
                'volume=9.5dB,alimiter=limit=0.7:level=false:attack=3:release=50', 'voice3_lim.wav'], check=True)
v, sr = sf.read('voice3_lim.wav'); m, _ = sf.read(MUSIC); m = m * 10 ** (MUSIC_DB / 20); s, _ = sf.read('sfx2.wav'); N = len(m)
v = np.concatenate([v, np.zeros(max(0, N - len(v)))])[:N]
db = lambda x: 10 ** (x / 20)
v = v * db(VOICE)
h = int(0.01 * sr); n = N // h; r = np.sqrt((v[:n * h].reshape(n, h) ** 2).mean(1)); act = (r > db(-38)).astype(float)
env = np.zeros(n); e = 0
for i in range(n):
    e += (act[i] - e) * (0.25 if act[i] > e else 0.035); env[i] = e
env = np.interp(np.arange(N) / sr, (np.arange(n) + 0.5) * 0.01, env)
t = np.arange(N) / sr
TF = 56.76
mg = db(-12.5) * db(-DUCK * env)                       # musica: circa 13 dB sotto la voce nelle pause, 18 (o DUCK+13) sotto il parlato
mg *= db(4.5 * np.clip((t - (TF - 0.6)) / 0.5, 0, 1))  # l'accordo finale sale
mix = m * mg[:, None] + s * db(-3.5) + np.stack([v, v], 1)
sf.write('mix2_pre.wav', mix, sr, subtype='FLOAT')
print('picco pre-mix', abs(mix).max(), ' voce rms nel parlato %.1f dB' % (20 * np.log10(np.sqrt((v[env > 0.8] ** 2).mean()))))
# volume finale: guadagno fisso + limitatore a -1,5 dBFS (obiettivo circa -14,5 LUFS, picco reale entro -1,3)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'mix2_pre.wav', '-af',
                'volume=%.2fdB,alimiter=limit=0.84:level=false:attack=3:release=60' % GAIN, '-c:a', 'pcm_s24le', OUT], check=True)
