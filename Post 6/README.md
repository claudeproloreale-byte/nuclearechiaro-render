# Post 6 — "Una centrale può esplodere come una bomba?" (copertina: CENTRALE o BOMBA)

Sesto video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Pubblicato il 26/11/2026.
Verticale 1080×1920, 30 fps, 82,0 s (2460 fotogrammi), voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazioni, codice dell'animazione, libreria comune, audio, sottotitoli, copertina e descrizione. Come per `Post 5/`, la cartella è autonoma; l'unica differenza è che la puntata 6 usa la libreria `comune/`, qui copiata (`Post 6/comune/`).
Il lavoro di sviluppo (15 versioni) è nel ramo `ep6-v2`, cartella `ep6/`; lo storico completo è in `STORICO.md`.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`nuclearechiaro_ep6_sottotitoli.mp4`), versione senza sottotitoli (`nuclearechiaro_ep6.mp4`), video muto (`ep6_muto.mp4`), sottotitoli `.srt`, copertina (`copertina_ep6.jpg`) |
| `sorgenti/` | Le due registrazioni dell'autore già passate in Adobe Podcast Enhance: `Voce_6-mejorada-v2.wav` (la voce intera) e `Battuta_rifatta-mejorada-v2.wav` (la penultima battuta, registrata di nuovo) |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice_fx.wav` (voce montata e trattata) e `mix_final.wav` (traccia finale). `phrases_raw.json` (le frasi nella registrazione), `phrases.json` (le frasi dopo il montaggio), `warp6.json` (tempi della scaletta → tempi reali), `events6.json` (tempi degli eventi dell'animazione per gli effetti sonori) |
| `video/` | Animazione (`ep6.html` + `ep6.js` + `scene/`, three.js), labiale (`lip6.js`), rendering, sottotitoli, copertina (con lo sfondo usato, `copertina_sfondo.jpg`) |
| `comune/` | Libreria condivisa dalle puntate (base, palco, centrale, atomi, acqua, mascotte, icone, render); vedi `comune/README.md` |
| `descrizione.md` | Descrizione con hashtag |
| `STORICO.md` | Storico di tutte le versioni (bozza 1 → v15) |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js 0.187 e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (circa 10 secondi)
```
audio/build_audio.sh
```
Passaggi:
- rilevamento delle frasi (`detect6.py`);
- montaggio e trattamento della voce (`voice_ep6.py`): scrive anche i tempi delle frasi, la tabella `warp6.json` e il labiale `video/lip6.js`; accoda la battuta rifatta dopo 1 s di silenzio;
- musica ed effetti (`music6.py`);
- mix (`mix6.py -1.2 0 -5`).

Verificato il 26/11/2026: `mix_final.wav`, `voice_fx.wav`, `phrases.json`, `warp6.json` e `lip6.js` escono identici bit per bit.

`events6.json` viene dall'animazione: all'avvio `ep6.js` simula le catene di fissioni, le catture e gli urti sulle molecole d'acqua e stampa i tempi in console. Per rigenerarlo (serve solo se si cambia l'animazione): `cd video && node print_events.js`.
Se si cambia `warp6.json`, la tabella va copiata anche in `WARP` dentro `video/tempi.js`.

### 2. Animazione (video muto)
In locale (circa 0,5 s per fotogramma senza scheda grafica, con due processi in parallelo):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository), in 8–10 minuti. Parametri: `dir` = `Post 6/video`, `page` = `ep6.html`, `seconds` = `82.0`, `jobs` = `20`, `tag` = `post6_ep6`.
Il video muto già pronto è `output/ep6_muto.mp4`.
Prova rapida di singoli fotogrammi: `PAGE=ep6.html VW=1080 VH=1920 PREFIX=prova node render.js still 10.3,30`.

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh ../output/ep6_muto.mp4    # usa ../audio/mix_final.wav
```
Produce `nuclearechiaro_ep6.mp4` (senza sottotitoli) e `nuclearechiaro_ep6_sottotitoli.mp4` (quello pubblicato).

Verificato il 26/11/2026:
- senza sottotitoli, il file è identico a quello in `output/` (stesso hash di video e audio);
- con i sottotitoli, l'audio è identico e il video coincide a parte minime differenze della ricompressione (PSNR 79,6 dB);
- i fotogrammi disegnati da questa cartella (a 10,3 s e a 30 s) sono identici pixel per pixel a quelli della cartella di sviluppo `ep6/`.

## La storia del video
- Domanda di partenza: "Una centrale nucleare può esplodere come una bomba?". Risposta in tre mosse:
  - **combustibile**: nella bomba l'uranio 235 è quasi puro (più di 90 nuclei su 100), in una pastiglia di centrale solo 3–5 su 100 e il resto è uranio 238, che assorbe molti neutroni senza spaccarsi;
  - **acqua**: la reazione in una centrale ha bisogno dei neutroni lenti, e solo l'acqua li rallenta;
  - **autoregolazione**: se il nocciolo si scalda, l'acqua si dilata, frena meno i neutroni e la reazione rallenta da sola; le barre di controllo la spengono. Un incidente, per quanto improbabile, può succedere, ma un'esplosione atomica è fisicamente impossibile.
- Cambi principali chiesti dall'autore durante le 15 versioni:
  - bomba stilizzata con involucro trasparente e palla di uranio, riflesso ridotto; veicoli militari sullo sfondo;
  - dopo la reazione a catena nella bomba, lampo bianco e breve fungo atomico (poi più lungo e con effetto sonoro di esplosione), prima di passare alla centrale; un jet militare con scia nel cielo iniziale (più alto e più veloce a ogni richiesta);
  - il neutrone lento "attirato" dall'alone giallo dell'U-235: curva di cattura più evidente, con l'alone che si illumina;
  - un U-238 distinto dall'U-235 (con le targhette "Uranio 235" / "Uranio 238" a 0:40);
  - molecole d'acqua piccole vicino alla mascotte; schivata del neutrone più fluida;
  - alla fissione di BB: un neutrone esce a sinistra, l'altro rimbalza nell'acqua ed esce a destra;
  - penultima battuta registrata di nuovo; animazione nuova con barre di controllo che scendono e un solo cerchio con il fungo atomico e una croce rossa solida su "fisicamente impossibile".
- Nuova regola del canale (dalla puntata 6): video fra 30 e 120 s e circa 1 s di pausa fra le battute (`regole.md`).

## Come funziona l'animazione
- `video/ep6.js` monta i "mondi", disegnati uno alla volta con un breve lampo ai passaggi (`SWITCH` in `tempi.js`): **bomba** 0–8,55 · **atomi zona B** 8,55–20,6 · **fungo nel deserto** 20,6–21,6 (scaletta) · **centrale** · **atomi zona R** · **centrale** di chiusura.
- Scene (`video/scene/`):
  - `bomba3d.js`: B1–B2, bomba, veicoli, jet con scia, zoom nella palla, fungo atomico;
  - `bomba.js`: B3–B4, atomi densi, catena di fissioni, lampo bianco;
  - `zonaR.js`, `b7.js`, `b8.js`, `b9.js`: barre di uranio con l'acqua in mezzo, pastiglia, neutrone lento catturato (`cattura.js`), rimbalzi nell'acqua, dilatazione dell'acqua e termometro;
  - `centrale.js`: B5, zoom nel nocciolo, B10 con barre di controllo, termometro e cerchio con fungo e croce rossa.
- Altri moduli: `supersonico.js` (scia e cono d'urto dei neutroni veloci), `etichette.js` (targhette "Uranio 235/238"), `mascotte6.js`, `tempi.js`.
- **Due tempi.** La tabella `WARP` riallinea i tempi della scaletta ai tempi reali della voce e serve per gli eventi (`fwarp`, `unwarp`); tutto ciò che si muove di continuo usa il tempo reale `tn`.
- `window.renderFrame(t)` disegna l'istante `t` in secondi. `?cover=1` mostra la posa della copertina.

## Audio: cosa è stato fatto
- **Voce**: registrazione Adobe Podcast. Ogni battuta della scaletta si appoggia sulla voce, con circa 1 s di pausa fra le battute; il lampo cade su "energia", il fungo ha il suo tempo prima di "Per una centrale nucleare". La penultima battuta è la registrazione rifatta. Poi livellamento per frase (±3 dB), equalizzazione, compressione leggera, limitatore.
- **Musica**: kalimba a 100 bpm in do maggiore, che cambia con le scene.
- **Effetti**: fissioni, catture, urti sull'acqua, lampo, esplosione del fungo, barre di controllo, colpo della croce rossa, mascotte.
- **Mix**: musica a −5 dB ovunque. Volume finale −14,5 LUFS, picco −1,5 dBFS.

## Sottotitoli
`video/make_subs6.py`: testo effettivamente pronunciato (controllato con `audio/transcribe6.py`, che usa Whisper), sui tempi reali delle frasi. Stile del canale: Poppins grassetto, contorno `#0c1c4a`, 22 caratteri per riga; a fine riga si tolgono . , : ; e restano ? e !.
Nella B10 i sottotitoli seguono la registrazione ("molto, molto improbabile"), non il testo della scaletta.
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

## Copertina
La bomba in primo piano sulla collina, dietro la centrale; titolo "CENTRALE" (bianco) / "o BOMBA" (giallo), senza mascotte.
```
cd video && python3 make_cover6.py copertina_sfondo.jpg copertina_ep6.jpg "CENTRALE" "o BOMBA"
```
Lo sfondo si ridisegna con `PAGE='ep6.html?cover=1' VW=1080 VH=1920 PREFIX=sfondo node render.js still 30`.

## Testo pronunciato
Ma una centrale nucleare può esplodere come una bomba atomica? No. E non perché qualcuno la tiene a bada: lo impedisce la fisica. In una bomba l'uranio 235 è quasi puro: più di 90 nuclei su 100. Ogni neutrone, anche se velocissimo, trova subito un nucleo da spaccare, e in meno di un milionesimo di secondo si libera tutta l'energia. Per una centrale nucleare è completamente diverso. Nella pastiglia di una centrale, infatti, l'uranio 235 è solo da 3 a 5 nuclei su 100. Tutti gli altri sono uranio 238, e molti neutroni finiscono lì, assorbiti. Per andare avanti, la reazione ha bisogno dell'acqua, che rallenta i neutroni. E i neutroni più sono lenti, più probabilità hanno di interagire con l'uranio 235. E se il nocciolo si scalda troppo, l'acqua si dilata e frena meno i neutroni: la reazione rallenta da sola. Un incidente, anche se molto, molto improbabile, può succedere, ma un'esplosione atomica è fisicamente impossibile. Hai qualche domanda? Fammela nei commenti!

## Dati e note di fisica
- **Arricchimento**: l'uranio delle armi è arricchito oltre il 90% in U-235; quello del combustibile delle centrali civili da circa il 3% al 5%.
- **Neutroni lenti e veloci**: la sezione d'urto di fissione dell'U-235 è di circa 585 barn per neutroni termici e circa 1 barn per neutroni veloci (centinaia di volte di meno). Nel video l'alone giallo dell'U-235 e la "cattura" del neutrone lento sono una rappresentazione di questo effetto: non è un'attrazione vera, ma un effetto quantistico. Per questo nella voce non c'è la parola "attira".
- **U-238**: assorbe molti neutroni senza fissionare, quindi in una pastiglia di centrale la catena non può moltiplicarsi come in una bomba.
- **Autoregolazione**: se la temperatura sale, l'acqua si dilata, è meno densa e rallenta meno i neutroni: la reazione cala da sola. Le barre di controllo, assorbitori di neutroni, spengono il reattore.
- **Incidenti storici**: le esplosioni di Černobyl' e Fukushima furono di vapore e di idrogeno, non esplosioni atomiche (detto nella descrizione, non nel video).
- **Nel video**: l'acqua fra le barre è più larga che nella realtà, per far vedere bene i rimbalzi; il fungo atomico è mostrato senza distruzione visibile; nessuna fiamma.
