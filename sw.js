const CACHE_NAME = "guitar-v2";
const ASSETS = [
    "./", "./index.html", "./style.css",
    "./app.js", "./fretboard.js", "./utils.js", "./sound.js",
    "./data/chords.js", "./data/scales.js",
    "./manifest.json",
    "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
