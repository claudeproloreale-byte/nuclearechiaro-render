# Ripristina il "Ciao" della prima registrazione (preferito dall'autore): i primi 1,72 s della voce
# tornano quelli della ripresa 1 (voice_fx_take1.wav, salvata da patch_voice.py).
import soundfile as sf, numpy as np
a, sr = sf.read('voice_fx.wav'); old, _ = sf.read('voice_fx_take1.wav')
k = int(1.72 * sr); a[:k] = np.clip(old[:k], -0.7, 0.7)
sf.write('voice_fx.wav', a, sr, subtype='PCM_16')
