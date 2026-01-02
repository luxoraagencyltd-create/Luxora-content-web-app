import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const VAPID_KEY = "DÁN_KEY_CỦA_BẠN_VÀO_ĐÂY"; 

export const requestNotificationPermission = async (userId: string) => {
  console.log("Đang xin quyền...");
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // 👇 BƯỚC QUAN TRỌNG: Đăng ký Service Worker thủ công để đảm bảo nó chạy
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service Worker registered:", registration);
      } catch (err) {
        console.error("Service Worker registration failed:", err);
        return;
      }

      // Lấy Token gắn với Service Worker này
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration // 👈 QUAN TRỌNG NHẤT
      });

      if (token) {
        console.log('FCM Token:', token);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        
        // Uncomment dòng dưới nếu muốn hiện thông báo xác nhận
        // alert("Kích hoạt thông báo thành công!");
        return token;
      }
    } else {
      console.log('Quyền thông báo bị từ chối.');
    }
  } catch (error) {
    console.error('Lỗi notification:', error);
  }
};