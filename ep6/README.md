# Puntata 6 — Una centrale può esplodere come una bomba?

**Scaletta di riferimento: nell'app di produzione** (https://claude.ai/artifact/LKLS4NqcETV4Hw6c2gwk4S, `scalette/p6`; richieste in `richieste`, versioni in `versioni/p6-v<k>`). Come si lavora: `piano app/app.md` nel progetto. Il vecchio documento della scaletta è superato.

**Stato:** v5 (25/11/2026, revisione delle note sulla v4): 55,4 s, labiale simulato, senza audio. Prossimo passo: l'autore guarda la v5 e conferma o riapre le note nell'app.
Storico: `STORICO.md` · Regole: `regole.md`.

## Dove si corregge
| Cosa | File |
|---|---|
| B1-B2: bomba, veicoli militari sullo sfondo, zoom unico, involucro trasparente, palla di uranio | `video/scene/bomba3d.js` |
| B3-B4: zona B "bomba" (atomi), catena e lampo bianco | `video/scene/bomba.js` |
| B5, zoom nel nocciolo (B6), B10 e chiusura | `video/scene/centrale.js` |
| Barre di uranio con l'acqua, pastiglie viste da lontano, inquadrature della zona R, niente dietro la mascotte | `video/scene/zonaR.js` |
| B7 dentro la pastiglia: neutrone lento, U-235 "saltato" (A2), U-238 che assorbono | `video/scene/b7.js` |
| B8 bordo della pastiglia: rimbalzi nell'acqua; molecole d'acqua | `video/scene/b8.js` |
| B9 acqua che si dilata, neutrone veloce nella barra R, termometro | `video/scene/b9.js` |
| Effetto "supersonico" dei neutroni veloci (scia) | `video/supersonico.js` |
| Mascotte (espressioni, gesti) | `video/mascotte6.js` |
| Tempi comuni, battute, passaggi fra i mondi, WARP | `video/tempi.js` |
| Camera degli atomi, ordine di montaggio, molecole che spariscono dietro la mascotte | `video/ep6.js` |

## Tempi (scaletta v2)
B1 0,5–4,0 · B2 4,5–8,0 · B3 8,5–12,8 · B4 13,3–20,3 · B5 20,8–23,8 · B6 24,3–28,9 · B7 29,4–33,3 · B8 33,8–37,9 · B9 38,4–43,9 · B10 44,4–50,4 · B11 50,9–53,3 · paesaggio pulito 53,9–55,4. `WARP` = identità.
Mondi: bomba 0–8,55 · atomi zona B 8,55–20,6 (lampo bianco 19,2–21,6) · centrale 20,6–25,5 · atomi zona R 25,5–44,5 · centrale 44,5–55,4.

## Rendering
GitHub, workflow `Rendering`: `dir` = `ep6/video`, `page` = `ep6.html`, `seconds` = `55.4` (serve `comune/` nel repository).
In locale: `PAGE=ep6.html VW=1080 VH=1920 node render.js seg 0 1662 ep6.mp4` (circa 0,6 s per fotogramma, due processi in parallelo).
Prova a metà risoluzione: `PAGE='ep6.html?w=540&h=960' VW=540 VH=960 node render.js still 1,10,26,35,41.7`.
