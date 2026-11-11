// Minimal service worker: caches static assets (JS/CSS/fonts/images) with
// a stale-while-revalidate strategy so repeat visits and flaky-network
// loads are fast, and serves a tiny offline fallback for page navigations
// that fail with no cache and no network. Intentionally does NOT cache
// API routes, Supabase calls, or HTML navigations themselves — those
// should always be fresh. This keeps "slow even on good network" fast on
// repeat loads, and gives slow/no-network loads something to show instead
// of a blank screen.

const CACHE_NAME = "aza-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/welcome/")) return true;
  return /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|svg|gif|ico)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Page navigations: go to the network first (always want fresh HTML/
  // data), and only fall back to the offline page if that fails and
  // nothing cached is available.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets: stale-while-revalidate. Serve from cache immediately
  // if present (fast, works offline), then refresh the cache in the
  // background for next time.
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);
        return cached || networkFetch || fetch(request);
      })
    );
  }
  // Everything else (API routes, Supabase, etc.) is left untouched —
  // always goes straight to the network.
});
