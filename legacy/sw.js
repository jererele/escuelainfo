
const CACHE_NAME = 'aulainfo-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './cosmos.js',
    './assets/icon.png',
    './manifest.json'
];

// Instalar el Service Worker y cachear recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
        })
    );
});

// Responder con recursos del cache si están disponibles
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
