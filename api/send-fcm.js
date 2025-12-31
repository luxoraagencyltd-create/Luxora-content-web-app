const admin = require("firebase-admin");

// Khởi tạo Admin SDK (Giữ nguyên logic cũ của bạn)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;

  if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { tokens, title, body } = req.body;

  if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin config error" });
  }

  try {
    // 👇 CẤU HÌNH GÓI TIN CHUẨN ĐỂ ĐÁNH THỨC MÁY
    const message = {
      notification: {
        title: title,
        body: body,
      },
      // Cấu hình riêng cho Android
      android: {
        priority: "high",
        notification: {
          icon: "/assets/logo-192.png",
          priority: "high",
          channelId: "default",
        }
      },
      // Cấu hình riêng cho iOS (Quan trọng)
      apns: {
        payload: {
          aps: {
            "content-available": 1, // Đánh thức app chạy nền
            alert: {
              title: title,
              body: body,
            },
            sound: "default"
          },
        },
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`FCM Sent: ${response.successCount} success.`);
    
    res.status(200).json({ success: true, sent: response.successCount });
    
  } catch (error) {
    console.error("FCM Error:", error);
    res.status(500).json({ error: error.message });
  }
}