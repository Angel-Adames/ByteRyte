(()=>{
'use strict';
const LINES=['hello, world','welcome to ByteRyte',"let's write some code"];
const WHY=[['career','Career','Job hunting'],['school','School','Class or homework'],['app','Build an app','Something of my own'],['interviews','Interviews','Practice screens'],['curiosity','Curiosity','Just want to know'],['other','Something else','None of these']];
const EXP=[['new','New to coding'],['basics','Know some basics'],['vibe','Vibe coded, want the fundamentals'],['brush','Comfortable, brushing up']];
const GOALS=[[20,'Casual','5 min'],[50,'Regular','10 min'],[100,'Serious','15 min'],[150,'Intense','20 min']];
const MIN={20:'5 min',50:'10 min',100:'15 min',150:'20 min'};
let timer=0,done=false;
const A=()=>window.__BR.courseUi;
const calm=()=>document.documentElement.hasAttribute('data-reduce')||matchMedia('(prefers-reduced-motion: reduce)').matches;
function css(){if(document.getElementById('obcss'))return;const s=document.createElement('style');s.id='obcss';s.textContent='.term{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;background:var(--codebg);color:#e2e8f0;border-radius:16px;padding:16px;min-height:168px;line-height:1.7;margin:8px 0 18px;cursor:pointer}.term .chrome{display:flex;gap:6px;align-items:center;margin:0 0 12px;color:#94a3b8;font-size:12px}.term .chrome b{margin-left:4px;font-weight:650}.term .chrome i{width:9px;height:9px;border-radius:50%;background:#334155}.term .chrome i:first-child{background:var(--gt)}.term .tline{display:block;white-space:pre;overflow-wrap:normal;word-break:normal;opacity:.38;transition:opacity .35s}.term .tline.on{opacity:1}.caret{display:inline-block;width:9px;height:1.05em;background:var(--gt);margin-left:2px;vertical-align:-3px}html:not([data-reduce]) .caret{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}.obar{height:8px;background:var(--line);border-radius:9px;overflow:hidden;margin:4px 0 16px}.obar i{display:block;height:100%;background:var(--g)}.oback{margin-bottom:8px}.ccards{display:grid;gap:10px}.ccard{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:14px;cursor:pointer}.ccard.on{border-color:var(--g);background:var(--gl)}.ccard b{display:block}.ccard small{display:block;color:var(--mut)}#welcome{cursor:pointer}';document.head.appendChild(s)}
function stop(){if(timer){clearInterval(timer);clearTimeout(timer);timer=0}}
function bar(n){return `<div class="obar" role="progressbar" aria-label="Question ${n} of 4" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${n}"><i style="width:${n*25}%"></i></div>`}
function frame(step,title,body,back){
  css();
  const a=A();
  a.cur('welcome');
  const app=a.app();
  app.className='';
  app.innerHTML=`<main class="fade onb">${back?`<button class="link oback" id="oback" type="button">Back</button>`:''}${bar(step)}<h1 class="h1">${title}</h1>${body}<button class="btn" id="ogo" type="button" disabled>Continue</button>${step<3?'<button class="btn alt" id="oskip" type="button" style="margin-top:12px">Skip question</button>':''}</main>`;
  if(back)a.q('#oback').onclick=()=>{if(a.once(a.q('#oback')))back()};
}
function choices(step,title,key,opts,next,back){
  const a=A();
  frame(step,title,`<div class="ccards">${opts.map(o=>`<button type="button" class="ccard" data-v="${o[0]}" aria-pressed="false"><span><b>${a.esc(o[1])}</b>${o[2]?`<small>${a.esc(o[2])}</small>`:''}</span></button>`).join('')}</div>`,back);
  let pick='';
  a.qq('.ccard').forEach(b=>b.onclick=()=>{pick=b.dataset.v;a.qq('.ccard').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});a.q('#ogo').disabled=false});
  a.q('#ogo').onclick=()=>{if(!pick||!a.once(a.q('#ogo')))return;a.S()[key]=pick;a.save();next()};
  const sk=a.q('#oskip');if(sk)sk.onclick=()=>{if(a.once(sk))next()};
}
function why(){choices(1,'Why do you want to learn to code?','why',WHY,exp,()=>welcome(true))}
function exp(){choices(2,'How much coding experience do you have?','exp',EXP,()=>A().pick('first'),why)}
function goal(){
  const a=A();
  frame(4,'What is your daily goal?','<div class="ccards">'+GOALS.map(([g,n,m])=>`<button type="button" class="ccard" data-g="${g}" aria-pressed="false"><span><b>${n}</b><small>${m} · ${g} XP</small></span></button>`).join('')+'</div>',()=>a.pick('more'));
  let g=0;
  a.qq('.ccard').forEach(b=>b.onclick=()=>{g=+b.dataset.g;a.qq('.ccard').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});a.q('#ogo').disabled=false});
  a.q('#ogo').onclick=()=>{if(!g||!a.once(a.q('#ogo')))return;a.S().goal=g;a.save();finish()};
}
function finish(){
  const a=A(),S=a.S(),t=a.T(S.track),mins=MIN[S.goal]||'a daily goal';
  css();
  a.cur('welcome');
  a.app().className='';
  a.app().innerHTML=`<main class="fade onb"><h1 class="h1">You're all set</h1><p class="muted">${a.esc(t?t.name:'Java')}, ${mins} a day.${S.why?' Learning for: '+S.why+'.':''}</p><button class="btn" id="ogo" type="button">Continue</button></main>`;
  a.q('#ogo').onclick=()=>{if(a.once(a.q('#ogo')))a.edit()};
}
function welcome(replay){
  stop();done=false;
  css();
  const a=A();
  a.cur('welcome');
  a.hist({screen:'welcome'});
  const app=a.app();
  app.className='';
  const said=LINES.join('. ');
  app.innerHTML=`<main class="fade onb" id="welcome" tabindex="0"><h1 class="sr">Welcome to ByteRyte</h1><div class="sr" aria-live="polite">${said}</div><div class="term" id="term" aria-hidden="true"><div class="chrome"><i></i><i></i><i></i><b>hello.js</b></div><div id="lines"></div></div><button class="btn alt" id="wskip" type="button">Skip welcome</button></main>`;
  const box=a.q('#lines');
  const go=()=>{if(done)return;done=true;stop();why()};
  a.q('#wskip').onclick=e=>{e.stopPropagation();if(a.once(a.q('#wskip')))go()};
  a.q('#welcome').onclick=()=>go();
  a.q('#welcome').onkeydown=e=>{if(e.key==='Enter'||e.key==='Escape'||e.key===' '){e.preventDefault();go()}};
  a.q('#wskip').focus();
  const paint=()=>{box.innerHTML=LINES.map((l,i)=>`<div class="tline${i===LINES.length-1?' on':''}">&gt; ${l}${i===LINES.length-1?'<i class="caret"></i>':''}</div>`).join('')};
  if(replay||calm()){paint();return}
  let li=0,ci=0;const rows=[];
  const tick=()=>{
    if(done)return;
    if(li>=LINES.length){stop();timer=setTimeout(go,700);return}
    const line=LINES[li];
    if(!ci){rows.forEach(r=>r.classList.remove('on'));const d=document.createElement('div');d.className='tline';box.appendChild(d);rows.push(d)}
    if(ci===1)rows[li].classList.add('on');
    rows[li].innerHTML='&gt; '+line.slice(0,ci)+(ci<=line.length?'<i class="caret"></i>':'');
    if(ci===1&&window.__BR.aud().sound)window.__BR.fx(880);
    if(++ci>line.length){li++;ci=0}
  };
  tick();timer=setInterval(tick,62);
}
window.ONBOARD={welcome,goal,why,exp};
})();
