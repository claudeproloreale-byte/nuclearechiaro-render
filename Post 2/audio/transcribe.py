# Trascrizione automatica di controllo della voce (Whisper "small" tramite sherpa-onnx).
# uso: python3 transcribe.py <cartella del modello> <voce a 16 kHz mono .wav> <phrases.json>
# modello: pip install sherpa-onnx; archivio sherpa-onnx-whisper-small.tar.bz2 dalle release "asr-models" di github.com/k2-fsa/sherpa-onnx
import sys, json, numpy as np, soundfile as sf, sherpa_onnx
d = sys.argv[1]
r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + '/small-encoder.int8.onnx', decoder=d + '/small-decoder.int8.onnx', tokens=d + '/small-tokens.txt', language='it', task='transcribe', num_threads=2)
a, sr = sf.read(sys.argv[2], dtype='float32'); PH = json.load(open(sys.argv[3]))
def tr(s, e):
    st = r.create_stream(); st.accept_waveform(sr, a[int(max(0, s - 0.25) * sr):int((e + 0.3) * sr)]); r.decode_stream(st); return st.result.text.strip()
print('--- per frase'); 
for i, (s, e) in enumerate(PH): print(i, '%.2f-%.2f' % (s, e), '|', tr(s, e))
print('--- per battuta')
for s, e in ((0.5, 9.2), (10.0, 16.7), (16.8, 20.8), (21.2, 32.9), (33.2, 41.5), (42.0, 45.8), (46.8, 53.9), (54.1, 56.8)): print('%.1f-%.1f' % (s, e), '|', tr(s, e))
