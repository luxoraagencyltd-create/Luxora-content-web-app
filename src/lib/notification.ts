import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

// 👇 HÃY CHẮC CHẮN BẠN ĐÃ DÁN KEY LẤY TỪ FIREBASE VÀO ĐÂY
const VAPID_KEY = "BJu3LkoCrazLdU_SCLr5COb351-bCLXcR9KEb-Cv5N0W_uQ4Q4RE6lTkjHtznHOE_XJ5zO1jaZQVc6bjRExthHM"; 

export const requestNotificationPermission = async (userId: string) => {
  console.log("Đang bắt đầu xin quyền..."); // Log debug
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Quyền thông báo: ĐÃ CẤP. Đang lấy Token...');
      
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });

      if (token) {
        console.log('FCM Token:', token); // 👈 BẠN CẦN LẤY CÁI NÀY
        
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        
        return token;
      } else {
        console.log('Không lấy được Token.');
      }
    } else {
      console.log('Quyền thông báo bị từ chối.');
      alert("Bạn đã chặn thông báo. Hãy bấm vào biểu tượng 🔒 trên thanh địa chỉ để mở lại.");
    }
  } catch (error) {
    console.error('Lỗi khi xin quyền:', error);
    alert("Lỗi: " + error);
  }
};