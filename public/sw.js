const CACHE_NAME = 'refaaq-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض طلبات المشاركة من التطبيقات الأخرى (Web Share Target)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // معالجة مشاركة إشعار التحويل من تطبيقات البنوك (Bankak / Fawry)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const receiptFile = formData.get('receipt');

          if (receiptFile) {
            // حفظ الإشعار المشارك مؤقتاً في كاش خاص ليقرأه التطبيق
            const cache = await caches.open('shared-receipts');
            await cache.put('latest-shared-receipt', new Response(receiptFile));
          }
        } catch (err) {
          console.error('Error handling shared target:', err);
        }

        // التوجيه التلقائي لشاشة الرفع
        return Response.redirect('/?shared_receipt=1', 303);
      })()
    );
    return;
  }

  // للاستعلامات العادية: Stale-While-Revalidate للأصول الثابتة
  if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // طلبات الصفحات: الشبكة أولاً مع الرجوع للكاش إذا كان المستخدم Offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(event.request);
        return cachedPage || cache.match('/');
      })
    );
  }
});
