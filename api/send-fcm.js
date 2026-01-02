const admin = require("firebase-admin");

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // --- 1. DEBUG BIẾN MÔI TRƯỜNG (Không log key ra nhé) ---
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log("🔍 Checking Env Vars:", {
      projectId: projectId ? "OK" : "MISSING",
      clientEmail: clientEmail ? "OK" : "MISSING",
      privateKeyLength: rawKey ? rawKey.length : 0
    });

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error("Thiếu biến môi trường Firebase trên Vercel.");
    }

    // --- 2. KHỞI TẠO FIREBASE ADMIN (TRONG TRY CATCH) ---
    if (!admin.apps.length) {
      // Xử lý key: Nếu key chứa \n (chuỗi) thì replace, nếu là xuống dòng thật thì giữ nguyên
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

    // --- 3. GỬI TIN ---
    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens provided" });
    }

    // Lấy URL icon
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
    
    console.log(`🚀 FCM Result: ${response.successCount} success, ${response.failureCount} failed.`);
    
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
    console.error("🔥 SERVER CRASH:", error);
    // Trả về lỗi JSON thay vì sập 500 HTML
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack 
    });
  }
}