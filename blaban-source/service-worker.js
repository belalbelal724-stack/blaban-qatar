// B Laban Qatar — Service Worker v3 (network-first for HTML to avoid stale)
const VERSION = 'blaban-v3-2026-05-23';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_DYNAMIC = `${VERSION}-dynamic`;

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-maskable-512.png'
];

const CDN_PATTERNS = [
  /https:\/\/cdnjs\.cloudflare\.com\//,
  /https:\/\/fonts\.googleapis\.com\//,
  /https:\/\/fonts\.gstatic\.com\//,
  /https:\/\/www\.gstatic\.com\/firebasejs\//,
  /https:\/\/cdn\.jsdelivr\.net\//
];

self.addEventListener('install', event => {
  console.log('[SW] Install:', VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate:', VERSION);
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(n => !n.startsWith(VERSION))
             .map(n => { console.log('[SW] Deleting old cache:', n); return caches.delete(n); })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.host.includes('firebasedatabase.app') || url.host.includes('firebaseio.com') ||
      (url.host.includes('googleapis.com') && url.pathname.includes('firebase'))) return;
  if (url.host.includes('supabase.co') || url.host.includes('supabase.in')) return;
  
  if (url.origin === self.location.origin) {
    if (req.destination === 'document' || 
        (req.headers.get('accept') || '').includes('text/html') ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/' || url.pathname.endsWith('/')) {
      event.respondWith(networkFirstHTML(req));
      return;
    }
    event.respondWith(cacheFirst(req));
    return;
  }
  if (CDN_PATTERNS.some(p => p.test(req.url))) {
    event.respondWith(networkFirst(req));
    return;
  }
});

async function networkFirstHTML(req) {
  try {
    const response = await fetch(req, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(req, response.clone());
    }
    return response;
  } catch(err) {
    const cache = await caches.open(CACHE_STATIC);
    const cached = await cache.match(req) || await cache.match('./index.html') || await cache.match('./');
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const response = await fetch(req);
    if (response.ok) cache.put(req, response.clone());
    return response;
  } catch(err) { throw err; }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_DYNAMIC);
  try {
    const response = await fetch(req);
    if (response.ok) cache.put(req, response.clone());
    return response;
  } catch(err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => event.ports[0]?.postMessage({ ok: true }));
  }
});

self.addEventListener('push', event => {
  let data = { title: 'ب لبن قطر', body: 'تنبيه جديد', icon: './icon-192.png' };
  if (event.data) { try { data = { ...data, ...event.data.json() }; } catch(e) {} }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: data.icon, badge: './icon-192.png',
      dir: 'rtl', lang: 'ar', tag: data.tag || 'default', data: data.url || './'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) {
        if (c.url.includes(self.registration.scope)) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
