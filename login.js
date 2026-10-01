// 깡깡이 상식 · 아이디/비번 로그인으로 기록 이어 하기 (상식 전용 Supabase 프로젝트, 계정 메모칸 user_metadata.ss 에 저장)
(function(){
const SUPA_URL="https://ruvpsowkdbyxpfumpckw.supabase.co",SUPA_KEY="sb_publishable_nkVEVsyJcp1vC6k8JlgSQA_lUGRsOPr";
const PFX="studioS.",META="sangsik.sync",DOM="@yellow8227-cmd.github.io",TAG="KKSS1:";
const _set=Storage.prototype.setItem;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{_set.call(localStorage,k,v)}catch(e){}};
let meta={};try{meta=JSON.parse(lsGet(META)||"{}")}catch(e){}
const saveMeta=()=>lsSet(META,JSON.stringify(meta));
let sb=null,user=null,timer=null,ready=false;

// ── 기록 → 짧은 코드 (카드 id 는 번호로 바꿔서 줄인다)
function cardIndex(){if(cardIndex.m)return cardIndex.m;const m=new Map();
  try{if(typeof D!=="undefined")D.forEach((d,i)=>m.set(d[2]+"|"+d[3],i))}catch(e){}return cardIndex.m=m}
function cardList(){try{return typeof D!=="undefined"?D:[]}catch(e){return[]}}
function slim(arr){const m=cardIndex();return (arr||[]).map(x=>m.has(x)?m.get(x):x)}
function fat(arr){const L=cardList();return (arr||[]).map(x=>typeof x==="number"&&L[x]?L[x][2]+"|"+L[x][3]:x)}
function snapshot(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX)&&k!=="studioS.snd")d[k]=lsGet(k)}return d}
function shrink(d){d=Object.assign({},d);try{const v=JSON.parse(d["studioS.v1"]||"null");if(v){v.wrong=slim(v.wrong);v.known=slim(v.known);v._n=1;d["studioS.v1"]=JSON.stringify(v)}}catch(e){}return d}
function grow(d){d=Object.assign({},d);try{const v=JSON.parse(d["studioS.v1"]||"null");if(v&&v._n){v.wrong=fat(v.wrong);v.known=fat(v.known);delete v._n;d["studioS.v1"]=JSON.stringify(v)}}catch(e){}return d}
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pack(t){const txt=JSON.stringify({t:t||Date.now(),d:shrink(snapshot())});
  if(window.CompressionStream){const buf=await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();return TAG+"z"+b64(new Uint8Array(buf))}
  return TAG+"j"+b64(new TextEncoder().encode(txt))}
async function unpack(code){code=String(code||"").replace(/\s+/g,"");const i=code.indexOf(TAG);if(i<0)throw new Error("bad");code=code.slice(i+TAG.length);
  const raw=unb64(code.slice(1));const txt=code[0]==="z"?await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"))).text():new TextDecoder().decode(raw);
  const o=JSON.parse(txt);if(!o||typeof o.d!=="object")throw new Error("bad");o.d=grow(o.d);return o}
function hasProgress(){const d=snapshot();return Object.entries(d).some(([k,v])=>{try{const o=JSON.parse(v);
  if(k==="studioS.v1")return !!((o.wrong||[]).length||(o.known||[]).length);return o&&typeof o==="object"&&Object.keys(o).length>0}catch(e){return !!v}})}
function applyData(o){Object.keys(snapshot()).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  Object.entries(o.d).forEach(([k,v])=>{if(String(k).startsWith(PFX))lsSet(k,v)})}
window.KK={pack,unpack,applyData};

// ── 바뀔 때마다 표시 → 3초 뒤 계정에 저장
Storage.prototype.setItem=function(k,v){const mine=this===localStorage&&String(k).startsWith(PFX)&&k!=="studioS.snd";
  const before=mine?this.getItem(k):null;_set.call(this,k,v);
  if(mine&&before!==String(v)){meta.t=Date.now();saveMeta();schedule()}};
function schedule(){if(!user||!ready)return;clearTimeout(timer);timer=setTimeout(push,3000);paint("저장 중…")}
async function push(){if(!user||!sb)return;clearTimeout(timer);
  try{const t=meta.t||Date.now();const code=await pack(t);
    const r=await sb.auth.updateUser({data:{ss:code,ssat:t}});if(r.error)throw r.error;
    meta.synced=t;meta.uid=user.id;saveMeta();paint()}catch(e){paint("저장 대기")}}
async function remote(){const r=await sb.auth.getUser();if(r.error)throw r.error;const md=r.data.user&&r.data.user.user_metadata||{};return md.ss?{code:md.ss,t:md.ssat||0}:null}
async function pull(){
  let rm;try{rm=await remote()}catch(e){ready=true;paint("오프라인");return}
  ready=true;if(!rm){await push();return}
  const same=meta.uid===user.id,dirty=(meta.t||0)>(meta.synced||0),hasLocal=hasProgress();
  const take=async()=>{const o=await unpack(rm.code);applyData(o);meta.t=meta.synced=rm.t;meta.uid=user.id;saveMeta();location.reload()};
  if(same){
    if(rm.t>(meta.synced||0)){
      if(!dirty)return take();
      if(confirm("다른 기기에서 푼 기록과 이 기기 기록이 둘 다 바뀌었어요.\n[확인] 다른 기기 기록으로 맞추기\n[취소] 이 기기 기록으로 덮어쓰기"))return take();
    }
    if(dirty)await push();else paint();return}
  if(!hasLocal)return take();
  if(confirm("이 아이디에 저장된 기록이 있어요.\n[확인] 저장된 기록 불러오기 (이 기기 기록은 바뀌어요)\n[취소] 이 기기 기록을 아이디에 저장하기"))return take();
  meta.uid=user.id;await push();
}
addEventListener("online",()=>{if(user&&ready)push()});
document.addEventListener("visibilitychange",()=>{if(!user||!ready)return;if(document.hidden){if((meta.t||0)>(meta.synced||0))push()}else pull()});

// ── 화면
const css=document.createElement("style");css.textContent=`
#acct{display:inline-block;margin:8px 0 0;font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--line,#ccd);background:var(--card,#fff);color:var(--ink,#1b2440);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acct.on{background:#1b2440;color:#fff;border-color:#1b2440}
#acctdlg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px}
#acctdlg .box{background:var(--card,#fff);color:var(--ink,#1b2440);border-radius:12px;padding:20px;width:100%;max-width:380px;max-height:90vh;overflow:auto}
#acctdlg h3{margin:0 0 6px}#acctdlg h4{margin:16px 0 4px}#acctdlg p{font-size:13px;opacity:.85;margin:0 0 12px;line-height:1.55}
#acctdlg input,#acctdlg textarea{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px;margin:0 0 8px;border:1px solid var(--line,#ccd);border-radius:8px;background:none;color:inherit}
#acctdlg textarea{font:12px monospace;height:80px}
#acctdlg .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#acctdlg button{font:inherit;padding:10px 14px;border-radius:8px;border:1px solid var(--line,#ccd);background:none;color:inherit;cursor:pointer}
#acctdlg button.p{background:#1b2440;color:#fff;border-color:#1b2440}#acctdlg .err{color:#d9344f;font-size:13px;min-height:1.2em;line-height:1.5}#acctdlg .ok{color:#1f8a4c}
#acctdlg .link{border:0;padding:4px 0;text-decoration:underline;font-size:13px;opacity:.8}`;
document.head.appendChild(css);
const btn=document.createElement("button");btn.id="acct";
(document.querySelector("header")||document.body).appendChild(btn);
function paint(st){btn.classList.toggle("on",!!user);btn.textContent=user?("👤 "+String(user.email||"").replace(DOM,"")+" · "+(st||"자동 저장 중")):"🔑 로그인하고 폰·노트북 이어 하기"}
paint();
btn.onclick=()=>user?account():login();
function dlg(html){document.querySelectorAll("#acctdlg").forEach(x=>x.remove());const d=document.createElement("div");d.id="acctdlg";d.innerHTML=`<div class="box">${html}</div>`;d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);return d}
const idOk=s=>/^[a-z0-9._-]{3,20}$/.test(s);
function errMsg(e){const m=String(e&&(e.message||e.msg||e.error_description)||e||"");
  if(/already registered|already exists/i.test(m))return "이미 있는 아이디예요. 로그인을 눌러 주세요.";
  if(/Invalid login credentials/i.test(m))return "아이디나 비밀번호가 맞지 않아요. 처음이면 '가입'을 눌러 주세요.";
  if(/Email not confirmed/i.test(m))return "서버에서 이메일 확인을 요구하고 있어요. 만든 사람에게 알려 주세요 (Confirm email 설정).";
  if(/rate limit|too many/i.test(m))return "잠시 후 다시 시도해 주세요.";
  if(/Password should be/i.test(m))return "비밀번호를 6자 이상으로 해 주세요.";
  if(/signups? (not allowed|disabled)/i.test(m))return "지금은 새 가입이 막혀 있어요 (서버 설정).";
  if(/Email address .* is invalid/i.test(m))return "서버가 아이디 형식을 거절했어요. 화면을 캡처해서 만든 사람에게 보내 주세요.";
  if(/fetch|network|Failed to/i.test(m))return "인터넷 연결을 확인해 주세요.";
  return "로그인하지 못했어요: "+m.slice(0,80)}
function login(){
  const d=dlg(`<h3>로그인</h3><p>아이디·비밀번호만 정하면 돼요. 폰이든 노트북이든 같은 아이디로 로그인하면 점수·오답·외운 카드·작문이 그대로 이어져요. 로그인하지 않아도 지금처럼 쓸 수 있어요.</p>
   <input id="aid" placeholder="아이디 (영문 소문자·숫자 3~20자)" autocapitalize="none" autocorrect="off" autocomplete="username">
   <input id="apw" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password">
   <div class="err" id="aerr"></div>
   <div class="r"><button class="p" id="ain">로그인</button><button id="aup">처음이에요 (가입)</button><button id="ax">닫기</button></div>
   <div class="r"><button class="link" id="axfer">로그인 없이 코드로 옮기기</button></div>`);
  const er=d.querySelector("#aerr");
  const go=async up=>{const id=d.querySelector("#aid").value.trim().toLowerCase(),pw=d.querySelector("#apw").value;er.className="err";
    if(!idOk(id)){er.textContent="아이디는 영문 소문자·숫자 3~20자로 써 주세요.";return}
    if(pw.length<6){er.textContent="비밀번호는 6자 이상이에요.";return}
    er.textContent=up?"가입하는 중…":"로그인 중…";
    try{await boot();
      const r=up?await sb.auth.signUp({email:id+DOM,password:pw}):await sb.auth.signInWithPassword({email:id+DOM,password:pw});
      if(r.error)throw r.error;
      if(!r.data.session){er.textContent="가입은 됐지만 서버가 이메일 확인을 기다리고 있어요. 만든 사람에게 알려 주세요 (Supabase → Authentication → Email → Confirm email 끄기).";return}
      d.remove()}catch(e){er.textContent=errMsg(e)}};
  d.querySelector("#ain").onclick=()=>go(false);d.querySelector("#aup").onclick=()=>go(true);d.querySelector("#ax").onclick=()=>d.remove();
  d.querySelector("#apw").onkeydown=e=>{if(e.key==="Enter")go(false)};
  d.querySelector("#axfer").onclick=xfer;
}
function account(){
  const d=dlg(`<h3>👤 ${String(user.email||"").replace(DOM,"")}</h3><p>푼 기록이 이 아이디에 자동 저장돼요. 다른 기기에서도 같은 아이디로 로그인하면 이어서 할 수 있어요.${meta.synced?"<br>마지막 저장: "+new Date(meta.synced).toLocaleString("ko-KR"):""}</p>
   <div class="err" id="amsg"></div>
   <div class="r"><button class="p" id="anow">지금 저장</button><button id="aget">저장된 기록 불러오기</button></div>
   <div class="r"><button id="aout">로그아웃</button><button id="ax">닫기</button></div>`);
  const msg=d.querySelector("#amsg");
  d.querySelector("#anow").onclick=async()=>{meta.t=Math.max(meta.t||0,Date.now());await push();msg.className="err ok";msg.textContent=meta.synced>=meta.t?"저장했어요.":"저장하지 못했어요. 인터넷을 확인해 주세요."};
  d.querySelector("#aget").onclick=async()=>{try{const rm=await remote();if(!rm){msg.textContent="아직 저장된 기록이 없어요.";return}
    if(!confirm(new Date(rm.t).toLocaleString("ko-KR")+"에 저장된 기록으로 이 기기 기록을 바꿀까요?"))return;
    applyData(await unpack(rm.code));meta.t=meta.synced=rm.t;meta.uid=user.id;saveMeta();location.reload()}catch(e){msg.textContent=errMsg(e)}};
  d.querySelector("#aout").onclick=async()=>{if((meta.t||0)>(meta.synced||0))await push();await sb.auth.signOut();d.remove()};
  d.querySelector("#ax").onclick=()=>d.remove();
}
function xfer(){
  const d=dlg(`<h3>코드로 기록 옮기기</h3><p>로그인 없이 옮기는 방법이에요. 기록을 코드 한 줄로 바꿔 카카오톡 <b>나와의 채팅</b>으로 보내고, 다른 기기에서 붙여 넣어요.</p>
   <h4>① 지금까지 푼 기기에서</h4><div class="r"><button class="p" id="xsend">기록 보내기</button></div><div class="err" id="xm1"></div>
   <h4>② 이어서 풀 기기에서</h4><textarea id="xin" placeholder="KKSS1:로 시작하는 코드를 붙여 넣으세요"></textarea>
   <div class="r"><button class="p" id="xget">기록 받기</button><button id="ax">닫기</button></div><div class="err" id="xm2"></div>`);
  const m1=d.querySelector("#xm1"),m2=d.querySelector("#xm2");d.querySelector("#ax").onclick=()=>d.remove();
  d.querySelector("#xsend").onclick=async()=>{const code=await pack();
    if(navigator.share){try{await navigator.share({text:code});m1.className="err ok";m1.textContent="보냈어요. 다른 기기에서 ②를 하세요.";return}catch(e){if(e&&e.name==="AbortError")return}}
    try{await navigator.clipboard.writeText(code);m1.className="err ok";m1.textContent="코드를 복사했어요. 카톡 나와의 채팅에 붙여 넣어 보내세요."}
    catch(e){const t=d.querySelector("#xin");t.value=code;t.select();m1.className="err";m1.textContent="자동 복사가 안 돼서 아래 칸에 코드를 넣어 뒀어요. 전체 선택해서 복사하세요."}};
  d.querySelector("#xget").onclick=async()=>{let o;try{o=await unpack(d.querySelector("#xin").value)}catch(e){m2.textContent="코드가 올바르지 않아요. KKSS1:부터 끝까지 전부 붙여 넣었는지 확인하세요.";return}
    if(!confirm(new Date(o.t).toLocaleString("ko-KR")+"에 보낸 기록으로 이 기기 기록을 바꿀까요?"))return;applyData(o);meta.t=Date.now();saveMeta();location.reload()};
}
function load(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
let booting=null;
function boot(){return booting||(booting=(async()=>{
  if(!window.supabase)await load("sb/supabase.js");
  sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"sangsik-auth"}});
  sb.auth.onAuthStateChange((ev,ses)=>{const u=ses&&ses.user||null;const changed=(u&&u.id)!==(user&&user.id);user=u;paint();
    if(changed){ready=false;if(u)setTimeout(pull,0)}});
})().catch(e=>{booting=null;throw e}))}
let hasSes=false;try{hasSes=!!lsGet("sangsik-auth")}catch(e){}
if(hasSes)boot().catch(()=>paint());
})();
