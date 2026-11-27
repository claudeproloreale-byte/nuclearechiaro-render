# Puntata 7 — Cos'è davvero la radioattività

**Scaletta di riferimento: nell'app di produzione** (https://claude.ai/artifact/LKLS4NqcETV4Hw6c2gwk4S, `scalette/p7`; richieste in `richieste`, versioni in `versioni/p7-v<k>`). Come si lavora: `piano app/app.md` nel progetto.

**Stato:** v5 (27/11/2026): 7 note della v4 (simbolo bianco che lampeggia di verde, camera più bassa con rocce e omino più vicini e banano a destra, raggi più sottili, nuclei più distanziati e instabili a griglia, lampo davanti ai nucleoni, Grande Carro nell'icona). v4 (27/11/2026): 10 note della v3 (lato natura a destra della centrale e camera più vicina, banano e rocce nuovi, omino nella collina, alfa veloce senza scia, gamma ultimo decadimento, stella vera, pesi a simbolo, aereo di linea, fusto più grande). v3 (26/11/2026), 96,4 s, 540×960, senza audio: revisione della scaletta (12 blocchi). B1 simbolo della radioattività verde fosforescente; B2–B3 sole, rocce e banano che si illuminano, raggi cosmici (niente icone); B4 omino che cammina e si gira; nuclei più distanziati; B7 un solo nucleo fa alfa, beta e gamma; B11 tre icone; B15 simbolo sul fusto. B7 7,5 s e B11 6,5 s (WARP in `tempi.js`). v2: B1 senza saluto. v1: bozza 1. Regole: `regole.md`.

## Dove si corregge
| Cosa | File |
|---|---|
| B1 spazio (stelle, simbolo della radioattività dalla v3; senza saluto) | `video/scene/spazio.js` (simbolo: `video/simbolo7.js`) |
| Lato natura (a destra della centrale dalla v4): sole, rocce, banano, raggi cosmici, omino e zoom nel puntino (B2–B5, B10–B12; tempi in `FOSF`, `CAMMINA`, `ZOOM`) | `video/scene/natura.js` |
| Collina: centrale, B13 (scorre verso sinistra), passaggio alla centrale (B13), cupola e barriere che si illuminano (B14–B15) | `video/scene/collina.js` (centrale: `comune/centrale.js`) |
| B5–B9 atomi: campo di nuclei (`DIST`), U1 e i suoi decadimenti (alfa, beta, gamma, poi stabile), 16 nuclei del dimezzamento, camera | `video/scene/atomi.js` |
| Aspetto dei nuclei instabili (alone rosa, tremolio) e delle radiazioni alfa, beta, gamma | `video/nuclei7.js` |
| Primo piano: tre icone (B11, stella vera), pesi a simbolo, aereo di linea, lampo della B5, cronometro (B9), bilancia (B10), cubetti, aereo e granellino (B11–B13), fusto (B15) | `video/scene/primopiano.js` |
| Mascotte (saluto, espressioni, gesti) | `video/mascotte7.js` |
| Tempi delle battute, passaggi fra i mondi, WARP (senza voce allunga solo B7 e B11) | `video/tempi.js` |
| Montaggio | `video/ep7.js` |

## Tempi (scaletta; nel video dalla B7 in poi si aggiunge la WARP: +0,5 s dopo la B7, +2 s dopo la B11)
B1 0,5–4,0 · B2 4,5–10,0 · B3 10,5–15,0 · B4 15,5–21,5 · B5 22,0–24,5 · B6 25,0–30,5 · B7 31,0–38,0 · B8 38,5–46,5 · B9 47,0–54,5 · B10 55,0–59,5 · B11 60,0–65,0 · B12 65,5–70,5 · B13 71,0–77,0 · B14 77,5–86,0 · B15 86,5–89,5 · B16 90,0–92,4 · paesaggio pulito 92,9–94,4.
Mondi: spazio 0–4,25 · collina 4,25–23,3 · atomi 23,3–55,1 · collina 55,1–94,4.

## Rendering
Prova a metà risoluzione: `PAGE='ep7.html?w=540&h=960' VW=540 VH=960 node render.js still 1,13.8,34.4,50.2,63,84.4`.
Video intero a metà risoluzione (circa 0,15 s per fotogramma, due processi): `node render.js seg 0 1416 a.mp4` e `seg 1416 2832 b.mp4`.
GitHub: workflow `Rendering`, `dir` = `ep7/video`, `page` = `ep7.html`, `seconds` = `96.4`.
