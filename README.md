# nuclearechiaro-render

Rendering dei video di "Nucleare chiaro per tutti" con GitHub Actions.
Il workflow `Rendering` divide il video in pezzi e li disegna su più macchine nello stesso momento, poi li unisce.
Il video finale è nell'artefatto della corsa e nel ramo `render-<tag>`.

## Struttura (dalla puntata 6)
- `comune/`: libreria comune a tutte le puntate (centrale, atomi, acqua, mascotte, icone, palco, rendering). Vedi `comune/README.md`.
- `epN/video/`: pagina, montaggio e un file per scena (`scene/`); `render.js` usa `../../comune/render.js`.
- `regole.md`: regole del canale per fare e correggere i video.
- `Post N/`: archivio completo di ogni puntata pubblicata.
