const CACHE = 'vydavky-v1';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', e => {
  // Don't intercept GitHub API calls or Google APIs — always go live
  const url = e.request.url;
  if (url.includes('api.github.com') || url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a fresh copy of navigations and same-origin assets
        if (e.request.method === 'GET' && (url.startsWith(self.location.origin) || url.includes('fonts.googleapis') || url.includes('fonts.gstatic'))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
