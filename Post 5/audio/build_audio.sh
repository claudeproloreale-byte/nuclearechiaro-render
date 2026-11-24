#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalla registrazione in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
cp ../sorgenti/Voce_5-mejorada-v2.wav voce_in.wav
python3 detect5.py     # le 23 frasi nella registrazione (soglia -50 dB) -> phrases_raw.json
python3 voice_ep5.py   # montaggio sulla scaletta (senza saluto: si parte dallo zoom nella centrale), livellamento, EQ, compressione
                       #   -> voice_fx.wav, phrases.json (25 frasi), warp5.json (tabella WARP di ../video/ep5.js), ../video/lip5.js
python3 music5.py      # musica (kalimba, 100 bpm) ed effetti sonori; tempi di fissioni, catture e urti sull'acqua da events5.json
python3 mix5.py -1.6 0 -5
                       # mix: musica a -5 dB ovunque e più bassa sotto la voce; volume finale circa -14,4 LUFS
mv mix5.wav mix_final.wav
rm -f voce_in.wav voice_edit.wav music5.wav sfx5.wav
echo "mix_final.wav pronto"
