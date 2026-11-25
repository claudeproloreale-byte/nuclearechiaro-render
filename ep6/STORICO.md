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
- Caricati nel repository `nuclearechiaro-render`, ramo `fase0-ep6` (24/11/2026, dopo che l'autore ha reso pubblico il repository); provati dalla cartella del repository: identici. Da fare: unire il ramo in `main` e lanciare il workflow (la chiave `gh` della sessione non funzionava).

## 24/11/2026 (sera) — v2 dalla scaletta dell'app di produzione
- Richiesta `p6-mwv1olwv` (dalla v1): tolto il saluto; nuove B1-B2 (bomba), B5 (ritorno alla centrale), B6 e B8 (barre come nella puntata 5); cambiati B3, B4 (7 s), B9, B10 (6 s).
- Prima, per errore, era stato rifatto il rendering della v1 senza leggere l'app: da ora ogni "rigenera" parte da `richieste` e `scalette/p6` dell'app.
- Nuova scena `scene/bomba3d.js`: bomba stilizzata su terra marrone, 4 carri armati che avanzano lentamente, 3 pezzi d'artiglieria, cielo velato. L'involucro diventa trasparente (5,4–6,4): guscio, cavi, scatola dei comandi, palla di uranio con l'alone giallo; dentro la palla si passa agli atomi (8,55). Solo forme generiche.
- Zona B: stessa catena, spostata di 0,5 s (neutrone 15,1, prima fissione 16,0, fine 19,25; 112 fissioni). Sotto il lampo bianco si passa direttamente alla centrale (20,6).
- Centrale: campo largo nella B5, zoom nel nocciolo 23,3–25,5, poi lampo e barre viste da lontano.
- Zona R rifatta come barre di uranio (larghe 14) con l'acqua in mezzo (larga 8), pastiglie color rame che diventano trasparenti 27,0–28,4 entrando al centro di una pastiglia della barra C. Nuclei solo nelle barre (174, di cui 6 U-235), 1038 molecole solo nell'acqua.
- B8: inquadratura sul bordo della pastiglia; il neutrone esce dalla barra, rimbalza 5 volte nell'acqua e spacca BB (37,4); i suoi due neutroni sono assorbiti da U-238 della barra.
- B9: inquadratura sull'acqua fra la barra C e la barra R; le molecole si allontanano dal percorso del neutrone in verticale (molte escono dall'inquadratura); il neutrone veloce attraversa l'acqua senza rimbalzare, entra nella barra R e passa accanto a C9 senza spaccarlo.
- Mascotte: niente saluto, compare nell'angolo a 0,2; indica i commenti 51,9–52,8, esce a 53,9. Durata 55,4 s.

## 25/11/2026 — v3, revisione delle note sulla v2
- 1,7 s: tolta l'artiglieria; sullo sfondo 2 carri armati, una jeep e una camionetta, più dettagliati (forme arrotondate, cingoli con ruote, parafanghi, torretta sfaccettata, telone).
- 7,1 s: lo zoom sulla bomba era fatto di 4 tratti, ognuno con la sua frenata: ora è un solo movimento 4,4–8,6, distanza in scala logaritmica, che parte piano e accelera fino a entrare nella palla.
- 19 s: neutroni liberi più piccoli quando la camera è lontana (ingrandimento ridotto in `ep6.js`, la libreria resta com'è).
- 27 s: colore dell'acqua fra le barre uguale alla puntata 5; l'autore lo lascia così.
- 30,8 s (B7): frammenti e neutroni più lenti (1,3 unità/s); nuovo U-235 A2 vicino al percorso di un neutrone, che gli passa accanto (l'alone sobbalza) e si attacca all'U-238 T7.
- 41,2 s (B9): le molecole si diradano in modo uniforme (fattore 2,5 in verticale dal centro dell'inquadratura), niente più zone vuote; quelle sul percorso del neutrone si scostano appena.
