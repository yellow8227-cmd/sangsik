// 깡깡이 상식 · 기록 옮기기 (서버 없이 코드 복사/붙여넣기로 폰↔노트북)
(function(){
if(window.FBCONF&&window.FBCONF.apiKey)return;
const PFX="studioS.",TAG="KKSS1:";
function snapshot(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX)&&k!=="studioS.snd")d[k]=localStorage.getItem(k)}return d}
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pack(){const txt=JSON.stringify({t:Date.now(),d:snapshot()});
  if(window.CompressionStream){const buf=await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();return TAG+"z"+b64(new Uint8Array(buf))}
  return TAG+"j"+b64(new TextEncoder().encode(txt))}
async function unpack(code){code=code.replace(/\s+/g,"");const i=code.indexOf(TAG);if(i<0)throw 0;code=code.slice(i+TAG.length);
  const kind=code[0],raw=unb64(code.slice(1));let txt;
  if(kind==="z")txt=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"))).text();else txt=new TextDecoder().decode(raw);
  const o=JSON.parse(txt);if(!o||typeof o.d!=="object")throw 0;return o}
const css=document.createElement("style");css.textContent=`
#xfer{display:inline-block;margin:8px 0 0;font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--line,#ccd);background:var(--card,#fff);color:var(--ink,#1b2440);cursor:pointer}
#xdlg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px}
#xdlg .box{background:var(--card,#fff);color:var(--ink,#1b2440);border-radius:12px;padding:20px;width:100%;max-width:380px;max-height:90vh;overflow:auto}
#xdlg h3{margin:0 0 6px}#xdlg h4{margin:16px 0 4px}#xdlg p{font-size:13px;opacity:.85;margin:0 0 10px;line-height:1.55}
#xdlg textarea{width:100%;box-sizing:border-box;height:90px;font:12px monospace;padding:8px;border:1px solid var(--line,#ccd);border-radius:8px;background:none;color:inherit}
#xdlg .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}#xdlg button{font:inherit;padding:10px 14px;border-radius:8px;border:1px solid var(--line,#ccd);background:none;color:inherit;cursor:pointer}
#xdlg button.p{background:#1b2440;color:#fff;border-color:#1b2440}#xdlg .msg{font-size:13px;min-height:1.2em;color:#d9344f;margin-top:6px}#xdlg .ok{color:#1f8a4c}`;
document.head.appendChild(css);
const btn=document.createElement("button");btn.id="xfer";btn.textContent="📲 폰↔노트북 기록 옮기기";
(document.querySelector("header")||document.body).appendChild(btn);
btn.onclick=open;
function open(){
  const d=document.createElement("div");d.id="xdlg";
  d.innerHTML=`<div class="box"><h3>기록 옮기기</h3>
   <p>점수·오답·외운 카드·작문 기록을 다른 기기로 옮겨요. 로그인 없이, 기록을 코드 한 줄로 바꿔서 보내는 방식이에요.</p>
   <h4>① 지금까지 푼 기기에서</h4>
   <p><b>기록 보내기</b>를 누르고 카카오톡 <b>나와의 채팅</b>으로 보내세요. 공유가 안 되면 자동으로 복사돼요.</p>
   <div class="r"><button class="p" id="xsend">기록 보내기</button></div><div class="msg" id="xm1"></div>
   <h4>② 이어서 풀 기기에서</h4>
   <p>받은 코드를 길게 눌러 복사해서 아래 칸에 붙여 넣으세요. 이 기기의 기록은 받은 기록으로 바뀌어요.</p>
   <textarea id="xin" placeholder="KKSS1:로 시작하는 코드를 붙여 넣으세요"></textarea>
   <div class="r"><button class="p" id="xget">기록 받기</button><button id="xclose">닫기</button></div><div class="msg" id="xm2"></div></div>`;
  d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);
  const m1=d.querySelector("#xm1"),m2=d.querySelector("#xm2");
  d.querySelector("#xclose").onclick=()=>d.remove();
  d.querySelector("#xsend").onclick=async()=>{
    try{const code=await pack();
      if(navigator.share){try{await navigator.share({text:code});m1.className="msg ok";m1.textContent="보냈어요. 다른 기기에서 ②를 하세요.";return}catch(e){if(e&&e.name==="AbortError")return}}
      await navigator.clipboard.writeText(code);m1.className="msg ok";m1.textContent="코드를 복사했어요. 카톡 나와의 채팅에 붙여 넣어 보내세요.";
    }catch(e){const code=await pack().catch(()=>"");d.querySelector("#xin").value=code;d.querySelector("#xin").select();m1.className="msg";m1.textContent="자동 복사가 안 돼서 아래 칸에 코드를 넣어 뒀어요. 전체 선택해서 복사하세요."}};
  d.querySelector("#xget").onclick=async()=>{
    let o;try{o=await unpack(d.querySelector("#xin").value)}catch(e){m2.className="msg";m2.textContent="코드가 올바르지 않아요. KKSS1:부터 끝까지 전부 붙여 넣었는지 확인하세요.";return}
    const when=new Date(o.t).toLocaleString("ko-KR");
    if(!confirm(when+"에 보낸 기록으로 이 기기 기록을 바꿀까요?"))return;
    Object.keys(snapshot()).forEach(k=>localStorage.removeItem(k));
    Object.entries(o.d).forEach(([k,v])=>{if(String(k).startsWith(PFX))localStorage.setItem(k,v)});
    location.reload()};
}
})();
