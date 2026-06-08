// B Laban Qatar — Service Worker v7
const VERSION = 'blaban-v7-2026-06-08';
const CACHE_NAME = 'blaban-cache-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  console.log('[SW] Installing ' + VERSION);
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating ' + VERSION);
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: VERSION }));
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip non-GET, cross-origin, Firebase, Supabase
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('supabase') || url.hostname.includes('firebase')) return;
  if (url.origin !== self.location.origin) return;
  
  // Network-first for HTML
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(()=>{});
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
    );
    return;
  }
  
  // Cache-first for assets
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(r2 => {
      const copy = r2.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(()=>{});
      return r2;
    }))
  );
});

// Notification click → focus or open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      if ('focus' in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  })());
});
