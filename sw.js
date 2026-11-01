const C='byteryte-v32',F=['./','index.html','style.css','app.js','data.js','interview.js','grade.js','rytia.js','boot.js','manifest.webmanifest','icons/icon.svg','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
const APP=new Set(F.map(f=>f.replace(/^\.\//,'')));
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const keys=await caches.keys(),old=keys.filter(k=>k!==C);
  await Promise.all(old.map(k=>caches.delete(k)));
  await self.clients.claim();
  if(!old.length)return;
  const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of all)c.postMessage({type:'byteryte-reload'});
})())});
function appFile(url,req){if(req.mode==='navigate')return true;const name=url.pathname.split('/').pop();return !name||APP.has(name)}
function fromCache(req){return caches.match(req,{ignoreSearch:true}).then(hit=>{if(hit)return hit;if(req.mode!=='navigate')throw new Error('offline');return caches.match('./').then(r=>r||caches.match('index.html'))})}
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET')return;
  let url;try{url=new URL(q.url)}catch(err){return}
  if(url.origin!==location.origin)return;
  if(!appFile(url,q)){e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q)).catch(()=>{if(q.mode!=='navigate')throw new Error('offline');return caches.match('./').then(r=>r||caches.match('index.html'))}));return}
  e.respondWith(fetch(q).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(C).then(c=>c.put(q,copy)).catch(()=>{})}
    if(res&&res.ok)return res;
    return fromCache(q).catch(()=>res);
  }).catch(()=>fromCache(q)));
});
