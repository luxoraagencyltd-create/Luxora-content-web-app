import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

// 👇 DÁN KEY CỦA BẠN VÀO ĐÂY (Đừng để trống)
const VAPID_KEY = "BJu3LkoCrazLdU_SCLr5COb351-bCLXcR9KEb-Cv5N0W_uQ4Q4RE6lTkjHtznHOE_XJ5zO1jaZQVc6bjRExthHM"; 

export const requestNotificationPermission = async (userId: string) => {
  console.log("🔄 Đang kiểm tra quyền và đồng bộ FCM Token...");
  
  try {
    // 1. Kiểm tra trạng thái quyền hiện tại
    let permission = Notification.permission;
    
    if (permission === 'default') {
      // Nếu chưa xin, thì xin
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      console.log('✅ Quyền đã được cấp. Đang lấy Token...');
      
      // 2. Đăng ký Service Worker (Bắt buộc để chạy nền)
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (err) {
        console.error("Lỗi đăng ký SW:", err);
        return;
      }

      // 3. Lấy Token
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration 
      });

      if (token) {
        console.log('🔥 FCM Token:', token);
        
        // 4. Lưu vào Firestore (Dùng setDoc merge để an toàn nếu doc chưa tồn tại)
        const userRef = doc(db, "users", userId);
        
        // Kiểm tra xem user doc có tồn tại chưa
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
           await updateDoc(userRef, {
             fcmTokens: arrayUnion(token)
           });
        } else {
           // Nếu user bị xóa mà chưa tạo lại kịp (hiếm gặp nhưng cứ đề phòng)
           // Thường App.tsx đã tạo user rồi.
           console.warn("User chưa tồn tại trong DB để lưu Token");
        }
        
        console.log("💾 Đã lưu Token vào Firestore thành công!");
        return token;
      } else {
        console.log('❌ Không lấy được Token.');
      }
    } else {
      console.log('⛔ Quyền thông báo bị từ chối.');
    }
  } catch (error) {
    console.error('Lỗi quy trình notification:', error);
  }
};