# Puntata 8 — Dove finisce l'acqua calda?

**Scaletta di riferimento: nell'app di produzione** (https://claude.ai/artifact/LKLS4NqcETV4Hw6c2gwk4S, `scalette/p8`; versioni in `versioni/p8-v<k>`). Come si lavora: `piano app/app.md` nel progetto. Note su dati e fonti: `nuclearechiaro video 8/scaletta.md` nel progetto.

**Stato:** v1 (28/11/2026), bozza 1 dell'animazione sui tempi della scaletta, 93,9 s, 540×960, senza audio (labiale simulato).

## Idea visiva
Collina che ruota come un piccolo pianeta (come nella puntata 2) con tre luoghi: la centrale con le due torri e un fiume davanti (centro), la stessa centrale in riva al mare senza torri (a sinistra, B8), una centrale a carbone con camino e torre (a destra, B9). Il gancio (B1) è la torre vista dal basso con il pennacchio che sale; nella B10 la torre diventa trasparente e si vede come funziona dentro.

## Dove si corregge
| Cosa | File |
|---|---|
| Camere, rotazioni della collina, aperture di cupola, sala turbine e torre, circuiti accesi, estate | `video/scene/regia.js` |
| Collina, cielo, nuvole, fiume (sponde, canne, pesci, alghe), sito mare (spiaggia, presa e scarico, macchia tiepida, pesci), sito carbone | `video/scene/mondo.js` |
| Centrale: cupola con l'interno, sala turbine con turbina, alternatore e condensatore, circuito secondario, terzo circuito (tubi verso la torre o il mare), traliccio, bandiera | `video/scene/centrale8.js` |
| Torre: guscio con la metà davanti apribile, colonnine, vasca, riempimento, ugelli, pioggia, frecce d'aria, vapore dentro | `video/scene/torre.js` |
| Pennacchi e fumo (trama delle nuvole) | `video/scene/fumo.js` |
| Acqua (increspature, riflessi, macchia tiepida) | `video/scene/acqua8.js` |
| Primo piano: pentola (B2), torta 1/3–2/3 (B4), termometro (B5), icone carbone e gas (B5), omino con il fiato (B11), termometro del fiume (B13) | `video/scene/primopiano.js` |
| Mascotte (espressioni, dito alzato, annuisce, indica i commenti) | `video/mascotte8.js` |
| Tempi delle battute, WARP | `video/tempi.js` |
| Montaggio | `video/ep8.js` |

## Tempi (scaletta)
B1 0,5–5,0 · B2 5,5–10,0 · B3 10,5–14,5 · B4 15,0–22,0 · B5 22,5–29,0 · B6 29,5–36,0 · B7 36,5–42,0 · B8 42,5–48,5 · B9 49,0–56,0 · B10 56,5–64,0 · B11 64,5–71,0 · B12 71,5–75,5 · B13 76,0–84,0 · B14 84,5–89,0 · B15 89,5–91,9 · paesaggio pulito 92,4–93,9.
Rotazioni della collina: verso il mare 42,7–44,5, ritorno 49,0–50,8; verso il carbone 53,0–54,4, ritorno 55,9–57,2.

## Rendering
Prova a metà risoluzione: `PAGE='ep8.html?w=540&h=960' VW=540 VH=960 node render.js still 2,20,46,61,80`.
Video intero a metà risoluzione (circa 0,2 s per fotogramma, due processi): `seg 0 1409 a.mp4` e `seg 1409 2817 b.mp4`.
`node_modules`: come la puntata 7 (`npm install` nella cartella `video`).
