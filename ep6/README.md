# Puntata 6 — Una centrale può esplodere come una bomba?

**Scaletta di riferimento: nell'app di produzione** (https://claude.ai/artifact/LKLS4NqcETV4Hw6c2gwk4S, `scalette/p6`; richieste in `richieste`, versioni in `versioni/p6-v<k>`). Come si lavora: `piano app/app.md` nel progetto. Il vecchio documento della scaletta è superato.

**Stato:** v10 (26/11/2026): voce, musica, effetti, sottotitoli; pause di circa 1 s fra le battute e fungo dopo il lampo bianco (richieste dell'autore). Durata 79,2 s. Prossimo passo: l'autore guarda la v10.
Storico: `STORICO.md` · Regole: `regole.md`.

## Dove si corregge
| Cosa | File |
|---|---|
| B1-B2: bomba, veicoli militari sullo sfondo, zoom unico, involucro trasparente, palla di uranio; fungo dopo il lampo (v10) | `video/scene/bomba3d.js` |
| B3-B4: zona B "bomba" (atomi), catena e lampo bianco | `video/scene/bomba.js` |
| B5, zoom nel nocciolo (B6), B10 e chiusura | `video/scene/centrale.js` |
| Barre di uranio con l'acqua, pastiglie viste da lontano, inquadrature della zona R, niente dietro la mascotte | `video/scene/zonaR.js` |
| B7 dentro la pastiglia: neutrone lento, U-235 "saltato" (A2), U-238 che assorbono | `video/scene/b7.js` |
| B8 bordo della pastiglia: rimbalzi nell'acqua; molecole d'acqua | `video/scene/b8.js` |
| B9 acqua che si dilata, neutrone veloce nella barra R, termometro | `video/scene/b9.js` |
| Neutrone lento catturato dall'alone di un U-235 (curva; B7 e B8) | `video/cattura.js` |
| Effetto "supersonico" dei neutroni veloci (scia) | `video/supersonico.js` |
| Mascotte (espressioni, gesti) | `video/mascotte6.js` |
| Tempi comuni, battute, passaggi fra i mondi, WARP, labiale | `video/tempi.js` (WARP e `lip6.js` escono da `audio/voice_ep6.py`) |
| Montaggio della voce, eventi agganciati alle parole | `audio/voice_ep6.py` |
| Musica ed effetti sonori | `audio/music6.py` (tempi degli eventi: `audio/events6.json`, da `video/print_events.js`) |
| Mix e volume | `audio/mix6.py` |
| Sottotitoli | `video/make_subs6.py` |
| Camera degli atomi, ordine di montaggio, molecole che spariscono dietro la mascotte | `video/ep6.js` |

## Tempi (scaletta v2)
B1 0,5–4,0 · B2 4,5–8,0 · B3 8,5–12,8 · B4 13,3–20,3 · B5 20,8–23,8 · B6 24,3–28,9 · B7 29,4–33,3 · B8 33,8–37,9 · B9 38,4–43,9 · B10 44,4–50,4 · B11 50,9–53,3 · paesaggio pulito 53,9–55,4 (tempi di scaletta).
Con la voce (`WARP`, v10 del 26/11/2026) il video dura 79,2 s, con circa 1 s di pausa fra le battute. Eventi sulle parole: fissione nella bomba su "spaccare", lampo pieno su "energia" (25,0), fungo nel deserto 25,9–28,3 (scaletta 20,6–21,6, `FUNGO_END`), centrale e "Per una centrale nucleare" da 28,8; A si spacca dopo "uranio 238", BB catturato su "interagire", B9 sulle parole del termometro e dell'acqua, la mascotte indica su "fammela" ed esce; paesaggio pulito fino alla fine. Tabella completa: `audio/warp6.json` (stampata da `audio/voice_ep6.py` con la velocità di ogni tratto).
Mondi: bomba 0–8,55 · atomi zona B 8,55–20,6 (lampo bianco 19,2–21,0) · fungo nel deserto 20,6–21,6 · centrale 21,6–25,5 · atomi zona R 25,5–44,5 · centrale 44,5–55,4.

## Rendering e montaggio
1. Audio: `audio/build_audio.sh` (registrazione in `sorgenti/`; Whisper per il controllo del testo: `audio/transcribe6.py`).
2. Video muto: GitHub, workflow `Rendering`: `dir` = `ep6/video`, `page` = `ep6.html`, `seconds` = `79.22` (serve `comune/` nel repository).
   In locale: `PAGE=ep6.html VW=1080 VH=1920 node render.js seg 0 2377 ep6_muto.mp4` (circa 0,5 s per fotogramma; due processi in parallelo sulle due metà).
3. `video/assemble.sh ep6_muto.mp4`: `nuclearechiaro_ep6.mp4` (senza sottotitoli) e `nuclearechiaro_ep6_sottotitoli.mp4` (da pubblicare).
Prova a metà risoluzione: `PAGE='ep6.html?w=540&h=960' VW=540 VH=960 node render.js still 1,10,26,35,41.7`.
