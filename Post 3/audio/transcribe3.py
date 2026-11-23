# Trascrizione automatica di controllo (Whisper "small" via sherpa-onnx), frase per frase.
# uso: python3 transcribe3.py <cartella modello> <voce 16 kHz .wav> <phrases.json>
import sys, json, soundfile as sf, sherpa_onnx
d = sys.argv[1]
r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + '/small-encoder.int8.onnx', decoder=d + '/small-decoder.int8.onnx', tokens=d + '/small-tokens.txt', language='it', task='transcribe', num_threads=2)
a, sr = sf.read(sys.argv[2], dtype='float32'); PH = json.load(open(sys.argv[3]))
for i, (s, e) in enumerate(PH):
    st = r.create_stream(); st.accept_waveform(sr, a[int(max(0, s - 0.25) * sr):int((e + 0.3) * sr)]); r.decode_stream(st)
    print(i, '%.2f-%.2f' % (s, e), '|', st.result.text.strip(), flush=True)
