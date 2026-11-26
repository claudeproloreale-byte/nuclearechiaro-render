#!/bin/bash
# Rendering del video (senza audio) in 12 pezzi, due processi alla volta, poi unione in ep6_muto.mp4.
# Requisiti: node, npm install (three + playwright), Google Chrome, ffmpeg. Per Chrome in un altro percorso: export CHROME=/percorso
# Più veloce: workflow "Rendering" di GitHub (dir "Post 6/video", page ep6.html, seconds 82.0).
set -e
cd "$(dirname "$0")"
export PAGE=ep6.html VW=1080 VH=1920
mkdir -p seg
run() { local name=$1; shift; local p=$1; shift; local i=1; for f in "$@"; do [ -f seg/$name$i.mp4 ] || node render.js seg $p $f seg/$name$i.mp4; p=$f; i=$((i+1)); done; }
run a 0 205 410 615 820 1025 1230 &
run b 1230 1435 1640 1845 2050 2255 2460 &
wait
for f in a1 a2 a3 a4 a5 a6 b1 b2 b3 b4 b5 b6; do echo "file '$f.mp4'"; done > seg/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list.txt -c copy ep6_muto.mp4
echo "ep6_muto.mp4 pronto (82,0 s, 2460 fotogrammi)"
