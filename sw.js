const CACHE_NAME = "financial-v2";

const urlsToCache = [
  "./",
  "./index.html"
];

self.addEventListener("install", event => {
  // Supaya versi Service Worker baru langsung aktif, tanpa harus menunggu
  // semua tab lama ditutup dulu.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  // Hapus semua cache versi lama supaya tidak ada sisa file basi yang
  // ketinggalan tersimpan di browser pengguna.
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  // Network-first: selalu coba ambil versi terbaru dari server dulu setiap
  // request. Kalau berhasil, simpan salinannya ke cache (untuk mode offline).
  // Kalau gagal (misal sedang offline), baru pakai versi dari cache sebagai
  // fallback. Ini memperbaiki bug lama: sebelumnya Service Worker selalu
  // menyajikan versi pertama yang pernah di-cache dan TIDAK PERNAH mengambil
  // versi baru dari GitHub, walaupun file di repo sudah diperbarui.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});