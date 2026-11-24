# Puntata 6 — storico

## 16/11/2026 — scaletta e animazione di prova, bozza 1
- Scaletta (Claude Docs) e animazione fatte insieme su richiesta dell'autore. 49,4 s, labiale simulato, senza audio.
- `ep6.js` composto da `src/atoms6.js`, `src/tail6.js` e pezzi di `ep5.js` (centrale righe 9–195, base degli atomi 239–261, primo piano 533–648).
- Zona B: 167 nuclei fitti (distanza minima 1,3), 155 U-235; neutrone che entra a 14,6, prima fissione a 15,5, catena fino a 18,75: 111 fissioni. Lampo bianco 18,7–21,3, cambio di zona a 20,25.
- Zona R: 93 nuclei radi (distanza minima 1,45), 3 U-235 (A, BB, C9); 67 molecole d'acqua; 283 neutroni in tutto. B8: 5 rimbalzi, velocità × 0,74 a ogni urto.
- Rendering nell'ambiente di Claude (2 processi): la chiave di GitHub della sessione non era valida.

## 24/11/2026 — fase 0 del piano: libreria comune e un file per scena
- Il codice di `ep6.js` (un solo file di circa 50 kB) è stato diviso:
  - libreria `comune/` (base, palco, centrale, atomi, acqua, mascotte, icone, render) per tutte le puntate;
  - `ep6/video/`: `ep6.js` (montaggio), `tempi.js`, `mascotte6.js`, `scene/centrale.js`, `bomba.js`, `zonaR.js`, `b7.js`, `b8.js`, `b9.js`.
- Tolti pezzi mai usati: materiale dei protoni, geometria `nucGeo`, colore `C_HOT`, funzione `ang`, il blocco disattivato degli "altri U-235 fermi" della zona R (`if (false && ...)`).
- `render.js` comune: serve anche `/comune/`; con `FMT=png` salva fotogrammi senza compressione per i confronti.
- Verifica: 20 fotogrammi a metà risoluzione (da 0,1 a 48,5 s, uno per ogni scena e passaggio) e 3 a piena risoluzione identici pixel per pixel alla versione precedente; stessi conteggi di nuclei, fissioni, neutroni e molecole.
- Da fare: copiare `comune/` e `ep6/` nel repository `nuclearechiaro-render` (in questa sessione l'accesso a GitHub non è stato concesso).
