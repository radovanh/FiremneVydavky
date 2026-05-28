const CACHE = 'vydavky-v2';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Skip waiting immediately when requested by the page
self.addEventListener('message', function(e){
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Install: cache core assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fetch: network first, fall back to cache for app shell
self.addEventListener('fetch', function(e){
  const url = e.request.url;
  // Never intercept GitHub API or Google API calls
  if (url.includes('api.github.com') || url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      // Cache navigations and same-origin assets
      if (e.request.method === 'GET' && (
        url.startsWith(self.location.origin) ||
        url.includes('fonts.googleapis') ||
        url.includes('fonts.gstatic')
      )) {
        const copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});
