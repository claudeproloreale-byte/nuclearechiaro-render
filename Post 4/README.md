# Post 4 — "Cosa succede quando colpisco un atomo" (la fissione)

Quarto video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Versione finale del 22/11/2026.
Verticale 1080×1920, 30 fps, 89,4 s, voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazione, codice dell'animazione, audio, sottotitoli, copertina e descrizione.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`nuclearechiaro_ep4_sottotitoli.mp4`), versione senza sottotitoli (`nuclearechiaro_ep4.mp4`), video muto (`ep4_muto.mp4`), sottotitoli `.srt`, copertina (`copertina_ep4.jpg`) |
| `sorgenti/` | La registrazione dell'autore già passata in Adobe Podcast Enhance (`Voce_4-mejorada-v2.wav`, 85,2 s, una sola ripresa): è quella usata. L'originale non è stato condiviso |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice_fx.wav` (voce montata e trattata) e `mix_final.wav` (traccia finale). `phrases_raw.json` (le 23 frasi nella registrazione), `phrases.json` (frasi dopo il montaggio), `warp4.json` (tempi della scaletta → tempi reali), `events4.json` (tempi degli eventi dell'animazione per gli effetti sonori) |
| `video/` | Animazione (`ep4.html` + `ep4.js`, three.js), labiale (`lip4.js`), rendering, sottotitoli, copertina (con lo sfondo usato, `copertina_sfondo.jpg`) |
| `descrizione.md` | Descrizione con hashtag |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (circa un minuto)
```
audio/build_audio.sh
```
Passaggi: trattamento e montaggio della voce (`voice_ep4.py`, che scrive anche i tempi delle frasi e il labiale `video/lip4.js`), tabella dei tempi (`warp4.py`), musica ed effetti (`music4.py`), mix (`mix4.py -1.6 0 -5`).
Il risultato è identico bit per bit a `audio/mix_final.wav` (verificato il 23/11/2026; anche `voice_fx.wav`, `phrases.json`, `warp4.json` e `lip4.js` escono identici).

`events4.json` viene dall'animazione: `ep4.js` simula all'avvio la reazione a catena e i rimbalzi dei frammenti e stampa i tempi in console. Per rigenerarlo (serve solo se si cambia l'animazione): `cd video && node print_events.js` (verificato: esce identico).
Se si cambia `phrases.json`, la tabella prodotta da `warp4.py` va copiata anche in `WARP` dentro `ep4.js`.

### 2. Animazione (video muto)
In locale (circa 1,5 s per fotogramma senza scheda grafica: circa un'ora con due processi):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository): `dir` = `Post 4/video`, `page` = `ep4.html`, `seconds` = `89.4`, `jobs` = `20`, `tag` = `post4_ep4`.
Il video muto già pronto è `output/ep4_muto.mp4` (verificato: fotogrammi disegnati oggi dal codice e fotogrammi del video pubblicato coincidono, a parte la compressione, PSNR circa 44 dB).

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh                                  # usa ep4_muto.mp4 e ../audio/mix_final.wav
./assemble.sh ../output/ep4_muto.mp4                       # senza rifare il rendering
```
Produce `nuclearechiaro_ep4.mp4` (senza sottotitoli) e `nuclearechiaro_ep4_sottotitoli.mp4` (quello pubblicato).
Verificato il 23/11/2026: in entrambe le versioni video e audio decodificati sono identici a quelli in `output/`.

## La storia del video
- Struttura dettata dall'autore: barretta → zoom nella pastiglia → U-235 e U-238 → la mascotte (un neutrone) colpisce un U-235 → 3 neutroni (uno catturato da un U-238, uno esce dal reattore, uno spacca un altro U-235) → reazione a catena → i frammenti di fissione frenano e scaldano → l'U-238 che cattura un neutrone diventa plutonio, anch'esso fissile.
- Scaletta scritta come documento modificabile (https://claude.ai/artifact/V9G9gRbUFT5Tpwjsto3zBH), corretta dall'autore.
- Quattro animazioni di prova sui tempi della scaletta (84,2 s), poi la voce e due giri di ritocchi.

## Come funziona l'animazione
- `ep4.js` contiene tutto. Tre "mondi" disegnati uno alla volta, con un breve lampo chiaro a ogni passaggio (`SWITCH`, `fadeAt`):
  - CENTRALE: la centrale della puntata 3 (apertura con zoom sul nocciolo, chiusura con zoom all'indietro fino al paesaggio);
  - BARRETTE: barrette di combustibile nell'acqua, guaina trasparente, pastiglie; in B11 l'acqua scorre e si scalda;
  - ATOMI: l'interno di una pastiglia, nuclei di uranio sparsi (mai sovrapposti, distanza minima 1,45 fra i centri). U-235 1 su 10 (più che nella realtà, per far vedere la catena), con l'alone giallo; dove nella vista larga della catena mancavano, ne sono stati aggiunti alcuni.
  - Sopra c'è il primo piano (mascotte, icone) con una camera fissa.
- Nucleo: 40 nucleoni (16 protoni corallo, 24 neutroni azzurri). Nella fissione si divide in due frammenti (24 + 16, come bario e kripton).
- La mascotte saluta grande, va in basso a destra, poi in B6 ("Guarda cosa succede quando un neutrone lo colpisce") fa da proiettile: vola fino all'U-235, sparisce nel lampo e ricompare nell'angolo stordita.
- **Neutroni** in linea retta: ognuno provoca un'altra fissione, viene assorbito da un U-238 o esce dall'inquadratura. Il terzo neutrone della prima fissione aspetta e parte su "il terzo", e spacca il secondo U-235 su "spacca". La reazione a catena (24 fissioni) è una simulazione decisa all'avvio, con seme fisso.
- **Frammenti "a biliardo"** (`fragSim`): partono veloci, rallentano e quando toccano un nucleo rimbalzano per riflessione, senza girarci attorno né sovrapporsi. Quelli della catena si fermano e poi dissolvono, ma mai mentre la camera è vicina; quelli della prima fissione, della fissione inquadrata F e del plutonio escono dall'inquadratura, fuori campo non rientrano e dissolvono dove non si vedono.
- **Calore**: i frammenti di F urtano diversi nuclei (l'asse è scelto per questo) ed escono in circa un secondo; i nuclei urtati diventano arancioni, vibrano e hanno un alone caldo, compresi i neutroni che avevano assorbito. Termometro della puntata 3.
- **Plutonio**: un U-238 in un'altra zona della pastiglia cattura un neutrone che arriva da fuori, due neutroni diventano protoni (decadimenti beta, con l'elettrone), alone verde e targhetta "Plutonio 239", poi si spacca quando un neutrone lo colpisce. Torta con un terzo verde.
- Targhette "Uranio 235", "Uranio 238", "Plutonio 239" (solo in questa puntata): ovali bianchi con bordo e testo blu scuro.
- **Due tempi.** La tabella `WARP` riallinea i tempi della scaletta ai tempi reali della voce (89,4 s) e serve per gli **eventi**; tutto ciò che si muove di continuo usa il tempo reale `tn`; le camere usano `rt(...)`. Gli zoom sono a scala logaritmica, per sembrare fluidi.
- `window.renderFrame(t)` disegna l'istante `t` (in secondi). Prova di singoli fotogrammi: `PAGE=ep4.html VW=1080 VH=1920 PREFIX=prova node render.js still 15.3,25.9,51.5`.

## Audio: cosa è stato fatto
- Voce: versione Adobe Podcast della registrazione (picco −5,4 dBFS, fondo circa −75 dB). "Ciao" originale (due versioni con il tono alzato sono state scartate dall'autore perché innaturali). Montaggio: pause a 0,9 s al massimo, allungate dove serve all'animazione: 1,2 s prima di "Gli atomi" (zoom nella pastiglia), 2,3 s dopo "lo colpisce" (volo della mascotte e urto), 2,1 s prima di "I due nuclei nuovi" (zoom sulla fissione F), 7,9 s prima di "E il 238?" (barrette che si scaldano); 3,05 s di paesaggio finale. Poi livellamento per frase (±3 dB), equalizzazione, de-esser, compressione leggera, limitatore.
- Musica: kalimba a 100 bpm in do maggiore, che cambia con le scene (leggera, sospesa sulla fissione spiegata, ritmo che cresce con la catena, arpeggi che salgono sulle barrette, sospesa sul plutonio, accordo finale).
- Effetti: urto della mascotte, ogni fissione della catena, catture, rimbalzi dei frammenti, termometro, bolle e acqua nelle barrette, decadimenti beta, targhette, torta, uscita della mascotte.
- Mix: la musica è **5 dB più bassa ovunque** rispetto al primo mix e scende di altri 5 dB mentre l'autore parla; nella pausa delle barrette sale di 5 dB. L'autore ha provato anche −10 dB (troppo bassa). Volume finale −14,3 LUFS, picco −2,7 dBFS.

## Sottotitoli
`video/make_subs4.py`: testo effettivamente pronunciato (controllato con la trascrizione automatica, `audio/transcribe4.py`) sui tempi reali delle frasi (`audio/phrases.json`), ogni frase divisa in righe con il tempo ripartito in base alla lunghezza. I numeri in cifre ("a circa 10 000 chilometri al secondo").
Stile del canale: Poppins grassetto bianco, contorno blu `#0c1c4a`, una riga di max 22 caratteri, centro al 79,5% dell'altezza.
Punteggiatura: tolti punti, virgole e due punti a fine riga; **? e ! restano** ("Ciao!", "E il 238?", "Domande?"), così come la punteggiatura in mezzo alla riga.
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

Trascrizione di controllo (facoltativa): `pip install sherpa-onnx`, scaricare `sherpa-onnx-whisper-small.tar.bz2` dalle release "asr-models" di github.com/k2-fsa/sherpa-onnx, poi
```
ffmpeg -i audio/voice_fx.wav -ac 1 -ar 16000 audio/v16.wav
python3 audio/transcribe4.py <cartella del modello> audio/v16.wav audio/phrases.json
```

## Copertina
Il lampo della fissione inquadrata (scelto dall'autore), senza mascotte, titolo "LA REAZIONE / NUCLEARE" (riga bianca, ultima gialla).
```
cd video && python3 make_cover4.py copertina_sfondo.jpg copertina_ep4.jpg "LA REAZIONE" "NUCLEARE"
```
(riproduce la copertina pixel per pixel, verificato). Lo sfondo è stato disegnato sull'animazione di prova, prima della voce: con il codice finale lo stesso momento si ottiene con `PAGE='ep4.html?cover=1&t=47.6' VW=1080 VH=1920 PREFIX=cov node render.js still 0`, ma il fotogramma non è identico (l'asse dei frammenti di F è cambiato), per questo lo sfondo originale è conservato in `copertina_sfondo.jpg`.

## Testo pronunciato
Ciao! Oggi ti porto dentro una pastiglia di uranio. Gli atomi non sono tutti uguali: ci sono due isotopi, l'uranio 235 e il 238. Stessi protoni, ma il 238 ha tre neutroni in più. Nel combustibile, il 235 è solo qualche atomo su cento. Guarda cosa succede quando un neutrone lo colpisce. Il nucleo si spacca in due: è la fissione. E libera due o tre nuovi neutroni. Due li cattura il 238 o scappano dal reattore, il terzo spacca un altro atomo di 235. Questo è fissile: si spacca e tiene viva la reazione a catena. I due nuclei nuovi, i prodotti di fissione, schizzano via a circa diecimila chilometri al secondo. Gli atomi vicini li frenano subito, e quella frenata diventa calore che scalda l'acqua. E il 238? Con il neutrone catturato, in pochi giorni diventa plutonio. Anche lui è fissile, ovvero può spaccarsi se colpito da un altro neutrone: alla fine, circa un terzo dell'energia di una centrale viene dal plutonio. Domande? Scrivile nei commenti.

## Dati e fonti (novembre 2026)
- Uranio naturale: 0,7% di U-235, oltre il 99,2% di U-238; combustibile arricchito di solito al 3,5–5% (World Nuclear Association, "Nuclear Power Reactors").
- Energia di una fissione: circa 200 MeV, per circa l'85% energia cinetica dei frammenti; reazione di esempio U-235 + n → Ba-141 + Kr-92 + 3n (World Nuclear Association, "Physics of Uranium and Nuclear Energy").
- Neutroni per fissione: 2,43 in media con neutroni termici (nuclear-power.com, "Uranium 235").
- Velocità iniziale dei frammenti dell'ordine di 10 000 km/s; si fermano in pochi micrometri, quindi il calore si deposita nella pastiglia (nuclear-power.com, "Fission fragments").
- Da U-238 a plutonio: U-239 (23,5 minuti) → Np-239 (2,36 giorni) → Pu-239 (nuclear-power.com).
- Circa un terzo dell'energia del combustibile viene dal plutonio (World Nuclear Association, "Plutonium").
