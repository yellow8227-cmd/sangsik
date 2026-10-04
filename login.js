// 깡깡이 상식 · 아이디/비번 로그인으로 기록 이어 하기 (상식 전용 Supabase, ss_accounts 표를 함수(rpc)로만 드나든다 — sangsik-setup.sql)
(function(){
const SUPA_URL="https://ruvpsowkdbyxpfumpckw.supabase.co",SUPA_KEY="sb_publishable_nkVEVsyJcp1vC6k8JlgSQA_lUGRsOPr";
const PFX="studioS.",META="sangsik.sync",ACCT="sangsik-acct",TAG="KKSS1:";
const _set=Storage.prototype.setItem;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{_set.call(localStorage,k,v)}catch(e){}};
let meta={};try{meta=JSON.parse(lsGet(META)||"{}")}catch(e){}
const saveMeta=()=>lsSet(META,JSON.stringify(meta));
let user=null,timer=null,ready=false;
async function api(fn,args){let r;
  try{r=await fetch(SUPA_URL+"/rest/v1/rpc/"+fn,{method:"POST",headers:{apikey:SUPA_KEY,"Content-Type":"application/json"},body:JSON.stringify(args)})}catch(e){throw new Error("network")}
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
  if(!r.ok)throw new Error(j&&j.message||("http "+r.status));return j}
function setUser(u){user=u;try{if(u)_set.call(localStorage,ACCT,JSON.stringify(u));else localStorage.removeItem(ACCT)}catch(e){}paint();if(u){ready=false;pull()}}

// ── 기록 → 짧은 코드 (카드 id 는 번호로 바꿔서 줄인다)
function cardIndex(){if(cardIndex.m)return cardIndex.m;const m=new Map();
  try{if(typeof D!=="undefined")D.forEach((d,i)=>m.set(d[2]+"|"+d[3],i))}catch(e){}return cardIndex.m=m}
function cardList(){try{return typeof D!=="undefined"?D:[]}catch(e){return[]}}
function slim(arr){const m=cardIndex();return (arr||[]).map(x=>m.has(x)?m.get(x):x)}
function fat(arr){const L=cardList();return (arr||[]).map(x=>typeof x==="number"&&L[x]?L[x][2]+"|"+L[x][3]:x)}
function snapshot(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX)&&k!=="studioS.snd")d[k]=lsGet(k)}return d}
function shrink(d){d=Object.assign({},d);try{const v=JSON.parse(d["studioS.v1"]||"null");if(v){v.wrong=slim(v.wrong);v.known=slim(v.known);v._n=1;d["studioS.v1"]=JSON.stringify(v)}}catch(e){}try{const S=JSON.parse(d["studioS.seen"]||"null");if(S&&!S._n){const m=cardIndex(),o={_n:1};Object.entries(S).forEach(([k,r])=>{o[m.has(k)?m.get(k):k]=[r.n|0,r.c|0,r.w|0,Math.round((r.t||0)/1000)]});d["studioS.seen"]=JSON.stringify(o)}}catch(e){}return d}
function grow(d){d=Object.assign({},d);try{const v=JSON.parse(d["studioS.v1"]||"null");if(v&&v._n){v.wrong=fat(v.wrong);v.known=fat(v.known);delete v._n;d["studioS.v1"]=JSON.stringify(v)}}catch(e){}try{const S=JSON.parse(d["studioS.seen"]||"null");if(S&&S._n){const L=cardList(),o={};Object.entries(S).forEach(([k,r])=>{if(k==="_n")return;const kk=/^\d+$/.test(k)&&L[+k]?L[+k][2]+"|"+L[+k][3]:k;o[kk]={n:r[0],c:r[1],w:r[2],t:r[3]*1000}});d["studioS.seen"]=JSON.stringify(o)}}catch(e){}return d}
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
async function push(){if(!user)return;clearTimeout(timer);
  try{const t=meta.t||Date.now();const code=await pack(t);
    await api("ss_save",{p_token:user.token,p_data:code,p_t:t});
    meta.synced=t;meta.uid=user.id;saveMeta();paint()}catch(e){if(/bad_token/.test(e.message))return setUser(null);paint("저장 대기")}}
async function remote(){const r=await api("ss_load",{p_token:user.token});return r&&r.data?{code:r.data,t:Number(r.t)||0}:null}
// 두 기록 합치기: 목록은 합집합, 숫자는 큰 쪽, 글은 긴 쪽 — 어느 쪽 기록도 버리지 않는다
function deepMerge(a,b){
  if(Array.isArray(a)&&Array.isArray(b)){if(!a.every(x=>typeof x==="string")||!b.every(x=>typeof x==="string"))return a.length?a:b;const out=a.slice(),seen=new Set(a.map(x=>JSON.stringify(x)));b.forEach(x=>{const k=JSON.stringify(x);if(!seen.has(k)){seen.add(k);out.push(x)}});return out}
  if(a&&b&&typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)&&!Array.isArray(b)){if("ans" in a||"score" in a||"text" in a&&"left" in a)return ("text" in a&&(b.text||"").length>(a.text||"").length)?b:a;const o=Object.assign({},b);Object.keys(a).forEach(k=>{o[k]=k in b?deepMerge(a[k],b[k]):a[k]});return o}
  if(typeof a==="number"&&typeof b==="number")return Math.max(a,b);
  if(typeof a==="string"&&typeof b==="string")return a.length>=b.length?a:b;
  return a===undefined||a===null?b:a}
function mergeSnap(local,remoteD){const out=Object.assign({},remoteD);
  Object.entries(local).forEach(([k,v])=>{if(!(k in out)){out[k]=v;return}
    try{const a=JSON.parse(v),b=JSON.parse(out[k]);const m=deepMerge(a,b);
      if(k==="studioS.v1"&&a&&typeof a==="object"){m.cat=a.cat;m.mode=a.mode}out[k]=JSON.stringify(m)}catch(e){out[k]=v}});return out}
function backup(){try{_set.call(localStorage,"sangsik.backup",JSON.stringify({t:Date.now(),d:snapshot()}))}catch(e){}}
async function pull(){
  let rm;try{rm=await remote()}catch(e){if(/bad_token/.test(e.message))return setUser(null);ready=true;paint("오프라인");return}
  ready=true;if(!rm){meta.t=Date.now();await push();return}
  const same=meta.uid===user.id,dirty=(meta.t||0)>(meta.synced||0),hasLocal=hasProgress();
  const take=async()=>{const o=await unpack(rm.code);backup();applyData(o);meta.t=meta.synced=rm.t;meta.uid=user.id;saveMeta();location.reload()};
  const merge=async()=>{const o=await unpack(rm.code);backup();applyData({d:mergeSnap(snapshot(),o.d)});meta.uid=user.id;meta.synced=rm.t;meta.t=Date.now();saveMeta();await push();location.reload()};
  if(same){
    if(rm.t>(meta.synced||0))return dirty?merge():take();
    if(dirty)await push();else paint();return}
  // 이 기기에서 이 아이디로 처음: 이 기기에 푼 게 있으면 합치고, 없으면 불러온다
  return hasLocal?merge():take();
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
#acctdlg .tabs{display:flex;gap:4px;margin:0 0 12px;background:rgba(127,127,127,.12);padding:4px;border-radius:10px}
#acctdlg .tab{flex:1;border:0;padding:10px 6px;border-radius:8px;font-size:14px;font-weight:700;opacity:.65}#acctdlg .tab.on{background:var(--card,#fff);opacity:1;box-shadow:0 1px 3px rgba(0,0,0,.15)}
#acctdlg .lab{display:block;font-size:13px;font-weight:700;margin:8px 0 4px}
#acctdlg .pwrow{display:flex;gap:6px;align-items:stretch}#acctdlg .pwrow input{flex:1;margin:0}#acctdlg .eye{padding:0 12px;white-space:nowrap;font-size:13px}
#acctdlg .rules{list-style:none;margin:4px 0 4px;padding:0;font-size:12.5px;line-height:1.7;opacity:.8}#acctdlg .rules li:before{content:"○ ";}
#acctdlg .rules li.ok{color:#1f8a4c;opacity:1}#acctdlg .rules li.ok:before{content:"✓ "}#acctdlg .rules li.bad{color:#d9344f;opacity:1}#acctdlg .rules li.bad:before{content:"✗ "}
#acctdlg .memo{background:#fff7d1;color:#5a4a00;border-radius:8px;padding:8px 10px;font-size:12.5px;opacity:1;margin:8px 0 4px}
#acctdlg button.big{flex:1;padding:13px;font-size:16px;font-weight:700}
#acctdlg .link{border:0;padding:4px 0;text-decoration:underline;font-size:13px;opacity:.8}`;
document.head.appendChild(css);
const btn=document.createElement("button");btn.id="acct";
(document.querySelector("header")||document.body).appendChild(btn);
function paint(st){btn.classList.toggle("on",!!user);btn.textContent=user?("👤 "+user.id+" · "+(st||"자동 저장 중")):"🔑 로그인하고 폰·노트북 이어 하기"}
paint();
btn.onclick=()=>user?account():login();
function dlg(html){document.querySelectorAll("#acctdlg").forEach(x=>x.remove());const d=document.createElement("div");d.id="acctdlg";d.innerHTML=`<div class="box">${html}</div>`;d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);return d}
const idOk=s=>/^[a-z0-9._-]{3,20}$/.test(s);
function errMsg(e,up){const m=String(e&&e.message||e||"");
  if(/id_taken/.test(m))return "누가 이미 쓰는 아이디예요. 숫자를 붙이는 등 다른 아이디로 해 보세요. (내 아이디라면 위의 '로그인' 탭으로)";
  if(/bad_login/.test(m))return "아이디나 비밀번호가 맞지 않아요. '보기'를 눌러 비밀번호를 확인해 보세요. 처음이면 위의 '가입' 탭으로.";
  if(/bad_id/.test(m))return "아이디는 영문 소문자·숫자 3~20자로 써 주세요.";
  if(/bad_pw/.test(m))return "비밀번호는 6~72자로 해 주세요.";
  if(/network/.test(m))return "인터넷 연결을 확인해 주세요.";
  if(/Could not find the function|PGRST202|404/.test(m))return "서버 준비가 아직 안 됐어요 (SQL 설정 필요). 만든 사람에게 알려 주세요.";
  return "로그인하지 못했어요: "+m.slice(0,80)}
function login(mode){
  mode=mode||(meta.uid?"in":"up");const up=mode==="up";
  const d=dlg(`<div class="tabs"><button class="tab ${up?"on":""}" data-m="up">처음이면 · 가입</button><button class="tab ${up?"":"on"}" data-m="in">로그인</button></div>
   <p>${up?"아이디·비밀번호만 정하면 끝이에요. 이메일이나 전화번호는 필요 없어요. 가입하면 폰·노트북 어디서든 같은 기록으로 이어서 공부할 수 있어요.":"가입할 때 정한 아이디·비밀번호를 넣으세요. 이 기기에서도 기록이 이어져요."}</p>
   <label class="lab" for="aid">아이디</label>
   <input id="aid" placeholder="예: kkang1011" inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username" maxlength="20">
   ${up?`<ul class="rules" id="idrules"><li data-r="len">3~20자</li><li data-r="chr">영어·숫자만 (한글·띄어쓰기 안 돼요)</li></ul>`:""}
   <label class="lab" for="apw">비밀번호</label>
   <div class="pwrow"><input id="apw" type="password" placeholder="${up?"6자 이상, 아무 글자나":"비밀번호"}" autocomplete="${up?"new-password":"current-password"}"><button type="button" class="eye" id="aeye">보기</button></div>
   ${up?`<ul class="rules" id="pwrules"><li data-r="pwlen">6자 이상 <span id="pwn"></span></li></ul>
   <p class="memo">📝 아이디·비밀번호를 꼭 메모해 두세요. 비밀번호 찾기 기능이 없어요.</p>`:""}
   <div class="err" id="aerr"></div>
   <div class="r"><button class="p big" id="ago">${up?"가입하고 시작하기":"로그인"}</button></div>
   <div class="r"><button class="link" id="ax">닫기</button><button class="link" id="axfer">로그인 없이 코드로 옮기기</button></div>`);
  const er=d.querySelector("#aerr"),idI=d.querySelector("#aid"),pwI=d.querySelector("#apw");
  d.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const keep={id:idI.value,pw:pwI.value,show:pwI.type==="text"};login(b.dataset.m);
    const n=document.querySelector("#acctdlg");n.querySelector("#aid").value=keep.id;n.querySelector("#apw").value=keep.pw;if(keep.show)n.querySelector("#aeye").click();n.querySelector("#aid").dispatchEvent(new Event("input"));n.querySelector("#apw").dispatchEvent(new Event("input"))});
  const mark=(sel,ok,touched)=>{const li=d.querySelector(sel);if(li){li.classList.toggle("ok",ok);li.classList.toggle("bad",!ok&&touched)}};
  idI.oninput=()=>{const raw=idI.value;const low=raw.toLowerCase().replace(/\s+/g,"");if(low!==raw)idI.value=low;
    const v=idI.value;mark('[data-r="len"]',v.length>=3&&v.length<=20,v.length>0);mark('[data-r="chr"]',v.length>0&&/^[a-z0-9._-]+$/.test(v),v.length>0);er.textContent=""};
  pwI.oninput=()=>{const n=pwI.value.length;mark('[data-r="pwlen"]',n>=6,n>0);const c=d.querySelector("#pwn");if(c)c.textContent=n?`(지금 ${n}자)`:"";er.textContent=""};
  d.querySelector("#aeye").onclick=()=>{const show=pwI.type==="password";pwI.type=show?"text":"password";d.querySelector("#aeye").textContent=show?"숨기기":"보기";const n=pwI.value.length;pwI.focus();try{pwI.setSelectionRange(n,n)}catch(e){}};
  const go=async()=>{const id=idI.value.trim().toLowerCase(),pw=pwI.value;er.className="err";
    if(!id){er.textContent="아이디를 써 주세요.";idI.focus();return}
    if(/[ㄱ-ㅎ가-힣]/.test(id)){er.textContent="아이디에 한글은 안 돼요. 자판을 영어로 바꿔서 써 주세요.";idI.focus();return}
    if(!idOk(id)){er.textContent=id.length<3?"아이디가 너무 짧아요. 3자 이상 써 주세요.":"아이디에는 영어·숫자만 쓸 수 있어요.";idI.focus();return}
    if(pw.length<6){er.textContent=`비밀번호를 6자 이상으로 해 주세요. (지금 ${pw.length}자)`;pwI.focus();return}
    er.className="err ok";er.textContent=up?"가입하는 중…":"로그인 중…";
    try{const tok=await api(up?"ss_signup":"ss_login",{p_id:id,p_pw:pw});d.remove();setUser({id,token:tok});if(up)setTimeout(()=>alert(`가입 완료! 아이디: ${id}\n다른 기기에서는 '로그인' 탭으로 들어오세요.`),50)}
    catch(e){er.className="err";er.textContent=errMsg(e,up)}};
  d.querySelector("#ago").onclick=go;d.querySelector("#ax").onclick=()=>d.remove();
  pwI.onkeydown=e=>{if(e.key==="Enter")go()};idI.onkeydown=e=>{if(e.key==="Enter")pwI.focus()};
  d.querySelector("#axfer").onclick=xfer;setTimeout(()=>idI.focus(),50);
}
function account(){
  const d=dlg(`<h3>👤 ${user.id}</h3><p>푼 기록이 이 아이디에 자동 저장돼요. 다른 기기에서도 같은 아이디로 로그인하면 이어서 할 수 있어요.${meta.synced?"<br>마지막 저장: "+new Date(meta.synced).toLocaleString("ko-KR"):""}</p>
   <div class="err" id="amsg"></div>
   <div class="r"><button class="p" id="anow">지금 저장</button><button id="aget">저장된 기록 불러오기</button></div>
   <div class="r"><button id="aout">로그아웃</button><button id="ax">닫기</button></div>
   ${lsGet("sangsik.backup")?`<div class="r"><button class="link" id="aundo">기록이 이상해요 · 직전 상태로 되돌리기</button></div>`:""}`);
  const msg=d.querySelector("#amsg");
  d.querySelector("#anow").onclick=async()=>{meta.t=Math.max(meta.t||0,Date.now());await push();msg.className="err ok";msg.textContent=meta.synced>=meta.t?"저장했어요.":"저장하지 못했어요. 인터넷을 확인해 주세요."};
  d.querySelector("#aget").onclick=async()=>{try{const rm=await remote();if(!rm){msg.textContent="아직 저장된 기록이 없어요.";return}
    if(!confirm(new Date(rm.t).toLocaleString("ko-KR")+"에 저장된 기록으로 이 기기 기록을 바꿀까요?"))return;
    applyData(await unpack(rm.code));meta.t=meta.synced=rm.t;meta.uid=user.id;saveMeta();location.reload()}catch(e){msg.textContent=errMsg(e)}};
  d.querySelector("#aout").onclick=async()=>{if((meta.t||0)>(meta.synced||0))await push();api("ss_logout",{p_token:user.token}).catch(()=>{});d.remove();setUser(null)};
  d.querySelector("#ax").onclick=()=>d.remove();
  const u=d.querySelector("#aundo");if(u)u.onclick=()=>{let bk;try{bk=JSON.parse(lsGet("sangsik.backup"))}catch(e){}if(!bk)return;
    if(!confirm(new Date(bk.t).toLocaleString("ko-KR")+" 직전 기록으로 되돌릴까요?"))return;const cur={t:Date.now(),d:snapshot()};applyData(bk);lsSet("sangsik.backup",JSON.stringify(cur));meta.t=Date.now();saveMeta();push().then(()=>location.reload())};
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
    if(!confirm(new Date(o.t).toLocaleString("ko-KR")+"에 보낸 기록을 이 기기 기록과 합칠까요? (어느 쪽 기록도 지워지지 않아요)"))return;backup();applyData({d:mergeSnap(snapshot(),o.d)});meta.t=Date.now();saveMeta();if(user)await push();location.reload()};
}
try{const a=JSON.parse(lsGet(ACCT)||"null");if(a&&a.id&&a.token)setUser(a)}catch(e){}
})();
