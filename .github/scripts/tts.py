import asyncio,json,os,subprocess,edge_tts
D='audio/tts';T=json.load(open(D+'/text.json',encoding='utf-8'))
VOICE=os.environ.get('VOICE','ko-KR-SunHiNeural')
async def one(i,t):
    await edge_tts.Communicate(t,VOICE,rate='-5%').save(f'{D}/p{i}.mp3')
async def main():
    for i,t in enumerate(T['paras']):await one(i,t)
asyncio.run(main())
def dur(f):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]).decode().strip())
n=len(T['paras'])
subprocess.check_call(['ffmpeg','-y','-loglevel','error','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','0.9','-c:a','libmp3lame','-b:a','48k',D+'/gap.mp3'])
L=[]
for i in range(n):
    subprocess.check_call(['ffmpeg','-y','-loglevel','error','-i',f'{D}/p{i}.mp3','-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','48k',f'{D}/n{i}.mp3'])
    L+=[f"file 'n{i}.mp3'","file 'gap.mp3'"]
open(D+'/list.txt','w').write('\n'.join(L)+'\n')
subprocess.check_call(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',D+'/list.txt','-c','copy',D+'/full.mp3'])
starts=[];t=0;g=dur(D+'/gap.mp3')
for i in range(n):starts.append(round(t,2));t+=dur(f'{D}/n{i}.mp3')+g
for i in range(n):os.replace(f'{D}/n{i}.mp3',f'{D}/p{i}.mp3')
for f in ['list.txt','gap.mp3']:os.remove(D+'/'+f)
json.dump({"hash":T['hash'],"voice":VOICE,"starts":starts,"total":round(dur(D+'/full.mp3'),2)},open(D+'/meta.json','w'),indent=1)
print(open(D+'/meta.json').read())
