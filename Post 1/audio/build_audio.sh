#!/bin/bash
# Ricostruisce la traccia audio finale (mix_final.wav) dalle due registrazioni in ../sorgenti.
# Richiede: python3 con numpy, scipy, soundfile; ffmpeg.
set -e
cd "$(dirname "$0")"
python3 voice.py                                                  # ripresa 1: pulizia, livellamento, tempi, equalizzazione -> voice_fx.wav
ffmpeg -y -loglevel error -i ../sorgenti/Modifica_1.m4a -ac 1 -ar 48000 new_raw.wav
python3 patch_voice.py                                            # primi 6 s rifatti ("funzionare") -> voice_fx.wav (salva voice_fx_take1.wav)
ffmpeg -y -loglevel error -i voice_fx.wav -af "alimiter=limit=0.7:level=disabled" -ar 48000 vtmp.wav && mv vtmp.wav voice_fx.wav
python3 ciao.py                                                   # "Ciao" della ripresa 1
python3 music.py                                                  # musica e effetti sintetizzati -> music.wav, sfx.wav
python3 mix.py                                                    # mix con la musica che si abbassa sotto la voce -> mix_pre.wav
I=$(ffmpeg -hide_banner -nostats -i mix_pre.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | awk '{print $2}')
G=$(python3 -c "print(round(-14.5-($I),2))")
ffmpeg -y -loglevel error -i mix_pre.wav -af "volume=${G}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled" -ar 48000 mix_final.wav
echo "mix_final.wav pronto (guadagno ${G} dB)"
