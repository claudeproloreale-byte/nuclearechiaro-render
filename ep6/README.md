# Puntata 6 — Una centrale può esplodere come una bomba?

**Stato:** animazione di prova, bozza 1 (49,4 s, labiale simulato, senza audio). Codice diviso in scene (fase 0 del piano, 24/11/2026), stesso risultato pixel per pixel. Prossimo passo: l'autore guarda la bozza 1 e chiede le correzioni.
Scaletta (versione di riferimento): https://claude.ai/artifact/AEt2xw9J4XAB6XaextERiZ · Storico: `STORICO.md` · Regole: `regole.md` del canale.

## Dove si corregge
| Cosa | File |
|---|---|
| Centrale, apertura e chiusura | `video/scene/centrale.js` |
| B5 zona B "bomba" e lampo bianco | `video/scene/bomba.js` |
| Zona R (posizione, niente dietro la mascotte) | `video/scene/zonaR.js` |
| B7 neutrone lento, U-238 che assorbono | `video/scene/b7.js` |
| B8 acqua, rimbalzi | `video/scene/b8.js` |
| B9 acqua che si dilata, termometro | `video/scene/b9.js` |
| Mascotte (espressioni, gesti) | `video/mascotte6.js` |
| Tempi comuni, battute, WARP | `video/tempi.js` |
| Camera degli atomi, ordine di montaggio | `video/ep6.js` |

## Tempi (scaletta)
B1 0,2–0,8 · B2 1,3–4,8 · B3 5,3–8,8 · B4 9,3–13,6 · B5 14,1–19,9 · B6 20,4–25,0 · B7 25,5–29,4 · B8 29,9–34,0 · B9 34,5–40,0 · centrale da 40,6 · B10 40,5–44,0 · B11 44,5–46,9 · paesaggio fino a 49,4. `WARP` = identità.

## Rendering
GitHub, workflow `Rendering`: `dir` = `ep6/video`, `page` = `ep6.html`, `seconds` = `49.4` (serve `comune/` nel repository).
Prova a metà risoluzione: `PAGE='ep6.html?w=540&h=960' VW=540 VH=960 node render.js still 8,24,37.2`.
