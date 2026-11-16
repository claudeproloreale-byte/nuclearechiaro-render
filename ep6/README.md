# Puntata 6 — Una centrale può esplodere come una bomba?

Stato: **animazione di prova, bozza 1** (49,4 s, labiale simulato, senza audio), fatta insieme alla scaletta su richiesta dell'autore. Prossimo passo: l'autore guarda la bozza 1, corregge il testo nella scaletta e chiede le correzioni grafiche.

Scaletta (documento modificabile, versione di riferimento, da approvare): https://claude.ai/artifact/AEt2xw9J4XAB6XaextERiZ

## Contenuto
- `video/ep6.js` + `video/ep6.html`: animazione. Parte da `ep5.js` (centrale, mascotte, nuclei, molecole d'acqua, termometro). Serve `video/fonts/Poppins-Bold.ttf`.
- `video/src/atoms6.js`, `video/src/tail6.js`: le due parti nuove, da cui è stato composto `ep6.js` insieme a pezzi di `ep5.js` (centrale righe 9–195, base degli atomi 239–261, primo piano 533–648). Se si corregge, si corregge direttamente `ep6.js`.
- `video/render.js`: quello della puntata 5.

## Struttura
- **Centrale** (0–5,0 e 40,6–49,4): come nella puntata 5, sempre accesa. Lampo chiaro a ogni passaggio.
- **Atomi, zona B "bomba"** (intorno a x 0, 5,0–20,25): 167 nuclei fitti (distanza minima 1,3), 9 su 10 U-235. Un neutrone entra da sinistra (14,6) e spacca il primo nucleo a 15,5; la catena si allarga (neutroni a 4,2 unità al secondo, frammenti che dissolvono) fino a 18,75: 111 fissioni. Lampo bianco davanti a tutto, anche alla mascotte: sale da 18,7 a 19,45, resta pieno, scende da 20,35 a 21,3.
- **Atomi, zona R "centrale"** (intorno a x 30, da 20,25 sotto il lampo bianco): nuclei radi (distanza minima 1,45), solo 3 U-235 (A, BB, C9). Nessun nucleo né molecola dietro la mascotte in angolo (`behindMascot`).
  - B7: neutrone lento dal basso spacca A a 26,6; due neutroni assorbiti da U-238 (piccolo lampo e sobbalzo), uno esce.
  - B8: molecole d'acqua da 30,2; un neutrone entra da sinistra, rimbalza 5 volte sugli idrogeni (rallenta di 0,74 a ogni urto) e spacca BB a 33,6.
  - B9: termometro (in alto a destra) che sale 35,2–36,6; l'acqua "si dilata" 36,0–37,2 (molecole che si allontanano dal percorso del neutrone e dal centro, tremano di più, fondo più caldo); un neutrone veloce attraversa senza rimbalzare (36,9–38,7) e passa accanto a C9 senza spaccarlo (l'alone sobbalza); termometro che scende 38,8–39,9.
- Mascotte: grande al centro per il saluto, poi in angolo. Sopracciglia decise sul "No" (B3), occhi più grandi davanti al lampo, preoccupata quando il nocciolo si scalda; indica i commenti 45,9–46,8, saluta ed esce a 47,9.

## Tempi (secondi di scaletta, bozza 1)
B1 0,2–0,8 · B2 1,3–4,8 · B3 5,3–8,8 · B4 9,3–13,6 · B5 14,1–19,9 · B6 20,4–25,0 · B7 25,5–29,4 · B8 29,9–34,0 · B9 34,5–40,0 · centrale da 40,6 · B10 40,5–44,0 · B11 44,5–46,9 · paesaggio fino a 49,4.
`WARP` per ora è l'identità.

## Rendering
Bozza 1 fatta nell'ambiente di Claude (2 processi), perché la chiave di GitHub della sessione non era valida e il workflow non si poteva avviare. Per le prossime bozze: workflow `Rendering` con `dir` = `ep6/video`, `page` = `ep6.html`, `seconds` = `49.4`.
Per i fotogrammi di prova a metà risoluzione la pagina va aperta con `ep6.html?w=540&h=960` (oltre a `VW=540 VH=960`), altrimenti si vede solo un quarto dello schermo.
