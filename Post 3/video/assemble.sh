#!/bin/bash
# Unisce video muto, audio e sottotitoli. Prima: ./run_render.sh e ../audio/build_audio.sh (oppure usa i file già pronti).
set -e
cd "$(dirname "$0")"
V=${1:-ep3_muto.mp4}; A=${2:-../audio/mix_final.wav}
python3 make_subs3.py
ffmpeg -y -loglevel error -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart nuclearechiaro_ep3.mp4
ffmpeg -y -loglevel error -i nuclearechiaro_ep3.mp4 -vf "ass=subs/ep3.ass:fontsdir=fonts" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart nuclearechiaro_ep3_sottotitoli.mp4
echo "pronti: nuclearechiaro_ep3_sottotitoli.mp4 (pubblicato) e nuclearechiaro_ep3.mp4 (senza sottotitoli)"
