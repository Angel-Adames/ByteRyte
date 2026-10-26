(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=$('#app'),DAY=864e5;
const PK='byteroots-profiles',GK='byteroots-settings';
const iso=(d=new Date())=>{const z=new Date(d);return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')+'-'+String(z.getDate()).padStart(2,'0')};
const shiftDay=(n,from=new Date())=>{const z=new Date(from);z.setDate(z.getDate()+n);return iso(z)};
const today=()=>iso(),yday=()=>shiftDay(-1),dayDiff=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/DAY);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const AVATARS=['🦊','🐼','🐙','🦉','🐸','🐯','🐨','🦄','🐧','🐳','🦖','🤖','👩‍💻','👨‍💻','🧑‍🚀','🐝'];
const AVATAR_NAMES=['Fox','Panda','Octopus','Owl','Frog','Tiger','Koala','Unicorn','Penguin','Whale','Dinosaur','Robot','Woman at a computer','Man at a computer','Astronaut','Bee'];
const NEWP=(name='Learner',avatar='🦊')=>({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,avatar,xp:0,streak:0,best:0,last:null,hearts:5,heartDay:today(),done:{},review:{},misses:{},xpLog:{},gems:50,freezes:0,inv:{fifty:1,skip:1},doubleUntil:0,goal:30,goalDay:null,badges:{},saved:{},dlog:{},stats:{answered:0,correct:0,perfect:0,lessons:0,interviews:0,bestIv:0,reviews:0,challenges:0},onboarded:false,track:'java',unlockAll:false,created:Date.now(),curriculum:2,gates:{}});
// ---------- storage + migration ----------
const readStore=k=>{try{const t=localStorage.getItem(k);return t?JSON.parse(t):null}catch(e){return null}};
let G=Object.assign({theme:'system',sound:true,big:false,rytia:true},readStore(GK)||{});
let P=readStore(PK);
if(!P||typeof P!=='object'||Array.isArray(P)){P={active:null,list:{}};const old=readStore('byteroots-v1');
  if(old&&typeof old==='object'&&!Array.isArray(old)){const p=Object.assign(NEWP(),{xp:old.xp||0,streak:old.streak||0,done:old.done||{},review:old.review||{},misses:old.misses||{},saved:old.saved||{},track:old.track||'java',onboarded:true,curriculum:old.curriculum});
    if(old.last){const d=new Date(old.last);if(!isNaN(d))p.last=iso(d)}p.best=p.streak;P.list[p.id]=p;P.active=p.id}}
let S;
function finite(v,d,min,max){const n=Number(v);if(!Number.isFinite(n))return d;let x=n;if(min!=null&&x<min)x=min;if(max!=null&&x>max)x=max;return x}
function sanitize(p){
  p.xp=Math.round(finite(p.xp,0,0,1e9));
  p.streak=Math.round(finite(p.streak,0,0,1e5));
  p.best=Math.round(finite(p.best,0,0,1e5));
  p.hearts=Math.round(finite(p.hearts,5,0,5));
  p.gems=Math.round(finite(p.gems,0,0,1e9));
  p.freezes=Math.round(finite(p.freezes,0,0,2));
  const g=Number(p.goal);p.goal=[10,30,50,100].includes(g)?g:30;
  p.doubleUntil=finite(p.doubleUntil,0,0,null);
  if(p.doubleUntil>Date.now()+30*864e5)p.doubleUntil=0;
  if(p.heartAt==null||!Number.isFinite(Number(p.heartAt)))p.heartAt=null;else p.heartAt=Number(p.heartAt);
  p.name=String(p.name==null?'Learner':p.name).replace(/[\u0000-\u001f]/g,'').trim().slice(0,24)||'Learner';
  p.avatar=String(p.avatar==null?'🦊':p.avatar).replace(/[\u0000-\u001f]/g,'').slice(0,32)||'🦊';
  if(!Number.isFinite(Number(p.created)))p.created=Date.now();else p.created=Number(p.created);
  p.gen=Math.round(finite(p.gen,0,0,1e9));
  p.inv=p.inv&&typeof p.inv==='object'?p.inv:{};
  p.inv.fifty=Math.round(finite(p.inv.fifty,0,0,999));
  p.inv.skip=Math.round(finite(p.inv.skip,0,0,999));
  p.onboarded=!!p.onboarded;p.unlockAll=!!p.unlockAll;
  if(!p.stats||typeof p.stats!=='object'||Array.isArray(p.stats))p.stats={};
  ['answered','correct','perfect','lessons','interviews','bestIv','reviews','challenges','bought','bestChal','saved'].forEach(k=>{if(p.stats[k]!=null)p.stats[k]=Math.round(finite(p.stats[k],0,0,1e9))});
  ['xpLog','misses','saved','badges'].forEach(map=>{
    if(!p[map]||typeof p[map]!=='object'||Array.isArray(p[map])){p[map]={};return}
    Object.keys(p[map]).forEach(k=>{
      if(k==='__proto__'||k==='constructor'||k==='prototype'){delete p[map][k];return}
      p[map][k]=Math.round(finite(p[map][k],0,0,map==='xpLog'||map==='misses'?1e9:1e15));
    });
  });
  if(!p.dlog||typeof p.dlog!=='object'||Array.isArray(p.dlog))p.dlog={};
  Object.keys(p.dlog).forEach(k=>{
    const x=p.dlog[k];
    if(!x||typeof x!=='object'||Array.isArray(x)){p.dlog[k]={l:0,a:0,c:0};return}
    ['l','a','c'].forEach(f=>{x[f]=Math.round(finite(x[f],0,0,1e9))});
  });
  if(!p.review||typeof p.review!=='object'||Array.isArray(p.review))p.review={};
  Object.keys(p.review).forEach(k=>{
    const x=p.review[k];
    if(!x||typeof x!=='object'||Array.isArray(x)){delete p.review[k];return}
    x.due=finite(x.due,0,0,null);x.box=Math.round(finite(x.box,0,0,8));
  });
  if(!p.gates||typeof p.gates!=='object'||Array.isArray(p.gates))p.gates={};
  Object.keys(p.gates).forEach(k=>{if(k==='__proto__'||k==='constructor'||k==='prototype'){delete p.gates[k];return}p.gates[k]=!!p.gates[k]});
  const questIds={xp:1,lessons:1,correct:1,perfect:1,chal:1,review:1,iv:1};
  if(p.qd&&typeof p.qd==='object'&&!Array.isArray(p.qd)&&typeof p.qd.day==='string'&&Array.isArray(p.qd.ids)&&p.qd.ids.length===3&&p.qd.ids[0]==='xp'&&p.qd.ids.every(id=>questIds[id])){
    p.qd.chest=!!p.qd.chest;
    if(!p.qd.p||typeof p.qd.p!=='object'||Array.isArray(p.qd.p))p.qd.p={};
    Object.keys(p.qd.p).forEach(k=>{p.qd.p[k]=Math.round(finite(p.qd.p[k],0,0,1e9))});
    if(!p.qd.claimed||typeof p.qd.claimed!=='object'||Array.isArray(p.qd.claimed))p.qd.claimed={};
    Object.keys(p.qd.claimed).forEach(k=>{if(!questIds[k])delete p.qd.claimed[k];else p.qd.claimed[k]=1});
  }else delete p.qd;
  if(typeof TRACKS==='undefined'||!TRACKS.some(t=>t.id===p.track))p.track='java';
  const dayOk=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00');return !isNaN(d.getTime())&&iso(d)===s};
  if(p.last!=null&&!dayOk(p.last))p.last=null;
  if(p.heartDay!=null&&!dayOk(p.heartDay))p.heartDay=null;
  if(p.goalDay!=null&&!dayOk(p.goalDay))p.goalDay=null;
  return p}
function ownCopy(target,raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))return target;Object.keys(raw).forEach(k=>{if(k==='__proto__'||k==='constructor'||k==='prototype')return;target[k]=raw[k]});return target}
function hydrate(){
  if(!P||typeof P!=='object'||Array.isArray(P))P={active:null,list:{}};
  if(!P.list||typeof P.list!=='object'||Array.isArray(P.list))P.list={};
  Object.keys(P.list).forEach(id=>{
    if(id==='__proto__'||id==='constructor'||id==='prototype'){delete P.list[id];return}
    const raw=P.list[id];
    if(!raw||typeof raw!=='object'||Array.isArray(raw)){delete P.list[id];return}
    const d=NEWP();
    const merged=ownCopy(Object.assign(d,{id}),raw);
    merged.id=id;
    merged.inv=ownCopy(Object.assign({},d.inv),raw.inv);
    merged.stats=ownCopy(Object.assign({},d.stats),raw.stats);
    merged.saved=ownCopy({},raw.saved);
    merged.badges=ownCopy({},raw.badges);
    merged.done=ownCopy({},raw.done);
    merged.review=ownCopy({},raw.review);
    merged.misses=ownCopy({},raw.misses);
    merged.xpLog=ownCopy({},raw.xpLog);
    merged.dlog=ownCopy({},raw.dlog);
    merged.gates=ownCopy({},raw.gates);
    if(!(raw.curriculum>=2))migrateProgress(merged);
    sanitize(merged);
    P.list[id]=merged});
  if(!P.active||!P.list[P.active])P.active=Object.keys(P.list)[0]||null;
  S=P.active?P.list[P.active]:null}
const econBases={};
function econSnap(p){return {gems:p.gems,hearts:p.hearts,freezes:p.freezes||0,fifty:(p.inv&&p.inv.fifty)||0,skip:(p.inv&&p.inv.skip)||0,doubleUntil:p.doubleUntil||0,goal:p.goal,goalDay:p.goalDay??null,heartAt:p.heartAt??null,heartDay:p.heartDay??null,bought:(p.stats&&p.stats.bought)||0}}
const progBases={};
function copyMap(o){const out={};if(o&&typeof o==='object'&&!Array.isArray(o))Object.keys(o).forEach(k=>{if(k==='__proto__'||k==='constructor'||k==='prototype')return;out[k]=o[k]});return out}
function progSnap(p){const st=p.stats||{},q=p.qd&&typeof p.qd==='object'?p.qd:{};return {xp:p.xp||0,streak:p.streak||0,best:p.best||0,last:p.last??null,lessons:st.lessons||0,perfect:st.perfect||0,xpLog:copyMap(p.xpLog),done:copyMap(p.done),misses:copyMap(p.misses),badges:copyMap(p.badges),review:copyMap(p.review),qday:q.day||null,qp:copyMap(q.p),qclaimed:copyMap(q.claimed),qchest:!!q.chest,gen:p.gen||0}}
function rememberEcon(p){if(p&&p.id){econBases[p.id]=econSnap(p);progBases[p.id]=progSnap(p)}}
function rememberAll(){Object.keys(econBases).forEach(k=>delete econBases[k]);Object.keys(progBases).forEach(k=>delete progBases[k]);Object.values(P.list||{}).forEach(rememberEcon)}
function mergeEcon(mine,remote,base){
  const add=(r,m,b,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(r+(m-b))));
  mine.gems=add(remote.gems||0,mine.gems||0,base.gems,0,1e9);
  mine.hearts=add(remote.hearts||0,mine.hearts||0,base.hearts,0,5);
  mine.freezes=add(remote.freezes||0,mine.freezes||0,base.freezes,0,2);
  mine.inv=mine.inv&&typeof mine.inv==='object'?mine.inv:{};
  mine.inv.fifty=add((remote.inv&&remote.inv.fifty)||0,mine.inv.fifty||0,base.fifty,0,999);
  mine.inv.skip=add((remote.inv&&remote.inv.skip)||0,mine.inv.skip||0,base.skip,0,999);
  mine.doubleUntil=Math.max(0,(remote.doubleUntil||0)+((mine.doubleUntil||0)-base.doubleUntil));
  if(mine.goal===base.goal)mine.goal=remote.goal;
  if(mine.goalDay===base.goalDay)mine.goalDay=remote.goalDay;
  if(mine.heartAt===base.heartAt)mine.heartAt=remote.heartAt;
  if(mine.heartDay===base.heartDay)mine.heartDay=remote.heartDay;
  if(!mine.stats||typeof mine.stats!=='object')mine.stats={};
  mine.stats.bought=add((remote.stats&&remote.stats.bought)||0,mine.stats.bought||0,base.bought,0,1e9);
  sanitize(mine);
}
function mergeProg(mine,remote,base){
  const add=(r,m,b,lo,hi)=>Math.max(lo,Math.min(hi,Math.round((r||0)+((m||0)-(b||0)))));
  const bad=k=>k==='__proto__'||k==='constructor'||k==='prototype';
  const bumped=(remote.gen||0)>(base.gen||0);
  const unchanged=(m,b)=>m===b||(!!m&&!!b&&typeof m==='object'&&typeof b==='object'&&m.box===b.box&&m.due===b.due);
  const keep=(mineMap,remoteMap,baseMap)=>{
    const out={},mineM=mineMap&&typeof mineMap==='object'?mineMap:{},remoteM=remoteMap&&typeof remoteMap==='object'?remoteMap:{},baseM=baseMap&&typeof baseMap==='object'?baseMap:{};
    Object.keys(mineM).forEach(k=>{if(bad(k)||!mineM[k])return;if(baseM[k]&&!remoteM[k]&&unchanged(mineM[k],baseM[k]))return;out[k]=mineM[k]});
    Object.keys(remoteM).forEach(k=>{if(bad(k)||!remoteM[k]||out[k])return;if(baseM[k]&&!mineM[k])return;out[k]=remoteM[k]});
    return out;
  };
  mine.xp=add(remote.xp,mine.xp,base.xp,0,1e9);
  const days=new Set([...Object.keys(base.xpLog||{}),...Object.keys(remote.xpLog||{}),...Object.keys(mine.xpLog||{})]);
  const mineLog=copyMap(mine.xpLog);
  mine.xpLog={};
  days.forEach(d=>{const v=add(remote.xpLog&&remote.xpLog[d],mineLog[d],base.xpLog&&base.xpLog[d],0,1e9);if(v)mine.xpLog[d]=v});
  const mineDone=copyMap(mine.done);
  if(bumped){
    mine.done=copyMap(remote.done);
    Object.keys(mineDone).forEach(k=>{if(bad(k))return;if(mineDone[k]&&!(base.done&&base.done[k]))mine.done[k]=true});
  }else mine.done=keep(mineDone,remote.done,base.done);
  const mk=new Set([...Object.keys(base.misses||{}),...Object.keys(remote.misses||{}),...Object.keys(mine.misses||{})]);
  const mineMiss=copyMap(mine.misses);
  mine.misses={};
  mk.forEach(k=>{const v=add(remote.misses&&remote.misses[k],mineMiss[k],base.misses&&base.misses[k],0,1e9);if(v)mine.misses[k]=v});
  if(!mine.stats||typeof mine.stats!=='object')mine.stats={};
  mine.stats.lessons=add(remote.stats&&remote.stats.lessons,mine.stats.lessons,base.lessons,0,1e9);
  mine.stats.perfect=add(remote.stats&&remote.stats.perfect,mine.stats.perfect,base.perfect,0,1e9);
  if(mine.streak===base.streak&&(mine.last??null)===(base.last??null)){mine.streak=remote.streak||0;mine.last=remote.last??null;mine.best=Math.max(mine.best||0,remote.best||0)}
  else{const rl=remote.last??null,ml=mine.last??null,last=!ml?rl:!rl?ml:(ml>=rl?ml:rl);if(last&&last===ml&&last===rl)mine.streak=Math.max(mine.streak||0,remote.streak||0);else if(last===rl)mine.streak=remote.streak||0;mine.last=last;mine.best=Math.max(mine.best||0,remote.best||0,mine.streak||0)}
  const mineReview=copyMap(mine.review);
  if(bumped){
    mine.review=copyMap(remote.review);
    Object.keys(mineReview).forEach(k=>{if(bad(k))return;if(mineReview[k]&&!(base.review&&base.review[k]))mine.review[k]=mineReview[k]});
  }else mine.review=keep(mineReview,remote.review,base.review);
  const mineBadges=copyMap(mine.badges);
  if(bumped){
    mine.badges=copyMap(remote.badges);
    Object.keys(mineBadges).forEach(k=>{if(bad(k))return;if(mineBadges[k]&&!(base.badges&&base.badges[k]))mine.badges[k]=mineBadges[k]});
  }else mine.badges=keep(mineBadges,remote.badges,base.badges);
  const takeQ=q=>({day:q.day,ids:q.ids.slice(),p:copyMap(q.p),claimed:copyMap(q.claimed),chest:!!q.chest});
  if(bumped){
    if(remote.qd&&remote.qd.day){
      const mineQ=mine.qd;
      mine.qd=takeQ(remote.qd);
      if(mineQ&&mineQ.day===remote.qd.day&&mineQ.day===base.qday){
        Object.keys(mineQ.p||{}).forEach(k=>{const delta=(mineQ.p[k]||0)-((base.qp&&base.qp[k])||0);if(delta>0)mine.qd.p[k]=Math.min(1e9,(mine.qd.p[k]||0)+delta)});
        Object.keys(mineQ.claimed||{}).forEach(k=>{if(bad(k))return;if(mineQ.claimed[k]&&!(base.qclaimed&&base.qclaimed[k]))mine.qd.claimed[k]=1});
        if(mineQ.chest&&!base.qchest)mine.qd.chest=true;
      }
    }else delete mine.qd;
  }else if(mine.qd&&remote.qd&&remote.qd.day&&mine.qd.day&&remote.qd.day>mine.qd.day){
    mine.qd=takeQ(remote.qd);
  }else if(mine.qd&&remote.qd&&mine.qd.day&&mine.qd.day===remote.qd.day&&mine.qd.day===base.qday){
    const qk=new Set([...Object.keys(base.qp||{}),...Object.keys(remote.qd.p||{}),...Object.keys(mine.qd.p||{})]);
    const mineP=copyMap(mine.qd.p);
    mine.qd.p={};
    qk.forEach(k=>{const v=add(remote.qd.p&&remote.qd.p[k],mineP[k],base.qp&&base.qp[k],0,1e9);if(v)mine.qd.p[k]=v});
    mine.qd.claimed=copyMap(mine.qd.claimed);
    Object.keys(remote.qd.claimed||{}).forEach(k=>{if(remote.qd.claimed[k])mine.qd.claimed[k]=1});
    if(remote.qd.chest||base.qchest)mine.qd.chest=true;
  }
  mine.gen=Math.max(mine.gen||0,remote.gen||0);
  sanitize(mine);
}
hydrate();
rememberAll();
function writeStore(k,v){try{localStorage.setItem(k,v);return true}catch(e){toast('This browser blocked saving. Free some space and try again.');return false}}
const saveG=()=>writeStore(GK,JSON.stringify(G));
let syncing=false,remoteNewer=false;
const save=()=>{
  if(syncing)return true;
  const mine=S,active=mine&&mine.id;
  if(mine)P.list[mine.id]=mine;
  const latest=readStore(PK);
  if(latest&&typeof latest==='object'&&!Array.isArray(latest)&&(latest.rev||0)>(P.rev||0)){
    if((R||remoteNewer)&&active&&mine){
      const base=econBases[active],pbase=progBases[active];
      P=latest;hydrate();
      const remote=P.list[active];
      if(remote&&base)mergeEcon(mine,remote,base);
      if(remote&&pbase)mergeProg(mine,remote,pbase);
      P.list[active]=mine;P.active=active;S=mine;remoteNewer=false;
      Object.keys(P.list).forEach(id=>{if(id!==active)rememberEcon(P.list[id])});
    }else{
      P=latest;hydrate();rememberAll();remoteNewer=false;
      toast('Another tab saved newer progress. This tab is showing that copy.');
      if(!R){const n=cur||'learn';cur='';show(n)}
      return false;
    }
  }
  P.rev=(P.rev||0)+1;
  const wrote=writeStore(PK,JSON.stringify(P));
  if(wrote&&S)rememberEcon(S);
  return wrote;
};
const HREG=30*60*1000;
function regen(){if(S.hearts>=5){S.heartAt=null;return}if(!S.heartAt){S.heartAt=Date.now();return}const n=Math.floor((Date.now()-S.heartAt)/HREG);if(n>0){S.hearts=Math.min(5,S.hearts+n);S.heartAt=S.hearts>=5?null:S.heartAt+n*HREG;save()}}
function nextHeart(){if(S.hearts>=5||!S.heartAt)return '';const m=Math.max(1,Math.ceil((S.heartAt+HREG-Date.now())/60000));return `${m} min`}
function heartsDue(){if(!S)return false;if(S.heartDay!==today())return true;if(S.hearts>=5||!S.heartAt)return false;return Date.now()-S.heartAt>=HREG}
function daily(){ // refill hearts at midnight, streak freeze handling, then pay goals already earned
  if(!S)return;
  regen();
  if(S.heartDay!==today()){S.hearts=5;S.heartAt=null;S.heartDay=today()}
  if(S.last&&S.last!==today()&&S.last!==yday()){const miss=dayDiff(S.last,today())-1;
    if(miss>0&&S.freezes>=miss){S.freezes-=miss;S.last=yday();toast(`🧊 Streak freeze used (${miss}) — streak saved!`)}else if(miss>0)S.streak=0}
  settleRewards();
  save()}
// ---------- theme / sound / toast ----------
const mq=matchMedia('(prefers-color-scheme: dark)');
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const applyTheme=()=>{if(!['system','light','dark'].includes(G.theme))G.theme='system';G.sound=!!G.sound;G.big=!!G.big;G.rytia=G.rytia!==false;const d=G.theme==='dark'||(G.theme==='system'&&mq.matches);document.documentElement.dataset.theme=d?'dark':'light';$('meta[name=theme-color]').content=d?'#0b1220':'#16a34a';document.documentElement.toggleAttribute('data-big',!!G.big);document.documentElement.toggleAttribute('data-standalone',standalone())};
mq.addEventListener?.('change',applyTheme);applyTheme();
let AC;const tone=(f,d=.12,t=0,type='sine')=>{if(!G.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,AC.currentTime+t);g.gain.exponentialRampToValueAtTime(.15,AC.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+t+d);o.connect(g).connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+d+.05)}catch(e){}};
const sfx={ok:()=>{tone(660);tone(880,.15,.09)},no:()=>{tone(220,.2,0,'triangle')},win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.18,i*.11)),coin:()=>{tone(988,.08);tone(1319,.15,.07)}};
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const TQ=[];let tBusy=false;function toast(msg){TQ.push(msg);if(!tBusy)nextToast()}function nextToast(){const msg=TQ.shift();if(msg===undefined){tBusy=false;return}tBusy=true;const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);const d=TQ.length?1500:2600;setTimeout(()=>t.classList.add('out'),d);setTimeout(()=>{t.remove();nextToast()},d+350)}
// ---------- syntax highlight ----------
const KW=/^(abstract|boolean|break|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|null|package|permits|private|protected|public|record|return|sealed|short|static|super|switch|this|throw|throws|try|var|void|when|while|true|false|let|func|struct|guard|in|protocol|extension|mutating|nil|some|inout|self|init|where|as|is|yield|async|await)$/;
function hl(code){const re=/(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(\b\d+(?:\.\d+)?[LfdF]?\b)|(@\w+)|(\b[A-Za-z_]\w*\b)|(___)/gm;let out='',i=0,m;
  while((m=re.exec(code))){out+=esc(code.slice(i,m.index));const [w,c,s,n,a,id,bl]=m;
    out+=c?`<span class="tc">${esc(w)}</span>`:s?`<span class="ts">${esc(w)}</span>`:n?`<span class="tn">${w}</span>`:a?`<span class="ta">${w}</span>`:bl?`<span class="blank">___</span>`:KW.test(id)?`<span class="tk">${w}</span>`:/^[A-Z]/.test(id)?`<span class="tt">${w}</span>`:w;i=m.index+w.length}
  return out+esc(code.slice(i))}
// ---------- data helpers ----------
const T=id=>TRACKS.find(t=>t.id===id);
const lessons=t=>{const o=[];t.units.forEach((u,ui)=>u.lessons.forEach((l,li)=>o.push({l,u,ui,li,key:l.id})));return o};
const findLesson=id=>{const lid=String(id).includes('~')?String(id).split('~')[0]:id;for(const t of TRACKS)for(const u of t.units){const li=u.lessons.findIndex(l=>l.id===lid);if(li>=0)return {t,u,l:u.lessons[li],ui:t.units.indexOf(u),li,id:lid}}return null};
const DRILL=['java.types','java.strings','java.control','java.methods','java.arrays'];
const FX_GATE=[...DRILL,'java.classes','java.refs','java.inherit','java.interfaces','java.exceptions'];
const DJ='https://dev.java/learn/',DO='https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/',FX='https://openjfx.io/javadoc/21/',MDN='https://developer.mozilla.org/en-US/docs/',SW='https://docs.swift.org/swift-book/documentation/the-swift-programming-language/';
const DOCS={'Types & Variables':DJ+'language-basics/primitive-types/','Strings':DO+'lang/String.html','Control Flow':DJ+'language-basics/controlling-flow/','Methods':DJ+'classes-objects/defining-methods/','Arrays':DJ+'language-basics/arrays/','Classes & Objects':DJ+'classes-objects/','Inheritance & Polymorphism':DJ+'inheritance/','Interfaces & Abstract Classes':DJ+'interfaces/','References & Memory':DJ+'classes-objects/creating-objects/','Exceptions':DJ+'exceptions/','Lists & Generics':DJ+'generics/','Maps & Sets':DJ+'api/collections-framework/','Lambdas & Streams':DJ+'lambdas/','Records, Enums & Equality':DJ+'records/','Sorting & Comparators':DO+'util/Comparator.html','Recursion':DJ+'classes-objects/defining-methods/','Big-O & Searching':DO+'util/Arrays.html','Threads & Concurrency':DO+'util/concurrent/package-summary.html','OOP Design & SOLID':DJ+'interfaces/','Files & I/O':DO+'nio/file/Files.html','Testing with JUnit':'https://junit.org/junit5/docs/current/user-guide/','Interview Patterns':DJ+'api/collections-framework/','Abstract vs Interface':DJ+'interfaces/','Generic Methods':DJ+'generics/','Checked & Unchecked':DJ+'exceptions/','Stream Pipelines':DO+'util/stream/Collectors.html','Records in Practice':DJ+'records/','Enums with State':'https://docs.oracle.com/javase/tutorial/java/javaOO/enum.html','Big-O Tradeoffs':DO+'util/Arrays.html',
'App Lifecycle & Scene Graph':FX+'javafx.graphics/javafx/application/Application.html','Layouts & Controls':FX+'javafx.graphics/javafx/scene/layout/package-summary.html','Events, Properties & FXML':FX+'javafx.base/javafx/beans/property/package-summary.html','Styling JavaFX with CSS':FX+'javafx.graphics/javafx/scene/doc-files/cssref.html','Concurrency & Tasks':FX+'javafx.graphics/javafx/concurrent/Task.html',
'Semantic HTML & Forms':MDN+'Glossary/Semantics','Box Model & Selectors':MDN+'Learn_web_development/Core/Styling_basics/Box_model','Flexbox & Grid':MDN+'Web/CSS/CSS_grid_layout','Responsive Design':MDN+'Learn_web_development/Core/CSS_layout/Responsive_Design','Variables, Transitions & Units':MDN+'Web/CSS/Using_CSS_custom_properties',
'Basics & Optionals':SW+'thebasics/','Value vs Reference Types':SW+'classesandstructures/','Errors & SwiftUI Basics':SW+'errorhandling/','Protocols, Closures & Collections':SW+'protocols/','Enums, Switch & Structs':SW+'enumerations/','Alerts & Dialogs':FX+'javafx.controls/javafx/scene/control/Alert.html','Windows & Modality':FX+'javafx.graphics/javafx/stage/Stage.html','Lists & Selection':FX+'javafx.controls/javafx/scene/control/ListView.html','Forms & Validation':MDN+'Web/CSS/:invalid','Positioning':MDN+'Web/CSS/position','Accessible CSS':MDN+'Web/CSS/:focus-visible','Strings & Characters':SW+'stringsandcharacters/','Throwing Functions':SW+'errorhandling/','SwiftUI Lists':'https://developer.apple.com/documentation/swiftui/foreach'};
const IVDOC={Swift:SW+'thebasics/',JavaFX:'https://openjfx.io/openjfx-docs/',CSS:MDN+'Web/CSS/CSS_grid_layout',Complexity:DJ+'api/collections-framework/','Data structures':DJ+'api/collections-framework/',Coding:DJ+'language-basics/controlling-flow/','Java trivia':DJ+'language-basics/primitive-types/',Patterns:DJ+'api/collections-framework/',OOP:DJ+'inheritance/',Collections:DJ+'api/collections-framework/',Streams:DJ+'lambdas/',JVM:'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-1.html',Memory:'https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html',Modern:'https://docs.oracle.com/en/java/javase/21/language/java-language-changes.html'};
Object.assign(DOCS,{
'How a Program Runs':'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-1.html',
'Memory: Values and References':'https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html',
'Debugging Mindset':'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html',
'Modern Java Syntax':'https://docs.oracle.com/en/java/javase/21/language/java-language-changes.html',
'Sealed Types':'https://docs.oracle.com/en/java/javase/21/language/sealed-classes-and-interfaces.html',
'App Lifecycle & Scene Graph':'https://openjfx.io/openjfx-docs/',
'How the Browser Paints':MDN+'Web/Performance/How_browsers_work',
'Modern CSS':MDN+'Web/CSS/:has',
'Observable Models & Navigation':'https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app',
'Async, Await, and the Main Actor':SW+'concurrency/'
});
const plural=(n,one,many)=>`${n} ${n===1?one:(many||one+'s')}`;
const docUrl=k=>{if(!k)return null;if(k.startsWith('iv-'))return IVDOC[IV[+k.slice(3)]?.tag]||null;const f=findLesson(k);if(f)return DOCS[f.l.name]||null;const id=String(k).split('~')[0];for(const t of TRACKS)for(const u of t.units)if(u.quiz&&u.quiz.id===id&&u.lessons[0])return DOCS[u.lessons[0].name]||null;return null};
const docLink=u=>{try{if(!u)return '';const host=new URL(u).hostname.replace(/^www\./,'');return `<a class="learn" href="${u}" target="_blank" rel="noopener">📘 Learn more · ${host} <span aria-hidden="true">↗</span><span class="sr">(opens in a new tab)</span></a>`}catch(e){return ''}};
const sheetHTML=items=>items&&items.length?`<ul class="cheats">${items.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:'';
const dl=()=>{const d=today();S.dlog=S.dlog||{};return S.dlog[d]=S.dlog[d]||{l:0,a:0,c:0}};
const savedKeys=()=>Object.keys(S.saved||{}).filter(k=>exByKey(k)).sort((a,b)=>S.saved[b]-S.saved[a]);
const quizEx=k=>{const p=String(k).split('~');if(p.length<2)return null;for(const t of TRACKS)for(const u of t.units)if(u.quiz&&u.quiz.id===p[0])return u.quiz.ex[+p[1]]||null;return null};
const exByKey=k=>{if(k.startsWith('iv-'))return IV[+k.slice(3)];const qz=quizEx(k);if(qz)return qz;const f=findLesson(k);if(!f)return null;const i=String(k).split('~')[1];return i===undefined?null:f.l.ex[+i]};
const lessonOf=k=>findLesson(k)?.l||null;
const trackOpen=t=>{if(!t||!t.parent)return true;if(S.unlockAll)return true;if(S.gates&&S.gates[t.id])return true;return (t.id==='javafx'?FX_GATE:DRILL).every(id=>S.done&&S.done[id])};
const due=()=>Object.entries(S.review).filter(([k,v])=>v.due<=Date.now()&&exByKey(k)).map(([k])=>k);
const NAMES={mc:'Concept check',out:'Predict the output',fill:'Complete the code',ar:'Arrange the code',bug:'Spot the bug',fix:'Fix the bug',type:'Write the code'};
const dblOn=()=>S.doubleUntil>Date.now();
// A session keeps the boost that was running when it started, including after the 15 minutes end.
const boosted=()=>R?S.doubleUntil>R.t0:dblOn();
function addXP(n){if(boosted())n*=2;S.xp+=n;S.xpLog[today()]=(S.xpLog[today()]||0)+n;
  if(S.last!==today()){S.streak=S.last===yday()?S.streak+1:1;S.last=today();S.best=Math.max(S.best,S.streak);if(S.streak%7===0){gems(20,'7-day streak bonus')}}
  settleRewards();return n}
function gems(n,why){S.gems+=n;if(why)toast(`💎 +${n} — ${why}`);sfx.coin()}
// ---------- levels ----------
function level(xp=S.xp){xp=Math.round(finite(xp,0,0,1e9));const T=n=>25*n*(n+3);let n=Math.floor((-3+Math.sqrt(9+xp/6.25))/2);if(!Number.isFinite(n)||n<0)n=0;if(n>100000)n=100000;while(n>0&&T(n)>xp)n--;while(T(n+1)<=xp&&n<100000)n++;return {L:n+1,into:xp-T(n),need:100+50*n}}
const compact=n=>{n=Math.round(finite(n,0,-1e12,1e12));const s=n<0?'-':'';n=Math.abs(n);if(n>=1e9)return s+(n/1e9).toFixed(1).replace(/\.0$/,'')+'B';if(n>=1e6)return s+(n/1e6).toFixed(1).replace(/\.0$/,'')+'M';if(n>=10000)return s+(n/1000).toFixed(n>=100000?0:1).replace(/\.0$/,'')+'k';return s+String(n)};
// ---------- daily quests ----------
const QPOOL={lessons:['📚','Complete 2 lessons',2],correct:['🎯','Get 15 answers right',15],perfect:['💯','Finish a lesson with no mistakes',1],chal:['⏱️','Get 5 right in speed challenges',5],review:['🔁','Finish a review or practice session',1],iv:['💼','Complete a mock interview',1]};
function quests(){if(!S.qd||S.qd.day!==today()){const keys=Object.keys(QPOOL);let h=0;for(const c of today()+S.id)h=(h*31+c.charCodeAt(0))>>>0;const pick=[];while(pick.length<2){const k=keys[h%keys.length];if(!pick.includes(k))pick.push(k);h=(h*1103515245+12345)>>>0}S.qd={day:today(),ids:['xp',...pick],p:{},claimed:{},chest:false}}
  return S.qd.ids.map(id=>{const [ic,label,n]=id==='xp'?['⚡',`Earn ${S.goal} XP`,S.goal]:QPOOL[id];const v=id==='xp'?(S.xpLog[today()]||0):(S.qd.p[id]||0);return {id,ic,label,n,v:Math.min(v,n),done:v>=n}})}
function claimQuests(){const qs=quests();
  qs.forEach(q=>{if(q.done&&!S.qd.claimed[q.id]){S.qd.claimed[q.id]=1;S.gems+=15;setTimeout(()=>{toast(`${q.ic} Quest complete: ${q.label} · +15 💎`);sfx.coin()},700)}});
  if(!S.qd.chest&&qs.every(q=>q.done)){S.qd.chest=true;S.gems+=25;setTimeout(()=>{toast('🎁 All daily quests done! +25 💎');sfx.coin()},1600)}}
function settleRewards(){if(S.goalDay!==today()&&(S.xpLog[today()]||0)>=S.goal){S.goalDay=today();gems(10,'Daily goal reached')}claimQuests()}
function qBump(m,n=1){quests();if(m!=='xp')S.qd.p[m]=(S.qd.p[m]||0)+n;claimQuests()}
function questsHTML(){const qs=quests(),d=qs.filter(q=>q.done).length;return `<section class="quests"><div class="row"><b>Daily quests</b><span class="muted sm">${d}/3 · resets at midnight</span></div>${qs.map(q=>`<div class="quest ${q.done?'done':''}"><span class="qi">${q.done?'✅':q.ic}</span><div><div class="row"><span>${esc(q.label)}</span><small>${q.v}/${q.n}</small></div><div class="bar sm"><i style="width:${q.v/q.n*100}%"></i></div></div><span class="qr" title="Reward">💎15</span></div>`).join('')}<div class="chest ${S.qd.chest?'open':''}">${S.qd.chest?'🎁 Bonus chest opened: +25 💎':'🎁 Finish all 3 for a +25 💎 bonus chest'}</div></section>`}
// ---------- badges ----------
const BADGES=[
['first','🌱','First Steps','Finish your first lesson',()=>S.stats.lessons>=1],
['five','📗','Bookworm','Finish 5 lessons',()=>S.stats.lessons>=5,()=>[S.stats.lessons,5]],
['twenty','🏛️','Scholar','Finish 20 lessons',()=>S.stats.lessons>=20,()=>[S.stats.lessons,20]],
['perfect','💯','Flawless','Finish a lesson with no mistakes',()=>S.stats.perfect>=1],
['streak3','🔥','On Fire','Reach a 3-day streak',()=>S.best>=3,()=>[S.best,3]],
['streak7','☄️','Unstoppable','Reach a 7-day streak',()=>S.best>=7,()=>[S.best,7]],
['xp500','⚡','Charged','Earn 500 XP',()=>S.xp>=500,()=>[S.xp,500]],
['xp2000','🌩️','Supercharged','Earn 2,000 XP',()=>S.xp>=2000,()=>[S.xp,2000]],
['unit1','☕','Java Rooted','Complete Java Unit 1 · Foundations',()=>lessons(T('java')).filter(x=>x.u.uid==='foundations').every(x=>S.done[x.key]),()=>{const u=lessons(T('java')).filter(x=>x.u.uid==='foundations');return [u.filter(x=>S.done[x.key]).length,u.length]}],
['branch','🌿','Branching Out','Finish a JavaFX and an HTML & CSS lesson',()=>['javafx','css'].every(t=>lessons(T(t)).some(x=>S.done[x.key]))],
['swift','🐦','Bilingual','Finish a Swift lesson',()=>lessons(T('swift')).some(x=>S.done[x.key])],
['iv1','💼','Interview Ready','Complete a mock interview',()=>S.stats.interviews>=1],
['iv80','🏅','Offer Letter','Score 80%+ in a mock interview',()=>S.stats.bestIv>=80],
['review','🔁','Comeback','Complete 3 review sessions',()=>S.stats.reviews>=3,()=>[S.stats.reviews,3]],
['shop','🛍️','Big Spender','Buy something in the shop',()=>S.stats.bought>=1],
['java','👑','Java Master','Complete every Java lesson',()=>lessons(T('java')).every(x=>S.done[x.key]),()=>[lessons(T('java')).filter(x=>S.done[x.key]).length,lessons(T('java')).length]],
['pro','🧰','Professional','Complete Unit 6 · Professional Java',()=>lessons(T('java')).filter(x=>x.u.uid==='pro').every(x=>S.done[x.key]),()=>{const u=lessons(T('java')).filter(x=>x.u.uid==='pro');return [u.filter(x=>S.done[x.key]).length,u.length]}],
['curator','★','Curator','Save 3 questions to revisit',()=>Object.keys(S.saved||{}).length>=3,()=>[Object.keys(S.saved||{}).length,3]],
['speed','🏎️','Speed Demon','Get 15+ right in a speed challenge',()=>(S.stats.bestChal||0)>=15,()=>[S.stats.bestChal||0,15]]];
function checkBadges(){BADGES.forEach(([id,ic,n,,f])=>{if(!S.badges[id]&&f()){S.badges[id]=Date.now();setTimeout(()=>{toast(`${ic} Badge unlocked: ${n}`);sfx.coin()},400)}});save()}
// ---------- shell ----------
const NAV=[['learn','📚','Learn'],['practice','🎯','Practice'],['interview','💼','Interview'],['shop','💎','Shop'],['profile','👤','Profile']];
let cur='learn';
function topbar(){const tight=S.streak>=100||S.gems>=1000;return `<header class="top${tight?' tight':''}"><button class="brand" data-go="learn" aria-label="ByteRyte home"><span class="logo">{ }</span>ByteRyte</button>
<span class="stat" title="Day streak" aria-label="${S.streak} day streak">🔥 ${compact(S.streak)}</span><span class="stat" title="Gems" aria-label="${S.gems} gems">💎 ${compact(S.gems)}</span><span class="stat" title="${S.hearts<5&&nextHeart()?'Next heart in '+nextHeart():'Hearts full'}" aria-label="${S.hearts} hearts${S.hearts<5&&nextHeart()?', next in '+nextHeart():''}">❤️ ${S.hearts}</span>
<button class="icon" data-go="settings" aria-label="Settings">⚙️</button></header>`}
function rail(){const lv=level(),wk=[...Array(7)].reduce((a,_,i)=>a+(S.xpLog[shiftDay(-i)]||0),0);
  return `<aside class="rail" aria-label="Your progress"><section class="rcard me"><span class="avatar">${esc(S.avatar)}</span><div><b>${esc(S.name)}</b><small>Level ${lv.L} · ${lv.into}/${lv.need} XP</small><div class="bar sm"><i style="width:${lv.into/lv.need*100}%"></i></div></div></section>
  <section class="rcard"><div class="sgrid s2"><div class="scard">🔥<b>${S.streak}</b>streak</div><div class="scard">⚡<b>${wk}</b>XP this week</div></div></section>${questsHTML()}
  <section class="rcard promo"><b>💼 Interview coming up?</b><small>Run a timed mock screen and get a hire/no-hire scorecard.</small><button class="btn sm" data-go="interview">Practice now</button></section></aside>`}
function shell(inner,{nav=true}={}){regen();document.querySelectorAll('.conf').forEach(c=>c.remove());app.className=nav?'withnav':'';app.innerHTML=topbar()+`<main id="main" class="fade">${/<h1[\s>]/.test(inner)?'':`<h1 class="sr">ByteRyte · ${({learn:'Learn path',practice:'Practice',interview:'Mock interview',shop:'Gem shop',profile:'Profile',settings:'Settings'})[cur]||'Home'}</h1>`}${inner}</main>`+(nav?rail():'')+(nav?`<nav class="bnav" aria-label="Main">${NAV.map(([id,ic,l])=>`<button data-go="${id}" class="${cur===id?'on':''}" ${cur===id?'aria-current="page"':''}><span aria-hidden="true">${ic}</span>${l}</button>`).join('')}</nav>`:'');
  $$('[data-go]').forEach(b=>b.onclick=()=>{if(!once(b))return;go(b.dataset.go)});window.scrollTo(0,0)}
function show(v){cur=v;({learn:home,practice,interview:ivHome,shop,profile,settings}[v]||home)()}
let histLock=false,navLock=false;
function histPush(state){
  if(histLock)return;
  const c=history.state;
  if(c&&c.br===1&&c.screen===state.screen&&c.ui===state.ui&&c.track===state.track&&c.back===state.back&&!!c.fresh===!!state.fresh)return;
  try{history.pushState(Object.assign({br:1},state),'')}catch(e){}
}
function navBack(fallback){
  if(navLock)return;navLock=true;queueMicrotask(()=>{navLock=false});
  if(history.state&&history.state.br===1){history.back();return}
  (fallback||home)();
}
function land(v){try{history.replaceState({br:1,screen:v},'')}catch(e){}show(v)}
function go(v){histPush({screen:v});show(v)}
function restore(s){
  if(!s||s.br!==1){show('learn');return}
  if(s.screen==='guide'){const t=T(s.track);if(t&&t.units[+s.ui||0])return guide(t,+s.ui||0);return show('learn')}
  if(s.screen==='recap')return recap();
  if(s.screen==='edit')return editProfile(!!s.fresh);
  if(s.screen==='session'){try{history.replaceState({br:1,screen:s.back||'learn'},'')}catch(e){}return show(s.back||'learn')}
  if(s.screen==='hearts')return outOfHearts();
  show(s.screen||'learn');
}
function onPop(ev){
  clearInterval(timerId);clearInterval(heartWatch);R=null;
  const s=ev.state;
  if(!s||s.br!==1){
    const screen=(cur==='guide'||cur==='edit')?'learn':(cur||'learn');
    histLock=true;try{history.pushState({br:1,screen},'')}catch(e){}histLock=false;show(screen);return}
  histLock=true;restore(s);histLock=false;
}
function armHistory(){
  try{
    const screen=S&&S.onboarded?'learn':'edit';
    const state={br:1,screen};if(screen==='edit')state.fresh=true;
    history.replaceState({br:0,screen:'sentinel'},'');
    history.pushState(state,'');
  }catch(e){}
}
// ---------- learn ----------
function quizBlocks(t,ui){if(!t||S.unlockAll)return false;for(let i=0;i<ui;i++){const q=t.units[i].quiz;if(q&&!S.done[q.id])return true}return false}
function home(){
  cur='learn';daily();const t=T(S.track),ls=lessons(t),locked=t.parent&&!trackOpen(t),firstOpen=ls.findIndex(x=>!S.done[x.key]),gp=Math.min(100,(S.xpLog[today()]||0)/S.goal*100);
  let h=`<section class="goalcard"><div class="row"><b>Daily goal</b><span>${S.xpLog[today()]||0} / ${S.goal} XP</span></div><div class="bar"><i style="width:${gp}%"></i></div>${S.last===yday()&&!(S.xpLog[today()])?`<div class="pill warn">🔥 Keep your ${S.streak}-day streak alive — do one lesson today!</div>`:''}${S.freezes?`<div class="pill">🧊 ${S.freezes} streak freeze${S.freezes>1?'s':''} ready</div>`:''}${dblOn()?`<div class="pill">⚡ Double XP active · ${Math.ceil((S.doubleUntil-Date.now())/60000)} min left</div>`:''}</section>
  <button class="qchip" data-go="practice">🗓 Daily quests <b>${quests().filter(q=>q.done).length}/3</b><span>›</span></button>
  <div class="tabs" role="tablist">`;
  TRACKS.forEach(x=>{const d=lessons(x).filter(y=>S.done[y.key]).length,n=lessons(x).length;
    h+=`<button role="tab" aria-selected="${x.id===S.track}" class="tab ${x.id===S.track?'on':''}" data-t="${x.id}" style="--c:${x.color}">${x.icon} ${x.name}<small>${x.primary?'Main path':x.parent?'↳ Java branch':'Secondary'} · ${d}/${n}</small></button>`});
  h+=`</div>`;
  if(locked)h+=`<div class="branchbox">🔒 ${t.id==='javafx'?'JavaFX is a separate OpenJFX library. Finish <b>Java through Exceptions</b> (classes, references, inheritance, interfaces) so the scene graph has something to stand on.':'HTML &amp; CSS unlocks after <b>types, strings, control flow, methods, and arrays</b>. You do not need classes for it.'}</div>`;
  t.units.forEach((u,ui)=>{const ud=u.lessons.filter(l=>S.done[l.id]).length,blocked=quizBlocks(t,ui);
    h+=`<div class="unit" style="--c:${t.color}"><div>${esc(u.name)}<small>${ud}/${u.lessons.length} lessons complete</small></div><div class="uright"><button class="guide" data-u="${ui}" aria-label="📖 Guide, ${esc(u.name)}">📖 Guide</button><div class="ring" style="--p:${ud/u.lessons.length*100}" aria-hidden="true"></div></div></div><div class="path" style="--c:${t.color}">`;
    u.lessons.forEach((l,li)=>{const i=ls.findIndex(x=>x.ui===ui&&x.li===li),k=ls[i].key,open=!locked&&(S.done[k]||(!blocked&&(S.unlockAll||i<=firstOpen||firstOpen<0))),isCur=open&&!S.done[k]&&i===firstOpen&&!blocked;
      const off=[0,48,68,48,0,-48,-68,-48][i%8];
      h+=`<div class="nodewrap ${isCur?'hascur':''}" style="--x:${off}px">${isCur?'<div class="startbub">START</div>':''}<button class="node ${open?'':'lock'} ${S.done[k]?'done':''} ${isCur?'cur':''}" style="--c:${t.color}" data-k="${esc(k)}" ${open?'':'disabled'} aria-label="${esc(l.name)}${S.done[k]?' (complete)':open?'':' (locked)'}">${S.done[k]?'★':open?t.icon:'🔒'}</button><div class="nlab">${esc(l.name)}</div></div>`});
    if(u.quiz){const q=u.quiz,lessonsDone=u.lessons.every(l=>S.done[l.id]),qOpen=!locked&&(S.unlockAll||(lessonsDone&&!blocked)),qDone=!!S.done[q.id],qCur=qOpen&&!qDone&&lessonsDone&&!blocked,off=[0,48,68,48,0,-48,-68,-48][u.lessons.length%8];
      h+=`<div class="nodewrap ${qCur?'hascur':''}" style="--x:${off}px">${qCur?'<div class="startbub">START</div>':''}<button class="node ${qOpen?'':'lock'} ${qDone?'done':''} ${qCur?'cur':''}" style="--c:${t.color}" data-quiz="1" data-ui="${ui}" ${qOpen?'':'disabled'} aria-label="Unit check${qDone?' (complete)':qOpen?'':' (locked)'}">${qDone?'★':qOpen?'✓':'🔒'}</button><div class="nlab">Unit check</div></div>`}
    h+=`</div>`});
  if(t.id==='java')h+=`<div class="branchbox">🌿 <b>HTML &amp; CSS</b> ${trackOpen(T('css'))?'is open.':'opens after types through arrays.'} <b>JavaFX</b> (OpenJFX 21+, not part of the JDK) ${trackOpen(T('javafx'))?'is open.':'opens after object-oriented Java.'} Switch tabs above once a branch is open.</div>`;
  h+=`<p class="note">Java print answers were run on JDK 21. Swift print answers and Swift Essentials typed answers were run on Swift 6.0.3. Concepts checked against Oracle, OpenJFX, MDN, and Swift.org. Gems stay in the app.</p>`;
  shell(h);
  $$('.tab').forEach(b=>b.onclick=()=>{if(!once(b))return;S.track=b.dataset.t;save();home()});
  $$('.node:not(.lock)').forEach(b=>b.onclick=()=>{if(!once(b))return;if(b.dataset.quiz){const u=t.units[+b.dataset.ui],q=u.quiz;start(q.ex.map((e,i)=>({e,k:`${q.id}~${i}`})),{key:q.id,name:q.name,mode:'quiz',pass:q.pass});return}const L=lessonOf(b.dataset.k);start(L.ex.map((e,i)=>({e,k:`${b.dataset.k}~${i}`})),{key:b.dataset.k,name:L.name,tip:L.tip,sheet:L.sheet,mode:'lesson'})});
  $$('.guide').forEach(b=>b.onclick=()=>{if(!once(b))return;guide(t,+b.dataset.u)});
  $('.node.cur')?.scrollIntoView({block:'center'});
}
function guide(t,ui){daily();histPush({screen:'guide',track:t.id,ui});const u=t.units[ui];
  shell(`<button class="link" id="bk">‹ Back to path</button><h1 class="h1">📖 ${esc(u.name)}</h1><p class="muted">Key ideas for every lesson in this unit — read before you start, or come back to refresh.</p>
  ${u.lessons.map(l=>{const ex=l.ex.find(e=>e.t==='out'&&e.code.split('\n').length<=4);return `<article class="gcard" style="--c:${t.color}"><h2>${t.icon} ${esc(l.name)} ${S.done[l.id]?'<span class="tag">✓ done</span>':''}</h2><p>${esc(l.tip)}</p>${sheetHTML(l.sheet)}${docLink(DOCS[l.name])}${ex?`<div class="gex"><small>Example</small><pre class="code sm" tabindex="0">${hl(ex.code)}</pre><small>Prints: <code>${esc(ex.opts[ex.a])}</code></small></div>`:''}</article>`}).join('')}`);
  $('#bk').onclick=()=>{if(!once($('#bk')))return;navBack(home)}}
// ---------- practice ----------
function practice(){cur='practice';daily();const dn=due().length;
  const weak=Object.entries(S.misses).filter(([k])=>lessonOf(k)).sort((a,b)=>b[1]-a[1]).slice(0,4);
  let h=`<h1 class="h1">Practice</h1><div class="mobonly">${questsHTML()}</div>
  <button class="pcard" id="rev" ${dn?'':'disabled'}><span class="pic">🔁</span><span><b>Review mistakes</b><small>${dn?`${plural(dn,'question')} due. They come back on a schedule.`:'Nothing due yet. Miss a question in a lesson and it comes back here.'}</small></span></button>
  <button class="pcard" id="chal"><span class="pic">⏱️</span><span><b>Speed challenge</b><small>60 seconds, as many as you can. Best: ${S.stats.bestChal||0}</small></span></button>
  <button class="pcard" id="svd" ${savedKeys().length?'':'disabled'}><span class="pic">★</span><span><b>Saved questions</b><small>${savedKeys().length?`${plural(savedKeys().length,'saved question')} · no hearts needed`:'None yet. After you answer, tap Save question to keep it here.'}</small></span></button>
  <h2 class="h2">Weak spots</h2>`;
  h+=weak.length?weak.map(([k,n])=>{const f=findLesson(k);return `<button class="pcard weak" data-k="${esc(k)}"><span class="pic">${f.t.icon}</span><span><b>${esc(f.l.name)}</b><small>${plural(n,'miss','misses')} · ${f.t.name}</small></span></button>`}).join(''):'<div class="empty"><span aria-hidden="true">🌱</span><p>No weak spots yet. Miss a question and that lesson will show up here.</p></div>';
  if(savedKeys().length)h+=`<h2 class="h2">Saved · ${savedKeys().length}</h2><ul class="svlist">${savedKeys().map(k=>{const e=exByKey(k),src=k.startsWith('iv-')?'Interview · '+e.tag:(lessonOf(k.split('~')[0])?.name||(quizEx(k)?'Unit check':''));return `<li><span><b>${esc((e.q||(e.t==='out'?'What does this print?':'Question')).slice(0,90))}</b><small>${esc(src||'')}</small></span><button class="link unsv" data-k="${esc(k)}" aria-label="Remove from saved">Remove</button></li>`}).join('')}</ul>`;
  shell(h);
  $('#svd').onclick=()=>{if(!once($('#svd')))return;const ks=savedKeys();if(ks.length)start(shuffle(ks).map(k=>({e:exByKey(k),k})),{name:'Saved questions',mode:'saved'})};
  $$('.unsv').forEach(b=>b.onclick=()=>{if(!once(b))return;delete S.saved[b.dataset.k];save();practice()});
  $('#rev').onclick=()=>{if(!once($('#rev')))return;const d=shuffle(due()).slice(0,10);if(d.length)start(d.map(k=>({e:exByKey(k),k})),{name:'Review',mode:'review'})};
  $('#chal').onclick=()=>{if(!once($('#chal')))return;const pool=[];TRACKS.forEach(t=>lessons(t).forEach(x=>{if(S.done[x.key]||S.unlockAll||t.id==='java'&&x.u.uid==='foundations')x.l.ex.forEach((e,i)=>{if(e.t!=='ar'&&e.t!=='type')pool.push({e,k:`${x.key}~${i}`})})}));start(shuffle(pool),{name:'Speed challenge',mode:'challenge',secs:60})};
  $$('.weak').forEach(b=>b.onclick=()=>{if(!once(b))return;const L=lessonOf(b.dataset.k);start(shuffle(L.ex.map((e,i)=>({e,k:`${b.dataset.k}~${i}`}))),{name:'Practice: '+L.name,mode:'practice',pk:b.dataset.k})});
}
// ---------- interview ----------
function ivHome(){cur='interview';daily();
  const tags=[...new Set(IV.map(q=>q.tag))];
  shell(`<h1 class="h1">Mock Interview</h1><p class="muted">A timed screen. No hearts are lost, and you get a scorecard at the end. Most questions are Java. A few cover JavaFX, CSS, and Swift.</p>
  <div class="ivgrid">${[['Quick screen',8,6],['Standard',12,10],['Full loop',18,15]].map(([n,q,m])=>`<button class="pcard ivs" data-q="${q}" data-m="${m}"><span class="pic">💼</span><span><b>${n}</b><small>${q} questions · ${m} min</small></span></button>`).join('')}</div>
  <h2 class="h2">Drill one topic</h2><p class="muted sm">Focus round: every question from one topic, 1 minute per question.</p><div class="chips">${tags.map(t=>`<button class="tag tbtn" data-tag="${esc(t)}">${t} · ${IV.filter(q=>q.tag===t).length}</button>`).join('')}</div>
  <p class="muted">Best score: <b>${S.stats.bestIv||0}%</b> · Interviews done: <b>${S.stats.interviews}</b></p>`);
  $$('.ivs').forEach(b=>b.onclick=()=>{if(!once(b))return;const java=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.track==='java')),oth=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.track!=='java'));const q=+b.dataset.q,no=Math.max(2,Math.round(q*.25));
    start(shuffle(java.slice(0,q-no).concat(oth.slice(0,no))),{name:'Mock Interview',mode:'interview',secs:+b.dataset.m*60})});
  $$('.tbtn').forEach(b=>b.onclick=()=>{if(!once(b))return;const qs=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.tag===b.dataset.tag));start(qs,{name:'Topic drill: '+b.dataset.tag,mode:'interview',secs:qs.length*60})});
}
// ---------- shop ----------
const ITEMS=[['hearts','❤️','Heart refill','Restore all 5 hearts now (otherwise +1 every 30 min, full at midnight)',30,()=>S.hearts<5,()=>{S.hearts=5;S.heartAt=null}],
['freeze','🧊','Streak freeze','Protects your streak for one missed day (max 2)',50,()=>S.freezes<2,()=>{S.freezes++}],
['fifty','✂️','50/50 hint ×3','Remove two wrong answers on a question',20,()=>true,()=>{S.inv.fifty=(S.inv.fifty||0)+3}],
['skip','⏭️','Skip question ×2','Skip a hard question without losing a heart',25,()=>true,()=>{S.inv.skip=(S.inv.skip||0)+2}],
['double','⚡','Double XP (15 min)','Adds 15 minutes. A lesson you start while it is active earns 2× XP',40,()=>true,()=>{S.doubleUntil=Math.max(Date.now(),S.doubleUntil)+15*60000}]];
function shop(){cur='shop';daily();
  shell(`<h1 class="h1">Gem Shop</h1><div class="wallet" aria-label="${S.gems} gems"><span>💎</span><div><b>${compact(S.gems)}</b><small>gems · earned from lessons, goals, streaks and interviews. Just for fun: no real money involved.</small></div></div>
  <div class="inv">Your stuff: ✂️ ${S.inv.fifty||0} · ⏭️ ${S.inv.skip||0} · 🧊 ${S.freezes}/2 ${dblOn()?'· ⚡ active':''}</div>
  ${ITEMS.map(([id,ic,n,d,c,ok])=>{const ready=ok()&&S.gems>=c;const label=!ok()?(id==='hearts'?'Full':'Max'):S.gems<c?`Need ${c-S.gems}`:`💎 ${c}`;return `<div class="sitem"><span class="pic">${ic}</span><div><b>${n}</b><small>${d}</small></div><button class="btn sm buy" data-id="${id}" ${ready?'':'disabled'} aria-label="${esc(n)}: ${label}">${label}</button></div>`}).join('')}
  <h2 class="h2">How to earn gems</h2><ul class="muted earn"><li>Finish a lesson: +5 (perfect lesson: +10)</li><li>Pass a unit check the first time: +5</li><li>Hit your daily goal: +10</li><li>Every 7-day streak: +20</li><li>Level up: +20</li><li>Daily quest: +15</li><li>All 3 quests: +25</li><li>Mock interview: +2 per correct answer</li><li>Speed challenge: +1 per correct answer</li></ul>`);
  $$('.buy').forEach(b=>b.onclick=()=>{const it=ITEMS.find(x=>x[0]===b.dataset.id);const now=Date.now();if(!it||S.gems<it[4]||!it[5]()||now-(buyAt[it[0]]||0)<400)return;buyAt[it[0]]=now;S.gems-=it[4];it[6]();S.stats.bought=(S.stats.bought||0)+1;sfx.coin();buzz(20);toast(`${it[1]} ${it[2]} purchased!`);checkBadges();save();shop()})}
// ---------- profile ----------
const buyAt={},tapLock={};let addLock=false;
function profile(){cur='profile';daily();
  const days=[...Array(7)].map((_,i)=>shiftDay(-(6-i))),mx=Math.max(S.goal,...days.map(d=>S.xpLog[d]||0));
  const week=d=>[...Array(7)].reduce((a,_,i)=>a+(S.xpLog[shiftDay(-(i+d))]||0),0),tw=week(0),lw=week(7);
  const dow=new Date().getDay(),cal=[...Array(35)].map((_,i)=>{const off=dow+28-i;return off<0?null:shiftDay(-off)}).slice(0);const lv=level();
  const acc=S.stats.answered?Math.round(S.stats.correct/S.stats.answered*100):0;
  const others=Object.values(P.list).filter(p=>p.id!==S.id);
  shell(`<section class="phead"><button class="avatar big" id="edit" aria-label="Change ${esc(S.name)}'s avatar">${esc(S.avatar)}</button><div><h1 class="h1" style="margin:0">${esc(S.name)}</h1><small class="muted">Joined ${new Date(S.created).toLocaleDateString()}</small><br><button class="link" id="edit2">Edit profile</button></div></section>
  <div class="lvl"><div class="row"><b>Level ${lv.L}</b><small class="muted">${lv.need-lv.into} XP to level ${lv.L+1}</small></div><div class="bar"><i style="width:${lv.into/lv.need*100}%"></i></div></div>
  <div class="sgrid"><div class="scard">🔥<b>${S.streak}</b>Day streak</div><div class="scard">🏆<b>${S.best}</b>Best streak</div><div class="scard">⚡<b>${S.xp}</b>Total XP</div><div class="scard">💎<b>${S.gems}</b>Gems</div><div class="scard">📚<b>${S.stats.lessons}</b>Lessons</div><div class="scard">🎯<b>${acc}%</b>Accuracy</div></div>
  <button class="pcard" id="recap"><span class="pic">📅</span><span><b>Weekly recap</b><small>Your last 7 days at a glance</small></span></button>
  <h2 class="h2">XP this week</h2><div class="chart" role="img" aria-label="XP for the last 7 days">${days.map(d=>`<div class="col"><span class="v">${S.xpLog[d]||0}</span><div class="b ${(S.xpLog[d]||0)>=S.goal?'met':''}" style="height:${(S.xpLog[d]||0)/mx*100}%"></div><span>${new Date(d+'T12:00').toLocaleDateString(undefined,{weekday:'narrow'})}</span></div>`).join('')}<div class="goalline" style="bottom:calc(${S.goal/mx*100}% * .78 + 22px)"></div></div>
  <div class="league"><b>Weekly league: you vs. last week</b><div class="row"><span>This week</span><b>${tw} XP</b></div><div class="row"><span>Last week</span><b>${lw} XP</b></div><div class="pill ${tw>=lw?'up':''}">${tw>lw?'📈 Promoted pace! Beat last week by '+(tw-lw)+' XP':tw===lw?'Tied with last week':'📉 '+(lw-tw)+' XP to beat last week'}</div></div>
  <h2 class="h2">Streak calendar</h2><div class="cal" role="img" aria-label="Activity calendar, last 5 weeks, Sunday through Saturday">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(x=>`<span>${x}</span>`).join('')}${cal.map(d=>{if(!d)return '<i class="fut"></i>';const v=S.xpLog[d]||0;return `<i title="${d}: ${v} XP" class="l${v?v>=S.goal?3:v>=S.goal/2?2:1:0} ${d===today()?'today':''}"></i>`}).join('')}</div><div class="legend">Less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> More · goal met = darkest</div>
  <h2 class="h2">Achievements · ${Object.keys(S.badges).length}/${BADGES.length}</h2><div class="badges" role="list">${BADGES.map(([id,ic,n,d,,pr])=>{const got=S.badges[id],pv=!got&&pr?pr():null;return `<div class="badge ${got?'got':''}" role="listitem" aria-label="${esc(n)}: ${esc(d)}. ${got?'Unlocked':'Locked'+(pv?`, ${Math.min(pv[0],pv[1])} of ${pv[1]}`:'')}"><span aria-hidden="true">${got?ic:'🔒'}</span><b>${n}</b><small>${d}</small>${got?`<small class="bdate">✓ ${got>1e12?new Date(got).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Unlocked'}</small>`:pv?`<div class="bprog" aria-hidden="true"><i style="width:${Math.min(100,pv[0]/pv[1]*100)}%"></i></div><small class="bdate">${Math.min(pv[0],pv[1])}/${pv[1]}</small>`:''}</div>`}).join('')}</div>
  <h2 class="h2">Profiles on this device</h2>${others.map(p=>`<div class="sitem"><span class="pic">${esc(p.avatar)}</span><div><b>${esc(p.name)}</b><small>${p.xp} XP · 🔥 ${p.streak}</small></div><button class="btn sm alt sw" data-id="${esc(p.id)}" aria-label="Switch to ${esc(p.name)}">Switch</button></div>`).join('')}
  <button class="btn alt" id="addp">＋ Add profile</button>`);
  $('#edit').onclick=$('#edit2').onclick=()=>{if(!once($('#edit2')))return;editProfile(false)};$('#recap').onclick=()=>{if(!once($('#recap')))return;recap()};
  $('#addp').onclick=()=>{if(addLock)return;addLock=true;queueMicrotask(()=>{addLock=false});const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p;save();onboard()};
  $$('.sw').forEach(b=>b.onclick=()=>{if(!once(b))return;P.active=b.dataset.id;S=P.list[P.active];save();daily();toast(`Switched to ${S.name}`);land('learn')});
}
function recap(){cur='profile';daily();histPush({screen:'recap'});
  const ds=[...Array(7)].map((_,i)=>shiftDay(-(6-i))),xp=d=>S.xpLog[d]||0,tw=ds.reduce((a,d)=>a+xp(d),0),lw=[...Array(7)].reduce((a,_,i)=>a+xp(shiftDay(-(i+7))),0);
  const act=ds.filter(d=>xp(d)>0).length,best=ds.reduce((b,d)=>xp(d)>xp(b)?d:b,ds[6]),dl7=ds.map(d=>(S.dlog||{})[d]||{l:0,a:0,c:0}),les=dl7.reduce((a,x)=>a+x.l,0),ans=dl7.reduce((a,x)=>a+x.a,0),cor=dl7.reduce((a,x)=>a+x.c,0);
  const wkStart=Date.now()-7*DAY,nb=BADGES.filter(([id])=>S.badges[id]>1e12&&S.badges[id]>wkStart),goals=ds.filter(d=>xp(d)>=S.goal).length,dn=due().length;
  const weak=Object.entries(S.misses).filter(([k])=>lessonOf(k)).sort((a,b)=>b[1]-a[1])[0];
  const msg=!tw?'A fresh week starts with one lesson. Five minutes today keeps the streak alive.':tw>lw?`You beat last week by ${tw-lw} XP. Keep that pace.`:tw===lw?'Same XP as last week: steady wins.':`${lw-tw} XP behind last week, and there is still time to catch up.`;
  shell(`<button class="link" id="bk">‹ Back to profile</button><h1 class="h1">📅 Weekly recap</h1><p class="muted">${new Date(ds[0]+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${new Date(ds[6]+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>
  <div class="rhero"><b>${tw}</b><span>XP this week</span><p>${msg}</p></div>
  <div class="sgrid"><div class="scard">📆<b>${act}/7</b>Active days</div><div class="scard">🎯<b>${goals}</b>Goals hit</div><div class="scard">📚<b>${les}</b>Lessons</div><div class="scard">✅<b>${ans?Math.round(cor/ans*100)+'%':'—'}</b>Accuracy</div><div class="scard">🔥<b>${S.streak}</b>Streak</div><div class="scard">🏅<b>${nb.length}</b>New badges</div></div>
  <h2 class="h2">Highlights</h2><ul class="hl">${tw?`<li>🌟 Best day: <b>${new Date(best+'T12:00').toLocaleDateString(undefined,{weekday:'long'})}</b> with ${xp(best)} XP</li>`:''}${nb.map(([,ic,n])=>`<li>${ic} Unlocked <b>${n}</b></li>`).join('')}<li>${tw>=lw?'📈':'📉'} Last week: ${lw} XP</li>${weak?`<li>🎯 Most-missed topic: <b>${esc(lessonOf(weak[0]).name)}</b></li>`:''}</ul>
  <h2 class="h2">Next week</h2>${dn?`<button class="pcard" id="rr"><span class="pic">🔁</span><span><b>Clear your review queue</b><small>${plural(dn,'question')} due</small></span></button>`:'<div class="empty"><span aria-hidden="true">✅</span><p>No review is waiting. A missed question will land here when it is due.</p></div>'}<button class="pcard" id="gl"><span class="pic">🌱</span><span><b>Continue learning</b><small>Pick up where you left off</small></span></button>`);
  $('#bk').onclick=()=>{if(!once($('#bk')))return;navBack(profile)};$('#gl').onclick=()=>{if(!once($('#gl')))return;go('learn')};$('#rr')&&($('#rr').onclick=()=>{if(!once($('#rr')))return;go('practice')})}
function editProfile(isNew){let av=S.avatar;histPush({screen:'edit',fresh:!!isNew});
  app.className='';app.innerHTML=`<main class="fade onb"><h1 class="h1">${isNew?'Welcome to ByteRyte 🌱':'Edit profile'}</h1>${isNew?'<p class="muted">Learn the fundamentals behind the code you ship — Java first, with JavaFX, HTML/CSS and Swift branches.</p>':''}
  <label class="lbl" for="nm">Your name</label><input id="nm" class="inp" maxlength="24" value="${esc(S.name==='Learner'&&isNew?'':S.name)}" placeholder="e.g. Alex" autocomplete="nickname">
  <div class="lbl">Pick an avatar</div><div class="avs" role="radiogroup" aria-label="Pick an avatar">${AVATARS.map((a,i)=>`<button role="radio" aria-checked="${a===av}" aria-label="${AVATAR_NAMES[i]} avatar" class="avatar ${a===av?'on':''}" data-a="${a}">${a}</button>`).join('')}</div>
  <div class="lbl">Daily goal</div><div class="goals">${[[10,'Casual'],[30,'Regular'],[50,'Serious'],[100,'Intense']].map(([g,n])=>`<button class="opt goal ${S.goal===g?'sel':''}" data-g="${g}"><b>${n}</b> · ${g} XP/day</button>`).join('')}</div>
  ${isNew?`<button class="btn" id="sv">Start from scratch</button><button class="btn alt" id="pl" style="margin-top:12px">Take placement test (skip the Java language drill)</button>`:`<button class="btn" id="sv">Save</button>${Object.keys(P.list).length>1?'<button class="btn red" id="del" style="margin-top:12px">Delete this profile</button>':''}<button class="btn alt" id="cx" style="margin-top:12px">Cancel</button>`}</main>`;
  $$('.avs .avatar').forEach(b=>b.onclick=()=>{av=b.dataset.a;$$('.avs .avatar').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)})});
  let goal=S.goal;
  $$('.goal').forEach(b=>b.onclick=()=>{goal=+b.dataset.g;$$('.goal').forEach(x=>x.classList.toggle('sel',x.dataset.g===String(goal)))});
  const commit=()=>{S.name=($('#nm').value.trim()||'Learner').slice(0,24);S.avatar=av;S.goal=goal;S.onboarded=true;save()};
  $('#sv').onclick=()=>{if(!once($('#sv')))return;commit();if(isNew)land('learn');else navBack(profile)};
  $('#cx')&&($('#cx').onclick=()=>{if(!once($('#cx')))return;navBack(profile)});
  $('#pl')&&($('#pl').onclick=()=>{if(!once($('#pl')))return;commit();try{history.replaceState({br:1,screen:'learn'},'')}catch(e){}cur='learn';const pool=[];lessons(T('java')).filter(x=>DRILL.includes(x.key)).forEach(x=>{const e=x.l.ex.filter(e=>e.t!=='ar');pool.push(...shuffle(e).slice(0,2).map((e)=>({e,k:x.key+'~'+x.l.ex.indexOf(e)})))});start(pool,{name:'Placement test',mode:'placement'})});
  $('#del')&&($('#del').onclick=()=>{if(!once($('#del')))return;if(!confirm(`Delete ${S.name}'s profile? This cannot be undone.`))return;delete P.list[S.id];P.active=Object.keys(P.list)[0];S=P.list[P.active];save();land('learn')});
}
const onboard=()=>editProfile(true);
// ---------- settings ----------
function settings(){cur='settings';daily();
  shell(`<h1 class="h1">Settings</h1>
  <div class="set"><b id="appear">Appearance</b><div class="seg" role="radiogroup" aria-labelledby="appear">${['system','light','dark'].map(t=>`<button role="radio" aria-checked="${G.theme===t}" class="${G.theme===t?'on':''}" data-th="${t}">${{system:'🖥 System',light:'☀️ Light',dark:'🌙 Dark'}[t]}</button>`).join('')}</div></div>
  <div class="set row"><b>Sound effects</b><button class="switch ${G.sound?'on':''}" id="snd" role="switch" aria-checked="${G.sound}" aria-label="Sound effects"><i></i></button></div>
  <div class="set row"><div><b>Ask Rytia why</b><p class="muted" style="margin:2px 0 0">After a wrong answer, a button can open a short note</p></div><button class="switch ${G.rytia?'on':''}" id="ry" role="switch" aria-checked="${G.rytia}" aria-label="Ask Rytia why"><i></i></button></div>
  <div class="set row"><div><b>Larger text</b><p class="muted" style="margin:2px 0 0">Bigger type and buttons for readability</p></div><button class="switch ${G.big?'on':''}" id="big" role="switch" aria-checked="${G.big}" aria-label="Larger text"><i></i></button></div>
  <div class="set row"><b>Unlock all lessons</b><button class="switch ${S.unlockAll?'on':''}" id="ua" role="switch" aria-checked="${S.unlockAll}" aria-label="Unlock all lessons"><i></i></button></div>
  <div class="set"><b>Daily goal</b><div class="seg" role="radiogroup" aria-label="Daily goal">${[10,30,50,100].map(g=>`<button role="radio" aria-checked="${S.goal===g}" class="${S.goal===g?'on':''}" data-g="${g}">${g} XP</button>`).join('')}</div></div>
  <div class="set"><b>Backup</b><p class="muted">Export all profiles to a JSON file, or import one to move progress to another device.</p><div class="row2"><button class="btn sm alt" id="exp">⬇️ Export</button><label class="btn sm alt" for="imp">⬆️ Import</label><input type="file" id="imp" accept="application/json" hidden></div></div>
  <div class="set"><b>Keyboard shortcuts (desktop)</b><p class="muted">1–9 choose an answer (or a code line in Arrange) · Backspace undo last line · Enter check / continue · H 50/50 · S skip · Esc quit</p></div>
  <div class="set"><b>Danger zone</b><button class="btn sm red" id="rs">Reset ${esc(S.name)}'s progress</button></div>
  <p class="note">ByteRyte · original app, not affiliated with any other language-learning brand. All data stays on this device.</p>`);
  $$('[data-th]').forEach(b=>b.onclick=()=>{if(!tap('theme-'+b.dataset.th))return;G.theme=b.dataset.th;saveG();applyTheme();settings()});
  $('#snd').onclick=()=>{if(!tap('sound'))return;G.sound=!G.sound;saveG();settings()};
  $('#ry').onclick=()=>{if(!tap('rytia'))return;G.rytia=!G.rytia;saveG();settings()};
  $('#big').onclick=()=>{if(!tap('big'))return;G.big=!G.big;saveG();applyTheme();settings()};
  $('#ua').onclick=()=>{if(!tap('unlock'))return;S.unlockAll=!S.unlockAll;save();settings()};
  $$('[data-g]').forEach(b=>b.onclick=()=>{if(!tap('goal'))return;S.goal=+b.dataset.g;save();settings()});
  $('#exp').onclick=()=>{const blob=new Blob([JSON.stringify({app:'ByteRyte',v:2,profiles:P,settings:G},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`byteroots-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
  $('#imp').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o);if((d.app!=='ByteRyte'&&d.app!=='ByteRoots')||!plain(d.profiles)||!plain(d.profiles.list))throw 0;if(!confirm('Replace all profiles on this device with this backup?'))return;P=d.profiles;if(plain(d.settings)){G=ownCopy({theme:'system',sound:true,big:false,rytia:true},d.settings);saveG();applyTheme()}hydrate();Object.keys(P.list).forEach(id=>{if(P.list[id])P.list[id].gen=(P.list[id].gen||0)+1});rememberAll();if(!S){const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p}const prev=readStore(PK);P.rev=Math.max(P.rev||0,prev&&prev.rev||0);save();daily();toast('✅ Progress imported');land('learn')}catch(_){toast('⚠️ That file is not a ByteRyte backup')}})};
  $('#rs').onclick=()=>{if(confirm('Reset all progress for this profile?')){const n=NEWP(S.name,S.avatar);n.id=S.id;n.created=S.created;n.onboarded=true;n.gen=(S.gen||0)+1;S=n;save();land('learn')}};
}
// ---------- lesson engine ----------
let R,timerId,heartWatch;
function once(el){if(!el)return false;const n=Date.now();if(el.__t&&n-el.__t<450)return false;el.__t=n;return true}
function tap(id){if(tapLock[id])return false;tapLock[id]=true;queueMicrotask(()=>{tapLock[id]=false});return true}
function armSessionWatch(){
  clearInterval(heartWatch);
  heartWatch=setInterval(()=>{
    if(!R){clearInterval(heartWatch);return}
    if(!heartsDue())return;
    daily();
    const hs=$('#hs');if(hs)hs.textContent='❤️ '+S.hearts;
  },1000);
}
function start(items,opt){
  clearInterval(timerId);clearInterval(heartWatch);daily();if((opt.mode==='lesson'||opt.mode==='practice'||opt.mode==='quiz')&&S.hearts<=0){histPush({screen:'hearts'});return outOfHearts()}
  R=Object.assign({q:items.slice(),total:items.length,done:0,correct:0,mist:new Set(),res:[],t0:Date.now(),quizItems:opt.mode==='quiz'?items.slice():null},opt);
  armSessionWatch();
  histPush({screen:'session',back:cur});
  if(R.mode==='challenge'||R.mode==='interview'){R.end=Date.now()+R.secs*1000;timerId=setInterval(tick,250)}
  app.className='';if(R.tip){app.innerHTML=`<header class="lhead"><button class="x" id="x" aria-label="Quit">✕</button><div class="bar"><i style="width:0"></i></div></header><main class="fade"><div class="kind">💡 Before you start</div><h1 class="h1">${esc(R.name)}</h1><div class="tip">${esc(R.tip)}</div>${sheetHTML(R.sheet)}<p class="muted">${R.total} exercises · mistakes come back at the end and in Review.</p></main><footer class="foot"><div class="in"><button class="btn" id="go">Start lesson</button></div></footer>`;
    $('#x').onclick=()=>{clearInterval(timerId);R=null;navBack(home)};$('#go').onclick=()=>{if(!once($('#go')))return;next()};$('#go').focus()}else next();
}
function tick(){const left=Math.max(0,R.end-Date.now()),el=$('#tmr');if(el){el.textContent=`⏱ ${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`;el.classList.toggle('warn',left<10000)}if(!left){clearInterval(timerId);finish(true)}}
const timed=()=>R.mode==='challenge'||R.mode==='interview',noHearts=()=>R.mode==='saved'||R.mode==='interview'||R.mode==='challenge'||R.mode==='placement'||R.mode==='review';
function next(){
  daily();
  if(!R.q.length)return finish();
  const {e}=R.q[0],tr=e.tag?`<span class="tag">${e.tag}</span>`:'';let sel=null;
  const pct=timed()?R.done/Math.max(R.done+1,R.mode==='challenge'?R.done+1:R.total)*100:R.done/R.total*100;
  let h=`<header class="lhead"><button class="x" id="x" aria-label="Quit">✕</button><div class="bar" role="progressbar" aria-label="Lesson progress" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>${R.mode==='challenge'?`<span class="stat" aria-live="polite">✅ ${R.correct}</span>`:''}${timed()?`<span class="stat tmr" id="tmr">⏱</span>`:noHearts()?`<span class="stat">${R.done}/${R.total}</span>`:`<span class="stat" id="hs">❤️ ${S.hearts}</span>`}</header>
  <main class="fade qmain"><div class="kind">${NAMES[e.t]} ${tr}${boosted()?'<span class="tag gold">2× XP</span>':''}</div><h1 class="q" id="prompt">${esc(e.q||'What does this print?')}</h1>`;
  if(e.code)h+=`<pre class="code" tabindex="0" aria-label="Code">${hl(e.code)}</pre>`;
  if(e.t==='fix')h+=`<p class="fixnote">Pick the line that makes this correct.</p>`;
  if(e.t==='ar')h+=`<div class="zone" id="ans" aria-label="Your answer"><span class="ph">Tap lines below in the right order</span></div><div class="zone bank" id="bank"></div>`;
  else if(e.t==='type'){const hint=e.grade==='strict'?'Match the spacing. A semicolon is not accepted here.':e.grade==='space'?'Extra spaces are fine. A semicolon is not accepted here.':'Extra spaces are fine, and one trailing semicolon is optional.';
    h+=`<label class="typelab" for="typebox">${esc(hint)}</label><textarea id="typebox" class="typebox" rows="2" spellcheck="false" autocapitalize="none" autocorrect="off" autocomplete="off" enterkeyhint="done" aria-label="Your code"></textarea>`}
  else{const lst=e.t==='bug'?e.lines.map((x,i)=>[x,i]):shuffle(e.opts.map((x,i)=>[x,i]));
    h+=`<div class="opts" role="radiogroup" aria-labelledby="prompt">`+lst.map(([x,i],n)=>`<button role="radio" aria-checked="false" class="opt ${e.t!=='mc'?'code':''}" data-i="${i}"><kbd>${n+1}</kbd>${e.t==='bug'?`<span class="sr">Line ${n+1}. </span>`:''}<span>${e.t==='mc'?esc(x):hl(x)}</span></button>`).join('')+`</div>`}
  const pw=R.mode!=='placement'&&R.mode!=='interview';
  h+=`</main><footer class="foot" id="ft"><div class="in">${pw?`<div class="pups"><button class="pup" id="ff" ${S.inv.fifty&&e.t!=='ar'&&e.t!=='bug'&&e.t!=='type'?'':'disabled'}>✂️ 50/50 <b>${S.inv.fifty||0}</b><span class="sr"> hint, ${S.inv.fifty||0} left</span></button><button class="pup" id="sk" ${S.inv.skip?'':'disabled'}>⏭️ Skip <b>${S.inv.skip||0}</b><span class="sr">, ${S.inv.skip||0} left</span></button></div>`:''}<button class="btn" id="chk" disabled>Check</button></div></footer>`;
  app.className='';app.innerHTML=h;tick&&timed()&&tick();
  $('#x').onclick=quit;
  const chk=$('#chk');
  if(e.t==='ar'){const bank=$('#bank'),ans=$('#ans');
    shuffle(e.lines.map((x,i)=>[x,i])).forEach(([x])=>{const c=document.createElement('button');c.className='chip';c.innerHTML=hl(x);c.dataset.raw=x;c.onclick=()=>{$('.ph')?.remove();(c.parentNode===bank?ans:bank).appendChild(c);chk.disabled=bank.children.length>0;tone(520,.04)};bank.appendChild(c)});
    chk.onclick=()=>{if(!once(chk))return;judge([...ans.children].map(c=>c.dataset.raw).join('\n')===e.lines.join('\n'),e.lines.join('\n'),null)}}
  else if(e.t==='type'){const box=$('#typebox');box.oninput=()=>{chk.disabled=!box.value.trim()};chk.onclick=()=>{if(!once(chk))return;box.readOnly=true;judge(gradeTyped(e,box.value),e.canon,null)}}
  else{$$('.opt').forEach(b=>b.onclick=()=>{if(b.disabled||!once(b))return;$$('.opt').forEach(o=>{o.classList.remove('sel');o.setAttribute('aria-checked','false')});b.classList.add('sel');b.setAttribute('aria-checked','true');sel=+b.dataset.i;chk.disabled=false;tone(520,.04)});
    chk.onclick=()=>{if(!once(chk))return;$$('.opt').forEach(o=>{o.disabled=true;if(+o.dataset.i===e.a)o.classList.add('right');else if(+o.dataset.i===sel)o.classList.add('wrong')});
      judge(sel===e.a,e.t==='bug'?`Line ${e.a+1}: ${e.lines[e.a].trim()}`:e.opts[e.a],sel)}}
  if($('#ff'))$('#ff').onclick=()=>{if(!once($('#ff'))||!S.inv.fifty)return;const wrong=shuffle($$('.opt').filter(o=>+o.dataset.i!==e.a&&!o.disabled)).slice(0,2);wrong.forEach(o=>{o.disabled=true;o.classList.add('gone');o.classList.remove('sel')});let n=1;$$('.opt').forEach(o=>{const kbd=o.querySelector('kbd');if(!kbd)return;kbd.textContent=o.disabled?'':String(n++)});if(wrong.some(o=>+o.dataset.i===sel)){sel=null;chk.disabled=true}S.inv.fifty--;save();$('#ff').disabled=true;$('#ff b').textContent=S.inv.fifty;buzz(12)};
  if($('#sk'))$('#sk').onclick=()=>{if(!once($('#sk')))return;S.inv.skip--;save();R.q.shift();R.done++;R.res.push({e,ok:null});toast('⏭️ Skipped');next()};
}
function shield(ms=450){const ft=$('#ft');if(!ft)return;ft.style.pointerEvents='none';const token=String(Date.now()+Math.random());ft.dataset.shield=token;setTimeout(()=>{if(ft.isConnected&&ft.dataset.shield===token)ft.style.pointerEvents=''},ms)}
function quit(){if(confirm('Quit? Progress in this session will be lost.')){clearInterval(timerId);clearInterval(heartWatch);R=null;navBack(home)}}
const RYTIA_FACE='<svg class="rytia-face" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="29" height="29" rx="10" fill="currentColor"/><circle cx="11" cy="14" r="2" fill="#fff"/><circle cx="21" cy="14" r="2" fill="#fff"/><path d="M11 21.5c1.6 2 8.4 2 10 0" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M23 3.2c1.2 2.2.4 4.4-1.2 5.2 2.4.2 4.2-1.4 4.6-3.6-1.6-.2-2.4-.8-3.4-1.6z" fill="#bbf7d0"/></svg>';
let rytiaP;
function loadRytia(){
  if(window.RYTIA)return Promise.resolve(window.RYTIA);
  if(rytiaP)return rytiaP;
  rytiaP=new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='rytia.js';
    s.onload=()=>{if(window.RYTIA)res(window.RYTIA);else{rytiaP=null;rej(new Error('rytia'))}};
    s.onerror=()=>{s.remove();rytiaP=null;rej(new Error('rytia'))};
    document.head.appendChild(s);
  });
  return rytiaP;
}
function closeRytia(){
  const card=$('#rytia-card'),btn=$('#rytia');
  if(!card||card.hidden)return false;
  card.hidden=true;card.innerHTML='';
  if(btn){btn.setAttribute('aria-expanded','false');btn.dataset.busy='0';btn.focus()}
  return true;
}
function showRytia(btn,row,picked){
  const card=$('#rytia-card');
  if(!btn||!card||!btn.isConnected)return;
  const sum=row&&typeof row.s==='string'&&row.s?row.s:'Rytia\u2019s note is not on this device yet. Use the explanation above.';
  const note=row&&row.n&&picked!==''&&picked!=null&&row.n[String(picked)]?row.n[String(picked)]:'';
  card.innerHTML=`<div class="rytia-top">${RYTIA_FACE}<p id="rytia-name" class="rytia-name">Rytia · your study helper</p><button type="button" class="rytia-x" id="rytia-x" aria-label="Close Rytia">\u2715</button></div><p class="rytia-sum">${esc(sum)}</p>${note?`<p class="rytia-note">${esc(note)}</p>`:''}`;
  card.hidden=false;
  btn.setAttribute('aria-expanded','true');
  btn.dataset.busy='0';
  const x=$('#rytia-x');
  if(x)x.onclick=()=>{closeRytia()};
}
function judge(ok,ans,sel){
  const it=R.q.shift(),{e,k}=it,first=!R.mist.has(k);
  S.stats.answered++;if(ok)S.stats.correct++;{const x=dl();x.a++;if(ok)x.c++}
  R.res.push({e,ok,first});
  if(ok){R.done++;if(first){R.correct++;qBump('correct')}sfx.ok();buzz(15);
    if(S.review[k]&&first){const b=S.review[k].box+1;if(b>3)delete S.review[k];else S.review[k]={box:b,due:Date.now()+[0,1,3,7][b]*DAY}}}
  else{R.mist.add(k);sfx.no();buzz([40,40,60]);S.review[k]={box:0,due:Date.now()};
    if(!k.startsWith('iv')&&R.mode!=='practice'&&R.mode!=='quiz'){const lk=k.split('~')[0];S.misses[lk]=(S.misses[lk]||0)+1}
    if(!timed()&&R.mode!=='placement'&&R.mode!=='review'&&R.mode!=='quiz')R.q.push(it);else R.done++;
    if(!noHearts()){if(S.hearts>=5)S.heartAt=Date.now();S.hearts=Math.max(0,S.hearts-1)}
    $('.qmain').classList.add('shake');if($('#hs'))$('#hs').textContent='❤️ '+S.hearts}
  if(R.mode==='practice'&&ok&&first&&R.pk&&S.misses[R.pk]){S.misses[R.pk]--;if(!S.misses[R.pk])delete S.misses[R.pk]}
  save();
  if(R.mode==='challenge'){if(ok)qBump('chal');document.body.classList.remove('fl-ok','fl-no');void document.body.offsetWidth;document.body.classList.add(ok?'fl-ok':'fl-no');if(!ok)toast('✗ '+(e.t==='bug'?'Line '+(e.a+1):e.t==='ar'?'Wrong order':e.opts[e.a]));return next()}
  const ft=$('#ft');ft.className='foot sheet '+(ok?'ok':'no');ft.setAttribute('role','alert');
  const ask=!ok&&G.rytia!==false?`<button type="button" class="rytia-ask" id="rytia" aria-expanded="false" aria-controls="rytia-card" data-k="${esc(k)}" data-i="${sel==null?'':String(sel)}">${RYTIA_FACE}<span>Ask Rytia why</span></button><div id="rytia-card" class="rytia-card" hidden role="region" aria-live="polite" aria-label="Rytia · your study helper"></div>`:'';
  ft.innerHTML=`<div class="in"><h2 class="fbh">${ok?['Nice!','Correct!','You got it!','Solid!','Exactly!'][Math.random()*5|0]:'Not quite'}</h2>${ok?'':`<p class="ca"><b>Correct answer:</b></p><pre class="code sm" tabindex="0">${hl(ans)}</pre>`}<p>${esc(e.why)}</p><div class="fbx">${docLink(docUrl(k))}<button class="bm" id="bm" aria-pressed="${!!S.saved[k]}">${S.saved[k]?'★ Saved':'☆ Save question'}</button></div>${ask}<button class="btn ${ok?'':'red'}" id="cont">Continue</button></div>`;
  $('#bm').onclick=()=>{if(S.saved[k])delete S.saved[k];else S.saved[k]=Date.now();save();const on=!!S.saved[k];$('#bm').textContent=on?'★ Saved':'☆ Save question';$('#bm').setAttribute('aria-pressed',on);if(on){S.stats.saved=(S.stats.saved||0)+1;checkBadges()}};
  if($('#rytia'))$('#rytia').onclick=()=>{
    const btn=$('#rytia'),card=$('#rytia-card');
    if(!btn||!card)return;
    if(!card.hidden){closeRytia();return}
    if(btn.dataset.busy==='1')return;
    btn.dataset.busy='1';
    const key=btn.dataset.k,picked=btn.dataset.i;
    loadRytia().then(data=>{if(btn.isConnected)showRytia(btn,data&&data[key],picked)}).catch(()=>{if(btn.isConnected)showRytia(btn,null,picked)});
  };
  requestAnimationFrame(()=>requestAnimationFrame(()=>ft.classList.add('show')));shield();
  $('#cont').focus({preventScroll:true});
  $('#cont').onclick=()=>{if(!once($('#cont')))return;if(!ok&&!noHearts()){daily();if(S.hearts<=0){clearInterval(timerId);return outOfHearts()}}next()};
}
function outOfHearts(){daily();clearInterval(timerId);clearInterval(heartWatch);R=null;if(S.hearts>0)return land('learn');if(!(history.state&&history.state.br===1&&history.state.screen==='hearts')){try{history.replaceState({br:1,screen:'hearts'},'')}catch(e){}}
  const draw=()=>{shell(`<div class="center"><div class="big">💔</div><h1 class="h1">Out of hearts</h1><p class="muted">You get 1 heart back every 30 minutes${nextHeart()?` (next in <b>${nextHeart()}</b>)`:''}, and all 5 at midnight. Review, interviews, and speed challenges do not cost hearts.</p>${S.gems<30?`<p class="muted sm">A refill costs 30 gems. You have ${S.gems}.</p>`:''}<button class="btn" id="buyh" data-nxt="${S.hearts}|${nextHeart()}|${S.gems}" ${S.gems<30?'disabled':''}>Refill for 💎 30</button><button class="btn alt" id="pr" style="margin-top:12px">Practice mistakes instead</button></div>`);
    $('#buyh').onclick=()=>{if(!once($('#buyh'))||S.gems<30)return;clearInterval(heartWatch);S.gems-=30;S.hearts=5;S.heartAt=null;S.stats.bought=(S.stats.bought||0)+1;sfx.coin();checkBadges();save();land('learn')};$('#pr').onclick=()=>{if(!once($('#pr')))return;clearInterval(heartWatch);go('practice')}};
  draw();
  heartWatch=setInterval(()=>{if(!$('#buyh')){clearInterval(heartWatch);return}const before=$('#buyh').dataset.nxt;if(heartsDue())daily();if(!S||!$('#buyh')){clearInterval(heartWatch);return}if(S.hearts>0){clearInterval(heartWatch);land('learn');return}const now=`${S.hearts}|${nextHeart()}|${S.gems}`;if(now!==before)draw()},1000)}
function finish(timeUp){
  clearInterval(timerId);clearInterval(heartWatch);if(!R)return;daily();const m=R.mode;
  let xp=0,gem=0,title='Lesson complete!',extra='';
  const answered=R.res.filter(r=>r.ok!==null).length;
  const skipped=R.res.some(r=>r.ok===null);
  const quizPass=m==='quiz'&&R.correct>=R.pass;
  const quizAgain=R.quizItems,quizKey=R.key,quizName=R.name,quizNeed=R.pass,quizCorrect=R.correct,quizTotal=R.total;
  if(m==='lesson'){const fresh=!S.done[R.key];S.done[R.key]=true;if(fresh){S.stats.lessons++;dl().l++;qBump('lessons')}xp=10+R.correct*2;gem=5;if(!R.mist.size&&!skipped){S.stats.perfect++;gem=10;xp+=5;qBump('perfect')}}
  else if(m==='quiz'){title=quizPass?'Unit check passed':'Unit check not passed';if(quizPass){const fresh=!S.done[R.key];S.done[R.key]=true;if(fresh){xp=10+R.correct*2;gem=5}}}
  else if(m==='review'){S.stats.reviews++;xp=5+R.correct;title='Review complete!';qBump('review');S.hearts=Math.min(5,S.hearts+1);extra='<p class="muted">+1 ❤️ for reviewing</p>'}
  else if(m==='practice'||m==='saved'){xp=5+R.correct;title='Practice complete!';qBump('review')}
  else if(m==='challenge'){title=timeUp?'Time\'s up!':'Challenge complete!';xp=R.correct*2;gem=R.correct;S.stats.challenges++;if(R.correct>(S.stats.bestChal||0)){S.stats.bestChal=R.correct;extra='<p class="pill up">🎉 New personal best!</p>'}}
  else if(m==='placement'){title='Placement result';const pass=R.correct>=Math.ceil(R.total*.8);if(pass){DRILL.forEach(id=>S.done[id]=true);S.gates=Object.assign({},S.gates,{css:true})}xp=R.correct;extra=pass?'<p class="pill up">✅ Language drill marked done. HTML &amp; CSS is open. JavaFX still waits for object-oriented Java, and the how-it-runs lessons stay on your path.</p>':'<p class="muted">Let\'s start from the foundations — they\'ll go fast.</p>'}
  if(m==='interview')return ivSummary(timeUp);
  const acc=answered?Math.round(R.correct/(m==='lesson'||m==='practice'||m==='saved'?R.total:answered)*100):0;
  const lv0=level().L;if(m!=='quiz'||quizPass)xp=addXP(xp);if(gem)S.gems+=gem;const lv1=level().L;if(lv1>lv0){S.gems+=20;extra+=`<p class="pill lvup">🆙 Level up! You reached level ${lv1} · +20 💎</p>`}checkBadges();save();if(m==='quiz'&&!quizPass){sfx.no();buzz([40,40,60])}else{sfx.win();buzz([30,50,30])}const secs=Math.round((Date.now()-R.t0)/1000);
  const score=m==='quiz'?quizCorrect+'/'+quizTotal:(m==='challenge'?R.correct:acc+'%');
  shell(`<div class="center finish"><div class="trophy" aria-hidden="true"><div class="big">${m==='challenge'?'⏱️':m==='placement'?'🧭':m==='quiz'?'📝':'🏆'}</div></div><h1 class="h1">${title}</h1><p class="muted">${esc(m==='quiz'?quizName:R.name)}</p>
  <div class="cards"><div class="card xp">⚡<b>+${xp}</b>XP</div><div class="card">${m==='challenge'?'✅':'🎯'}<b>${score}</b>${m==='challenge'?'correct':m==='quiz'?'score':'accuracy'}</div><div class="card gem">💎<b>+${gem}</b>gems</div></div>${extra}${m==='quiz'?`<p class="pill ${quizPass?'up':'warn'}">${quizPass?'Passed':'Not passed'} · ${quizNeed} of ${quizTotal} to pass. Gems stay in the app.</p>`:''}<p class="muted sm">⏱ ${Math.floor(secs/60)}m ${secs%60}s</p>
  ${R.mist.size&&m!=='placement'?`<p class="muted">${plural(R.mist.size,'missed question')} saved to Review.</p>`:m==='lesson'&&!skipped?'<p class="pill up">Flawless — 10 gems</p>':''}</div>`,{nav:false});
  const retry=m==='quiz'&&!quizPass?`<button class="btn alt" id="retry">Retry unit check</button>`:'';
  app.insertAdjacentHTML('beforeend',`<footer class="foot"><div class="in">${retry}<button class="btn" id="h">${m==='quiz'&&!quizPass?'Back to path':'Continue'}</button></div></footer>`);
  if($('#retry'))$('#retry').onclick=()=>{if(!once($('#retry')))return;start(quizAgain,{key:quizKey,name:quizName,mode:'quiz',pass:quizNeed})};
  $('#h').onclick=()=>{if(!once($('#h')))return;navBack(home)};$('#h').focus();
  if(!(m==='quiz'&&!quizPass))confetti();
}
function ivSummary(timeUp){
  const total=R.total,cor=R.correct,pct=Math.round(cor/total*100),dur=Math.round((Date.now()-R.t0)/1000),byTag={};
  R.res.forEach(r=>{const t=r.e.tag;byTag[t]=byTag[t]||[0,0];byTag[t][1]++;if(r.ok)byTag[t][0]++});
  const unans=total-R.res.length;
  S.stats.interviews++;qBump('iv');S.stats.bestIv=Math.max(S.stats.bestIv||0,pct);const xp=addXP(cor*3),gem=cor*2;S.gems+=gem;checkBadges();save();sfx.win();
  const verdict=pct>=85?['Strong hire','🟢']:pct>=70?['Hire','🟢']:pct>=50?['Lean no hire — close!','🟡']:['Keep practicing','🔴'];
  shell(`<div class="center"><div class="big">💼</div><h1 class="h1">Interview scorecard</h1><p class="muted">${timeUp?'Time ran out. ':''}${Math.floor(dur/60)}m ${dur%60}s · ${unans?unans+' unanswered':'all answered'}</p>
  <div class="score" style="--p:${pct}"><b>${pct}%</b><small>${cor}/${total}</small></div><p class="verdict">${verdict[1]} ${verdict[0]}</p>
  <div class="cards"><div class="card xp">⚡<b>+${xp}</b>XP</div><div class="card gem">💎<b>+${gem}</b>gems</div></div></div>
  <h2 class="h2">By topic</h2>${Object.entries(byTag).map(([t,[c,n]])=>`<div class="trow"><span>${t}</span><div class="bar"><i style="width:${c/n*100}%"></i></div><b>${c}/${n}</b></div>`).join('')}
  <h2 class="h2">Review your answers</h2>${R.res.map((r,i)=>`<details class="rev ${r.ok?'ok':'no'}"><summary>${r.ok?'✅':r.ok===null?'⏭️':'❌'} Q${i+1} · ${esc(r.e.tag)} — ${esc((r.e.q||'Predict the output').slice(0,60))}</summary>${r.e.code?`<pre class="code sm" tabindex="0">${hl(r.e.code)}</pre>`:''}${r.e.t==='ar'?`<p><b>Answer:</b></p><pre class="code sm" tabindex="0">${hl(r.e.lines.join('\n'))}</pre>`:`<p><b>Answer:</b> ${esc(r.e.t==='bug'?'Line '+(r.e.a+1)+': '+r.e.lines[r.e.a].trim():r.e.opts[r.e.a])}</p>`}<p>${esc(r.e.why)}</p></details>`).join('')}`,{nav:false});
  app.insertAdjacentHTML('beforeend','<footer class="foot"><div class="in"><button class="btn" id="h">Done</button></div></footer>');$('#h').onclick=()=>{if(!once($('#h')))return;navBack(ivHome)};
  if(pct>=70)confetti();
}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<48;i++){const c=document.createElement('div');c.className='conf';c.style.left=Math.random()*100+'vw';c.style.background=['#16a34a','#f97316','#0ea5e9','#8b5cf6','#facc15','#ef4444'][i%6];c.style.animationDelay=Math.random()*.6+'s';c.style.animationDuration=1.4+Math.random()+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),3200)}}
// ---------- keyboard ----------
document.addEventListener('keydown',ev=>{if(ev.target.tagName==='TEXTAREA'){if(ev.key==='Enter'&&(ev.metaKey||ev.ctrlKey)){const b=$('#chk');if(b&&!b.disabled){b.click();ev.preventDefault()}}return}if(ev.target.tagName==='INPUT')return;const k=ev.key;
  if(/^[1-9]$/.test(k)&&$('#bank')){const c=$$('#bank .chip')[+k-1];if(c){c.click();ev.preventDefault()}return}
  if(k==='Backspace'&&$('#ans')){const c=[...$$('#ans .chip')].pop();if(c){c.click();ev.preventDefault()}return}
  if(/^[1-9]$/.test(k)){const o=$$('.opt').filter(o=>!o.disabled)[+k-1];if(o){o.click();ev.preventDefault()}}
  else if(k==='Enter'){const ae=document.activeElement;if(ae&&(ae.id==='rytia'||ae.id==='rytia-x'||(ae.closest&&ae.closest('#rytia-card'))))return;const b=$('#cont')||(!$('#chk')?.disabled&&$('#chk'))||$('#go')||$('#h');if(b&&ae!==b){b.click();ev.preventDefault()}}
  else if(k==='Escape'){if(closeRytia()){ev.preventDefault();return}if($('#x'))$('#x').click()}
  else if((k==='h'||k==='H')&&$('#ff')&&!$('#ff').disabled)$('#ff').click();
  else if((k==='s'||k==='S')&&$('#sk')&&!$('#sk').disabled&&!$('#cont'))$('#sk').click()});
// ---------- boot ----------
if(!S){const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p;save()}
daily();
armHistory();
addEventListener('popstate',onPop);
histLock=true;restore(history.state);histLock=false;
addEventListener('storage',e=>{
  if(e.key===GK&&e.newValue){
    try{const g=JSON.parse(e.newValue);if(g&&typeof g==='object'&&!Array.isArray(g)){G=Object.assign({theme:'system',sound:true,big:false,rytia:true},g);applyTheme()}}catch(err){}
    return;
  }
  if(e.key!==PK||!e.newValue)return;
  let next;try{next=JSON.parse(e.newValue)}catch(err){return}
  if(!next||typeof next!=='object'||Array.isArray(next)||(next.rev||0)<=(P.rev||0))return;
  if(R){remoteNewer=true;return}
  remoteNewer=false;
  const busy=!!R;
  syncing=true;
  try{P=next;hydrate();if(!busy){const n=cur||'learn';cur='';show(n)}}
  finally{syncing=false}
});
if('serviceWorker' in navigator){let had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had){had=true;return}toast('A new version of ByteRyte is ready. Reload to use it.')})}
window.__BR={get S(){return S},P:()=>P,cur:()=>R&&R.q[0]&&R.q[0].e};
})();
