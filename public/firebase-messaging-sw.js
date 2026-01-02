/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Cấu hình cứng (Dùng đúng thông tin từ Console)
const firebaseConfig = {
  apiKey: "AIzaSyC0r5R2WiU_VdHDfiV3hJwJuef7JOOegoo",
  authDomain: "luxora-content-app.firebaseapp.com",
  projectId: "luxora-content-app",
  storageBucket: "luxora-content-app.firebasestorage.app",
  messagingSenderId: "1094059628830",
  appId: "1:1094059628830:web:4ba869df125dd412c3910f",
  measurementId: "G-BGB6F921DV"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 2. Xử lý tin nhắn nền (Background)
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Nhận tin nhắn nền:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // Icon dùng đường dẫn tương đối, trình duyệt tự hiểu
    icon: '/assets/logo-192.png', 
    badge: '/assets/logo-192.png',
    tag: 'luxora-notification',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Xử lý khi bấm vào thông báo
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Mở lại cửa sổ app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Nếu app đang mở sẵn thì focus vào
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf('/') !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa mở thì mở mới
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});