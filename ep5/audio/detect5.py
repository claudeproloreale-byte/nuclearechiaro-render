# Rileva le frasi nella registrazione: soglia -50 dB su finestre di 10 ms, pause interne < 0,35 s unite, frasi < 0,15 s scartate.
import soundfile as sf, numpy as np, json
a, sr = sf.read('voce_in.wav', dtype='float64')
h = int(sr*0.01); m = len(a)//h; r = 20*np.log10(np.sqrt((a[:m*h].reshape(m,h)**2).mean(1))+1e-12)
on = r > -50; segs = []; i = 0
while i < m:
    if on[i]:
        j = i
        while j < m and on[j]: j += 1
        segs.append([i*0.01, j*0.01]); i = j
    else: i += 1
mg = []
for s, e in segs:
    if mg and s - mg[-1][1] < 0.35: mg[-1][1] = e
    else: mg.append([s, e])
mg = [[round(s,2), round(e,2)] for s, e in mg if e - s > 0.15]
json.dump(mg, open('phrases_raw.json','w')); print(len(mg)); print(mg)
print('picco dBFS %.1f' % (20*np.log10(np.abs(a).max())))
