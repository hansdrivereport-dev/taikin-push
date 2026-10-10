// 백그라운드 푸시 수신용 서비스 워커

const PENDING_CACHE = 'taikin-push';
const PENDING_KEY = new URL('__pending-link', self.registration.scope).href;

function isFormUrl(u) {
  return /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(u || '');
}

// 알림 클릭은 Firebase SDK보다 먼저 직접 처리합니다.
// (아이폰은 앱이 꺼진 상태에서 외부 주소를 바로 열지 못하고 첫 화면만 여는 경우가 있어,
//  우리 페이지를 ?go=폼주소 로 열고, 페이지가 폼으로 넘겨줍니다. 주소가 무시돼도
//  잠시 저장해 둔 폼 주소를 페이지가 읽어서 이동합니다.)
self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();

  const d = (event.notification && event.notification.data) || {};
  const fcm = d.FCM_MSG || {};
  const link = d.link ||
    (fcm.fcmOptions && fcm.fcmOptions.link) ||
    (fcm.notification && fcm.notification.click_action) || '';
  const target = isFormUrl(link) ? link : '';
  const pageUrl = new URL(target ? './?go=' + encodeURIComponent(target) : './', self.registration.scope).href;

  event.waitUntil((async () => {
    if (target) {
      try {
        const cache = await caches.open(PENDING_CACHE);
        await cache.put(PENDING_KEY, new Response(JSON.stringify({ link: target, t: Date.now() })));
      } catch (e) {}
    }
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      try {
        await w.focus();
        if ('navigate' in w) await w.navigate(pageUrl);
        return;
      } catch (e) { /* 다음 방법 시도 */ }
    }
    await self.clients.openWindow(pageUrl);
  })());
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('./config.js');

firebase.initializeApp(self.APP_CONFIG.firebase);
// 서버가 보내는 webpush.notification은 Firebase SDK가 알림으로 표시합니다.
firebase.messaging();
