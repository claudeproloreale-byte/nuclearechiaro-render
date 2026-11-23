# Post 3 — "Come funziona una centrale nucleare"

Terzo video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Pubblicato il 19/11/2026.
Verticale 1080×1920, 30 fps, 66,2 s, voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazione, codice dell'animazione, audio, sottotitoli, copertina e descrizione.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`nuclearechiaro_ep3_sottotitoli.mp4`), versione senza sottotitoli (`nuclearechiaro_ep3.mp4`), video muto (`ep3_muto.mp4`), sottotitoli `.srt`, copertina (`copertina_ep3.jpg`) |
| `sorgenti/` | La registrazione dell'autore già passata in Adobe Podcast Enhance (`Voce_3-mejorada-v2.wav`, 69,6 s, una sola ripresa): è quella usata. L'originale non è stato condiviso |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice_fx.wav` (voce montata e trattata) e `mix_final.wav` (traccia finale). `phrases_raw.json` (frasi nella registrazione), `phrases.json` (frasi dopo il montaggio), `warp3.json` (tempi della scaletta → tempi reali) |
| `video/` | Animazione (`ep3.html` + `ep3.js`, three.js), labiale (`lip3.js`), rendering, sottotitoli, copertina |
| `descrizione.md` | Descrizione con hashtag (la versione scritta dall'autore il 19/11/2026) |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (meno di un minuto)
```
audio/build_audio.sh
```
Passaggi: trattamento e montaggio della voce (`voice_ep3.py`, che scrive anche i tempi delle frasi e il labiale `video/lip3.js`), musica ed effetti (`music3.py`), mix (`mix3.py -1.6 0 -5`).
Il risultato è identico bit per bit a `audio/mix_final.wav` (verificato il 23/11/2026; anche `voice_fx.wav`, `phrases_raw.json`, `phrases.json` e `lip3.js` escono identici).

### 2. Animazione (video muto)
In locale (circa 25 minuti senza scheda grafica):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository): `dir` = `Post 3/video`, `page` = `ep3.html`, `seconds` = `66.2`, `jobs` = `10`, `tag` = `post3_ep3`.
Il video muto già pronto è `output/ep3_muto.mp4` (verificato: fotogrammi disegnati oggi dal codice e fotogrammi del video pubblicato coincidono, a parte la compressione).

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh                                  # usa ep3_muto.mp4 e ../audio/mix_final.wav
./assemble.sh ../output/ep3_muto.mp4                       # senza rifare il rendering
```
Produce `nuclearechiaro_ep3.mp4` (senza sottotitoli) e `nuclearechiaro_ep3_sottotitoli.mp4` (quello pubblicato).
Verificato: nella versione senza sottotitoli video e audio decodificati sono identici a quelli in `output/`. Nella versione con i sottotitoli l'audio è identico e l'immagine differisce solo per gli arrotondamenti dell'encoder (PSNR medio 106 dB, invisibile): la codifica x264 a più processi non dà mai due file identici, nemmeno lanciando due volte lo stesso comando.

## Come funziona l'animazione
- `ep3.js` contiene tutto. Due scene disegnate una sopra l'altra: il **mondo** (colline, centrale, torri, traliccio, bandiera), con una camera che si avvicina alla cupola, al nocciolo e alla sala turbine; il **primo piano** (mascotte, icone, lente), con una camera fissa.
- La mascotte saluta grande al centro per meno di un secondo, poi si rimpicciolisce in basso a destra e parla da lì per tutto il video (sopra i sottotitoli, a sinistra dei pulsanti dei social); alla fine indica i commenti, saluta ed esce.
- La metà davanti della cupola e la parete della sala turbine diventano trasparenti: dentro ci sono il recipiente del reattore con le barrette, il circuito primario (gocce arancioni che girano), il generatore di vapore (bolle), la linea del vapore, la turbina, l'alternatore, il condensatore e la linea dell'acqua di ritorno. Le scintille escono dall'alternatore lungo il cavo fino al traliccio.
- Icone (dischi bianchi con bordo blu): termometro che sale, vapore, turbina di tre quarti, goccia; poi l'anello del ciclo Rankine con le frecce, che ritorna alla fine su "e il ciclo ricomincia" e resta a schermo per circa 3,7 s. In basso a sinistra: termometro piccolo, manometro, lampadina. La lente mostra barrette → pastiglia → atomo che si divide. `centerIcons()` compensa la prospettiva così i modellini restano al centro dei cerchi.
- **Due tempi.** La tabella `WARP` riallinea i tempi della scaletta ai tempi reali della voce (66,2 s) e serve solo per gli **eventi** (comparse, accensioni, espressioni). Tutto ciò che si muove di continuo (turbina, gocce e vapore nei circuiti, pallini sull'anello, scintille, nuvole, ondeggiamento della mascotte) usa il tempo reale `tn`: con la tabella andava a scatti, perché cambia ritmo da una frase all'altra. Camera, aperture e avanzamento del vapore usano `rt(...)`, che sposta le chiavi con `WARP` ma lascia fluido il movimento fra due chiavi.
- `window.renderFrame(t)` disegna l'istante `t` (in secondi). `render.js` apre la pagina in Chrome senza interfaccia, avanza un fotogramma alla volta e passa le immagini a ffmpeg.
- Il labiale viene da `lip3.js` (apertura della bocca per fotogramma, ricavata dal volume della voce da `audio/voice_ep3.py`). Con `ep3.html?lip=0` si vede il labiale simulato della prova.
- Prova di singoli fotogrammi: `PAGE=ep3.html VW=1080 VH=1920 PREFIX=prova node render.js still 12,25.6,50.2`.

## Audio: cosa è stato fatto
- Voce: versione Adobe Podcast della registrazione (picco −5,5 dBFS, fondo circa −70 dB, niente da riparare). Montaggio: silenzio iniziale portato a 0,3 s, pause tra le frasi accorciate a 0,9 s al massimo (1,2 s prima di "La fonte del calore", mentre la camera entra nella cupola), **2 s di silenzio aggiunti dopo "e il ciclo ricomincia"** perché l'anello del ciclo resti a schermo. Senza tagli il video sarebbe durato circa 70 s. Poi livellamento per frase (±3 dB), equalizzazione (taglio sotto 75 Hz, −2,5 dB a 230 Hz, +3 dB a 3,8 kHz, +2,5 dB sopra 9 kHz), de-esser, compressione leggera, limitatore.
- Musica: kalimba a 100 bpm in do maggiore, che cambia con le scene (leggera nel saluto, ritmo leggero sul ciclo, più raccolta nel nocciolo, regolare sui circuiti, piena su vapore e turbina, arpeggio che sale sull'anello finale, accordo quando la mascotte esce).
- Effetti: uno per evento visivo (edifici che spuntano, icone, termometro che sale, apertura della cupola, fissione, acqua che bolle, vapore, turbina che prende velocità, ronzio dell'alternatore, scintille, lampadina, condensatore, uscita della mascotte).
- Mix: la musica è **5 dB più bassa ovunque** rispetto al primo mix e scende di altri 5 dB mentre l'autore parla. L'autore ha provato anche −10 dB (troppo bassa). Volume finale −14,5 LUFS, picco −2,8 dBFS.

## Sottotitoli
`video/make_subs3.py`: testo effettivamente pronunciato (controllato con la trascrizione automatica, `audio/transcribe3.py`) sui tempi reali delle frasi (`audio/phrases.json`), ogni frase divisa in righe con il tempo ripartito in base alla lunghezza. I numeri in cifre ("a circa 320 gradi").
Stile del canale: Poppins grassetto bianco, contorno blu `#0c1c4a`, una riga di max 22 caratteri, centro al 79,5% dell'altezza.
Punteggiatura: tolti punti, virgole e due punti a fine riga; **? e ! restano**, così come la punteggiatura in mezzo alla riga ("Ciao!", "domanda, fammela").
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

Trascrizione di controllo (facoltativa): `pip install sherpa-onnx`, scaricare `sherpa-onnx-whisper-small.tar.bz2` dalle release "asr-models" di github.com/k2-fsa/sherpa-onnx, poi
```
ffmpeg -i audio/voice_fx.wav -ac 1 -ar 16000 audio/v16.wav
python3 audio/transcribe3.py <cartella del modello> audio/v16.wav audio/phrases.json
```

## Copertina
`output/copertina_ep3.jpg`: la centrale intera vista di fronte, cupola e sala turbine trasparenti con tutti i componenti accesi, senza mascotte, titolo "CENTRALE / NUCLEARE / come funziona".
```
cd video && PAGE='ep3.html?cover=1&cx=1.45&cy=4.6&cz=-6&ly=5.9' VW=1080 VH=1920 PREFIX=cov node render.js still 0
python3 make_cover3.py cov_0.jpg copertina_ep3.jpg "CENTRALE" "NUCLEARE" "come funziona"
```
(riproduce la copertina pixel per pixel, verificato). Titolo e centrale stanno nella fascia visibile anche nella griglia 3:4 del profilo (da 240 a 1680 px).

## Testo pronunciato
Ciao! Ti spiego il funzionamento di una centrale nucleare. L'idea alla base è semplice: scaldi dell'acqua, generi del vapore e fai girare una turbina. In pratica si sfrutta un ciclo termodinamico chiamato ciclo Rankine. La fonte del calore che scalda l'acqua si trova nel nocciolo: migliaia di barrette piene di pastiglie di uranio. Al loro interno, gli atomi subiscono una reazione nucleare. Il calore generato passa all'acqua del circuito primario, a circa trecentoventi gradi. Non bolle, perché è tenuta ad altissima pressione. Questo circuito è chiuso: la sua acqua non esce mai e non si mescola con altra. Cede solo il calore a un secondo circuito, dove l'acqua, a pressione più bassa, diventa vapore. Il vapore fa girare una turbina e l'alternatore produce elettricità. Infine il vapore si condensa e il ciclo ricomincia. Se hai qualche domanda, fammela nei commenti: ti risponderò, e magari ci faccio un video.

## Dati e fonti (novembre 2026)
- Circuito primario di un reattore ad acqua in pressione: circa 320 °C nel nocciolo, pressione di circa 155 bar per tenere l'acqua liquida (brevetto USPTO 4728485; dati di riferimento PWR, Politecnico di Torino: 292 °C in ingresso, 329 °C in uscita, 155 bar).
- Una pastiglia di combustibile (poco meno di 1 cm di diametro, poco più di 1 cm di lunghezza) dà circa la stessa energia di una tonnellata di carbone (World Nuclear Association, "Nuclear Fuel and its Fabrication").
- Oltre il 70% dei reattori in funzione è ad acqua in pressione (PWR) (World Nuclear Association, World Nuclear Outlook Report).
