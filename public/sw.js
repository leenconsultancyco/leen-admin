const CACHE_NAME = 'leen-admin-v1';
const OFFLINE_URL = '/__offline';

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ليـن — لوحة التحكم</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f4f4f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 56px; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
    .ar { font-size: 16px; color: #52525b; margin-bottom: 6px; }
    .en { font-size: 14px; color: #71717a; margin-bottom: 24px; direction: ltr; }
    .note { font-size: 13px; color: #a1a1aa; margin-bottom: 24px; line-height: 1.6; }
    .btn {
      display: inline-block;
      background: #0E9B73;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 28px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .btn:hover { background: #0b7d5d; }
    .phone { font-size: 13px; color: #71717a; direction: ltr; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1 class="title">ليـن — لوحة التحكم</h1>
    <p class="ar">لا يوجد اتصال — أعد الاتصال للوصول إلى لوحة التحكم</p>
    <p class="en">No connection — reconnect to access the admin panel</p>
    <p class="note">
      لوحة التحكم تتطلب اتصالاً نشطاً بالإنترنت للوصول إلى البيانات.<br />
      Admin panel requires a live connection for all data.
    </p>
    <button class="btn" onclick="location.reload()">إعادة المحاولة · Retry</button>
    <p class="phone">📞 CENTER_PHONE_PLACEHOLDER</p>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.put(new Request(OFFLINE_URL), new Response(OFFLINE_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    )
  );
});
