#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalla registrazione in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
cp ../sorgenti/Voce_6-mejorada-v2.wav voce_in.wav
python3 detect6.py     # le 27 frasi nella registrazione (soglia -50 dB) -> phrases_raw.json
python3 voice_ep6.py   # montaggio sulla scaletta, eventi agganciati alle parole, livellamento, EQ, compressione
                       #   -> voice_fx.wav, phrases.json, warp6.json (tabella WARP di ../video/tempi.js), ../video/lip6.js
python3 music6.py      # musica (kalimba, 100 bpm) ed effetti; tempi di fissioni, catture e urti sull'acqua da events6.json
python3 mix6.py -1.2 0 -5
                       # mix: musica a -5 dB ovunque e più bassa sotto la voce; volume finale -14,5 LUFS, picco -1,4 dBFS
mv mix6.wav mix_final.wav
rm -f voce_in.wav voice_edit.wav voice_lim.wav mix6_pre.wav music6.wav sfx6.wav v16.wav
echo "mix_final.wav pronto"
