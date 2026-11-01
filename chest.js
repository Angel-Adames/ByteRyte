(()=>{
'use strict';
const $=s=>document.querySelector(s);
const CSS=`
.loot{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(8,12,20,.62)}
.lootbox{width:min(360px,100%);background:var(--card);color:var(--ink);border:2px solid var(--line);border-radius:24px;padding:22px 18px 18px;text-align:center;box-shadow:0 16px 50px rgba(0,0,0,.28)}
.lid{width:148px;height:110px;margin:8px auto 12px;border-radius:18px 18px 12px 12px;background:linear-gradient(160deg,#fbbf24,#d97706);position:relative;box-shadow:0 8px 0 #92400e}
.lid::before{content:"";position:absolute;left:18px;right:18px;top:16px;height:22px;border-radius:8px;background:rgba(255,255,255,.35)}
.lid::after{content:"";position:absolute;left:50%;top:46px;width:28px;height:28px;margin-left:-14px;border-radius:50%;background:#fff7ed;box-shadow:0 0 0 6px rgba(255,255,255,.35)}
.loot[data-stage=shake] .lid{animation:cshake .9s ease-in-out}
.loot[data-stage=burst] .lid{animation:cburst .6s ease-out forwards;filter:drop-shadow(0 0 18px #fde68a)}
.loot[data-stage=reveal] .lid{transform:scale(1.04);filter:drop-shadow(0 0 12px #fde68a)}
.loot[data-tier=common] .lid{background:linear-gradient(160deg,#cbd5e1,#64748b);box-shadow:0 8px 0 #334155}
.loot[data-tier=rare] .lid{background:linear-gradient(160deg,#7dd3fc,#0284c7);box-shadow:0 8px 0 #075985}
.loot[data-tier=epic] .lid{background:linear-gradient(160deg,#d8b4fe,#7c3aed);box-shadow:0 8px 0 #5b21b6}
.loot[data-tier=legendary] .lid{background:linear-gradient(160deg,#fde68a,#f59e0b 40%,#f97316);box-shadow:0 8px 0 #9a3412}
@keyframes cshake{15%{transform:rotate(-16deg) scale(1.06)}35%{transform:rotate(16deg) scale(1.1)}55%{transform:rotate(-12deg) scale(1.06)}75%{transform:rotate(12deg)}100%{transform:rotate(0)}}
@keyframes cburst{30%{transform:scale(1.45) rotate(8deg)}100%{transform:scale(1.05)}}
.loot h2{margin:8px 0 4px;font-size:28px}
.gems{font-size:40px;font-weight:900;margin:0}
.odds{font-size:13px;color:var(--mut);line-height:1.4;margin:10px 0}
.loot .btn{margin-top:10px}
.loot[data-calm] .lid{animation:none}
.loot[data-calm] .lootbox{animation:cfade .25s ease-out}
@keyframes cfade{from{opacity:0}to{opacity:1}}
`;
function css(){if($('#chestcss'))return;const s=document.createElement('style');s.id='chestcss';s.textContent=CSS;document.head.appendChild(s)}
function oddsText(odds){if(!odds)return '';const names=['Common','Rare','Epic','Legendary'];return 'Next roll: '+odds.map((n,i)=>names[i]+' '+n+'%').join(' · ')}
function model(){
  const S=window.__BR.S,L=S.qd&&S.qd.loot;if(!L)return null;
  const name=L.tier.charAt(0).toUpperCase()+L.tier.slice(1);
  const left=Math.max(0,3-L.used);
  return {tier:L.tier,name,gems:L.gems,used:L.used,left,odds:left?window.__BR.loot.odds(L.used+1):null,claimed:!!L.claimed,calm:document.documentElement.hasAttribute('data-reduce')};
}
function paint(stage){
  css();
  const m=model();if(!m)return;
  let root=$('#loot');
  if(!root){root=document.createElement('div');root.id='loot';root.className='loot';document.body.appendChild(root)}
  root.dataset.stage=stage;root.dataset.tier=m.tier;root.dataset.calm=m.calm?'1':'0';
  const reveal=stage==='reveal';
  root.innerHTML=`<div class="lootbox" role="dialog" aria-modal="true" aria-label="Daily chest"><div class="lid" aria-hidden="true"></div>${reveal?`<p class="muted">Today's chest</p><h2>${m.name}</h2><p class="gems">${m.gems} gems</p><p class="odds" id="codds">${m.left?oddsText(m.odds):'No rerolls left'}</p><button type="button" class="btn" id="creroll" ${m.left?'':'disabled'}>Reroll${m.left?' · '+m.left+' left':''}</button><button type="button" class="btn alt" id="ckeep">Keep</button>`:`<p class="muted">${stage==='shake'?'Shaking the latch…':'The lid gives way…'}</p>`}</div>`;
  if(!reveal)return;
  const reroll=$('#creroll'),keep=$('#ckeep');
  if(reroll)reroll.onclick=()=>{const r=window.__BR.chest.reroll();paint('reveal');if(r&&r.kept){const note=$('#codds');const now=model();if(note&&now)note.textContent+=' · Kept '+now.name+'.'}window.__BR.fx&&window.__BR.fx()};
  if(keep)keep.onclick=()=>{if(!window.__BR.chest.claim())return;const now=model();root.innerHTML=`<div class="lootbox" role="dialog" aria-label="Chest kept"><h2>Kept</h2><p class="gems">${now.gems} gems</p><p class="muted">Added once. This chest will not pay again today.</p><button type="button" class="btn" id="cdone">Done</button></div>`;$('#cdone').onclick=()=>{root.remove();location.reload()}};
}
function show(){
  const m=model();if(!m)return;
  if(m.claimed){paint('reveal');return}
  const calm=m.calm;
  paint(calm?'reveal':'shake');
  if(calm){window.__BR.fx&&window.__BR.fx();return}
  setTimeout(()=>paint('burst'),900);
  setTimeout(()=>{paint('reveal');window.__BR.fx&&window.__BR.fx()},1600);
}
window.CHEST={show};
})();
