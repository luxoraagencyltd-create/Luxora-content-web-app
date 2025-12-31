/* eslint-disable no-undef */
// Sử dụng Firebase v8 CDN (Ổn định nhất cho Service Worker)
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// 👇 QUAN TRỌNG: BẠN PHẢI DÁN CỨNG CONFIG VÀO ĐÂY (KHÔNG DÙNG import.meta.env)
var firebaseConfig = {
  apiKey: "AIzaSyC0r5R2WiU_VdHDfiV3hJwJuef7JOOegoo",
  authDomain: "luxora-content-app.firebaseapp.com",
  projectId: "luxora-content-app",
  storageBucket: "luxora-content-app.firebasestorage.app",
  messagingSenderId: "1094059628830",
  appId: "1:1094059628830:web:4ba869df125dd412c3910f",
  measurementId: "G-BGB6F921DV"
};

// Khởi tạo
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Xử lý tin nhắn khi app tắt (Background)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/logo-192.png', // Đảm bảo bạn có file ảnh này
    // icon: '/favicon.ico', // Hoặc dùng tạm favicon nếu chưa có logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});