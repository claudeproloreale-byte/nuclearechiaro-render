# Post 1 — Video introduttivo ("Ciao, io sono un neutrone")

Primo video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Pubblicato il 17/11/2026 su Instagram, poi su YouTube Shorts e TikTok.
Verticale 1080×1920, 30 fps, 37 s, voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazioni originali, codice dell'animazione, audio, sottotitoli, copertine e descrizione.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`neutrone_intro_sottotitoli.mp4`), versione senza sottotitoli, video muto (`intro_muto.mp4`), sottotitoli `.srt`, due copertine, due foto profilo |
| `sorgenti/` | Le registrazioni dell'autore: `Prova_1-mejorada-v2.wav` (ripresa completa, passata in Adobe Podcast) e `Modifica_1.m4a` (primi 6 s rifatti per dire "funzionare") |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice_fx.wav` (voce montata) e `mix_final.wav` (traccia finale) |
| `video/` | Animazione (`intro.html` + `intro.js`, three.js), rendering, sottotitoli, copertine, foto profilo |
| `descrizione.md` | Descrizione con hashtag (Instagram, TikTok, YouTube) e titolo per YouTube |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (circa 1 minuto)
```
audio/build_audio.sh
```
Passaggi: pulizia e livellamento della ripresa 1 (`voice.py`), sostituzione dei primi 6 s con la nuova ripresa (`patch_voice.py`), limitatore, ripristino del "Ciao" della ripresa 1 (`ciao.py`, preferito dall'autore), musica ed effetti (`music.py`), mix con la musica che si abbassa sotto la voce (`mix.py`), volume finale −14,5 LUFS.
Il risultato è identico bit per bit a `audio/mix_final.wav` (verificato).

### 2. Animazione (video muto)
In locale (circa 15 minuti senza scheda grafica):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository): `dir` = `Post 1/video`, `page` = `intro.html`, `seconds` = `37.0`, `jobs` = `10`, `tag` = `post1_intro`.
Il video muto già pronto è `output/intro_muto.mp4`.

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh                                  # usa intro_muto.mp4 e ../audio/mix_final.wav
./assemble.sh ../output/intro_muto.mp4                     # senza rifare il rendering
```
Produce `neutrone_intro_sottotitoli.mp4` (quello pubblicato) e `neutrone_intro_senza_sottotitoli.mp4`.

## Come funziona l'animazione
- `intro.js` contiene tutto: scene (spazio, paura, alba sulla centrale), mascotte neutrone, casco, quattro icone (fissione, reattore, sicurezza, scorie), luci e tempi.
- `window.renderFrame(t)` disegna l'istante `t` (in secondi). `render.js` apre la pagina in Chrome senza interfaccia, avanza un fotogramma alla volta e passa le immagini a ffmpeg.
- La tabella `WARP` riallinea i tempi della scaletta originale (43,5 s) ai tempi reali della voce (37 s).
- La costante `LIP` (copiata anche in `lip.json`) dice quanto è aperta la bocca in ogni fotogramma; è ricavata dal volume della voce. Se si cambia la voce: `python3 audio/lip.py audio/voice_fx.wav video/lip_nuovo.json`, poi si sostituisce `LIP` in `intro.js`.
- Prova di singoli fotogrammi: `PAGE=intro.html VW=1080 VH=1920 PREFIX=prova node render.js still 2,10,27`.

## Sottotitoli
`video/make_subs_intro.py`: testo effettivamente pronunciato (controllato con trascrizione automatica) sui tempi reali delle frasi.
Stile del canale: Poppins grassetto bianco, contorno blu `#0c1c4a`, una riga di max 22 caratteri, centro al 79,5% dell'altezza.
Punteggiatura: tolte le virgolette «» e punti, virgole e due punti a fine riga; **? e ! restano** (richiesta dell'autore del 17/11/2026).
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

## Copertine
- `output/copertina_1_bocca_aperta.png`: fotogramma a 34,8 s + titolo.
  ```
  cd video && PAGE=intro.html VW=1080 VH=1920 PREFIX=t node render.js still 34.8
  FONTS=fonts python3 make_cover_intro.py t_34.8.jpg copertina.png
  ```
  (lo script riproduce la copertina pixel per pixel, verificato)
- `output/copertina_2_tranquilla.png`: stessa grafica, mascotte con un sorriso chiuso e posa calma. La posa si ottiene con `node cover_intro.js sfondo.jpg '<posa json>'` (`intro.js` accetta `window.COVER` con i campi `mx, my, ms, gaze, hx, hy, hz, eyeS, squint, sad, browY, open, smile, hr, hl`), poi `make_cover_intro.py`. I valori esatti di quella posa non sono stati salvati: l'immagine finale è comunque qui.
- Foto profilo (`foto_profilo_open.png`, usata, e `foto_profilo_smile.png`): `node avatar.js` in `video/`, poi ritaglio a 1080×1080.

## Voce: cosa è stato fatto
- Ripresa 1: tolti quattro micro-scatti e un respiro, alzati "è capire" e "la sicurezza e le scorie", +0,4 s di pausa dopo "capire", −0,6 s prima di "Con dei video brevi", equalizzazione (taglio sotto 75 Hz, −3 dB a 230 Hz, +3,5 dB a 4,2 kHz), compressione leggera.
- Ripresa 2 (`Modifica_1.m4a`, non passata in Adobe Podcast): riduzione del rumore, timbro e volume adattati alla ripresa 1, montata da "io sono un neutrone" a "reattori nucleari".
- Il "Ciao" iniziale è quello della ripresa 1.

## Testo pronunciato
Ciao! Io sono un neutrone: una delle particelle che fanno funzionare i reattori nucleari. Lo so: quando senti la parola "nucleare", un po' di paura ti viene. Ma sai cosa? Spesso abbiamo paura di ciò che non conosciamo. E il modo migliore per vincere la paura è capire. Per questo nasce questo canale. Io e l'ingegnere nucleare che mi dà la voce ti spiegheremo come funziona davvero: la fissione, i reattori, la sicurezza e le scorie. Con dei video brevi e chiari, un passo alla volta. Allora, sei pronto? Dai, andiamo!
