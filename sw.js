const CACHE_NAME = "marcenaria-flow-shell-v20260722-3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=20260722-3",
  "/assets/vendor/supabase.min.js?v=20260722-3",
  "/app.js?v=20260722-3",
  "/manifest.webmanifest",
  "/assets/favicon.png",
  "/assets/flow-marcenaria-logo.png",
  "/assets/login-background.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset =
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (request.method !== "GET" || !isSameOrigin || url.pathname.startsWith("/api/") || !isStaticAsset) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html")))
  );
});
