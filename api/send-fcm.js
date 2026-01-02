const admin = require("firebase-admin");

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. KHỞI TẠO (Lazy Init)
    if (!admin.apps.length) {
      // Xử lý Private Key: Thay thế \n thành xuống dòng thật
      const rawKey = process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
      
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      // Debug log (Không log ra private key thật để bảo mật)
      console.log("Checking Env Vars:", {
        hasProjectId: !!projectId,
        hasEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        keyLength: privateKey ? privateKey.length : 0
      });

      if (!privateKey || !clientEmail || !projectId) {
        throw new Error("Thiếu biến môi trường Firebase trên Vercel");
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    // 2. GỬI TIN
    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens" });
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
    
    console.log(`FCM Sent: ${response.successCount}/${tokens.length}`);
    
    // Trả về JSON chuẩn
    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("SERVER CRASH:", error);
    // Trả về lỗi dạng JSON để React không bị crash
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}