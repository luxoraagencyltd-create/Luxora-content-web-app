import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const VAPID_KEY = "BJu3LkoCrazLdU_SCLr5COb351-bCLXcR9KEb-Cv5N0W_uQ4Q4RE6lTkjHtznHOE_XJ5zO1jaZQVc6bjRExthHM"; 

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Lấy Token định danh thiết bị này
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });

      if (token) {
        console.log('FCM Token:', token);
        // Lưu token này vào thông tin user trên Firestore
        // Để sau này Server biết gửi thông báo cho ai
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token) // Thêm token vào mảng (1 user có thể dùng nhiều thiết bị)
        });
        return token;
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
};