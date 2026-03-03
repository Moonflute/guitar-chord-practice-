const CACHE_NAME = "guitar-v8";
const ASSETS = [
    "./", "./index.html", "./style.css",
    "./app.js", "./fretboard.js", "./utils.js", "./sound.js",
    "./data/chords.js", "./data/scales.js",
    "./manifest.json",
    "./icons/icon.svg"
];

self.addEventListener("install", e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Network-first: always try fresh files, fallback to cache
self.addEventListener("fetch", e => {
    e.respondWith(
        fetch(e.request)
            .then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return resp;
            })
            .catch(() => caches.match(e.request))
    );
});
