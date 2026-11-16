const CACHE = "ff-sensi-lab-v1";
const FILES = ["./", "./index.html", "./css/styles.css", "./js/app.js", "./manifest.webmanifest"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
