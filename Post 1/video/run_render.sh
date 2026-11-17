#!/bin/bash
# Rendering del video (senza audio) in 6 pezzi, due processi alla volta, poi unione in intro_muto.mp4.
# Requisiti: node, npm install (three + playwright), Google Chrome, ffmpeg. Per Chrome in un altro percorso: CHROME=/percorso node ...
set -e
cd "$(dirname "$0")"
export PAGE=intro.html VW=1080 VH=1920
mkdir -p seg
( node render.js seg 0 189 seg/s1.mp4; node render.js seg 189 350 seg/s2.mp4; node render.js seg 350 569 seg/s3.mp4 ) &
( node render.js seg 569 755 seg/s4.mp4; node render.js seg 755 852 seg/s5.mp4; node render.js seg 852 1110 seg/s6.mp4 ) &
wait
for i in 1 2 3 4 5 6; do echo "file 'seg/s$i.mp4'"; done > seg/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list.txt -c copy intro_muto.mp4
echo "intro_muto.mp4 pronto (37 s, 1110 fotogrammi)"
