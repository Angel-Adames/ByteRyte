const C='byteryte-v9',F=['./','index.html','style.css','app.js','data.js','interview.js','manifest.webmanifest','icons/icon.svg','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET')return;
  let same=false;try{same=new URL(q.url).origin===location.origin}catch(err){return}
  if(!same)return;
  e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q)).catch(()=>q.mode==='navigate'?caches.match('./').then(r=>r||caches.match('index.html')):caches.match('index.html')));
});
