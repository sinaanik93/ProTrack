const CACHE = "protrack-os-v2.1.7";
const CORE = [
  "/", "/index.html", "/styles.css", "/os.css?v=1.0.4", "/v2.css?v=2.0.3", "/production.css?v=2.1.6", "/app.js", "/os.js?v=2.1.2", "/v2.js?v=2.1.7", "/production.js?v=2.1.6",
  "/manifest.json?v=2.1.3", "/manifest.webmanifest", "/assets/app-icon.svg", "/assets/protrack-official.png", "/assets/apple-touch-icon.png", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/icon-512-maskable.png", "/assets/apple-splash-1170x2532.png"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match("/index.html"))));
});
