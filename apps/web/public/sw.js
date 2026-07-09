// Drenyra Service Worker — static asset caching + offline fallback
// Cache-first for build artifacts (hashed filenames), network-first for API/navigation

const CACHE_NAME = "drenyra-v1";
const STATIC_ASSETS = /\/assets\/.+\.(js|css|woff2?|png|svg|ico)$/;
const API_PATTERN = /\/api\//;

// Install: pre-cache is handled by the browser naturally via fetch events
self.addEventListener("install", (_event) => {
	self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
				),
			),
	);
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET and browser extensions
	if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

	// API requests: network-first (never serve stale API data offline)
	if (API_PATTERN.test(url.pathname)) {
		event.respondWith(networkFirst(request));
		return;
	}

	// Static assets (hashed builds): cache-first
	if (STATIC_ASSETS.test(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	// Navigation: network-first with offline fallback
	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request));
		return;
	}

	// Everything else: network-first
	event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(CACHE_NAME);
		cache.put(request, response.clone());
	}
	return response;
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok && response.type === "basic") {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;

		// Offline fallback for navigations
		if (request.mode === "navigate") {
			return new Response(
				`<!DOCTYPE html>
<html lang="es-PE">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión — Drenyra</title>
<style>
  body { font-family: system-ui; background: #0f0f12; color: #e0e0e5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
  .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); padding: 2rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  p { color: rgba(224,224,229,0.68); }
</style></head>
<body><div class="card"><h1>📡 Sin conexión</h1><p>Drenyra necesita conexión a internet para funcionar.<br>Revisá tu red e intentá de nuevo.</p></div></body></html>`,
				{ headers: { "Content-Type": "text/html; charset=utf-8" } },
			);
		}

		return new Response("Offline", { status: 503 });
	}
}
