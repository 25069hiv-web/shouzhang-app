/* 我的手账 — Service Worker：安装后缓存全部资源，断网也能打开 */
const CACHE = "shouzhang-pwa-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/greet-banner.jpg",
  "./assets/avatar.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => c.addAll(ASSETS)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !/^https?:/i.test(req.url)) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit =>
      hit || fetch(req).then(res => {
        // 运行时顺带缓存成功的同源资源
        if (res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        // 离线时导航请求回退到应用主页面
        if (req.mode === "navigate") return caches.match("./index.html");
      })
    )
  );
});
