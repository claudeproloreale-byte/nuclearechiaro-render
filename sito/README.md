# sito/

Pagine pubblicate con GitHub Pages (workflow `Pagine`): https://claudeproloreale-byte.github.io/nuclearechiaro-render/

- `registratore/`: registratore delle battute. L'app di produzione lo apre con `#d=z.<battute>` (JSON `{p, t, b:[[id, nome, voce]]}` compresso deflate-raw, base64url). Una battuta alla volta, prese in IndexedDB del browser, "Unisci ed esporta" → `pN-voce.mp3` (mono, 48 kHz, 192 kbps, lamejs) + `pN-tempi.json` (inizio/fine di ogni battuta).
- `lame.min.js`: lamejs 1.2.1 (LGPL, vedi `lame.LICENSE`).
