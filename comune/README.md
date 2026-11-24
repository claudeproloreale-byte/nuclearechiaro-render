# Libreria comune

Pezzi riusati da tutte le puntate (dalla 6). Ogni file ha in testa due righe d'uso.

| File | Cosa contiene |
|---|---|
| `base.js` | dimensioni (`?w=&h=`), matematica, `track`, `creaWarp`, semi casuali, mattoncini three.js, lampo dei passaggi |
| `palco.js` | renderer, primo piano (camera fissa), bloom, dissolvenza iniziale, lampo bianco a tutto schermo |
| `centrale.js` | la centrale di giorno con cupola apribile; inquadrature `CAM_WIDE`, `CAM_CORE`, `CAM_PUSH` |
| `atomi.js` | mondo degli atomi: nuclei, U-235 con alone, neutroni, fissioni, assorbimenti, camera, fondo che si scalda |
| `acqua.js` | molecole d'acqua, neutroni a zig-zag che rimbalzano sugli idrogeni, dilatazione |
| `mascotte.js` | la mascotte, labiale (simulato o dalla voce), battiti di ciglia, pose della mano |
| `icone.js` | dischi delle icone, termometro, bilancia, cronometro, centratura dei modellini |
| `render.js` | fotogrammi e video; serve la cartella della puntata e `/comune/` |

## Regole
- Una puntata importa da `/comune/...` e mette le sue scene in `scene/`. Ciò che vale per una sola puntata non entra qui.
- Ogni costruzione fissa il suo seme (`setSeed`): una scena aggiunta non cambia le altre.
- Prima di cambiare un file comune: fotogrammi di prova delle puntate che lo usano (`FMT=png`, confronto pixel per pixel).
- Nel repository di rendering la cartella sta in `comune/`, accanto a `ep6/`: `ep6/video/render.js` la usa con `../../comune/`.
