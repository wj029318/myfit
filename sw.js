var CACHE = 'fitlog-v1';
var ASSETS = [
  '/myfit/',
  '/myfit/index.html'
];

// Install: cache core assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Skip Firebase and API requests - always fetch from network
  var url = e.request.url;
  if(url.includes('firebase') || 
     url.includes('googleapis') || 
     url.includes('firestore') ||
     url.includes('generativelanguage')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Cache successful GET requests for our assets
        if(e.request.method === 'GET' && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function(){
        // Network failed, try cache
        return caches.match(e.request).then(function(cached){
          return cached || new Response('離線中，請檢查網路連線', {
            headers: {'Content-Type': 'text/plain; charset=utf-8'}
          });
        });
      })
  );
});
