import soundfile as sf, numpy as np, subprocess, json
SRC="../sorgenti/Prova_1-mejorada-v2.wav"
a,sr=sf.read(SRC,dtype='float64')
h=int(sr*0.01); n=len(a)//h
db=20*np.log10(np.sqrt((a[:n*h].reshape(n,h)**2).mean(1))+1e-9)
act=db>-45; segs=[]; i=0
while i<n:
    if act[i]:
        j=i
        while j<n and (act[j] or (j+12<n and act[j:j+12].any())): j+=1
        segs.append([i*0.01,j*0.01]); i=j
    else: i+=1
# 1) mute gate blips and the isolated breath
keep=[]
for s,e in segs:
    if e-s<=0.03 or (24.45<s<24.7):
        a[int((s-0.01)*sr):int((e+0.01)*sr)]=0
    else: keep.append([s,e])
# merge phrases separated by <0.2s for levelling
ph=[keep[0][:]]
for s,e in keep[1:]:
    if s-ph[-1][1]<0.2: ph[-1][1]=e
    else: ph.append([s,e])
# 2) per-phrase levelling
def loud(s,e):
    x=a[int(s*sr):int(e*sr)]; m=len(x)//h; r=np.sqrt((x[:m*h].reshape(m,h)**2).mean(1)); r=r[r>10**(-40/20)]
    return 20*np.log10(np.sqrt((r**2).mean()))
L=[loud(s,e) for s,e in ph]; med=np.median(L)
g=[float(np.clip(med-l,-3,7)) for l in L]
for (s,e),l,gg in zip(ph,L,g): print("%.2f-%.2f loud %.1f gain %+.1f"%(s,e,l,gg))
tt=[0]+[x for (s,e) in ph for x in (s-0.03,e+0.03)]+[len(a)/sr]
gg=[g[0]]+[x for q in g for x in (q,q)]+[g[-1]]
gain=10**(np.interp(np.arange(len(a))/sr,tt,gg)/20); a*=gain
# short fades at phrase edges
f=int(0.008*sr)
for s,e in keep:
    i0=max(0,int((s-0.012)*sr)); a[i0:i0+f]*=np.linspace(0,1,f); a[:0]
    i1=min(len(a),int((e+0.012)*sr)); a[i1-f:i1]*=np.linspace(1,0,f)
    # everything outside phrases stays as is (already digital silence)
# 3) timing edits: +0.4 s after "capire", -0.6 s in the long pause
c1=int(17.8*sr); a=np.concatenate([a[:c1],np.zeros(int(0.4*sr)),a[c1:]])
c2=int((28.0+0.4)*sr); a=np.concatenate([a[:c2],a[c2+int(0.6*sr):]])
TOTAL=37.0
a=np.concatenate([a,np.zeros(int(TOTAL*sr)-len(a))])
sf.write('voice_edit.wav',a,sr,subtype='PCM_24')
flt="highpass=f=75,equalizer=f=230:t=q:w=1.0:g=-3,equalizer=f=4200:t=q:w=0.9:g=3.5,highshelf=f=9000:g=3,deesser=i=0.25,acompressor=threshold=-24dB:ratio=3:attack=8:release=140:makeup=2,alimiter=limit=0.7"
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','voice_edit.wav','-af',flt,'-ar','48000','voice_fx.wav'],check=True)
