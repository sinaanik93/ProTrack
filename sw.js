const CACHE = "protrack-os-v1.0.6";
const CORE = [
  "/", "/index.html", "/styles.css", "/os.css?v=1.0.4", "/app.js", "/os.js",
  "/manifest.json?v=1.0.6", "/manifest.webmanifest?v=1.0.6", "/assets/app-icon.svg", "/assets/protrack-official.png"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match("/index.html"))));
});
