// Offline support: keeps a copy of the app on the device.
// Bump VERSION (and APP_VERSION in index.html) whenever you upload a changed file, so phones pick up the update.
const VERSION = "fuel-log-v9";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  // cache: "reload" skips the browser's own copy, which GitHub Pages lets go 10 minutes stale
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // The app page: open instantly from the saved copy, refresh that copy in the background.
  if (req.mode === "navigate") {
    event.respondWith(caches.open(VERSION).then(async cache => {
      const cached = await cache.match("./index.html");
      const fresh = fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(res => {
        if (res.ok) cache.put("./index.html", res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    }));
    return;
  }

  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
