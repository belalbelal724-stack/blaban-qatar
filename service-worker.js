const VERSION = 'blaban-v5-' + Date.now();
const CACHE_STATIC = ${VERSION}-static;
const CACHE_DYNAMIC = ${VERSION}-dynamic;
const STATIC_ASSETS = ['./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./icon-maskable-512.png'];

self.addEventListener('install', e => {
  console.log('[SW] Install:', VERSION);
  e.waitUntil(caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()).catch(err => console.warn('[SW]', err)));
});

self.addEventListener('activate', e => {
  console.log('[SW] Activate:', VERSION);
  e.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_STATIC && n !== CACHE_DYNAMIC)
           .map(n => { console.log('[SW] Delete old:', n); return caches.delete(n); })
    ))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.host.includes('firebasedatabase.app') || url.host.includes('firebaseio.com') || (url.host.includes('googleapis.com') && url.pathname.includes('firebase'))) return;
  if (url.host.includes('supabase.co') || url.host.includes('supabase.in')) return;
  
  if (url.origin === self.location.origin) {
    if (req.destination === 'document' || (req.headers.get('accept')||'').includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
      e.respondWith(networkFirstHTML(req)); return;
    }
    e.respondWith(cacheFirst(req)); return;
  }
});

async function networkFirstHTML(req) {
  try {
    const r = await fetch(req, { cache: 'no-store' });
    if (r.ok) { const c = await caches.open(CACHE_STATIC); c.put(req, r.clone()); }
    return r;
  } catch(e) {
    const c = await caches.open(CACHE_STATIC);
    const cached = await c.match(req) || await c.match('./index.html') || await c.match('./');
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE_STATIC);
  const cached = await c.match(req);
  if (cached) return cached;
  const r = await fetch(req);
  if (r.ok) c.put(req, r.clone());
  return r;
}

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_CACHE') caches.keys().then(n => Promise.all(n.map(k => caches.delete(k)))).then(() => e.ports[0]?.postMessage({ok:true}));
});