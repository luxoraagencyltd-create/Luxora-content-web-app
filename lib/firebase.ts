
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của bạn (Lấy từ Firebase Console -> Project Settings)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "luxora-protocol.firebaseapp.com",
  projectId: "luxora-protocol",
  storageBucket: "luxora-protocol.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
