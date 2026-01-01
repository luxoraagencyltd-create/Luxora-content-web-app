/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

var firebaseConfig = {
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

// Thiết lập xử lý khi nhận tin nhắn lúc TẮT APP
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Received background message ', payload);
  
  // Lấy tiêu đề và nội dung
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // Dùng location.origin để lấy đường dẫn tuyệt đối, tránh lỗi 404
    icon: self.location.origin + '/assets/pwa-192x192.png', 
    badge: self.location.origin + '/assets/pwa-192x192.png',
    tag: 'luxora-alert', // Gom nhóm thông báo
    renotify: true, // Rung lại nếu có tin mới cùng tag
    data: payload.data // Truyền dữ liệu để click vào mở app
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý khi người dùng bấm vào thông báo
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Mở App ra khi bấm vào
  event.waitUntil(
    clients.matchAll({type: 'window'}).then( function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});