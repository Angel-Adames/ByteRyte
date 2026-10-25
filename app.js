(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=$('#app'),DAY=864e5;
const PK='byteroots-profiles',GK='byteroots-settings';
const iso=(d=new Date())=>{const z=new Date(d);return z.getFullYear()+'-'+String(z.getMonth()+1).padStart(2,'0')+'-'+String(z.getDate()).padStart(2,'0')};
const today=()=>iso(),yday=()=>iso(Date.now()-DAY),dayDiff=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/DAY);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const AVATARS=['🦊','🐼','🐙','🦉','🐸','🐯','🐨','🦄','🐧','🐳','🦖','🤖','👩‍💻','👨‍💻','🧑‍🚀','🐝'];
const NEWP=(name='Learner',avatar='🦊')=>({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,avatar,xp:0,streak:0,best:0,last:null,hearts:5,heartDay:today(),done:{},review:{},misses:{},xpLog:{},gems:50,freezes:0,inv:{fifty:1,skip:1},doubleUntil:0,goal:30,goalDay:null,badges:{},saved:{},dlog:{},stats:{answered:0,correct:0,perfect:0,lessons:0,interviews:0,bestIv:0,reviews:0,challenges:0},onboarded:false,track:'java',unlockAll:false,created:Date.now()});
// ---------- storage + migration ----------
const readStore=k=>{try{const t=localStorage.getItem(k);return t?JSON.parse(t):null}catch(e){return null}};
let G=Object.assign({theme:'system',sound:true,big:false},readStore(GK)||{});
let P=readStore(PK);
if(!P||typeof P!=='object'||Array.isArray(P)){P={active:null,list:{}};const old=readStore('byteroots-v1');
  if(old){const p=Object.assign(NEWP(),{xp:old.xp||0,streak:old.streak||0,done:old.done||{},review:old.review||{},track:old.track||'java',onboarded:true});
    if(old.last){const d=new Date(old.last);if(!isNaN(d))p.last=iso(d)}p.best=p.streak;P.list[p.id]=p;P.active=p.id}}
let S;
function hydrate(){
  if(!P||typeof P!=='object'||Array.isArray(P))P={active:null,list:{}};
  if(!P.list||typeof P.list!=='object')P.list={};
  Object.keys(P.list).forEach(id=>{const d=NEWP(),p=P.list[id]||{};
    P.list[id]=Object.assign(d,p,{id,inv:Object.assign({},d.inv,p.inv||{}),stats:Object.assign({},d.stats,p.stats||{}),saved:Object.assign({},p.saved||{}),badges:Object.assign({},p.badges||{}),done:Object.assign({},p.done||{}),review:Object.assign({},p.review||{}),misses:Object.assign({},p.misses||{}),xpLog:Object.assign({},p.xpLog||{}),dlog:Object.assign({},p.dlog||{})})});
  if(!P.active||!P.list[P.active])P.active=Object.keys(P.list)[0]||null;
  S=P.active?P.list[P.active]:null}
hydrate();
const saveG=()=>localStorage.setItem(GK,JSON.stringify(G));
const save=()=>{if(S)P.list[S.id]=S;localStorage.setItem(PK,JSON.stringify(P))};
const HREG=30*60*1000;
function regen(){if(S.hearts>=5){S.heartAt=null;return}if(!S.heartAt){S.heartAt=Date.now();return}const n=Math.floor((Date.now()-S.heartAt)/HREG);if(n>0){S.hearts=Math.min(5,S.hearts+n);S.heartAt=S.hearts>=5?null:S.heartAt+n*HREG;save()}}
function nextHeart(){if(S.hearts>=5||!S.heartAt)return '';const m=Math.max(1,Math.ceil((S.heartAt+HREG-Date.now())/60000));return `${m} min`}
function daily(){ // refill hearts at midnight, streak freeze handling
  if(!S)return;
  regen();
  if(S.heartDay!==today()){S.hearts=5;S.heartAt=null;S.heartDay=today()}
  if(S.last&&S.last!==today()&&S.last!==yday()){const miss=dayDiff(S.last,today())-1;
    if(miss>0&&S.freezes>=miss){S.freezes-=miss;S.last=yday();toast(`🧊 Streak freeze used (${miss}) — streak saved!`)}else if(miss>0)S.streak=0}
  save()}
// ---------- theme / sound / toast ----------
const mq=matchMedia('(prefers-color-scheme: dark)');
const applyTheme=()=>{const d=G.theme==='dark'||(G.theme==='system'&&mq.matches);document.documentElement.dataset.theme=d?'dark':'light';$('meta[name=theme-color]').content=d?'#0b1220':'#16a34a';document.documentElement.toggleAttribute('data-big',!!G.big)};
mq.addEventListener?.('change',applyTheme);applyTheme();
let AC;const tone=(f,d=.12,t=0,type='sine')=>{if(!G.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,AC.currentTime+t);g.gain.exponentialRampToValueAtTime(.15,AC.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+t+d);o.connect(g).connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+d+.05)}catch(e){}};
const sfx={ok:()=>{tone(660);tone(880,.15,.09)},no:()=>{tone(220,.2,0,'triangle')},win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.18,i*.11)),coin:()=>{tone(988,.08);tone(1319,.15,.07)}};
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const TQ=[];let tBusy=false;function toast(msg){TQ.push(msg);if(!tBusy)nextToast()}function nextToast(){const msg=TQ.shift();if(msg===undefined){tBusy=false;return}tBusy=true;const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);const d=TQ.length?1500:2600;setTimeout(()=>t.classList.add('out'),d);setTimeout(()=>{t.remove();nextToast()},d+350)}
// ---------- syntax highlight ----------
const KW=/^(abstract|boolean|break|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|null|package|private|protected|public|record|return|short|static|super|switch|this|throw|throws|try|var|void|while|true|false|let|func|struct|guard|in|protocol|extension|mutating|nil|some|inout|self|init|where|as|is|yield)$/;
function hl(code){const re=/(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(\b\d+(?:\.\d+)?[LfdF]?\b)|(@\w+)|(\b[A-Za-z_]\w*\b)|(___)/gm;let out='',i=0,m;
  while((m=re.exec(code))){out+=esc(code.slice(i,m.index));const [w,c,s,n,a,id,bl]=m;
    out+=c?`<span class="tc">${esc(w)}</span>`:s?`<span class="ts">${esc(w)}</span>`:n?`<span class="tn">${w}</span>`:a?`<span class="ta">${w}</span>`:bl?`<span class="blank">___</span>`:KW.test(id)?`<span class="tk">${w}</span>`:/^[A-Z]/.test(id)?`<span class="tt">${w}</span>`:w;i=m.index+w.length}
  return out+esc(code.slice(i))}
// ---------- data helpers ----------
const T=id=>TRACKS.find(t=>t.id===id);
const lessons=t=>{const o=[];t.units.forEach((u,ui)=>u.lessons.forEach((l,li)=>o.push({l,ui,li,key:`${t.id}-${ui}-${li}`})));return o};
const DJ='https://dev.java/learn/',DO='https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/',FX='https://openjfx.io/javadoc/21/',MDN='https://developer.mozilla.org/en-US/docs/',SW='https://docs.swift.org/swift-book/documentation/the-swift-programming-language/';
const DOCS={'Types & Variables':DJ+'language-basics/primitive-types/','Strings':DO+'lang/String.html','Control Flow':DJ+'language-basics/controlling-flow/','Methods':DJ+'classes-objects/defining-methods/','Arrays':DJ+'language-basics/arrays/','Classes & Objects':DJ+'classes-objects/','Inheritance & Polymorphism':DJ+'inheritance/','Interfaces & Abstract Classes':DJ+'interfaces/','References & Memory':DJ+'classes-objects/creating-objects/','Exceptions':DJ+'exceptions/','Lists & Generics':DJ+'generics/','Maps & Sets':DJ+'api/collections-framework/','Lambdas & Streams':DJ+'lambdas/','Records, Enums & Equality':DJ+'records/','Sorting & Comparators':DO+'util/Comparator.html','Recursion':DJ+'classes-objects/defining-methods/','Big-O & Searching':DO+'util/Arrays.html','Threads & Concurrency':DO+'util/concurrent/package-summary.html','OOP Design & SOLID':DJ+'interfaces/','Files & I/O':DO+'nio/file/Files.html','Testing with JUnit':'https://junit.org/junit5/docs/current/user-guide/','Interview Patterns':DJ+'api/collections-framework/','Abstract vs Interface':DJ+'interfaces/','Generic Methods':DJ+'generics/','Checked & Unchecked':DJ+'exceptions/','Stream Pipelines':DO+'util/stream/Collectors.html','Records in Practice':DJ+'records/','Enums with State':'https://docs.oracle.com/javase/tutorial/java/javaOO/enum.html','Big-O Tradeoffs':DO+'util/Arrays.html',
'App Lifecycle & Scene Graph':FX+'javafx.graphics/javafx/application/Application.html','Layouts & Controls':FX+'javafx.graphics/javafx/scene/layout/package-summary.html','Events, Properties & FXML':FX+'javafx.base/javafx/beans/property/package-summary.html','Styling JavaFX with CSS':FX+'javafx.graphics/javafx/scene/doc-files/cssref.html','Concurrency & Tasks':FX+'javafx.graphics/javafx/concurrent/Task.html',
'Semantic HTML & Forms':MDN+'Glossary/Semantics','Box Model & Selectors':MDN+'Learn_web_development/Core/Styling_basics/Box_model','Flexbox & Grid':MDN+'Web/CSS/CSS_grid_layout','Responsive Design':MDN+'Learn_web_development/Core/CSS_layout/Responsive_Design','Variables, Transitions & Units':MDN+'Web/CSS/Using_CSS_custom_properties',
'Basics & Optionals':SW+'thebasics/','Value vs Reference Types':SW+'classesandstructures/','Errors & SwiftUI Basics':SW+'errorhandling/','Protocols, Closures & Collections':SW+'protocols/','Enums, Switch & Structs':SW+'enumerations/','Alerts & Dialogs':FX+'javafx.controls/javafx/scene/control/Alert.html','Windows & Modality':FX+'javafx.graphics/javafx/stage/Stage.html','Lists & Selection':FX+'javafx.controls/javafx/scene/control/ListView.html','Forms & Validation':MDN+'Web/CSS/:invalid','Positioning':MDN+'Web/CSS/position','Accessible CSS':MDN+'Web/CSS/:focus-visible','Strings & Characters':SW+'stringsandcharacters/','Throwing Functions':SW+'errorhandling/','SwiftUI Lists':'https://developer.apple.com/documentation/swiftui/foreach'};
const IVDOC={Swift:SW+'thebasics/',JavaFX:'https://openjfx.io/openjfx-docs/',CSS:MDN+'Web/CSS/CSS_grid_layout',Complexity:DJ+'api/collections-framework/','Data structures':DJ+'api/collections-framework/'};
const docUrl=k=>{if(!k)return null;if(k.startsWith('iv-'))return IVDOC[IV[+k.slice(3)]?.tag]||null;const [t,u,l]=k.split('-');const L=T(t)?.units[u]?.lessons[l];return L?DOCS[L.name]||null:null};
const docLink=u=>{try{if(!u)return '';const host=new URL(u).hostname.replace(/^www\./,'');return `<a class="learn" href="${u}" target="_blank" rel="noopener">📘 Learn more · ${host} <span aria-hidden="true">↗</span><span class="sr">(opens in a new tab)</span></a>`}catch(e){return ''}};
const sheetHTML=items=>items&&items.length?`<ul class="cheats">${items.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:'';
const dl=()=>{const d=today();S.dlog=S.dlog||{};return S.dlog[d]=S.dlog[d]||{l:0,a:0,c:0}};
const savedKeys=()=>Object.keys(S.saved||{}).filter(k=>exByKey(k)).sort((a,b)=>S.saved[b]-S.saved[a]);
const exByKey=k=>{if(k.startsWith('iv-'))return IV[+k.slice(3)];const [t,u,l,e]=k.split('-');return T(t)?.units[u]?.lessons[l]?.ex[e]};
const lessonOf=k=>{const [t,u,l]=k.split('-');return T(t)?.units[u]?.lessons[l]};
const branchOpen=()=>S.unlockAll||lessons(T('java')).filter(x=>x.ui===0).every(x=>S.done[x.key]);
const due=()=>Object.entries(S.review).filter(([k,v])=>v.due<=Date.now()&&exByKey(k)).map(([k])=>k);
const NAMES={mc:'Concept check',out:'Predict the output',fill:'Complete the code',ar:'Arrange the code',bug:'Spot the bug',fix:'Fix the bug'};
const dblOn=()=>S.doubleUntil>Date.now();
function addXP(n){if(dblOn())n*=2;S.xp+=n;S.xpLog[today()]=(S.xpLog[today()]||0)+n;
  if(S.last!==today()){S.streak=S.last===yday()?S.streak+1:1;S.last=today();S.best=Math.max(S.best,S.streak);if(S.streak%7===0){gems(20,'7-day streak bonus')}}
  if(S.goalDay!==today()&&S.xpLog[today()]>=S.goal){S.goalDay=today();gems(10,'Daily goal reached');}
  qBump('xp',0);return n}
function gems(n,why){S.gems+=n;if(why)toast(`💎 +${n} — ${why}`);sfx.coin()}
// ---------- levels ----------
function level(xp=S.xp){let L=1,need=100,base=0;while(xp>=base+need){base+=need;L++;need=100+50*(L-1)}return {L,into:xp-base,need}}
// ---------- daily quests ----------
const QPOOL={lessons:['📚','Complete 2 lessons',2],correct:['🎯','Get 15 answers right',15],perfect:['💯','Finish a lesson with no mistakes',1],chal:['⏱️','Get 5 right in speed challenges',5],review:['🔁','Finish a review or practice session',1],iv:['💼','Complete a mock interview',1]};
function quests(){if(!S.qd||S.qd.day!==today()){const keys=Object.keys(QPOOL);let h=0;for(const c of today()+S.id)h=(h*31+c.charCodeAt(0))>>>0;const pick=[];while(pick.length<2){const k=keys[h%keys.length];if(!pick.includes(k))pick.push(k);h=(h*1103515245+12345)>>>0}S.qd={day:today(),ids:['xp',...pick],p:{},claimed:{},chest:false}}
  return S.qd.ids.map(id=>{const [ic,label,n]=id==='xp'?['⚡',`Earn ${S.goal} XP`,S.goal]:QPOOL[id];const v=id==='xp'?(S.xpLog[today()]||0):(S.qd.p[id]||0);return {id,ic,label,n,v:Math.min(v,n),done:v>=n}})}
function qBump(m,n=1){quests();if(m!=='xp')S.qd.p[m]=(S.qd.p[m]||0)+n;const qs=quests();
  qs.forEach(q=>{if(q.done&&!S.qd.claimed[q.id]){S.qd.claimed[q.id]=1;S.gems+=15;setTimeout(()=>{toast(`${q.ic} Quest complete: ${q.label} · +15 💎`);sfx.coin()},700)}});
  if(!S.qd.chest&&qs.every(q=>q.done)){S.qd.chest=true;S.gems+=25;setTimeout(()=>{toast('🎁 All daily quests done! +25 💎');sfx.coin()},1600)}}
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
['unit1','☕','Java Rooted','Complete Java Unit 1',()=>lessons(T('java')).filter(x=>x.ui===0).every(x=>S.done[x.key]),()=>{const u=lessons(T('java')).filter(x=>x.ui===0);return [u.filter(x=>S.done[x.key]).length,u.length]}],
['branch','🌿','Branching Out','Finish a JavaFX and an HTML & CSS lesson',()=>['javafx','css'].every(t=>lessons(T(t)).some(x=>S.done[x.key]))],
['swift','🐦','Bilingual','Finish a Swift lesson',()=>lessons(T('swift')).some(x=>S.done[x.key])],
['iv1','💼','Interview Ready','Complete a mock interview',()=>S.stats.interviews>=1],
['iv80','🏅','Offer Letter','Score 80%+ in a mock interview',()=>S.stats.bestIv>=80],
['review','🔁','Comeback','Complete 3 review sessions',()=>S.stats.reviews>=3,()=>[S.stats.reviews,3]],
['shop','🛍️','Big Spender','Buy something in the shop',()=>S.stats.bought>=1],
['java','👑','Java Master','Complete every Java lesson',()=>lessons(T('java')).every(x=>S.done[x.key]),()=>[lessons(T('java')).filter(x=>S.done[x.key]).length,lessons(T('java')).length]],
['pro','🧰','Professional','Complete Java Unit 5: Professional Java',()=>lessons(T('java')).filter(x=>x.ui===4).every(x=>S.done[x.key]),()=>{const u=lessons(T('java')).filter(x=>x.ui===4);return [u.filter(x=>S.done[x.key]).length,u.length]}],
['curator','★','Curator','Save 3 questions to revisit',()=>Object.keys(S.saved||{}).length>=3,()=>[Object.keys(S.saved||{}).length,3]],
['speed','🏎️','Speed Demon','Get 15+ right in a speed challenge',()=>(S.stats.bestChal||0)>=15,()=>[S.stats.bestChal||0,15]]];
function checkBadges(){BADGES.forEach(([id,ic,n,,f])=>{if(!S.badges[id]&&f()){S.badges[id]=Date.now();setTimeout(()=>{toast(`${ic} Badge unlocked: ${n}`);sfx.coin()},400)}});save()}
// ---------- shell ----------
const NAV=[['learn','📚','Learn'],['practice','🎯','Practice'],['interview','💼','Interview'],['shop','💎','Shop'],['profile','👤','Profile']];
let cur='learn';
function topbar(){const tight=S.streak>=100||S.gems>=1000;return `<header class="top${tight?' tight':''}"><button class="brand" data-go="learn" aria-label="ByteRyte home"><span class="logo">{ }</span>ByteRyte</button>
<span class="stat" title="Day streak" aria-label="${S.streak} day streak">🔥 ${S.streak}</span><span class="stat" title="Gems" aria-label="${S.gems} gems">💎 ${S.gems}</span><span class="stat" title="${S.hearts<5&&nextHeart()?'Next heart in '+nextHeart():'Hearts full'}" aria-label="${S.hearts} hearts${S.hearts<5&&nextHeart()?', next in '+nextHeart():''}">❤️ ${S.hearts}</span>
<button class="icon" data-go="settings" aria-label="Settings">⚙️</button></header>`}
function rail(){const lv=level(),wk=[...Array(7)].reduce((a,_,i)=>a+(S.xpLog[iso(Date.now()-i*DAY)]||0),0);
  return `<aside class="rail" aria-label="Your progress"><section class="rcard me"><span class="avatar">${S.avatar}</span><div><b>${esc(S.name)}</b><small>Level ${lv.L} · ${lv.into}/${lv.need} XP</small><div class="bar sm"><i style="width:${lv.into/lv.need*100}%"></i></div></div></section>
  <section class="rcard"><div class="sgrid s2"><div class="scard">🔥<b>${S.streak}</b>streak</div><div class="scard">⚡<b>${wk}</b>XP this week</div></div></section>${questsHTML()}
  <section class="rcard promo"><b>💼 Interview coming up?</b><small>Run a timed mock screen and get a hire/no-hire scorecard.</small><button class="btn sm" data-go="interview">Practice now</button></section></aside>`}
function shell(inner,{nav=true}={}){regen();document.querySelectorAll('.conf').forEach(c=>c.remove());app.className=nav?'withnav':'';app.innerHTML=topbar()+`<main id="main" class="fade">${/<h1[\s>]/.test(inner)?'':`<h1 class="sr">ByteRyte · ${({learn:'Learn path',practice:'Practice',interview:'Mock interview',shop:'Gem shop',profile:'Profile',settings:'Settings'})[cur]||'Home'}</h1>`}${inner}</main>`+(nav?rail():'')+(nav?`<nav class="bnav" aria-label="Main">${NAV.map(([id,ic,l])=>`<button data-go="${id}" class="${cur===id?'on':''}" ${cur===id?'aria-current="page"':''}><span>${ic}</span>${l}</button>`).join('')}</nav>`:'');
  $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));window.scrollTo(0,0)}
function go(v){cur=v;({learn:home,practice,interview:ivHome,shop,profile,settings}[v]||home)()}
// ---------- learn ----------
function home(){
  cur='learn';daily();const t=T(S.track),ls=lessons(t),locked=t.parent&&!branchOpen(),firstOpen=ls.findIndex(x=>!S.done[x.key]),gp=Math.min(100,(S.xpLog[today()]||0)/S.goal*100);
  let h=`<section class="goalcard"><div class="row"><b>Daily goal</b><span>${S.xpLog[today()]||0} / ${S.goal} XP</span></div><div class="bar"><i style="width:${gp}%"></i></div>${S.last===yday()&&!(S.xpLog[today()])?`<div class="pill warn">🔥 Keep your ${S.streak}-day streak alive — do one lesson today!</div>`:''}${S.freezes?`<div class="pill">🧊 ${S.freezes} streak freeze${S.freezes>1?'s':''} ready</div>`:''}${dblOn()?`<div class="pill">⚡ Double XP active · ${Math.ceil((S.doubleUntil-Date.now())/60000)} min left</div>`:''}</section>
  <button class="qchip" data-go="practice">🗓 Daily quests <b>${quests().filter(q=>q.done).length}/3</b><span>›</span></button>
  <div class="tabs" role="tablist">`;
  TRACKS.forEach(x=>{const d=lessons(x).filter(y=>S.done[y.key]).length,n=lessons(x).length;
    h+=`<button role="tab" aria-selected="${x.id===S.track}" class="tab ${x.id===S.track?'on':''}" data-t="${x.id}" style="--c:${x.color}">${x.icon} ${x.name}<small>${x.primary?'Main path':x.parent?'↳ Java branch':'Secondary'} · ${d}/${n}</small></button>`});
  h+=`</div>`;
  if(locked)h+=`<div class="branchbox">🔒 This branch grows off the Java trunk. Finish <b>Java Unit 1</b> to unlock it.</div>`;
  t.units.forEach((u,ui)=>{const ud=u.lessons.filter((l,li)=>S.done[`${t.id}-${ui}-${li}`]).length;
    h+=`<div class="unit" style="--c:${t.color}"><div>${esc(u.name)}<small>${ud}/${u.lessons.length} lessons complete</small></div><div class="uright"><button class="guide" data-u="${ui}" aria-label="Open ${esc(u.name)} guidebook">📖 Guide</button><div class="ring" style="--p:${ud/u.lessons.length*100}" aria-hidden="true"></div></div></div><div class="path" style="--c:${t.color}">`;
    u.lessons.forEach((l,li)=>{const i=ls.findIndex(x=>x.ui===ui&&x.li===li),k=ls[i].key,open=!locked&&(S.unlockAll||i<=firstOpen||firstOpen<0||S.done[k]),isCur=open&&!S.done[k]&&i===firstOpen;
      const off=[0,48,68,48,0,-48,-68,-48][i%8];
      h+=`<div class="nodewrap ${isCur?'hascur':''}" style="--x:${off}px">${isCur?'<div class="startbub">START</div>':''}<button class="node ${open?'':'lock'} ${S.done[k]?'done':''} ${isCur?'cur':''}" style="--c:${t.color}" data-k="${k}" ${open?'':'disabled'} aria-label="${esc(l.name)}${S.done[k]?' (complete)':open?'':' (locked)'}">${S.done[k]?'★':open?t.icon:'🔒'}</button><div class="nlab">${esc(l.name)}</div></div>`});
    h+=`</div>`});
  if(t.id==='java')h+=`<div class="branchbox">🌿 Branches: <b>JavaFX</b> and <b>HTML &amp; CSS</b> (incl. JavaFX CSS) ${branchOpen()?'are unlocked — switch tabs above.':'unlock after Java Unit 1.'}</div>`;
  h+=`<p class="note">Print answers were run on JDK 21. Swift snippets were checked against the Swift.org language guide. Concepts checked against Oracle, OpenJFX, and MDN. Gems stay in the app.</p>`;
  shell(h);
  $$('.tab').forEach(b=>b.onclick=()=>{S.track=b.dataset.t;save();home()});
  $$('.node:not(.lock)').forEach(b=>b.onclick=()=>{const L=lessonOf(b.dataset.k);start(L.ex.map((e,i)=>({e,k:`${b.dataset.k}-${i}`})),{key:b.dataset.k,name:L.name,tip:L.tip,sheet:L.sheet,mode:'lesson'})});
  $$('.guide').forEach(b=>b.onclick=()=>guide(t,+b.dataset.u));
  $('.node.cur')?.scrollIntoView({block:'center'});
}
function guide(t,ui){daily();const u=t.units[ui];
  shell(`<button class="link" id="bk">‹ Back to path</button><h1 class="h1">📖 ${esc(u.name)}</h1><p class="muted">Key ideas for every lesson in this unit — read before you start, or come back to refresh.</p>
  ${u.lessons.map((l,li)=>{const ex=l.ex.find(e=>e.t==='out'&&e.code.split('\n').length<=4);return `<article class="gcard" style="--c:${t.color}"><h2>${t.icon} ${esc(l.name)} ${S.done[`${t.id}-${ui}-${li}`]?'<span class="tag">✓ done</span>':''}</h2><p>${esc(l.tip)}</p>${sheetHTML(l.sheet)}${docLink(DOCS[l.name])}${ex?`<div class="gex"><small>Example</small><pre class="code sm" tabindex="0">${hl(ex.code)}</pre><small>Prints: <code>${esc(ex.opts[ex.a])}</code></small></div>`:''}</article>`}).join('')}`);
  $('#bk').onclick=home}
// ---------- practice ----------
function practice(){cur='practice';daily();const dn=due().length;
  const weak=Object.entries(S.misses).filter(([k])=>lessonOf(k)).sort((a,b)=>b[1]-a[1]).slice(0,4);
  let h=`<h1 class="h1">Practice</h1><div class="mobonly">${questsHTML()}</div>
  <button class="pcard" id="rev" ${dn?'':'disabled'}><span class="pic">🔁</span><span><b>Review mistakes</b><small>${dn?`${dn} question(s) due — spaced repetition`:'Nothing due. Missed questions come back here.'}</small></span></button>
  <button class="pcard" id="chal"><span class="pic">⏱️</span><span><b>Speed challenge</b><small>60 seconds, as many as you can. Best: ${S.stats.bestChal||0}</small></span></button>
  <button class="pcard" id="svd" ${savedKeys().length?'':'disabled'}><span class="pic">★</span><span><b>Saved questions</b><small>${savedKeys().length?`${savedKeys().length} bookmarked · no hearts needed`:'Tap “☆ Save question” after any answer to bookmark it here.'}</small></span></button>
  <h2 class="h2">Weak spots</h2>`;
  h+=weak.length?weak.map(([k,n])=>`<button class="pcard weak" data-k="${k}"><span class="pic">${T(k.split('-')[0]).icon}</span><span><b>${esc(lessonOf(k).name)}</b><small>${n} miss${n>1?'es':''} · ${T(k.split('-')[0]).name}</small></span></button>`).join(''):'<div class="empty"><span aria-hidden="true">🌱</span><p>No weak spots yet. Finish a few lessons and the topics you miss most will show up here.</p></div>';
  if(savedKeys().length)h+=`<h2 class="h2">Saved · ${savedKeys().length}</h2><ul class="svlist">${savedKeys().map(k=>{const e=exByKey(k),src=k.startsWith('iv-')?'Interview · '+e.tag:lessonOf(k.split('-').slice(0,3).join('-'))?.name;return `<li><span><b>${esc((e.q||(e.t==='out'?'What does this print?':'Question')).slice(0,90))}</b><small>${esc(src||'')}</small></span><button class="link unsv" data-k="${k}" aria-label="Remove from saved">Remove</button></li>`}).join('')}</ul>`;
  shell(h);
  $('#svd').onclick=()=>{const ks=savedKeys();if(ks.length)start(shuffle(ks).map(k=>({e:exByKey(k),k})),{name:'Saved questions',mode:'saved'})};
  $$('.unsv').forEach(b=>b.onclick=()=>{delete S.saved[b.dataset.k];save();practice()});
  $('#rev').onclick=()=>{const d=shuffle(due()).slice(0,10);if(d.length)start(d.map(k=>({e:exByKey(k),k})),{name:'Review',mode:'review'})};
  $('#chal').onclick=()=>{const pool=[];TRACKS.forEach(t=>lessons(t).forEach(x=>{if(S.done[x.key]||S.unlockAll||t.id==='java'&&x.ui===0)x.l.ex.forEach((e,i)=>{if(e.t!=='ar')pool.push({e,k:`${x.key}-${i}`})})}));start(shuffle(pool),{name:'Speed challenge',mode:'challenge',secs:60})};
  $$('.weak').forEach(b=>b.onclick=()=>{const L=lessonOf(b.dataset.k);start(shuffle(L.ex.map((e,i)=>({e,k:`${b.dataset.k}-${i}`}))),{name:'Practice: '+L.name,mode:'practice',pk:b.dataset.k})});
}
// ---------- interview ----------
function ivHome(){cur='interview';daily();
  const tags=[...new Set(IV.map(q=>q.tag))];
  shell(`<h1 class="h1">Mock Interview</h1><p class="muted">Timed technical-screen practice: predict output, find bugs, pick data structures, reason about Big-O, and complete methods. No hearts lost — you get a scorecard at the end.</p>
  <div class="ivgrid">${[['Quick screen',8,6],['Standard',12,10],['Full loop',18,15]].map(([n,q,m])=>`<button class="pcard ivs" data-q="${q}" data-m="${m}"><span class="pic">💼</span><span><b>${n}</b><small>${q} questions · ${m} min</small></span></button>`).join('')}</div>
  <h2 class="h2">Drill one topic</h2><p class="muted sm">Focus round: every question from one topic, 1 minute per question.</p><div class="chips">${tags.map(t=>`<button class="tag tbtn" data-tag="${esc(t)}">${t} · ${IV.filter(q=>q.tag===t).length}</button>`).join('')}</div>
  <p class="muted">Best score: <b>${S.stats.bestIv||0}%</b> · Interviews done: <b>${S.stats.interviews}</b></p>`);
  $$('.ivs').forEach(b=>b.onclick=()=>{const java=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.track==='java')),oth=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.track!=='java'));const q=+b.dataset.q,no=Math.max(2,Math.round(q*.25));
    start(shuffle(java.slice(0,q-no).concat(oth.slice(0,no))),{name:'Mock Interview',mode:'interview',secs:+b.dataset.m*60})});
  $$('.tbtn').forEach(b=>b.onclick=()=>{const qs=shuffle(IV.map((e,i)=>({e,k:'iv-'+i})).filter(x=>x.e.tag===b.dataset.tag));start(qs,{name:'Topic drill: '+b.dataset.tag,mode:'interview',secs:qs.length*60})});
}
// ---------- shop ----------
const ITEMS=[['hearts','❤️','Heart refill','Restore all 5 hearts now (otherwise +1 every 30 min, full at midnight)',30,()=>S.hearts<5,()=>{S.hearts=5;S.heartAt=null}],
['freeze','🧊','Streak freeze','Protects your streak for one missed day (max 2)',50,()=>S.freezes<2,()=>{S.freezes++}],
['fifty','✂️','50/50 hint ×3','Remove two wrong answers on a question',20,()=>true,()=>{S.inv.fifty=(S.inv.fifty||0)+3}],
['skip','⏭️','Skip question ×2','Skip a hard question without losing a heart',25,()=>true,()=>{S.inv.skip=(S.inv.skip||0)+2}],
['double','⚡','Double XP (15 min)','Earn 2× XP for 15 minutes',40,()=>true,()=>{S.doubleUntil=Math.max(Date.now(),S.doubleUntil)+15*60000}]];
function shop(){cur='shop';daily();
  shell(`<h1 class="h1">Gem Shop</h1><div class="wallet"><span>💎</span><div><b>${S.gems}</b><small>gems · earned from lessons, goals, streaks and interviews. Just for fun: no real money involved.</small></div></div>
  <div class="inv">Your stuff: ✂️ ${S.inv.fifty||0} · ⏭️ ${S.inv.skip||0} · 🧊 ${S.freezes}/2 ${dblOn()?'· ⚡ active':''}</div>
  ${ITEMS.map(([id,ic,n,d,c,ok])=>`<div class="sitem"><span class="pic">${ic}</span><div><b>${n}</b><small>${d}</small></div><button class="btn sm buy" data-id="${id}" ${S.gems<c||!ok()?'disabled':''}>💎 ${c}</button></div>`).join('')}
  <h2 class="h2">How to earn gems</h2><ul class="muted earn"><li>Finish a lesson: +5 (perfect lesson: +10)</li><li>Hit your daily goal: +10</li><li>Every 7-day streak: +20</li><li>Mock interview: +2 per correct answer</li><li>Speed challenge: +1 per correct answer</li></ul>`);
  $$('.buy').forEach(b=>b.onclick=()=>{const it=ITEMS.find(x=>x[0]===b.dataset.id);if(S.gems<it[4]||!it[5]())return;S.gems-=it[4];it[6]();S.stats.bought=(S.stats.bought||0)+1;sfx.coin();buzz(20);toast(`${it[1]} ${it[2]} purchased!`);checkBadges();save();shop()})}
// ---------- profile ----------
function profile(){cur='profile';daily();
  const days=[...Array(7)].map((_,i)=>iso(Date.now()-(6-i)*DAY)),mx=Math.max(S.goal,...days.map(d=>S.xpLog[d]||0));
  const week=d=>[...Array(7)].reduce((a,_,i)=>a+(S.xpLog[iso(Date.now()-(i+d)*DAY)]||0),0),tw=week(0),lw=week(7);
  const dow=new Date().getDay(),cal=[...Array(35)].map((_,i)=>{const off=dow+28-i;return off<0?null:iso(Date.now()-off*DAY)}).slice(0);const lv=level();
  const acc=S.stats.answered?Math.round(S.stats.correct/S.stats.answered*100):0;
  const others=Object.values(P.list).filter(p=>p.id!==S.id);
  shell(`<section class="phead"><button class="avatar big" id="edit" aria-label="Edit profile">${S.avatar}</button><div><h1 class="h1" style="margin:0">${esc(S.name)}</h1><small class="muted">Joined ${new Date(S.created).toLocaleDateString()}</small><br><button class="link" id="edit2">Edit profile</button></div></section>
  <div class="lvl"><div class="row"><b>Level ${lv.L}</b><small class="muted">${lv.need-lv.into} XP to level ${lv.L+1}</small></div><div class="bar"><i style="width:${lv.into/lv.need*100}%"></i></div></div>
  <div class="sgrid"><div class="scard">🔥<b>${S.streak}</b>Day streak</div><div class="scard">🏆<b>${S.best}</b>Best streak</div><div class="scard">⚡<b>${S.xp}</b>Total XP</div><div class="scard">💎<b>${S.gems}</b>Gems</div><div class="scard">📚<b>${S.stats.lessons}</b>Lessons</div><div class="scard">🎯<b>${acc}%</b>Accuracy</div></div>
  <button class="pcard" id="recap"><span class="pic">📅</span><span><b>Weekly recap</b><small>Your last 7 days at a glance</small></span></button>
  <h2 class="h2">XP this week</h2><div class="chart" role="img" aria-label="XP for the last 7 days">${days.map(d=>`<div class="col"><span class="v">${S.xpLog[d]||0}</span><div class="b ${(S.xpLog[d]||0)>=S.goal?'met':''}" style="height:${(S.xpLog[d]||0)/mx*100}%"></div><span>${new Date(d+'T12:00').toLocaleDateString(undefined,{weekday:'narrow'})}</span></div>`).join('')}<div class="goalline" style="bottom:calc(${S.goal/mx*100}% * .78 + 22px)"></div></div>
  <div class="league"><b>Weekly league: you vs. last week</b><div class="row"><span>This week</span><b>${tw} XP</b></div><div class="row"><span>Last week</span><b>${lw} XP</b></div><div class="pill ${tw>=lw?'up':''}">${tw>lw?'📈 Promoted pace! Beat last week by '+(tw-lw)+' XP':tw===lw?'Tied with last week':'📉 '+(lw-tw)+' XP to beat last week'}</div></div>
  <h2 class="h2">Streak calendar</h2><div class="cal" role="img" aria-label="Activity calendar, last 5 weeks">${['S','M','T','W','T','F','S'].map(x=>`<span>${x}</span>`).join('')}${cal.map(d=>{if(!d)return '<i class="fut"></i>';const v=S.xpLog[d]||0;return `<i title="${d}: ${v} XP" class="l${v?v>=S.goal?3:v>=S.goal/2?2:1:0} ${d===today()?'today':''}"></i>`}).join('')}</div><div class="legend">Less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> More · goal met = darkest</div>
  <h2 class="h2">Achievements · ${Object.keys(S.badges).length}/${BADGES.length}</h2><div class="badges" role="list">${BADGES.map(([id,ic,n,d,,pr])=>{const got=S.badges[id],pv=!got&&pr?pr():null;return `<div class="badge ${got?'got':''}" role="listitem" aria-label="${esc(n)}: ${esc(d)}. ${got?'Unlocked':'Locked'+(pv?`, ${Math.min(pv[0],pv[1])} of ${pv[1]}`:'')}"><span aria-hidden="true">${got?ic:'🔒'}</span><b>${n}</b><small>${d}</small>${got?`<small class="bdate">✓ ${got>1e12?new Date(got).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Unlocked'}</small>`:pv?`<div class="bprog" aria-hidden="true"><i style="width:${Math.min(100,pv[0]/pv[1]*100)}%"></i></div><small class="bdate">${Math.min(pv[0],pv[1])}/${pv[1]}</small>`:''}</div>`}).join('')}</div>
  <h2 class="h2">Profiles on this device</h2>${others.map(p=>`<div class="sitem"><span class="pic">${p.avatar}</span><div><b>${esc(p.name)}</b><small>${p.xp} XP · 🔥 ${p.streak}</small></div><button class="btn sm alt sw" data-id="${p.id}">Switch</button></div>`).join('')}
  <button class="btn alt" id="addp">＋ Add profile</button>`);
  $('#edit').onclick=$('#edit2').onclick=()=>editProfile(false);$('#recap').onclick=recap;
  $('#addp').onclick=()=>{const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p;save();onboard()};
  $$('.sw').forEach(b=>b.onclick=()=>{P.active=b.dataset.id;S=P.list[P.active];save();daily();toast(`Switched to ${S.name}`);home()});
}
function recap(){cur='profile';daily();
  const ds=[...Array(7)].map((_,i)=>iso(Date.now()-(6-i)*DAY)),xp=d=>S.xpLog[d]||0,tw=ds.reduce((a,d)=>a+xp(d),0),lw=[...Array(7)].reduce((a,_,i)=>a+xp(iso(Date.now()-(i+7)*DAY)),0);
  const act=ds.filter(d=>xp(d)>0).length,best=ds.reduce((b,d)=>xp(d)>xp(b)?d:b,ds[6]),dl7=ds.map(d=>(S.dlog||{})[d]||{l:0,a:0,c:0}),les=dl7.reduce((a,x)=>a+x.l,0),ans=dl7.reduce((a,x)=>a+x.a,0),cor=dl7.reduce((a,x)=>a+x.c,0);
  const wkStart=Date.now()-7*DAY,nb=BADGES.filter(([id])=>S.badges[id]>1e12&&S.badges[id]>wkStart),goals=ds.filter(d=>xp(d)>=S.goal).length,dn=due().length;
  const weak=Object.entries(S.misses).filter(([k])=>lessonOf(k)).sort((a,b)=>b[1]-a[1])[0];
  const msg=!tw?'A fresh week starts with one lesson. Five minutes today keeps the streak alive.':tw>lw?`You beat last week by ${tw-lw} XP. Keep that pace.`:tw===lw?'Same XP as last week: steady wins.':`${lw-tw} XP behind last week, and there is still time to catch up.`;
  shell(`<button class="link" id="bk">‹ Back to profile</button><h1 class="h1">📅 Weekly recap</h1><p class="muted">${new Date(ds[0]+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${new Date(ds[6]+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>
  <div class="rhero"><b>${tw}</b><span>XP this week</span><p>${msg}</p></div>
  <div class="sgrid"><div class="scard">📆<b>${act}/7</b>Active days</div><div class="scard">🎯<b>${goals}</b>Goals hit</div><div class="scard">📚<b>${les}</b>Lessons</div><div class="scard">✅<b>${ans?Math.round(cor/ans*100)+'%':'—'}</b>Accuracy</div><div class="scard">🔥<b>${S.streak}</b>Streak</div><div class="scard">🏅<b>${nb.length}</b>New badges</div></div>
  <h2 class="h2">Highlights</h2><ul class="hl">${tw?`<li>🌟 Best day: <b>${new Date(best+'T12:00').toLocaleDateString(undefined,{weekday:'long'})}</b> with ${xp(best)} XP</li>`:''}${nb.map(([,ic,n])=>`<li>${ic} Unlocked <b>${n}</b></li>`).join('')}<li>${tw>=lw?'📈':'📉'} Last week: ${lw} XP</li>${weak?`<li>🎯 Most-missed topic: <b>${esc(lessonOf(weak[0]).name)}</b></li>`:''}</ul>
  <h2 class="h2">Next week</h2>${dn?`<button class="pcard" id="rr"><span class="pic">🔁</span><span><b>Clear your review queue</b><small>${dn} question(s) due</small></span></button>`:''}<button class="pcard" id="gl"><span class="pic">🌱</span><span><b>Continue learning</b><small>Pick up where you left off</small></span></button>`);
  $('#bk').onclick=profile;$('#gl').onclick=home;$('#rr')&&($('#rr').onclick=practice)}
function editProfile(isNew){let av=S.avatar;
  app.className='';app.innerHTML=`<main class="fade onb"><h1 class="h1">${isNew?'Welcome to ByteRyte 🌱':'Edit profile'}</h1>${isNew?'<p class="muted">Learn the fundamentals behind the code you ship — Java first, with JavaFX, HTML/CSS and Swift branches.</p>':''}
  <label class="lbl" for="nm">Your name</label><input id="nm" class="inp" maxlength="24" value="${esc(S.name==='Learner'&&isNew?'':S.name)}" placeholder="e.g. Alex" autocomplete="nickname">
  <div class="lbl">Pick an avatar</div><div class="avs" role="radiogroup">${AVATARS.map(a=>`<button role="radio" aria-checked="${a===av}" class="avatar ${a===av?'on':''}" data-a="${a}">${a}</button>`).join('')}</div>
  <div class="lbl">Daily goal</div><div class="goals">${[[10,'Casual'],[30,'Regular'],[50,'Serious'],[100,'Intense']].map(([g,n])=>`<button class="opt goal ${S.goal===g?'sel':''}" data-g="${g}"><b>${n}</b> · ${g} XP/day</button>`).join('')}</div>
  ${isNew?`<button class="btn" id="sv">Start from scratch</button><button class="btn alt" id="pl" style="margin-top:12px">Take placement test (skip Java Unit 1)</button>`:`<button class="btn" id="sv">Save</button>${Object.keys(P.list).length>1?'<button class="btn red" id="del" style="margin-top:12px">Delete this profile</button>':''}<button class="btn alt" id="cx" style="margin-top:12px">Cancel</button>`}</main>`;
  $$('.avs .avatar').forEach(b=>b.onclick=()=>{av=b.dataset.a;$$('.avs .avatar').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)})});
  $$('.goal').forEach(b=>b.onclick=()=>{S.goal=+b.dataset.g;$$('.goal').forEach(x=>x.classList.toggle('sel',x===b))});
  const commit=()=>{S.name=($('#nm').value.trim()||'Learner').slice(0,24);S.avatar=av;S.onboarded=true;save()};
  $('#sv').onclick=()=>{commit();isNew?home():profile()};
  $('#cx')&&($('#cx').onclick=profile);
  $('#pl')&&($('#pl').onclick=()=>{commit();const pool=[];lessons(T('java')).filter(x=>x.ui===0).forEach(x=>{const e=x.l.ex.filter(e=>e.t!=='ar');pool.push(...shuffle(e).slice(0,2).map((e)=>({e,k:x.key+'-'+x.l.ex.indexOf(e)})))});start(pool,{name:'Placement test',mode:'placement'})});
  $('#del')&&($('#del').onclick=()=>{if(!confirm(`Delete ${S.name}'s profile? This cannot be undone.`))return;delete P.list[S.id];P.active=Object.keys(P.list)[0];S=P.list[P.active];save();home()});
}
const onboard=()=>editProfile(true);
// ---------- settings ----------
function settings(){cur='settings';daily();
  shell(`<h1 class="h1">Settings</h1>
  <div class="set"><b>Appearance</b><div class="seg" role="radiogroup">${['system','light','dark'].map(t=>`<button role="radio" aria-checked="${G.theme===t}" class="${G.theme===t?'on':''}" data-th="${t}">${{system:'🖥 System',light:'☀️ Light',dark:'🌙 Dark'}[t]}</button>`).join('')}</div></div>
  <div class="set row"><b>Sound effects</b><button class="switch ${G.sound?'on':''}" id="snd" role="switch" aria-checked="${G.sound}" aria-label="Sound effects"><i></i></button></div>
  <div class="set row"><div><b>Larger text</b><p class="muted" style="margin:2px 0 0">Bigger type and buttons for readability</p></div><button class="switch ${G.big?'on':''}" id="big" role="switch" aria-checked="${G.big}" aria-label="Larger text"><i></i></button></div>
  <div class="set row"><b>Unlock all lessons</b><button class="switch ${S.unlockAll?'on':''}" id="ua" role="switch" aria-checked="${S.unlockAll}" aria-label="Unlock all lessons"><i></i></button></div>
  <div class="set"><b>Daily goal</b><div class="seg">${[10,30,50,100].map(g=>`<button class="${S.goal===g?'on':''}" data-g="${g}">${g} XP</button>`).join('')}</div></div>
  <div class="set"><b>Backup</b><p class="muted">Export all profiles to a JSON file, or import one to move progress to another device.</p><div class="row2"><button class="btn sm alt" id="exp">⬇️ Export</button><label class="btn sm alt" for="imp">⬆️ Import</label><input type="file" id="imp" accept="application/json" hidden></div></div>
  <div class="set"><b>Keyboard shortcuts (desktop)</b><p class="muted">1–6 choose an answer (or a code line in Arrange) · Backspace undo last line · Enter check / continue · H 50/50 · S skip · Esc quit</p></div>
  <div class="set"><b>Danger zone</b><button class="btn sm red" id="rs">Reset ${esc(S.name)}'s progress</button></div>
  <p class="note">ByteRyte · original app, not affiliated with any other language-learning brand. All data stays on this device.</p>`);
  $$('[data-th]').forEach(b=>b.onclick=()=>{G.theme=b.dataset.th;saveG();applyTheme();settings()});
  $('#snd').onclick=()=>{G.sound=!G.sound;saveG();settings()};
  $('#big').onclick=()=>{G.big=!G.big;saveG();applyTheme();settings()};
  $('#ua').onclick=()=>{S.unlockAll=!S.unlockAll;save();settings()};
  $$('[data-g]').forEach(b=>b.onclick=()=>{S.goal=+b.dataset.g;save();settings()});
  $('#exp').onclick=()=>{const blob=new Blob([JSON.stringify({app:'ByteRyte',v:2,profiles:P,settings:G},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`byteroots-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
  $('#imp').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if((d.app!=='ByteRyte'&&d.app!=='ByteRoots')||!d.profiles?.list)throw 0;if(!confirm('Replace all profiles on this device with this backup?'))return;P=d.profiles;if(d.settings&&typeof d.settings==='object'){G=Object.assign({theme:'system',sound:true,big:false},d.settings);saveG();applyTheme()}hydrate();if(!S){const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p}save();daily();toast('✅ Progress imported');home()}catch(_){toast('⚠️ That file is not a ByteRyte backup')}})};
  $('#rs').onclick=()=>{if(confirm('Reset all progress for this profile?')){const n=NEWP(S.name,S.avatar);n.id=S.id;n.created=S.created;n.onboarded=true;S=n;save();home()}};
}
// ---------- lesson engine ----------
let R,timerId;
function start(items,opt){
  clearInterval(timerId);daily();if((opt.mode==='lesson'||opt.mode==='practice')&&S.hearts<=0)return outOfHearts();
  R=Object.assign({q:items.slice(),total:items.length,done:0,correct:0,mist:new Set(),res:[],t0:Date.now()},opt);
  if(R.mode==='challenge'||R.mode==='interview'){R.end=Date.now()+R.secs*1000;timerId=setInterval(tick,250)}
  app.className='';if(R.tip){app.innerHTML=`<div class="lhead"><button class="x" id="x" aria-label="Quit">✕</button><div class="bar"><i style="width:0"></i></div></div><main class="fade"><div class="kind">💡 Before you start</div><h1 class="h1">${esc(R.name)}</h1><div class="tip">${esc(R.tip)}</div>${sheetHTML(R.sheet)}<p class="muted">${R.total} exercises · mistakes come back at the end and in Review.</p></main><div class="foot"><div class="in"><button class="btn" id="go">Start lesson</button></div></div>`;
    $('#x').onclick=home;$('#go').onclick=next;$('#go').focus()}else next();
}
function tick(){const left=Math.max(0,R.end-Date.now()),el=$('#tmr');if(el){el.textContent=`⏱ ${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`;el.classList.toggle('warn',left<10000)}if(!left){clearInterval(timerId);finish(true)}}
const timed=()=>R.mode==='challenge'||R.mode==='interview',noHearts=()=>R.mode==='saved'||R.mode==='interview'||R.mode==='challenge'||R.mode==='placement'||R.mode==='review';
function next(){
  daily();
  if(!R.q.length)return finish();
  const {e}=R.q[0],tr=e.tag?`<span class="tag">${e.tag}</span>`:'';let sel=null;
  const pct=timed()?R.done/Math.max(R.done+1,R.mode==='challenge'?R.done+1:R.total)*100:R.done/R.total*100;
  let h=`<div class="lhead"><button class="x" id="x" aria-label="Quit">✕</button><div class="bar" role="progressbar" aria-label="Lesson progress" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>${R.mode==='challenge'?`<span class="stat" aria-live="polite">✅ ${R.correct}</span>`:''}${timed()?`<span class="stat tmr" id="tmr">⏱</span>`:noHearts()?`<span class="stat">${R.done}/${R.total}</span>`:`<span class="stat" id="hs">❤️ ${S.hearts}</span>`}</div>
  <main class="fade qmain"><div class="kind">${NAMES[e.t]} ${tr}${dblOn()?'<span class="tag gold">2× XP</span>':''}</div><h1 class="q">${esc(e.q||'What does this print?')}</h1>`;
  if(e.code)h+=`<pre class="code" tabindex="0" aria-label="Code">${hl(e.code)}</pre>`;
  if(e.t==='fix')h+=`<p class="fixnote">Pick the line that makes this correct.</p>`;
  if(e.t==='ar')h+=`<div class="zone" id="ans" aria-label="Your answer"><span class="ph">Tap lines below in the right order</span></div><div class="zone bank" id="bank"></div>`;
  else{const lst=e.t==='bug'?e.lines.map((x,i)=>[x,i]):shuffle(e.opts.map((x,i)=>[x,i]));
    h+=`<div class="opts" role="radiogroup">`+lst.map(([x,i],n)=>`<button role="radio" aria-checked="false" class="opt ${e.t!=='mc'?'code':''}" data-i="${i}"><kbd>${n+1}</kbd><span>${e.t==='mc'?esc(x):hl(x)}</span></button>`).join('')+`</div>`}
  const pw=R.mode!=='placement'&&R.mode!=='interview';
  h+=`</main><div class="foot" id="ft"><div class="in">${pw?`<div class="pups"><button class="pup" id="ff" ${S.inv.fifty&&e.t!=='ar'&&e.t!=='bug'?'':'disabled'} aria-label="50/50 hint, ${S.inv.fifty||0} left">✂️ 50/50 <b>${S.inv.fifty||0}</b></button><button class="pup" id="sk" ${S.inv.skip?'':'disabled'} aria-label="Skip, ${S.inv.skip||0} left">⏭️ Skip <b>${S.inv.skip||0}</b></button></div>`:''}<button class="btn" id="chk" disabled>Check</button></div></div>`;
  app.className='';app.innerHTML=h;tick&&timed()&&tick();
  $('#x').onclick=quit;
  const chk=$('#chk');
  if(e.t==='ar'){const bank=$('#bank'),ans=$('#ans');
    shuffle(e.lines.map((x,i)=>[x,i])).forEach(([x])=>{const c=document.createElement('button');c.className='chip';c.innerHTML=hl(x);c.dataset.raw=x;c.onclick=()=>{$('.ph')?.remove();(c.parentNode===bank?ans:bank).appendChild(c);chk.disabled=bank.children.length>0;tone(520,.04)};bank.appendChild(c)});
    chk.onclick=()=>judge([...ans.children].map(c=>c.dataset.raw).join('\n')===e.lines.join('\n'),e.lines.join('\n'))}
  else{$$('.opt').forEach(b=>b.onclick=()=>{if(b.disabled)return;$$('.opt').forEach(o=>{o.classList.remove('sel');o.setAttribute('aria-checked','false')});b.classList.add('sel');b.setAttribute('aria-checked','true');sel=+b.dataset.i;chk.disabled=false;tone(520,.04)});
    chk.onclick=()=>{$$('.opt').forEach(o=>{o.disabled=true;if(+o.dataset.i===e.a)o.classList.add('right');else if(+o.dataset.i===sel)o.classList.add('wrong')});
      judge(sel===e.a,e.t==='bug'?`Line ${e.a+1}: ${e.lines[e.a].trim()}`:e.opts[e.a])}}
  if($('#ff'))$('#ff').onclick=()=>{if(!S.inv.fifty)return;const wrong=shuffle($$('.opt').filter(o=>+o.dataset.i!==e.a&&!o.disabled)).slice(0,2);wrong.forEach(o=>{o.disabled=true;o.classList.add('gone');o.classList.remove('sel')});if(wrong.some(o=>+o.dataset.i===sel)){sel=null;chk.disabled=true}S.inv.fifty--;save();$('#ff').disabled=true;$('#ff b').textContent=S.inv.fifty;buzz(12)};
  if($('#sk'))$('#sk').onclick=()=>{S.inv.skip--;save();R.q.shift();R.done++;R.res.push({e,ok:null});toast('⏭️ Skipped');next()};
}
function quit(){if(confirm('Quit? Progress in this session will be lost.')){clearInterval(timerId);R=null;home()}}
function judge(ok,ans){
  const it=R.q.shift(),{e,k}=it,first=!R.mist.has(k);
  S.stats.answered++;if(ok)S.stats.correct++;{const x=dl();x.a++;if(ok)x.c++}
  R.res.push({e,ok,first});
  if(ok){R.done++;if(first){R.correct++;qBump('correct')}sfx.ok();buzz(15);
    if(S.review[k]&&first){const b=S.review[k].box+1;if(b>3)delete S.review[k];else S.review[k]={box:b,due:Date.now()+[0,1,3,7][b]*DAY}}}
  else{R.mist.add(k);sfx.no();buzz([40,40,60]);S.review[k]={box:0,due:Date.now()};
    const lk=k.split('-').slice(0,3).join('-');if(!k.startsWith('iv'))S.misses[lk]=(S.misses[lk]||0)+1;
    if(!timed()&&R.mode!=='placement'&&R.mode!=='review')R.q.push(it);else R.done++;
    if(!noHearts()){if(S.hearts>=5)S.heartAt=Date.now();S.hearts=Math.max(0,S.hearts-1)}
    $('.qmain').classList.add('shake');if($('#hs'))$('#hs').textContent='❤️ '+S.hearts}
  if(R.mode==='practice'&&ok&&first&&R.pk&&S.misses[R.pk]){S.misses[R.pk]--;if(!S.misses[R.pk])delete S.misses[R.pk]}
  save();
  if(R.mode==='challenge'){if(ok)qBump('chal');document.body.classList.remove('fl-ok','fl-no');void document.body.offsetWidth;document.body.classList.add(ok?'fl-ok':'fl-no');if(!ok)toast('✗ '+(e.t==='bug'?'Line '+(e.a+1):e.t==='ar'?'Wrong order':e.opts[e.a]));return next()}
  const ft=$('#ft');ft.className='foot sheet '+(ok?'ok':'no');ft.setAttribute('role','alert');
  ft.innerHTML=`<div class="in"><h2 class="fbh">${ok?['Nice!','Correct!','You got it!','Solid!','Exactly!'][Math.random()*5|0]:'Not quite'}</h2>${ok?'':`<p class="ca"><b>Correct answer:</b></p><pre class="code sm" tabindex="0">${hl(ans)}</pre>`}<p>${esc(e.why)}</p><div class="fbx">${docLink(docUrl(k))}<button class="bm" id="bm" aria-pressed="${!!S.saved[k]}">${S.saved[k]?'★ Saved':'☆ Save question'}</button></div><button class="btn ${ok?'':'red'}" id="cont">Continue</button></div>`;
  $('#bm').onclick=()=>{if(S.saved[k])delete S.saved[k];else S.saved[k]=Date.now();save();const on=!!S.saved[k];$('#bm').textContent=on?'★ Saved':'☆ Save question';$('#bm').setAttribute('aria-pressed',on);if(on){S.stats.saved=(S.stats.saved||0)+1;checkBadges()}};
  requestAnimationFrame(()=>requestAnimationFrame(()=>ft.classList.add('show')));
  $('#cont').focus({preventScroll:true});
  $('#cont').onclick=()=>{if(!ok&&!noHearts()){daily();if(S.hearts<=0){clearInterval(timerId);return outOfHearts()}}next()};
}
function outOfHearts(){daily();if(S.hearts>0)return home();shell(`<div class="center"><div class="big">💔</div><h1 class="h1">Out of hearts</h1><p class="muted">You get 1 heart back every 30 minutes${nextHeart()?` (next in <b>${nextHeart()}</b>)`:''}, and all 5 at midnight. Review, interviews and speed challenges don't cost hearts.</p><button class="btn" id="buyh" ${S.gems<30?'disabled':''}>Refill for 💎 30</button><button class="btn alt" id="pr" style="margin-top:12px">Practice mistakes instead</button></div>`);
  $('#buyh').onclick=()=>{if(S.gems<30)return;S.gems-=30;S.hearts=5;S.heartAt=null;S.stats.bought=(S.stats.bought||0)+1;sfx.coin();checkBadges();save();home()};$('#pr').onclick=practice}
function finish(timeUp){
  clearInterval(timerId);if(!R)return;daily();const m=R.mode;
  let xp=0,gem=0,title='Lesson complete!',extra='';
  const answered=R.res.filter(r=>r.ok!==null).length;
  const skipped=R.res.some(r=>r.ok===null);
  if(m==='lesson'){S.done[R.key]=true;S.stats.lessons++;dl().l++;xp=10+R.correct*2;gem=5;if(!R.mist.size&&!skipped){S.stats.perfect++;gem=10;xp+=5;qBump('perfect')}qBump('lessons')}
  else if(m==='review'){S.stats.reviews++;xp=5+R.correct;title='Review complete!';qBump('review');S.hearts=Math.min(5,S.hearts+1);extra='<p class="muted">+1 ❤️ for reviewing</p>'}
  else if(m==='practice'||m==='saved'){xp=5+R.correct;title='Practice complete!';qBump('review')}
  else if(m==='challenge'){title=timeUp?'Time\'s up!':'Challenge complete!';xp=R.correct*2;gem=R.correct;S.stats.challenges++;if(R.correct>(S.stats.bestChal||0)){S.stats.bestChal=R.correct;extra='<p class="pill up">🎉 New personal best!</p>'}}
  else if(m==='placement'){title='Placement result';const pass=R.correct>=Math.ceil(R.total*.8);if(pass)lessons(T('java')).filter(x=>x.ui===0).forEach(x=>S.done[x.key]=true);xp=R.correct;extra=pass?'<p class="pill up">✅ Java Unit 1 unlocked as complete — branches are open!</p>':'<p class="muted">Let\'s start from the foundations — they\'ll go fast.</p>'}
  if(m==='interview')return ivSummary(timeUp);
  const acc=answered?Math.round(R.correct/(m==='lesson'||m==='practice'||m==='saved'?R.total:answered)*100):0;
  const lv0=level().L;xp=addXP(xp);if(gem)S.gems+=gem;const lv1=level().L;if(lv1>lv0){S.gems+=20;extra+=`<p class="pill lvup">🆙 Level up! You reached level ${lv1} · +20 💎</p>`}checkBadges();save();sfx.win();buzz([30,50,30]);const secs=Math.round((Date.now()-R.t0)/1000);
  shell(`<div class="center finish"><div class="trophy" aria-hidden="true"><div class="big">${m==='challenge'?'⏱️':m==='placement'?'🧭':'🏆'}</div></div><h1 class="h1">${title}</h1><p class="muted">${esc(R.name)}</p>
  <div class="cards"><div class="card xp">⚡<b>+${xp}</b>XP</div><div class="card">${m==='challenge'?'✅':'🎯'}<b>${m==='challenge'?R.correct:acc+'%'}</b>${m==='challenge'?'correct':'accuracy'}</div><div class="card gem">💎<b>+${gem}</b>gems</div></div>${extra}<p class="muted sm">⏱ ${Math.floor(secs/60)}m ${secs%60}s</p>
  ${R.mist.size&&m!=='placement'?`<p class="muted">${R.mist.size} missed question(s) saved to Review.</p>`:m==='lesson'&&!skipped?'<p class="pill up">Flawless — 10 gems</p>':''}</div>`,{nav:false});
  app.insertAdjacentHTML('beforeend','<div class="foot"><div class="in"><button class="btn" id="h">Continue</button></div></div>');$('#h').onclick=home;$('#h').focus();
  confetti();
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
  app.insertAdjacentHTML('beforeend','<div class="foot"><div class="in"><button class="btn" id="h">Done</button></div></div>');$('#h').onclick=ivHome;
  if(pct>=70)confetti();
}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<48;i++){const c=document.createElement('div');c.className='conf';c.style.left=Math.random()*100+'vw';c.style.background=['#16a34a','#f97316','#0ea5e9','#8b5cf6','#facc15','#ef4444'][i%6];c.style.animationDelay=Math.random()*.6+'s';c.style.animationDuration=1.4+Math.random()+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),3200)}}
// ---------- keyboard ----------
document.addEventListener('keydown',ev=>{if(ev.target.tagName==='INPUT')return;const k=ev.key;
  if(/^[1-9]$/.test(k)&&$('#bank')){const c=$$('#bank .chip')[+k-1];if(c){c.click();ev.preventDefault()}return}
  if(k==='Backspace'&&$('#ans')){const c=[...$$('#ans .chip')].pop();if(c){c.click();ev.preventDefault()}return}
  if(/^[1-9]$/.test(k)){const o=$$('.opt')[+k-1];if(o&&!o.disabled){o.click();ev.preventDefault()}}
  else if(k==='Enter'){const b=$('#cont')||(!$('#chk')?.disabled&&$('#chk'))||$('#go')||$('#h');if(b&&document.activeElement!==b){b.click();ev.preventDefault()}}
  else if(k==='Escape'&&$('#x'))$('#x').click();
  else if((k==='h'||k==='H')&&$('#ff')&&!$('#ff').disabled)$('#ff').click();
  else if((k==='s'||k==='S')&&$('#sk')&&!$('#sk').disabled&&!$('#cont'))$('#sk').click()});
// ---------- boot ----------
if(!S){const p=NEWP();P.list[p.id]=p;P.active=p.id;S=p;save()}
daily();
S.onboarded?home():onboard();
window.__BR={get S(){return S},P:()=>P,cur:()=>R&&R.q[0]&&R.q[0].e};
})();
