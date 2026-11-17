import soundfile as sf, numpy as np, subprocess
v,sr=sf.read('voice_fx.wav'); m,_=sf.read('music.wav'); s,_=sf.read('sfx.wav'); N=len(m); v=v[:N]
db=lambda x:10**(x/20)
v=v*db(3.8)
# sidechain: follow the voice level, duck the music under speech
h=int(0.01*sr); n=N//h; r=np.sqrt((v[:n*h].reshape(n,h)**2).mean(1)); act=(r>db(-38)).astype(float)
env=np.zeros(n); e=0
for i in range(n):
    e += (act[i]-e)*(0.25 if act[i]>e else 0.035); env[i]=e
env=np.interp(np.arange(N)/sr,(np.arange(n)+0.5)*0.01,env)
t=np.arange(N)/sr
mg=db(-12.5)*db(-5.0*env)                       # music: about 13-18 dB under the voice
mg*=db(4.5*np.clip((t-34.95)/0.5,0,1))          # let the final chord come up
mix=m*mg[:,None]+s*db(-3.5)+np.stack([v,v],1)*0.7071*1.414
sf.write('mix_pre.wav',mix,sr,subtype='PCM_24')
sf.write('music_ducked.wav',m*mg[:,None],sr,subtype='PCM_24')
print('peak',abs(mix).max())
