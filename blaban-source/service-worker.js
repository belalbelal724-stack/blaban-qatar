// B Laban Qatar — Service Worker v2
// Provides offline support and caching for the PWA
const VERSION = 'blaban-v2-2026-05-10';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_DYNAMIC = `${VERSION}-dynamic`;

// Files to pre-cache (the app shell)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './icon-maskable-512.png'
];

// CDN resources to cache when used (network-first with fallback)
const CDN_PATTERNS = [
  /https:\/\/cdnjs\.cloudflare\.com\//,
  /https:\/\/fonts\.googleapis\.com\//,
  /https:\/\/fonts\.gstatic\.com\//,
  /https:\/\/www\.gstatic\.com\/firebasejs\//
];

// ============ INSTALL ============
self.addEventListener('install', event => {
  console.log('[SW] Install:', VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

// ============ ACTIVATE ============
self.addEventListener('activate', event => {
  console.log('[SW] Activate:', VERSION);
  event.waitUntil(
    caches.keys().then(names => {
      // Delete old version caches
      return Promise.all(
        names.filter(n => !n.startsWith(VERSION))
             .map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// ============ FETCH ============
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  
  // Skip non-GET (POST/PUT/DELETE — let them go through, especially for Firebase)
  if (req.method !== 'GET') return;
  
  // Skip Firebase real-time database (always live, never cache)
  if (url.host.includes('firebasedatabase.app') || 
      url.host.includes('firebaseio.com') ||
      url.host.includes('googleapis.com') && url.pathname.includes('firebase')) {
    return; // pass through normally
  }
  
  // Strategy 1: same-origin requests → cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }
  
  // Strategy 2: CDN resources → network-first with cache fallback
  if (CDN_PATTERNS.some(p => p.test(req.url))) {
    event.respondWith(networkFirst(req));
    return;
  }
  
  // Default: just go through
});

// Cache-first strategy
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(req);
  if (cached) return cached;
  
  try {
    const response = await fetch(req);
    if (response.ok) {
      cache.put(req, response.clone());
    }
    return response;
  } catch(err) {
    // Offline + not cached: return index.html as fallback for navigation
    if (req.destination === 'document') {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

// Network-first strategy (for CDN)
async function networkFirst(req) {
  const cache = await caches.open(CACHE_DYNAMIC);
  try {
    const response = await fetch(req);
    if (response.ok) {
      cache.put(req, response.clone());
    }
    return response;
  } catch(err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

// ============ MESSAGE HANDLING ============
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => event.ports[0]?.postMessage({ ok: true }));
  }
});

// ============ PUSH NOTIFICATIONS (placeholder for future use) ============
self.addEventListener('push', event => {
  let data = { title: 'ب لبن قطر', body: 'تنبيه جديد', icon: './icon-192.png' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch(e) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: './icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'default',
      data: data.url || './'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Focus existing window if open
      for (const c of clients) {
        if (c.url.includes(self.registration.scope)) {
          return c.focus();
        }
      }
      // Otherwise open new
      return self.clients.openWindow(url);
    })
  );
});
