# Post 5 — "Chi tiene il volante della reazione?" (moderazione e barre di controllo)

Quinto video del canale **Nucleare chiaro per tutti** (`nuclearechiaro`). Pubblicato il 24/11/2026.
Verticale 1080×1920, 30 fps, 82,6 s, voce dell'autore, musica ed effetti originali sintetizzati via codice, sottotitoli impressi.

In questa cartella c'è tutto per ricreare il video da zero: registrazione, codice dell'animazione, audio, sottotitoli, copertina e descrizione.

## Contenuto

| Cartella | Cosa c'è |
|---|---|
| `output/` | Video pubblicato (`nuclearechiaro_ep5_sottotitoli.mp4`), versione senza sottotitoli (`nuclearechiaro_ep5.mp4`), video muto (`ep5_muto.mp4`), sottotitoli `.srt`, copertina (`copertina_ep5.jpg`) |
| `sorgenti/` | La registrazione dell'autore già passata in Adobe Podcast Enhance (`Voce_5-mejorada-v2.wav`, 87,1 s, senza il saluto iniziale): è quella usata |
| `audio/` | Script dell'audio e i due risultati già pronti: `voice_fx.wav` (voce montata e trattata) e `mix_final.wav` (traccia finale). `phrases_raw.json` (le 23 frasi nella registrazione), `phrases.json` (25 frasi dopo il montaggio), `warp5.json` (tempi della scaletta → tempi reali), `events5.json` (tempi degli eventi dell'animazione per gli effetti sonori) |
| `video/` | Animazione (`ep5.html` + `ep5.js`, three.js), labiale (`lip5.js`), rendering, sottotitoli, copertina (con lo sfondo usato, `copertina_sfondo.jpg`) |
| `descrizione.md` | Descrizione con hashtag |

## Requisiti
- Node.js 22, Google Chrome, ffmpeg (con libass per i sottotitoli)
- Python 3 con `numpy`, `scipy`, `soundfile`, `Pillow`
- In `video/`: `npm install` (installa three.js 0.187 e Playwright). Se Chrome non è in `/usr/bin/google-chrome`: `export CHROME=/percorso/di/chrome`

## Ricostruire il video

### 1. Audio (circa un minuto)
```
audio/build_audio.sh
```
Passaggi:
- rilevamento delle frasi (`detect5.py`);
- montaggio e trattamento della voce (`voice_ep5.py`), che scrive anche i tempi delle frasi, la tabella `warp5.json` e il labiale `video/lip5.js`;
- musica ed effetti (`music5.py`);
- mix (`mix5.py -1.6 0 -5`).

Verificato il 24/11/2026: `mix_final.wav`, `voice_fx.wav`, `phrases_raw.json`, `phrases.json`, `warp5.json` e `lip5.js` escono identici bit per bit.

`events5.json` viene dall'animazione: all'avvio `ep5.js` simula le catene di fissioni e gli urti sulle molecole d'acqua, e stampa i tempi in console. Per rigenerarlo (serve solo se si cambia l'animazione): `cd video && node print_events.js`.
Se si cambia `warp5.json`, la tabella va copiata anche in `WARP` dentro `ep5.js`.

### 2. Animazione (video muto)
In locale (circa 1,7 s per fotogramma senza scheda grafica: più di un'ora con due processi):
```
cd video && npm install && ./run_render.sh
```
Oppure con GitHub Actions (workflow **Rendering** di questo repository), in 8–10 minuti. Parametri: `dir` = `Post 5/video`, `page` = `ep5.html`, `seconds` = `82.6`, `jobs` = `20`, `tag` = `post5_ep5`.
Il video muto già pronto è `output/ep5_muto.mp4` (corsa `ep5_voce7`).

### 3. Unione con audio e sottotitoli
```
cd video && ./assemble.sh                                  # usa ep5_muto.mp4 e ../audio/mix_final.wav
./assemble.sh ../output/ep5_muto.mp4                       # senza rifare il rendering
```
Produce `nuclearechiaro_ep5.mp4` (senza sottotitoli) e `nuclearechiaro_ep5_sottotitoli.mp4` (quello pubblicato).

Verificato il 24/11/2026:
- senza sottotitoli, video e audio decodificati sono identici a quelli in `output/`;
- con i sottotitoli, l'audio è identico e il video coincide a parte minime differenze della ricompressione (PSNR 65,6 dB).

## La storia del video
- Domanda lasciata aperta dalla puntata 4: se ogni fissione libera 2 o 3 neutroni, perché la reazione non scappa? Due "segreti":
  - **moderazione**: i neutroni nascono velocissimi; l'acqua fra le barre li rallenta, e solo così spaccano bene l'U-235;
  - **equilibrio**: per ogni fissione, uno solo dei neutroni deve causarne un'altra; le barre di controllo regolano questo numero e in emergenza cadono da sole.
- L'autore ha tolto dal testo il coefficiente di temperatura del moderatore e i neutroni ritardati, rimandati a puntate future.
- Prima puntata disegnata su GitHub Actions: 13 bozze di animazione sui tempi della scaletta (https://claude.ai/artifact/YGnwAZjKAVFrvktpZEoAjm), poi la voce e 7 prove.
- Cambi principali chiesti dall'autore:
  - la moderazione in una sola pastiglia era irrealistica: l'acqua sta **fra** le barre, quindi il neutrone esce da una barra, rallenta nell'acqua e fa fissione in un'altra;
  - barre molto larghe;
  - acqua fra le barre più larga (alla fine 8, contro 14 della barra);
  - barra di controllo fatta di atomi neri che scende al picco della catena e assorbe tutti i neutroni;
  - barre viste da vicino nello stesso stile delle barrette 3D;
  - niente saluto iniziale: il video parte dallo zoom nella centrale.

## Come funziona l'animazione
- `ep5.js` contiene tutto. Ci sono tre "mondi", disegnati uno alla volta con un breve lampo chiaro a ogni passaggio (`SWITCH`, `fadeAt`):
  - **CENTRALE**: quella della puntata 3. In apertura la cupola si apre con lo zoom sul nocciolo; in chiusura la camera si allontana fino al paesaggio, con la centrale sempre in funzione.
  - **BARRETTE 3D**: barrette di combustibile color rame nell'acqua, barre di controllo grigio scuro lunghe quanto le barrette, tenute da elettromagneti con la luce azzurra.
    - La posizione delle barre è data da `INS` e la luminosità delle barrette segue `power(t)`.
    - SCRAM: i magneti si spengono e le barre cadono in circa 1,4 s.
  - **ATOMI**, in due zone:
    - zona 1, dentro una pastiglia: la catena d'apertura. I frammenti rimbalzano e scaldano gli U-238 (`fragmentsBounce`, `heatOf`); i neutroni assorbiti tremano con il loro nucleo.
    - zona 2: barre verticali larghe (`RW` 14) con l'acqua in mezzo (`GAP` 8).
- **Zona 2, barre e acqua**:
  - da lontano si vedono le pastiglie (un solo cilindro scanalato per barra, `pelGeo`, con guaina lucida e bagliori arancioni) e la targhetta "Barra di Uranio" (`rodLabel`); entrando nella barra le pastiglie diventano trasparenti e compaiono i nuclei;
  - le molecole d'acqua (ossigeno azzurro, due idrogeni) hanno densità uniforme (`MOLS`); i neutroni rimbalzano su quelle esistenti (`nearestMol`, `zigNeutron`), rallentando di un fattore K a ogni urto;
  - la barra di controllo fatta di atomi (tre colonne, `CTRL`) spinge le molecole in basso e di lato.
- **Due tempi.** La tabella `WARP` riallinea i tempi della scaletta ai tempi reali della voce e serve per gli eventi; tutto ciò che si muove di continuo usa il tempo reale `tn`; le camere usano `rt(...)`.
- `window.renderFrame(t)` disegna l'istante `t` in secondi. `?cover=1` nasconde mascotte e icone. Prova di singoli fotogrammi: `PAGE=ep5.html VW=1080 VH=1920 PREFIX=prova node render.js still 10.3,36.4`.

## Audio: cosa è stato fatto
- **Voce**: versione Adobe Podcast della registrazione, senza "Ehi" iniziale.
  - Due frasi lunghe sono state divise sulle pause interne.
  - Ogni battuta della scaletta si appoggia sulla voce: dove la voce è più corta l'animazione va alla sua velocità e la pausa dopo si allunga; dove è più lunga l'animazione rallenta.
  - Pause dentro una battuta: 0,7 s al massimo.
  - Pausa dopo "chi la tiene sotto controllo?" accorciata a 2,75 s, perché "Primo segreto" comincia durante lo zoom nella barra.
  - Pause allungate: 1,0 s prima di "Per questo nel reattore…", 1,0 s dopo "che si spacca", 1,1 s dopo "si spegne".
  - La fissione della B7 cade su "spacca".
  - Poi livellamento per frase (±3 dB), equalizzazione, de-esser, compressione leggera, limitatore.
- **Musica**: kalimba a 100 bpm in do maggiore, che cambia con le scene.
- **Effetti**: comparsa della mascotte, lampi di passaggio, ogni fissione, catture, una goccia per ogni urto sulle molecole d'acqua, bilancia e termometro, la barra di controllo di atomi che scende (soffio, rombo basso, colpo d'arresto con risonanza metallica), barre 3D che scendono e salgono, ronzio degli elettromagneti, caduta delle barre, uscita della mascotte.
- **Mix**: musica a −5 dB ovunque; nella pausa dello zoom fino alle barre sale. Volume finale −14,4 LUFS, picco −2,6 dBFS.

## Sottotitoli
`video/make_subs5.py`: testo effettivamente pronunciato (controllato con `audio/transcribe5.py`), sui tempi reali delle frasi. Numeri in cifre ("circa 20 000 chilometri al secondo"). Stile e punteggiatura del canale: Poppins grassetto, contorno `#0c1c4a`, 22 caratteri per riga; a fine riga si tolgono . , : ; e restano ? e !.
Alla pubblicazione vanno disattivati i sottotitoli automatici di Instagram/TikTok.

## Copertina
Barre di controllo 3D abbassate fra le barrette luminose (scelta dall'autore), senza mascotte, titolo "IL FRENO / DEL REATTORE" (riga bianca, ultima gialla).
```
cd video && python3 make_cover5.py copertina_sfondo.jpg copertina_ep5.jpg "IL FRENO" "DEL REATTORE"
```
Riproduce la copertina pixel per pixel (verificato). Lo sfondo si ridisegna con `PAGE='ep5.html?cover=1' VW=1080 VH=1920 PREFIX=cv node render.js still 63.3`.

## Testo pronunciato
Nell'uranio di una centrale nucleare avviene una reazione a catena. Ma se ogni fissione libera due o tre neutroni, chi la tiene sotto controllo? Primo segreto: i neutroni appena nati sono velocissimi, circa ventimila chilometri al secondo. Così veloci che l'uranio 235 quasi non li cattura. Per questo nel reattore c'è l'acqua, che è un moderatore: dopo una ventina di urti contro l'idrogeno, il neutrone rallenta. A questa velocità, il neutrone ha il tempo di interagire con il nucleo, che si spacca. Secondo segreto: affinché la reazione sia in equilibrio, di tutti i neutroni prodotti da una fissione, uno solo deve causarne un'altra. Se sono di più, la potenza sale. Se sono di meno, la reazione si spegne. Ed ecco il freno e acceleratore della reazione: le barre di controllo, piene di materiali che assorbono i neutroni, come il boro. Le abbassi e la reazione rallenta. Le alzi e accelera. Le barre sono tenute su da elettromagneti: se dovesse mancare la corrente, cadono da sole in un paio di secondi e la centrale si spegne. Hai qualche domanda? Fammela nei commenti.

## Dati e fonti (novembre 2026)
- **Velocità dei neutroni**: un neutrone di fissione ha in media circa 2 MeV, cioè circa 19 600 km/s. Un neutrone termico ha 0,025 eV, cioè circa 2,2 km/s (Euronuclear, glossario "neutrons, thermal").
- **Moderazione**: in acqua servono circa 18–20 urti per passare da 2 MeV a energia termica, quasi tutti con l'idrogeno (DOE Fundamentals Handbook, Nuclear Physics and Reactor Theory).
- **Fissione dell'U-235**: è qualche centinaio di volte più probabile con neutroni termici che con neutroni veloci.
- **Reattore critico**: k = 1, cioè un solo neutrone per fissione ne causa un'altra (HyperPhysics, "Control of nuclear reactors").
- **Barre di controllo**:
  - materiali: argento-indio-cadmio o carburo di boro;
  - nei PWR sono appese sopra il nocciolo con elettromagneti e cadono per gravità in circa 2 s (La radioactivité, IN2P3, "Reactor control rods");
  - nei PWR la potenza si regola anche con il boro sciolto nell'acqua (non detto nel video).
- **Geometria reale**: in un PWR la barretta ha un diametro di circa 9,5 mm e l'acqua fra due barrette è di pochi millimetri. Nel video l'acqua è più larga, per far vedere i rimbalzi.
