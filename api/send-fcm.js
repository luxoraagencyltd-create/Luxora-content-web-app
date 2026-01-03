const admin = require("firebase-admin");

export default async function handler(req, res) {
  console.log("🔥 Firebase Admin Version:", admin.SDK_VERSION); 
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
        message: "Thiếu biến môi trường. Hãy kiểm tra Settings trên Vercel." 
      });
    }

    // 3. KHỞI TẠO FIREBASE ADMIN (An toàn)
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
           message: "Key sai định dạng: " + initError.message 
        });
      }
    }

    // 4. GỬI TIN
    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens provided" });
    }

    const host = req.headers.host; 
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const iconUrl = `${protocol}://${host}/assets/logo-192.png`;

    const message = {
      notification: { title, body },
      android: { priority: "high", notification: { icon: iconUrl, defaultSound: true } },
      apns: { payload: { aps: { "content-available": 1, alert: { title, body }, sound: "default" } } },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`🚀 FCM Sent: ${response.successCount}/${tokens.length}`);

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("🔥 SERVER CRASH:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
}