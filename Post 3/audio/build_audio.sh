#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalla registrazione in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
python3 voice_ep3.py   # voce (versione Adobe Podcast): frasi, pause tagliate a 0,9 s (1,2 s prima della battuta 5), +2 s dopo
                       #   "e il ciclo ricomincia", livellamento, EQ, compressione
                       #   -> voice_fx.wav, phrases_raw.json, phrases.json (tempi delle frasi), ../video/lip3.js (labiale)
python3 music3.py      # musica (kalimba, 100 bpm) ed effetti sonori sintetizzati, sui tempi di warp3.json -> music3.wav, sfx3.wav
python3 mix3.py -1.6 0 -5
                       # mix: musica 5 dB più bassa ovunque e altri 5 dB sotto la voce, volume finale circa -14,5 LUFS
mv mix3.wav mix_final.wav
echo "mix_final.wav pronto"
