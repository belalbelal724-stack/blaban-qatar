// B Laban Qatar — Service Worker
const VERSION = 'blaban-v5-2026-05-24-04-20';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_DYNAMIC = `${VERSION}-dynamic`;

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-maskable-512.png'
];

// ============ INSTALL — pre-cache static assets ============
self.addEventListener('install', event => {
  console.log('[SW] Install:', VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] Install error:', err))
  );
});

// ============ ACTIVATE — clean up old caches ============
self.addEventListener('activate', event => {
  console.log('[SW] Activate:', VERSION);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => !n.startsWith(VERSION))
             .map(n => {
               console.log('[SW] Delete old cache:', n);
               return caches.delete(n);
             })
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(client => {
          try { client.postMessage({ type: 'SW_UPDATED', version: VERSION }); } catch(e) {}
        });
      })
  );
});

// ============ FETCH ============
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  
  // Never intercept Firebase or Supabase
  if (url.host.includes('firebasedatabase.app') || url.host.includes('firebaseio.com')) return;
  if (url.host.includes('googleapis.com') && url.pathname.includes('firebase')) return;
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
  
  if (/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/.test(url.host + url.pathname)) {
    event.respondWith(networkFirstDynamic(req));
  }
});

async function networkFirstHTML(req) {
  try {
    const r = await fetch(req, { cache: 'no-store' });
    if (r.ok) {
      const c = await caches.open(CACHE_STATIC);
      c.put(req, r.clone());
    }
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
  try {
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch(e) { throw e; }
}

async function networkFirstDynamic(req) {
  const c = await caches.open(CACHE_DYNAMIC);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch(e) {
    const cached = await c.match(req);
    if (cached) return cached;
    throw e;
  }
}

// ============ MESSAGES ============
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys()
      .then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => event.ports[0]?.postMessage({ ok: true }));
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: VERSION });
  }
});

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', event => {
  let data = { title: '🥛 ب لبن قطر', body: 'تنبيه جديد', icon: './icon-192.png' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch(e) {
      try { data.body = event.data.text(); } catch(e2) {}
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'blaban-default',
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        for (const c of clients) {
          if (c.url.includes(self.registration.scope)) return c.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
