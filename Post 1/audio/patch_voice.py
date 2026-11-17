import soundfile as sf, numpy as np, subprocess
from scipy.signal import firwin2, fftconvolve, butter, sosfiltfilt
sr=48000
raw,_=sf.read('new_raw.wav'); print('clipped',(abs(raw)>0.985).sum())
# 1) denoise (noise profile from the pauses) + high-pass
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','new_raw.wav','-af','highpass=f=75,afftdn=nr=14:nf=-46:tn=0,afftdn=nr=6:nf=-52','den.wav'],check=True)
x,_=sf.read('den.wav')
SEG=[(0.19,0.51),(0.96,2.03),(2.55,5.54)]           # phrases in the new take
DST=[1.18,1.85,3.34]                                 # where they go on the video timeline
ref,_=sf.read('voice_fx.wav')                        # the processed voice already in the video
# 2) match the tone of the new take to the rest of the track (long-term spectrum, 1/3-octave smoothed)
def ltas(sig,segs):
    S=np.zeros(4097)
    for s,e in segs:
        y=sig[int(s*sr):int(e*sr)]
        for k in range(0,len(y)-8192,2048): S+=abs(np.fft.rfft(y[k:k+8192]*np.hanning(8192)))**2
    return S
f=np.fft.rfftfreq(8192,1/sr)
Sn=ltas(x,SEG); Sr=ltas(ref,[(7.1,17.6),(18.9,28.2),(29.0,35.0)])
cent=np.geomspace(90,12000,24); g=[]
for c in cent:
    m=(f>=c/1.19)&(f<c*1.19); g.append(10*np.log10((Sr[m].sum()/Sr.sum())/(Sn[m].sum()/Sn.sum())))
g=np.clip(np.array(g)-np.median(g),-9,9); print('eq dB',dict(zip(cent.round().astype(int),g.round(1))))
fr=np.concatenate([[0],cent,[sr/2]]); gg=np.concatenate([[g[0]],g,[g[-1]]])
fir=firwin2(2049,fr,10**(gg/20),fs=sr); x=fftconvolve(x,fir,'same')
sf.write('den_eq.wav',x,sr,subtype='PCM_24')
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','den_eq.wav','-af','deesser=i=0.25,acompressor=threshold=-24dB:ratio=3:attack=8:release=140:makeup=2','den_fx.wav'],check=True)
x,_=sf.read('den_fx.wav')
# 3) level each phrase like the rest of the voice, cut it out with short fades, place it
h=480
def loud(sig,s,e):
    y=sig[int(s*sr):int(e*sr)]; m=len(y)//h; r=np.sqrt((y[:m*h].reshape(m,h)**2).mean(1)); r=r[r>10**(-40/20)*r.max()/0.3] if 0 else r[r>r.max()*0.05]
    return 20*np.log10(np.sqrt((r**2).mean()))
target=np.median([loud(ref,s,e) for s,e in [(7.17,7.49),(7.99,9.31),(9.66,10.77),(12.69,14.55),(15.25,16.74),(18.96,20.32)]])
out=ref.copy(); out[:int(6.9*sr)]=0
for (s,e),d in zip(SEG,DST):
    s0,e0=s-0.05,e+0.09; y=x[int(s0*sr):int(e0*sr)].copy()
    y*=10**((target-loud(x,s,e))/20)
    n1,n2=int(0.03*sr),int(0.07*sr); y[:n1]*=np.linspace(0,1,n1)**2; y[-n2:]*=np.linspace(1,0,n2)**2
    i=int((d-0.05)*sr); out[i:i+len(y)]+=y
    print('phrase %.2f-%.2f -> %.2f-%.2f gain %+.1f dB'%(s,e,d,d+e-s,target-loud(x,s,e)))
out=np.clip(out,-0.98,0.98)
sf.copy if 0 else None
import shutil; shutil.copy('voice_fx.wav','voice_fx_take1.wav')
sf.write('voice_fx.wav',out,sr,subtype='PCM_16')
# residual noise inside the new phrases vs. speech level
for (s,e) in [(1.52,1.80),(2.95,3.3)]: 
    y=out[int(s*sr):int(e*sr)]; print('gap %.2f-%.2f rms %.1f dB'%(s,e,20*np.log10(np.sqrt((y**2).mean())+1e-9)))
