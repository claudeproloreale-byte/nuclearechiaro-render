# Puntata 8 — Dove finisce l'acqua calda?

**Scaletta di riferimento: nell'app di produzione** (https://claude.ai/artifact/LKLS4NqcETV4Hw6c2gwk4S, `scalette/p8`; versioni in `versioni/p8-v<k>`). Come si lavora: `piano app/app.md` nel progetto. Note su dati e fonti: `nuclearechiaro video 8/scaletta.md` nel progetto.

**Stato:** v2 (28/11/2026), 93,9 s, 540×960, senza audio (labiale simulato).
- **v2:** corrette le 9 note della v1 e la B9 nuova della scaletta.
  - B9: niente più giro verso il carbone; torta 26% azzurro (con una torre) / 74% bianco (con un fiume), dalle ore 12 in senso orario.
  - B13: la collina gira sulla centrale del grande fiume (senza torri, al posto del sito a carbone). Presa a monte e scarico a valle; su «abbassa la potenza» la macchia tiepida si restringe.
  - Traliccio tolto ovunque. Nella centrale con le torri non c'è il cavo; sul mare e sul fiume il cavo esce dall'alternatore e va a sinistra, fuori dall'inquadratura.
  - Terzo circuito davanti alla centrale: esce dalla parete davanti della sala turbine, corre a terra verso sinistra ed entra nella torre dal davanti (caldo fuori, freddo dentro). B12 inquadra i due tubi fra torre e sala.
  - Torre: ugelli più in alto (y 2,55), l'acqua cade per un tratto più lungo; fascia rossa davanti disegnata dopo il guscio (non sparisce più all'apertura).
  - Termometri (B5, B13) in dischi più grandi; omino (B11) in un disco più grande con il cielo di notte, luna, stelle e fiocchi.
  - Sul mare: presa a destra e scarico a sinistra, così i tubi non si incrociano.
- **v1:** bozza 1 dell'animazione sui tempi della scaletta.

## Idea visiva
Collina che ruota come un piccolo pianeta (come nella puntata 2) con tre luoghi: la centrale con le due torri e un fiume davanti (centro), la stessa centrale in riva al mare senza torri (a sinistra, B8), la stessa centrale su un grande fiume senza torri (a destra, B13). Il gancio (B1) è la torre vista dal basso con il pennacchio che sale; nella B10 la torre diventa trasparente e si vede come funziona dentro.

## Dove si corregge
| Cosa | File |
|---|---|
| Camere, rotazioni della collina, aperture di cupola, sala turbine e torre, circuiti accesi, estate | `video/scene/regia.js` |
| Collina, cielo, nuvole, fiume, sito mare (spiaggia, presa e scarico, macchia tiepida, pesci), sito del grande fiume (B13) | `video/scene/mondo.js` |
| Centrale: cupola con l'interno, sala turbine con turbina, alternatore e condensatore, circuito secondario, terzo circuito (tubi verso la torre o l'acqua), cavo, bandiera | `video/scene/centrale8.js` |
| Torre: guscio con la metà davanti apribile, colonnine, vasca, riempimento, ugelli, pioggia, frecce d'aria, vapore dentro | `video/scene/torre.js` |
| Pennacchi e fumo (trama delle nuvole) | `video/scene/fumo.js` |
| Acqua (increspature, riflessi, macchia tiepida) | `video/scene/acqua8.js` |
| Primo piano: pentola (B2), torta 1/3–2/3 (B4), termometro (B5), icone carbone e gas (B5), torta 26/74 (B9), omino con il fiato (B11), termometro del fiume (B13) | `video/scene/primopiano.js` |
| Mascotte (espressioni, dito alzato, annuisce, indica i commenti) | `video/mascotte8.js` |
| Tempi delle battute, WARP | `video/tempi.js` |
| Montaggio | `video/ep8.js` |

## Tempi (scaletta)
B1 0,5–5,0 · B2 5,5–10,0 · B3 10,5–14,5 · B4 15,0–22,0 · B5 22,5–29,0 · B6 29,5–36,0 · B7 36,5–42,0 · B8 42,5–48,5 · B9 49,0–56,0 · B10 56,5–64,0 · B11 64,5–71,0 · B12 71,5–75,5 · B13 76,0–84,0 · B14 84,5–89,0 · B15 89,5–91,9 · paesaggio pulito 92,4–93,9.
Rotazioni della collina: verso il mare 42,7–44,5, ritorno 49,0–50,8; verso il grande fiume 75,7–77,3, ritorno 84,1–85,8. Torta della B9: 51,7–56,4.

## Rendering
Prova a metà risoluzione: `PAGE='ep8.html?w=540&h=960' VW=540 VH=960 node render.js still 2,20,46,61,80`.
Video intero a metà risoluzione (circa 0,2 s per fotogramma, due processi): `seg 0 1409 a.mp4` e `seg 1409 2817 b.mp4`.
`node_modules`: come la puntata 7 (`npm install` nella cartella `video`).
