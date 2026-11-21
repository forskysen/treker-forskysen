const C='habits-v4';
const CDN=['cdnjs.cloudflare.com','cdn.jsdelivr.net'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon-192.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  const same=u.origin===self.location.origin;
  // Never touch API/auth traffic (Supabase, Google, etc.): only our own files and the two script CDNs
  if(!same&&!CDN.includes(u.hostname))return;
  if(req.mode==='navigate'){
    // pages: network first (new releases arrive immediately), cached copy only when offline
    e.respondWith(fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(u.origin+u.pathname,cp))}return r}).catch(()=>caches.match(u.origin+u.pathname).then(h=>h||caches.match('./')||caches.match('index.html'))));
    return;
  }
  // static files: stale-while-revalidate
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
