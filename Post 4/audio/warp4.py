# Puntata 4 — tabella WARP [tempo di scaletta, tempo reale] dai tempi reali delle frasi (phrases.json).
# Le chiavi sono gli inizi e le fini delle battute più alcuni eventi da mettere sulla parola giusta.
import json
P = json.load(open('phrases.json')); s = lambda k: P[k][0]; e = lambda k: P[k][1]
W = [[0, 0], [0.2, s(0)], [0.8, e(0)], [1.3, s(1)], [4.0, e(1)],
     [5.0, s(2)], [7.0, e(2)], [7.15, s(3)], [8.6, e(3)], [8.7, s(4)], [12.1, e(4)],            # B3 (tre frasi)
     [12.6, s(5)], [16.2, e(5)], [16.7, s(6)], [21.2, e(6)],                                      # B4, B5
     [21.3, s(7)], [21.7, e(7) - 0.15], [23.0, e(7) + 1.15], [24.0, s(8)],                        # B6: "Guarda cosa succede..." poi volo (1,3 s) e urto
     [28.9, e(10)],                                                                                # B7 (tre frasi)
     [29.4, s(11)], [33.7, s(12) + 0.75], [35.6, e(12)],                                          # B8: il terzo neutrone spacca C su "spacca"
     [36.1, s(13)], [41.4, e(14)],                                                                 # B9
     [43.5, s(15)], [46.3, s(15) + 3.0], [49.1, e(15)],                                           # B10: i frammenti di F partono su "schizzano via"
     [49.6, s(16)], [54.9, e(17)],                                                                 # B11
     [62.8, s(18)], [68.3, e(18)],                                                                 # barrette, B12
     [68.8, s(19)], [72.6, s(19) + 2.75], [77.5, e(20)],                                          # B13: G si spacca su "colpito"; la torta si riempie su "alla fine circa un terzo"
     [78.0, s(21)], [78.85, s(21) + 0.95], [82.7, e(22) + 1.55], [84.2, e(22) + 3.05]]            # B14 e paesaggio finale
for a, b in zip(W, W[1:]): assert b[0] > a[0] and b[1] > a[1], (a, b)
W = [[a, round(b, 2)] for a, b in W]
json.dump(W, open('warp4.json', 'w')); print(json.dumps(W)); print('durata', W[-1][1])
