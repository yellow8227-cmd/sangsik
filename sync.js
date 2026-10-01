// 깡깡이 상식 · 아이디/비번으로 기록 이어 하기 (Firebase). 설정이 없거나 오프라인이면 조용히 꺼진다.
(function(){
const CONF=window.FBCONF;if(!CONF||!CONF.apiKey)return;
const PFX="studioS.",META="sync.meta",DOM="@sangsik.app";
const SDK="fb/";
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{_set.call(localStorage,k,v)}catch(e){}}};
const _set=Storage.prototype.setItem;
let meta={};try{meta=JSON.parse(ls.get(META)||"{}")}catch(e){}
const saveMeta=()=>ls.set(META,JSON.stringify(meta));
let auth=null,db=null,user=null,timer=null,ready=false;

// 기록이 바뀔 때마다 표시해 두고 2초 뒤 서버로 올린다
Storage.prototype.setItem=function(k,v){const mine=this===localStorage&&String(k).startsWith(PFX)&&k!=="studioS.snd";
  const before=mine?this.getItem(k):null;_set.call(this,k,v);
  if(mine&&before!==String(v)){meta.t=Date.now();saveMeta();schedule()}};
function schedule(){if(!user||!ready)return;clearTimeout(timer);timer=setTimeout(push,2000);paint("저장 중…")}
function snapshot(){const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX))d[k]=ls.get(k)}return d}
function hasLocal(){const d=snapshot();return Object.keys(d).some(k=>k!=="studioS.snd")}
async function push(){if(!user)return;
  try{const t=meta.t||Date.now();await db.collection("users").doc(user.uid).set({data:snapshot(),t});
    meta.synced=t;meta.uid=user.uid;saveMeta();paint()}catch(e){paint("저장 대기(오프라인)")}}
function apply(remote){Object.keys(snapshot()).forEach(k=>{if(k!=="studioS.snd")try{localStorage.removeItem(k)}catch(e){}});
  Object.entries(remote.data||{}).forEach(([k,v])=>ls.set(k,v));meta.t=meta.synced=remote.t;meta.uid=user.uid;saveMeta();location.reload()}
async function pull(){
  let snap;try{snap=await db.collection("users").doc(user.uid).get()}catch(e){ready=true;paint("오프라인");return}
  const remote=snap.exists?snap.data():null;ready=true;
  if(!remote){await push();return}
  const sameAcct=meta.uid===user.uid;
  if(sameAcct){
    const localDirty=(meta.t||0)>(meta.synced||0);
    if(remote.t>(meta.synced||0)&&!localDirty)return apply(remote);
    if(remote.t>(meta.synced||0)&&localDirty){
      if(confirm("다른 기기에서 푼 기록과 이 기기 기록이 둘 다 바뀌었어요.\n[확인] 계정(다른 기기) 기록으로 맞추기\n[취소] 이 기기 기록을 계정에 올리기"))return apply(remote);
    }
    await push();return}
  // 이 기기에서 이 계정으로 처음 로그인
  if(!hasLocal())return apply(remote);
  if(confirm("이 계정에 저장된 기록이 있어요.\n[확인] 계정 기록 불러오기 (이 기기 기록은 지워져요)\n[취소] 이 기기 기록을 계정에 덮어쓰기"))return apply(remote);
  await push();
}
addEventListener("online",()=>{if(user&&ready)push()});
document.addEventListener("visibilitychange",()=>{if(!user||!ready)return;if(document.hidden){clearTimeout(timer);push()}else pull()});

// ── 화면: 헤더 오른쪽 위 버튼 + 로그인 창
const css=document.createElement("style");css.textContent=`
#acct{display:inline-block;margin:8px 0 0;font:inherit;font-size:13px;padding:6px 10px;border-radius:999px;border:1px solid var(--line,#ccd);background:var(--card,#fff);color:var(--ink,#1b2440);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;z-index:5}
#acctdlg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px}
#acctdlg .box{background:var(--card,#fff);color:var(--ink,#1b2440);border-radius:12px;padding:20px;width:100%;max-width:360px}
#acctdlg h3{margin:0 0 6px}#acctdlg p{font-size:13px;opacity:.8;margin:0 0 12px;line-height:1.5}
#acctdlg input{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px;margin:0 0 8px;border:1px solid var(--line,#ccd);border-radius:8px;background:none;color:inherit}
#acctdlg .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#acctdlg button{font:inherit;padding:10px 14px;border-radius:8px;border:1px solid var(--line,#ccd);background:none;color:inherit;cursor:pointer}
#acctdlg button.p{background:#1b2440;color:#fff;border-color:#1b2440}#acctdlg .err{color:#d9344f;font-size:13px;min-height:1.2em}`;
document.head.appendChild(css);
const btn=document.createElement("button");btn.id="acct";btn.textContent="로그인";
const host=document.querySelector("header")||document.body;host.appendChild(btn);
function paint(st){btn.textContent=user?("☁ "+user.email.replace(DOM,"")+(st?" · "+st:"")):"로그인 · 기록 이어 하기"}
paint();
btn.onclick=()=>user?account():login();
function dlg(html){const d=document.createElement("div");d.id="acctdlg";d.innerHTML=`<div class="box">${html}</div>`;d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);return d}
const idOk=s=>/^[a-z0-9._-]{3,20}$/.test(s);
function login(){
  const d=dlg(`<h3>로그인</h3><p>아이디·비밀번호를 정하면 폰과 노트북에서 같은 기록(오답, 점수, 외운 카드)으로 이어서 공부할 수 있어요. 로그인하지 않아도 지금처럼 쓸 수 있어요.</p>
   <input id="aid" placeholder="아이디 (영문 소문자·숫자 3~20자)" autocapitalize="none" autocomplete="username">
   <input id="apw" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password">
   <div class="err" id="aerr"></div>
   <div class="r"><button class="p" id="ain">로그인</button><button id="aup">처음이에요 (가입)</button><button id="ax">닫기</button></div>`);
  const go=async up=>{const id=d.querySelector("#aid").value.trim().toLowerCase(),pw=d.querySelector("#apw").value,er=d.querySelector("#aerr");
    if(!idOk(id)){er.textContent="아이디는 영문 소문자·숫자 3~20자로 써 주세요.";return}
    if(pw.length<6){er.textContent="비밀번호는 6자 이상이에요.";return}
    er.textContent=up?"가입하는 중…":"로그인 중…";
    try{if(!auth)await boot();up?await auth.createUserWithEmailAndPassword(id+DOM,pw):await auth.signInWithEmailAndPassword(id+DOM,pw);d.remove()}
    catch(e){const c=e&&e.code||"";er.textContent=c.includes("email-already")?"이미 있는 아이디예요. 로그인을 눌러 주세요.":c.includes("invalid-credential")||c.includes("wrong-password")||c.includes("user-not-found")?"아이디나 비밀번호가 맞지 않아요. 처음이면 '가입'을 눌러 주세요.":c.includes("network")||!auth?"인터넷 연결을 확인해 주세요.":c.includes("too-many")?"잠시 후 다시 시도해 주세요.":"로그인하지 못했어요 ("+c+")"}};
  d.querySelector("#ain").onclick=()=>go(false);d.querySelector("#aup").onclick=()=>go(true);d.querySelector("#ax").onclick=()=>d.remove();
  d.querySelector("#apw").onkeydown=e=>{if(e.key==="Enter")go(false)};
}
function account(){
  const d=dlg(`<h3>${user.email.replace(DOM,"")}</h3><p>이 기기에서 푼 기록이 계정에 자동 저장돼요. 다른 기기에서도 같은 아이디로 로그인하면 이어서 할 수 있어요.${meta.synced?"<br>마지막 저장: "+new Date(meta.synced).toLocaleString("ko-KR"):""}</p>
   <div class="r"><button class="p" id="anow">지금 저장</button><button id="aget">계정 기록 불러오기</button><button id="aout">로그아웃</button><button id="ax">닫기</button></div>`);
  d.querySelector("#anow").onclick=async()=>{await push();d.remove()};
  d.querySelector("#aget").onclick=async()=>{try{const s=await db.collection("users").doc(user.uid).get();if(s.exists)apply(s.data());else d.remove()}catch(e){alert("인터넷 연결을 확인해 주세요.")}};
  d.querySelector("#aout").onclick=async()=>{await push();await auth.signOut();d.remove()};
  d.querySelector("#ax").onclick=()=>d.remove();
}
function load(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
let booting=null;
function boot(){return booting||(booting=(async()=>{
  await load(SDK+"firebase-app-compat.js");await Promise.all([load(SDK+"firebase-auth-compat.js"),load(SDK+"firebase-firestore-compat.js")]);
  firebase.initializeApp(CONF);auth=firebase.auth();db=firebase.firestore();
  auth.onAuthStateChanged(u=>{user=u;ready=false;paint();if(u)pull()});
})().catch(e=>{booting=null;throw e}))}
// 예전에 로그인했던 기기면 자동으로 이어 붙는다
if(meta.uid)boot().catch(()=>paint());
})();
