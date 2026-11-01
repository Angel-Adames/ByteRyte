(()=>{
'use strict';
const COURSES=[['java','Java','Types, objects, and the JDK.'],['javafx','JavaFX','Windows and controls with OpenJFX.'],['css','HTML & CSS','Pages, layout, and the box model.'],['swift','Swift','Optionals, values, and SwiftUI.']];
const CSS=`.ccards{display:grid;gap:10px;margin:14px 0}.ccard{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:14px;cursor:pointer;box-shadow:0 3px 0 var(--line)}.ccard.on{border-color:var(--g);background:var(--gl);box-shadow:0 3px 0 var(--gd)}.ccard b{display:block;font-size:18px}.ccard small{display:block;color:var(--mut);font-weight:650;font-size:14px;line-height:1.35}.cico{flex:none;width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--bg2);font-size:26px}.cmenu{position:absolute;top:100%;right:8px;z-index:40;background:var(--card);color:var(--ink);border:2px solid var(--line);border-radius:14px;padding:8px;display:grid;gap:6px;min-width:200px;box-shadow:0 12px 30px rgba(0,0,0,.18)}.cmenu button{text-align:left;border:0;background:transparent;color:inherit;font-weight:800;padding:10px 12px;border-radius:10px;cursor:pointer;min-height:44px}.cmenu button[aria-current=true]{background:var(--gl);color:var(--gt)}`;
function css(){if(document.getElementById('coursecss'))return;const s=document.createElement('style');s.id='coursecss';s.textContent=CSS;document.head.appendChild(s)}
function pick(mode){
  const A=window.__BR.courseUi,S=A.S();
  A.cur('courses');
  if(mode==='first'&&!A.needs())return A.edit();
  const have=new Set(S.courses||[]);
  const list=COURSES.filter(([id])=>mode==='first'||!have.has(id));
  if(mode==='add'&&!list.length){A.toast('Every course is already added');return A.land('learn')}
  css();
  const chosen=new Set();
  A.hist({screen:'courses'});
  const app=A.app();
  app.className='';
  app.innerHTML=`<main class="fade onb"><h1 class="h1">${mode==='first'?'What do you want to learn first?':mode==='more'?'Want to add another?':'Add a course'}</h1><p class="muted">${mode==='first'?'Pick one course. You can add more in a moment.':'Switch between courses anytime from the header.'}</p><div class="ccards">${list.map(([id,name,desc])=>{const t=A.T(id);return `<button type="button" class="ccard" data-course="${id}" aria-pressed="false" aria-label="${A.esc(name)}. ${A.esc(desc)}"><span class="cico" aria-hidden="true">${t?t.icon:''}</span><span><b>${A.esc(name)}</b><small>${A.esc(desc)}</small></span></button>`}).join('')}</div><button class="btn" id="cgo" ${mode==='first'?'disabled':''}>${mode==='first'?'Continue':'Add these'}</button>${mode!=='first'?'<button class="btn alt" id="cskip" type="button" style="margin-top:12px">Skip</button>':''}</main>`;
  const $=A.q,$$=A.qq;
  $$('.ccard').forEach(b=>b.onclick=()=>{const id=b.dataset.course;if(mode==='first'){chosen.clear();$$('.ccard').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-pressed','false')})}if(chosen.has(id)){chosen.delete(id);b.classList.remove('on');b.setAttribute('aria-pressed','false')}else{chosen.add(id);b.classList.add('on');b.setAttribute('aria-pressed','true')}$('#cgo').disabled=!chosen.size});
  if(mode!=='first')$('#cgo').disabled=true;
  $('#cgo').onclick=()=>{if(!chosen.size||!A.once($('#cgo')))return;const ids=[...chosen];if(mode==='first'){A.adopt(ids[0],true);A.save();pick('more');return}ids.forEach(id=>A.adopt(id,false));if(mode==='add')A.adopt(ids[0],true);A.save();if(mode==='more')A.edit();else A.land('learn')};
  const sk=$('#cskip');if(sk)sk.onclick=()=>{if(!A.once(sk))return;if(mode==='more')A.edit();else A.land('learn')};
}
function menu(b){
  const A=window.__BR.courseUi,S=A.S();
  css();
  const old=document.getElementById('cmenu');
  if(old){old.remove();b.setAttribute('aria-expanded','false');return}
  const tracks=(S.courses||[]).map(id=>A.T(id)).filter(Boolean);
  const m=document.createElement('div');
  m.id='cmenu';m.className='cmenu';m.setAttribute('role','menu');
  m.innerHTML=tracks.map(t=>`<button type="button" role="menuitem" data-course="${t.id}" ${t.id===S.track?'aria-current="true"':''}>${t.icon} ${A.esc(t.name)}</button>`).join('')+'<button type="button" role="menuitem" id="addc">Add a course</button>';
  b.parentElement.appendChild(m);
  b.setAttribute('aria-expanded','true');
  m.onclick=e=>{const t=e.target.closest('[data-course]');if(t){if(!(S.courses||[]).includes(t.dataset.course))A.adopt(t.dataset.course,true);else S.track=t.dataset.course;A.save();m.remove();A.home();return}if(e.target.id==='addc'){m.remove();b.setAttribute('aria-expanded','false');pick('add')}};
}
window.COURSES_UI={pick,menu};
})();
