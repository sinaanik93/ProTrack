const CACHE = "protrack-os-phase-2.8.0";
const RUNTIME = "protrack-os-runtime-2.8.0";
const CORE = [
  "/",
  "/index.html",
  "/styles.css",
  "/os.css?v=1.0.4",
  "/v2.css?v=2.0.3",
  "/production.css?v=2.1.6",
  "/design-system.css?v=1.1.1",
  "/core-screens.css?v=1.2.6",
  "/quality.css?v=1.3.4",
  "/ai-memory.css?v=2.3.0",
  "/ai-coach.css?v=2.4.0",
  "/ai-forecast.css?v=2.5.0",
  "/ai-reporting.css?v=2.6.0",
  "/ai-knowledge.css?v=2.7.0",
  "/ai-automation.css?v=2.8.0",
  "/app.js",
  "/os.js?v=2.1.2",
  "/v2.js?v=2.1.8",
  "/production.js?v=2.1.6",
  "/design-system.js?v=1.1.1",
  "/core-screens.js?v=1.2.6",
  "/quality.js?v=1.3.4",
  "/ai-video.js?v=2.2.0",
  "/ai-memory.js?v=2.3.0",
  "/ai-coach.js?v=2.4.0",
  "/ai-forecast.js?v=2.5.0",
  "/ai-reporting.js?v=2.6.0",
  "/ai-knowledge.js?v=2.7.0",
  "/ai-automation.js?v=2.8.0",
  "/manifest.json?v=1.3.4",
  "/manifest.webmanifest",
  "/assets/app-icon.svg",
  "/assets/protrack-official.png",
  "/assets/apple-touch-icon.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-512-maskable.png",
  "/assets/apple-splash-1170x2532.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![CACHE, RUNTIME].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(RUNTIME).then(cache => cache.put(request, copy));
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(RUNTIME).then(cache => cache.put(request, copy));
    }
    return response;
  } catch (_) {
    return caches.match(request).then(cached => cached || caches.match("/index.html"));
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({offline:true,message:"offline"}), {
      status: 503,
      headers: {"Content-Type": "application/json", "Cache-Control": "no-store"}
    })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(?:png|jpg|jpeg|svg|webp|css|js|webmanifest|json)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
