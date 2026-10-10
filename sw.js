// 백그라운드 푸시 수신용 서비스 워커
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('./config.js');

firebase.initializeApp(self.APP_CONFIG.firebase);
// 서버가 보내는 webpush.notification은 Firebase SDK가 알림으로 표시하고,
// 알림을 누르면 fcm_options.link(보고 폼)를 엽니다.
firebase.messaging();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 페이지가 열려 있을 때 페이지 쪽에서 직접 띄운 알림(data.link 포함)을 눌렀을 때
self.addEventListener('notificationclick', (event) => {
  const link = event.notification && event.notification.data && event.notification.data.link;
  if (!link) return; // Firebase가 띄운 알림은 SDK가 처리
  event.notification.close();
  event.waitUntil(self.clients.openWindow(link));
});
