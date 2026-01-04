// 👇 Dùng import từng phần (Modular) để tránh lỗi
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export default async function handler(req, res) {
  // 1. CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error("Thiếu biến môi trường Firebase.");
    }

    // 2. KHỞI TẠO (Dùng getApps để kiểm tra thay vì admin.apps)
    if (!getApps().length) {
      const privateKey = rawKey.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin Initialized (Modular)");
    }

    // 3. CHUẨN BỊ GỬI
    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens" });
    }

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

    // 4. GỬI TIN (Dùng getMessaging() thay vì admin.messaging())
    const messaging = getMessaging();
    const response = await messaging.sendMulticast(message);
    
    console.log(`🚀 FCM Sent: ${response.successCount}/${tokens.length}`);

    // Log lỗi chi tiết nếu có
    if (response.failureCount > 0) {
       // Lọc ra các lỗi để dễ debug
       const errors = response.responses
         .map((r, idx) => r.error ? { token: tokens[idx], error: r.error.message } : null)
         .filter(r => r);
       console.error("FCM Failures:", JSON.stringify(errors));
    }

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack
    });
  }
}