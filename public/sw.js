const CACHE_NAME = "heyra-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = ["/", "/listings", "/dashboard/bookings", OFFLINE_URL];
const FIELD_ROUTE_PATTERNS = ["/listings/", "/dashboard/bookings/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const request = event.request;
  const acceptHeader = request.headers.get("accept") || "";
  const isNavigation = request.mode === "navigate" || acceptHeader.includes("text/html");
  const url = new URL(request.url);
  const shouldPreferCache =
    url.origin === self.location.origin &&
    FIELD_ROUTE_PATTERNS.some((pattern) => url.pathname.startsWith(pattern));

  if (isNavigation) {
    event.respondWith(
      (shouldPreferCache
        ? caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
              .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                return response;
              })
              .catch(async () => cached || caches.match(OFFLINE_URL));

            return cached || networkFetch;
          })
        : fetch(request)
            .then((response) => {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              return response;
            })
            .catch(async () => {
              const cached = await caches.match(request);
              return cached || caches.match(OFFLINE_URL);
            })),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok && (request.url.startsWith(self.location.origin) || request.destination === "image")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    }),
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : { title: "Heyra", body: "You have a new update.", url: "/" };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Heyra", {
      body: payload.body || "You have a new update.",
      data: {
        url: payload.url || "/",
      },
      tag: payload.tag || "heyra-push",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));

      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }

      return self.clients.openWindow(url);
    }),
  );
});
