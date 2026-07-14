// POISE Time Clock service worker.
// Deliberately conservative: the punch flow requires the network (live camera,
// geolocation, and a server-set timestamp), and SPEC §10 puts an offline punch
// queue OUT OF SCOPE. So we only cache the app shell for fast loads and never
// serve stale punch data. Navigation always tries the network first.

const CACHE = "poise-shell-v1";
const SHELL = ["/", "/login", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache API, auth, or Supabase calls.
  if (url.pathname.startsWith("/api") || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for navigations, falling back to cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
