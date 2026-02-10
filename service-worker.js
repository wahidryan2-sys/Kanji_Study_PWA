const CACHE_NAME = 'kanji-pro-v18-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Jika kamu punya file gambar lokal (bukan link internet), daftarkan di sini:
  // './icons/icon-192.png',
  // './icons/icon-512.png'
];

// 1. Install Service Worker & Cache Aset Utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate & Hapus Cache Lama jika versi naik
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Intercept Fetch (Offline Strategy)
self.addEventListener('fetch', (event) => {
  // Untuk data Google Fonts atau GitHub (Sakubun), kita coba Network dulu, kalau gagal baru Cache
  if (event.request.url.includes('fonts.googleapis') || event.request.url.includes('githubusercontent')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          throw error; // Jika offline dan tidak ada di cache, biarkan error (nanti ditangani kodemu)
        }
      })
    );
  } else {
    // Untuk file lokal (HTML/CSS), Cache First (biar loading instan)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});