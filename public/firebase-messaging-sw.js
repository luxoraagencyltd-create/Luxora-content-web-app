// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/compat/9.22.0/firebase-messaging-compat.js');

// Cấu hình Firebase (Copy từ src/lib/firebase.ts sang đây)
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

// Khởi tạo Messaging trong nền
const messaging = firebase.messaging();

// Xử lý khi nhận tin nhắn lúc App đang TẮT (Background)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/pwa-192x192.png', // Đảm bảo bạn có file icon này
    badge: '/assets/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});