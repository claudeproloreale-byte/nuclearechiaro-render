#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalla registrazione in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
python3 voice3.py      # voce (versione Adobe Podcast): livellamento, +0,5 s di pausa prima di "Oggi quel qualcun altro", EQ, compressione
                       #   -> voice3_fx.wav, phrases3.json (tempi delle frasi), ../video/lip2.js (labiale)
python3 music2.py      # musica (kalimba, 100 bpm) ed effetti sonori sintetizzati -> music2.wav, sfx2.wav
python3 mix2.py -1.4 0 music2.wav mix_final.wav 5 -5
                       # mix: musica 5 dB più bassa ovunque e altri 5 dB sotto la voce, volume finale circa -14,5 LUFS
echo "mix_final.wav pronto"
