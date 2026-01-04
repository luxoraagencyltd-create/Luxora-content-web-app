// 👇 DÙNG IMPORT THAY VÌ REQUIRE
import admin from "firebase-admin";

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 2. KIỂM TRA BIẾN MÔI TRƯỜNG
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      console.error("❌ THIẾU BIẾN MÔI TRƯỜNG TRÊN VERCEL");
      return res.status(500).json({ 
        error: "Configuration Error", 
        message: "Thiếu biến môi trường (ProjectID, Email, Key)." 
      });
    }

    // 3. KHỞI TẠO FIREBASE ADMIN (Dùng import admin từ ở trên)
    if (!admin.apps.length) {
      try {
        // Xử lý xuống dòng cho Private Key
        const privateKey = rawKey.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log("✅ Firebase Admin Init Success");
      } catch (initError) {
        console.error("❌ Firebase Admin Init Failed:", initError);
        return res.status(500).json({ 
           error: "Init Failed", 
           message: "Lỗi khởi tạo Firebase: " + initError.message 
        });
      }
    }

    // 4. GỬI TIN
    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens provided" });
    }

    // Lấy URL icon tuyệt đối
    const host = req.headers.host; 
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const iconUrl = `${protocol}://${host}/assets/logo-192.png`;

    const message = {
      notification: { title, body },
      android: { 
        priority: "high", 
        notification: { icon: iconUrl, defaultSound: true } 
      },
      apns: {
        payload: { aps: { "content-available": 1, alert: { title, body }, sound: "default" } },
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`🚀 FCM Sent: ${response.successCount}/${tokens.length}`);
    
    // Log lỗi chi tiết nếu có token hỏng
    if (response.failureCount > 0) {
       console.error("FCM Failures:", JSON.stringify(response.responses));
    }

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("🔥 SERVER CRASH HANDLED:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack 
    });
  }
}