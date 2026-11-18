#!/bin/bash
# Rendering del video (senza audio) in 10 pezzi, due processi alla volta, poi unione in ep2_muto.mp4.
# Requisiti: node, npm install (three + playwright), Google Chrome, ffmpeg. Per Chrome in un altro percorso: export CHROME=/percorso
set -e
cd "$(dirname "$0")"
export PAGE=ep2.html VW=1080 VH=1920
mkdir -p seg
run() { local name=$1; shift; local p=$1; shift; local i=1; for f in "$@"; do node render.js seg $p $f seg/$name$i.mp4; p=$f; i=$((i+1)); done; }
run a 0 189 288 501 630 880 &
run b 880 990 1251 1386 1620 1752 &
wait
for f in a1 a2 a3 a4 a5 b1 b2 b3 b4 b5; do echo "file '$f.mp4'"; done > seg/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list.txt -c copy ep2_muto.mp4
echo "ep2_muto.mp4 pronto (58,4 s, 1752 fotogrammi)"
