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

## 25/11/2026 — v4, revisione delle note sulla v3
- 1,6 s: jeep con parafanghi piatti (quelli a mezzo cilindro sembravano ruote sballate); ombre morbide a terra sotto la bomba e i mezzi (prima la bomba sembrava galleggiare); mezzi ancora più lontani (z da −42 a −68); bomba più a destra nell'inquadratura.
- 18,7 s: neutroni della catena "supersonici": 14 unità/s invece di 4,2, partono 0,33 s dopo la fissione così la catena ha gli stessi tempi (121 fissioni). Nuovo `video/supersonico.js`: scia luminosa e cono d'urto a V su ogni neutrone più veloce di 6 unità/s (quelli rallentati dall'acqua non ce l'hanno).
- 30,75 s (B7): A2 e T7 dove indicato dall'autore (T7 resta nella fascia bassa dei sottotitoli, scelta dell'autore); neutroni nati a 9 unità/s; frammenti che escono subito dall'inquadratura (6 unità in 1,3 s) e svaniscono fuori campo.
- 37,98 s (B8): stessi cambi per i neutroni e i frammenti nati da BB (frammenti in verticale, dentro la barra).
- 39,9 s (B9): molecole messe con il metodo "miglior candidato" (distribuzione uniforme); tolti i buchi fissi dietro la mascotte delle tre inquadrature: le molecole si rimpiccioliscono mentre le passano dietro (`scaleAt`, nuova opzione facoltativa di `comune/acqua.js`, che non cambia nulla se non usata); buchi dei nuclei ridotti alla grandezza della mascotte.

## 25/11/2026 — v5, revisione delle note sulla v4
- 16,4 s, 30,8 s, 37,6 s: tolto il "cono d'urto" a V davanti ai neutroni veloci; resta la scia.
- Bagliori dei frammenti di fissione staccati dai frammenti: in `comune/atomi.js` il bagliore seguiva il punto d'arrivo del frammento, mentre i nucleoni ci arrivano in 0,45 s; ora sta sul centro del frammento come lo si vede (con i frammenti lenti delle versioni precedenti la differenza non si notava).
- B7: tutti i neutroni nati da A partono insieme (prima a 0,06 s l'uno dall'altro); anche nella B8.
- B7: l'autore ha scelto altri due nuclei: U-238 che cattura in basso a destra (T7), U-235 mancato al centro, vicino alla mascotte (A2, spostato di 0,45 a sinistra perché il neutrone gli passi accanto senza colpirlo).

## 25/11/2026 — v6, revisione della nota sulla v5
- B7 (29,1 s): il neutrone lento arriva dal basso a destra, da fuori campo, verso A (freccia dell'autore). Passa dove di solito sta la mascotte, che si sposta in alto a destra (80% della larghezza, 40% dell'altezza, sopra la colonna dei pulsanti) da 27,4 a 30,2 e poi torna nell'angolo.
- Frammenti di A ora in alto a sinistra e in basso a destra (lungo il corridoio del neutrone in arrivo), così resta posto per un U-238 che assorbe: nati da A 3 neutroni (uno su T7 accanto ad A2, uno assorbito, uno esce).

## 25/11/2026 — v7, revisione delle 4 note sulla v6
- 7,2 s: riflesso sulla palla di uranio ridotto (superficie meno lucida: roughness 0,48, metalness 0,55; prima 0,35 e 0,6).
- 30,5 s (B7): l'U-235 a sinistra a metà altezza diventa U-238 (`b7.ritocca`, dopo `at.sparsi`: le posizioni casuali non cambiano).
- Idea dell'autore: il neutrone lento non punta dritto all'U-235, passerebbe di lato (0,6 dal centro); entrato nell'alone (0,95) la traiettoria si piega e il nucleo lo cattura. Nuovo `video/cattura.js`, usato nella B7 (A, passa a destra) e nella B8 (BB, passa sotto, stessa velocità dell'ultimo tratto; corridoio senza molecole anche lungo la curva). I neutroni veloci attraversano l'alone dritti senza essere catturati (A2 nella B7, C9 nella B9), come prima. Fisica: sezione d'urto di fissione dell'U-235 circa 585 barn per i neutroni lenti, circa 1 per i veloci (effetto quantistico, non un'attrazione: nella voce evitare "attira").
- 37,2 s: molecole dietro la mascotte: niente più molecole minuscole visibili. Il raggio della mascotte era stimato 0,026 × distanza, misurato è circa 0,016 × distanza; ora si rimpiccioliscono solo a ridosso del bordo (da 0,2 fuori a 0,05 dentro) e spariscono sotto di lei.

## 25/11/2026 — v8, nota dell'autore sulla v7 ("accentuare un po' di più" la cattura del neutrone lento)
- `cattura.js`: il neutrone passerebbe a 0,85 dal centro (prima 0,6), la curva comincia a 1,1 (prima 0,95) ed è più stretta; nella curva accelera fino a 1,7 volte, come tirato dal nucleo; l'alone dell'U-235 si illumina e si allarga mentre il neutrone ci è dentro (`alonePulsa`, B7 su A e B8 su BB).

## 26/11/2026 — v9, voce dell'autore, musica, effetti, sottotitoli
- Voce: `Voce_6-mejorada-v2.wav` (Adobe Podcast, 96,1 s, 27 frasi). Rispetto alla scaletta: "Ma una centrale…", "Nella pastiglia di una centrale infatti…" e una frase nuova nella B8: "E i neutroni più sono lenti, più probabilità hanno di interagire con l'uranio 235", che cade sulla cattura del neutrone lento.
- Montaggio come la puntata 5 (pause fra frasi 0,7 s al massimo, fra battute da 0,35 a 1,0 s; 0,9 s prima di "No."), più eventi agganciati alle parole (vedi README). Nella B8 il tratto dopo l'ultimo rimbalzo dura 4,8 s: il neutrone lento si vede andare piano mentre la voce dice che è lento. Durata 72,3 s.
- Musica kalimba 100 bpm come le puntate precedenti; si ferma sotto il lampo bianco e riprende con la centrale. Effetti: carri armati lontani, zoom, lampi di passaggio, pioggia di fissioni nella bomba che sale verso il lampo, colpo morbido e scintillio sul lampo (niente esplosione), fissioni A e BB, neutroni assorbiti, gocce sugli urti in acqua, "tiro" dell'alone nella cattura, termometro, molecole che si allontanano, neutrone veloce, cupola che si richiude, mascotte.
- Mix: musica a −5 dB, −14,5 LUFS, picco −1,4 dBFS. Sottotitoli: 63 righe, al massimo 22 caratteri.

## 26/11/2026 — v10, richieste dell'autore sulla v9
- Regole: durata dei video da 30 a 120 s; fra una battuta e l'altra una piccola pausa di circa 1 s (la v9 era troppo densa); nella puntata 6 il fungo è ammesso.
- Voce: pause fra battute 1,0 s (`PB` in `voice_ep6.py`, prima 0,35–1,0); dentro le battute come prima (0,7 s al massimo). Durata 79,2 s.
- Fungo: dopo il lampo bianco su "energia" si torna nel deserto (camera lontana, bomba e mezzi nascosti): il fungo sale e si allarga 2,4 s, arancione e caldo all'inizio, poi color sabbia, con un anello di polvere a terra; lampo chiaro e centrale. Il bianco si dirada prima (`FLASH_DOWN` 21,0). Audio: musica ferma fino alla centrale, rombo basso e morbido sul fungo.
- Corretto lo zoom nella bomba: usava il tempo del video come se fosse quello della scaletta (`fwarp` in `bomba3d.js`).
- Musica rifatta per sezioni sui tempi di scaletta (`SEZ` in `music6.py`), così segue le scene qualunque sia la durata.
- Livelli come le puntate precedenti (stesso mix della puntata 5, musica −5 dB, sottotitoli identici): −14,5 LUFS, picco −1,5 dBFS.

## 26/11/2026 — v11, note dell'autore sulla v10
- Cielo della scena iniziale meno vuoto: jet militare stilizzato (grigio, senza insegne) che passa da sinistra a destra nei primi 5,6 s con una scia bianca (`bomba3d.js`, `jet`). Le nuvole esistenti stanno sopra il bordo dell'inquadratura.
- Fungo più lungo: 3,6 s (prima 2,4; ancora in `voice_ep6.py`); esplosione lontana e sorda sul fungo (colpo grave, scoppio filtrato, rombo che rotola, in `music6.py`).
- 0:42, schivata della mascotte nella B7: ora segue il tempo del video (prima la scaletta, con il passo della WARP), smootherstep e piccolo arco verso sinistra; andata 1,2 s, ritorno 2,0 s (`mascotte6.js`, `posMascotte`).
- 0:56, neutroni nati da BB: non più assorbiti da due U-238. Uno va a sinistra verso il centro della pastiglia ed esce dall'inquadratura; l'altro va nell'acqua, rimbalza su due molecole ed esce a destra prima che la camera si allarghi sulla B9 (`b8.js`, `DESTRA`).

## 26/11/2026 — v12, note dell'autore sulla v11
- Jet più in alto (circa 14% dell'altezza). Scia rifatta: non più palline in fila ma un nastro continuo rivolto alla camera, sfumato ai bordi, che nasce poco dietro il motore, si allarga, scende e ondeggia appena e svanisce piano (`bomba3d.js`, `scia`).
- 0:56: il neutrone di BB che va nell'acqua rallentava perché dopo la fissione la WARP è lenta (pausa della voce) e spariva a PE(4,6), poco fuori dal bordo. Ora si muove nel tempo del video (7 u/s, x0,85 a ogni urto; chiavi fitte riportate in scaletta con `unwarp`) e sparisce a PE(7,2), circa 0,6 s dopo essere uscito.

## 26/11/2026 — v13, nuova registrazione della B10 e note sulla v12
- B10 registrata di nuovo dall'autore (`sorgenti/Battuta_rifatta-mejorada-v2.wav`): "Un incidente, anche se molto, molto improbabile, può succedere, ma un'esplosione atomica è fisicamente impossibile." (Whisper sente "molto molto" in tutte le finestre provate). In `voice_ep6.py` il file si accoda alla registrazione e le sue due frasi sostituiscono le frasi 23 e 24. Sottotitoli aggiornati. Durata 81,2 s.
- Jet più veloce: attraversa il cielo in 4,2 s (prima 5,4).
- Bug a 0:57: dopo il secondo rimbalzo la scia "supersonica" del neutrone nell'acqua era una lunga riga dritta. Causa: il neutrone si muove nel tempo del video, ma `supersonico.js` misurava la velocità nel tempo di scaletta, che lì è molto lento. Ora i neutroni con `tempoVideo` hanno la velocità misurata nel tempo del video, e nessuna scia va oltre l'ultimo rimbalzo.
