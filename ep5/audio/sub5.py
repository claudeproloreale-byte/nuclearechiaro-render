import soundfile as sf, numpy as np, json
a, sr = sf.read('voce_in.wav'); h=int(sr*0.01); m=len(a)//h
r=20*np.log10(np.sqrt((a[:m*h].reshape(m,h)**2).mean(1))+1e-12)
PH=json.load(open('phrases_raw.json'))
for k,(s,e) in enumerate(PH):
    i0,i1=int(s*100),int(e*100); seg=r[i0:i1]; low=seg<-42; gaps=[];j=0
    while j<len(seg):
        if low[j]:
            q=j
            while q<len(seg) and low[q]: q+=1
            if q-j>=8: gaps.append((round(s+j/100,2),round(s+q/100,2)))
            j=q
        else: j+=1
    print(k,s,e,gaps)
