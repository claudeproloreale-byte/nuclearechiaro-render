#!/bin/bash
# Rendering del video (senza audio) in 12 pezzi, due processi alla volta, poi unione in ep4_muto.mp4.
# Requisiti: node, npm install (three + playwright), Google Chrome, ffmpeg. Per Chrome in un altro percorso: export CHROME=/percorso
set -e
cd "$(dirname "$0")"
export PAGE=ep4.html VW=1080 VH=1920
mkdir -p seg
run() { local name=$1; shift; local p=$1; shift; local i=1; for f in "$@"; do [ -f seg/$name$i.mp4 ] || node render.js seg $p $f seg/$name$i.mp4; p=$f; i=$((i+1)); done; }
run a 0 225 450 675 900 1125 1341 &
run b 1341 1565 1790 2015 2240 2460 2682 &
wait
for f in a1 a2 a3 a4 a5 a6 b1 b2 b3 b4 b5 b6; do echo "file '$f.mp4'"; done > seg/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list.txt -c copy ep4_muto.mp4
echo "ep4_muto.mp4 pronto (89,4 s, 2682 fotogrammi)"
