#!/bin/bash
# Unisce video muto, audio e sottotitoli. Prima: ./run_render.sh e ../audio/build_audio.sh (oppure usa ../audio/mix_final.wav già pronto).
set -e
cd "$(dirname "$0")"
V=${1:-intro_muto.mp4}; A=${2:-../audio/mix_final.wav}
python3 make_subs_intro.py
ffmpeg -y -loglevel error -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart neutrone_intro_senza_sottotitoli.mp4
ffmpeg -y -loglevel error -i "$V" -i "$A" -map 0:v -map 1:a -vf "ass=subs/intro.ass:fontsdir=fonts" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart neutrone_intro_sottotitoli.mp4
echo "pronti: neutrone_intro_sottotitoli.mp4 e neutrone_intro_senza_sottotitoli.mp4"
