# Post 2 — "Perché in Italia si riparla di nucleare?"

Secondo video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Pubblicato il 18/11/2026.
Verticale 1080×1920, 30 fps, 58,4 s, voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazione originale, codice dell'animazione, audio, sottotitoli, copertina e descrizione.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`nuclearechiaro_ep2_sottotitoli.mp4`), versione senza sottotitoli (`nuclearechiaro_ep2.mp4`), video muto (`ep2_muto.mp4`), sottotitoli `.srt`, copertina (`copertina_ep2.jpg`) |
| `sorgenti/` | La registrazione dell'autore: `Voce_video_2.m4a` (originale, in due riprese con un taglio tra la battuta 2 e la 3) e `Voce_video_2-mejorada-v2.wav` (la stessa passata in Adobe Podcast Enhance: è quella usata) |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice3_fx.wav` (voce trattata) e `mix_final.wav` (traccia finale). `warp2.json` e `phrases3.json`: tempi |
| `video/` | Animazione (`ep2.html` + `ep2.js`, three.js), labiale (`lip2.js`), rendering, sottotitoli, copertina |
| `descrizione.md` | Descrizione con hashtag |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (pochi secondi)
```
audio/build_audio.sh
```
Passaggi: trattamento della voce (`voice3.py`, che scrive anche i tempi delle frasi e il labiale `video/lip2.js`), musica ed effetti (`music2.py`), mix (`mix2.py`).
Il risultato è identico bit per bit a `audio/mix_final.wav` (verificato il 18/11/2026; anche `voice3_fx.wav`, `phrases3.json` e `lip2.js` escono identici).

### 2. Animazione (video muto)
In locale (circa 40 minuti senza scheda grafica):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository): `dir` = `Post 2/video`, `page` = `ep2.html`, `seconds` = `58.4`, `jobs` = `10`, `tag` = `post2_ep2`.
Il video muto già pronto è `output/ep2_muto.mp4` (verificato: fotogrammi disegnati oggi dal codice e fotogrammi del video pubblicato coincidono, a parte la compressione).

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh                                  # usa ep2_muto.mp4 e ../audio/mix_final.wav
./assemble.sh ../output/ep2_muto.mp4                       # senza rifare il rendering
```
Produce `nuclearechiaro_ep2_sottotitoli.mp4` (quello pubblicato) e `nuclearechiaro_ep2.mp4`. Verificato: video e audio decodificati sono identici ai file in `output/`.

## Come funziona l'animazione
- `ep2.js` contiene tutto: la collina che ruota come un piccolo pianeta fra tre luoghi (rinnovabili a sinistra, centrale nucleare al centro, fossili a destra), notte con luna e stelle, cielo grigio di smog, mascotte neutrone con casco, moneta, clessidra e foglio di progetto, oggetti in primo piano (lampadine, nave gasiera e gasdotto, casetta con contatore, monetine), bandiere italiana e francese che sventolano, centrale "dei vicini" con traliccio e cavo.
- `window.renderFrame(t)` disegna l'istante `t` (in secondi). `render.js` apre la pagina in Chrome senza interfaccia, avanza un fotogramma alla volta e passa le immagini a ffmpeg.
- La tabella `WARP` riallinea i tempi della scaletta (54,5 s) ai tempi reali della voce (58,4 s): serve per comparse, accensioni ed espressioni. Le rotazioni della collina (`T.rot`) sono scritte direttamente in tempo reale, così restano fluide.
- Il labiale viene da `lip2.js` (apertura della bocca per fotogramma, ricavata dal volume della voce da `audio/voice3.py`). Con `ep2.html?lip=0` si vede il labiale simulato della prima prova.
- Prova di singoli fotogrammi: `PAGE=ep2.html VW=1080 VH=1920 PREFIX=prova node render.js still 10,26.5,44.9`.

## Audio: cosa è stato fatto
- Voce: versione Adobe Podcast della registrazione (niente saturazione, fondo uniforme anche sul taglio fra le due riprese). Livellamento per frase (±3 dB), +0,5 s di pausa prima di "Oggi quel qualcun altro" (per dare tempo alla rotazione verso i fossili), equalizzazione (taglio sotto 75 Hz, −2,5 dB a 230 Hz, +3 dB a 3,8 kHz, +2,5 dB sopra 9 kHz), de-esser, compressione leggera, limitatore.
- Musica: kalimba a 100 bpm in do maggiore, che cambia umore con le scene (leggera, preoccupata, luminosa, sospesa di notte, cupa sui fossili, ritmata sul nucleare, più seria su "costa, e ci vuole tempo"), accordo finale sul lampo.
- Effetti: uno per evento visivo (lampadine, monetine, rotazioni della collina, fiamma, camion, casco, foglio, volo finale). L'occhiolino e il suo effetto sono stati tolti su richiesta dell'autore.
- Mix: la musica è **5 dB più bassa ovunque** rispetto al primo mix e scende di altri 5 dB mentre l'autore parla. L'autore ha provato anche −10 dB (troppo bassa) e altri stili di musica (pianoforte e archi, elettronica, chitarra: scartati). Volume finale −14,5 LUFS.

## Sottotitoli
`video/make_subs.py`: testo effettivamente pronunciato (controllato con la trascrizione automatica, `audio/transcribe.py`) sui tempi reali delle frasi (`audio/phrases3.json`), ogni frase divisa in righe con il tempo ripartito in base alla lunghezza.
Stile del canale: Poppins grassetto bianco, contorno blu `#0c1c4a`, una riga di max 22 caratteri, centro al 79,5% dell'altezza.
Punteggiatura: tolti punti, virgole e due punti a fine riga; **? e ! restano**, così come la punteggiatura in mezzo alla riga.
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

Trascrizione di controllo (facoltativa): `pip install sherpa-onnx`, scaricare `sherpa-onnx-whisper-small.tar.bz2` dalle release "asr-models" di github.com/k2-fsa/sherpa-onnx, poi
```
ffmpeg -i audio/voice3_fx.wav -ac 1 -ar 16000 audio/v16.wav
python3 audio/transcribe.py <cartella del modello> audio/v16.wav audio/phrases3.json
```

## Copertina
`output/copertina_ep2.jpg`: centrale in primo piano, rinnovabili sullo sfondo a sinistra e fossili a destra, senza mascotte, titolo "PERCHÉ / ci serve?".
```
cd video && PAGE='ep2.html?cover=1' VW=1080 VH=1920 PREFIX=cov node render.js still 0
python3 make_cover.py cov_0.jpg "PERCHÉ" "ci serve?" copertina_ep2.jpg
```
(riproduce la copertina pixel per pixel, verificato). La modalità `?cover=1` di `ep2.js` mette la cupola chiusa, il fumo della ciminiera che esce a destra e il camion sul pendio davanti alla collina.

## Testo pronunciato
Ehi! Lo sapevi che l'Italia compra all'estero tre quarti dell'energia che usa? E la nostra corrente è tra le più care d'Europa. Sole, vento e acqua ci danno già il 40% dell'elettricità, e devono ancora crescere! Ma di notte e quando non c'è vento, serve qualcun altro. Oggi quel qualcun altro sono i combustibili fossili: soprattutto gas, e ancora un po' di carbone e petrolio. Li compriamo all'estero, costano cari e inquinano. Ecco dove entro in gioco io. Una centrale nucleare produce giorno e notte, senza emettere anidride carbonica né inquinare l'aria. E una parte della corrente che compriamo dai vicini nasce già così. Costa, e ci vuole tempo: per questo se ne discute. Ma da settembre l'Italia ha una legge per ricominciare a progettarlo. Ti interessa saperne di più? Seguimi!

## Dati e fonti (novembre 2026)
- Dipendenza energetica dall'estero 2025: oltre tre quarti dell'energia (relazione del Ministero dell'Ambiente e della Sicurezza Energetica su dati Eurostat).
- Elettricità 2025: 311.324 GWh, rinnovabili 41,1%, non rinnovabili 43,8%, saldo estero 15,1% (Terna, rapporto mensile di dicembre 2025).
- Prezzo all'ingrosso 2025: PUN medio 115,9 €/MWh, Francia 61,1, Spagna 65,3 (ARERA).
- Legge delega sul nucleare sostenibile approvata definitivamente dal Senato il 23/09/2026 (legge 169/2026).
