import admin from "firebase-admin";

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

    // 2. KHỞI TẠO (Kiểm tra admin.apps)
    if (!admin.apps.length) {
      const privateKey = rawKey.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin Initialized");
    }

    // 3. CHUẨN BỊ GÓI TIN
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

    // 4. GỬI TIN BẰNG HÀM MỚI (sendEachForMulticast)
    // sendMulticast đã cũ, v13 dùng sendEachForMulticast
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`🚀 FCM Sent: ${response.successCount}/${tokens.length}`);

    if (response.failureCount > 0) {
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
    // Trả về JSON để React đọc được lỗi
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack
    });
  }
}