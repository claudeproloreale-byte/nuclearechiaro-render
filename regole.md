# Regole del canale (per fare e correggere i video)

Versione corta e operativa. Identità, piano editoriale, pubblicazione e storia delle decisioni: `nuclearechiaro video 2/CANALE.md`.

## Formato
- Reel verticale 1080×1920, 30 fps, H.264 + AAC. Durata 30–60 s (puntata 6: circa 50 s); si sfora solo se serve all'animazione e l'autore è d'accordo.
- Zone sicure: niente di importante nel 10% in alto e nel 20% in basso; a destra, dal 55% all'88% dell'altezza, la colonna dei pulsanti: vuota.
- Ultimo secondo e mezzo: paesaggio pulito, senza mascotte.
- Apertura calma, un'informazione alla volta; schemi riassuntivi a schermo qualche secondo; zoom lenti, senza scatti.

## Scritte e sottotitoli
- Unica scritta nel video: i sottotitoli impressi (eccezione: targhette "Uranio 235/238", "Plutonio 239" della puntata 4).
- Testo effettivamente pronunciato. Punteggiatura normale; a fine riga si tolgono `. , : ;`, le «» sempre; restano `?` `!` e la punteggiatura in mezzo alla riga. Numeri in cifre.
- Poppins grassetto bianco, contorno `#0c1c4a`, una riga di 22 caratteri al massimo, centro al 79,5% dell'altezza. Mascotte grande e icone non scendono sulla riga.
- Si conserva anche la versione senza sottotitoli; alla pubblicazione si spengono quelli automatici.

## Mascotte
- Sfera azzurra `#58b0ff` satinata, occhi bianchi opachi, sopracciglia a capsula, guance rosa, bocca bordeaux con lingua; mani staccate; niente gambe; niente riflessi forti sul viso. Occhiolino quasi mai.
- In apertura grande al centro per circa 1 s (saluto), poi in mezzo secondo piccola "in angolo" (in basso a destra, sopra i sottotitoli, a sinistra dei pulsanti). Labiale sempre attivo, gesti ridotti.
- Sull'ultima frase ("fammela nei commenti") indica a destra, verso i commenti.

## Scene
- 3D stilizzato "giocattolo", colori pieni. Centrale di giorno: colline, due torri con fascia rossa, cupola con fascia blu (metà frontale apribile, pavimento grigio dentro), sala turbine, bandiera italiana.
- Calore: termometro che sale, mai fiamme. Icone: dischi bianchi con bordo blu, modellino al centro del disco (`centerIcons`).
- Fra atomi e centrale: zoom con un breve lampo chiaro.

## Atomi
- Fondo blu notte; nuclei di 40 nucleoni (protoni `#f06a52`, neutroni azzurri); U-235 alone giallo, plutonio verde. Si può esagerare la quota di U-235.
- Nuclei sparsi, mai sovrapposti; nessun nucleo né molecola dietro la mascotte in angolo; nelle panoramiche nessuna fascia vuota.
- Niente sparisce senza motivo: ogni neutrone spacca, viene assorbito da un U-238 o esce. Nessuna fissione spontanea. I frammenti rallentano e dissolvono solo lontano dalla camera o fuori campo; un nucleo urtato da un frammento si scalda.
- Acqua: ossigeno azzurro, due idrogeni bianchi; spiegata la moderazione, i neutroni continuano a rimbalzare sull'acqua.
- Bomba (puntata 6): lampo bianco a tutto schermo, niente fungo né distruzione.

## Tempi e codice
- Tempi "di scaletta" in tutto il codice; con la voce arriva la tabella `WARP`: serve **solo per gli eventi** (comparse, espressioni) e per le chiavi delle camere (`rt`). Ciò che si muove di continuo usa il tempo del video.
- Dalla puntata 6: libreria `comune/` + un file per scena in `scene/`; per una correzione si tocca solo la scena interessata. README della puntata breve (stato, dove si corregge, tempi); il resto in `STORICO.md`.
- Fotogrammi di prova a metà risoluzione: `?w=540&h=960` e `VW=540 VH=960`. Rendering completo su GitHub (workflow `Rendering`), solo dei tratti cambiati quando basta.
- Archivio completo su GitHub (`Post N/`) solo a puntata finita; durante il lavoro il codice sta nel repository di rendering.

## Audio
- Voce dell'autore (anche versione Adobe Podcast), tono mai ritoccato; pause fra le frasi al massimo 0,9 s, più lunghe dove l'animazione ne ha bisogno.
- Musica kalimba originale, 100 bpm, do maggiore, a −5 dB ovunque. Un effetto discreto per evento visivo.
- Mix finale circa −14,5 LUFS, picco −1,3 dBFS.
