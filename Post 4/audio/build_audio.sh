#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalla registrazione in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
python3 voice_ep4.py   # voce (versione Adobe Podcast, "Ciao" originale): frasi da phrases_raw.json, pause a 0,9 s al massimo,
                       #   allungate dove serve all'animazione (volo e urto, zoom su F, barrette), livellamento, EQ, compressione
                       #   -> voice_fx.wav, phrases.json (tempi delle 23 frasi), ../video/lip4.js (labiale)
python3 warp4.py       # tempi della scaletta -> tempi reali (warp4.json, la stessa tabella WARP scritta in ../video/ep4.js)
python3 music4.py      # musica (kalimba, 100 bpm) ed effetti sonori sintetizzati; tempi di fissioni, catture e rimbalzi da events4.json
python3 mix4.py -1.6 0 -5
                       # mix: musica 5 dB più bassa ovunque e altri 5 dB sotto la voce, volume finale circa -14,3 LUFS
mv mix4.wav mix_final.wav
echo "mix_final.wav pronto"
