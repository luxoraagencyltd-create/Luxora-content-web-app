const admin = require("firebase-admin");

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { tokens, title, body } = req.body;

    // 1. LẤY VÀ XỬ LÝ BIẾN MÔI TRƯỜNG (Logic mới mạnh mẽ hơn)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("❌ Thiếu biến môi trường.");
      return res.status(500).json({ error: "Missing Env Vars" });
    }

    // --- QUAN TRỌNG: Dọn dẹp Private Key ---
    // 1. Xóa dấu ngoặc kép bao quanh nếu có
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // 2. Chuyển ký tự \n thành xuống dòng thật
    privateKey = privateKey.replace(/\\n/g, '\n');
    // ---------------------------------------

    // 2. KHỞI TẠO FIREBASE ADMIN
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log("✅ Firebase Admin Init Success");
      } catch (e) {
        console.error("❌ Init Error:", e.message);
        return res.status(500).json({ error: "Key Error", details: e.message });
      }
    }

    // 3. GỬI TIN
    if (!tokens || !tokens.length) {
       return res.status(200).json({ message: "No tokens" });
    }

    // Link icon
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
    return res.status(500).json({ error: "Server Error", message: error.message });
  }
}