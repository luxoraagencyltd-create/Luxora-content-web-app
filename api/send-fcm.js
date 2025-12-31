const admin = require("firebase-admin");

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. KHỞI TẠO FIREBASE ADMIN (Nếu chưa có)
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Xử lý xuống dòng
        : undefined;

      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      // Kiểm tra xem biến môi trường có đủ không
      if (!privateKey || !clientEmail || !projectId) {
        throw new Error(`Thiếu Config: ProjectID=${!!projectId}, Email=${!!clientEmail}, Key=${!!privateKey}`);
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      });
    }

    // 2. LẤY DỮ LIỆU GỬI LÊN
    const { tokens, title, body } = req.body;

    if (!tokens || !tokens.length) {
      return res.status(200).json({ message: "Không có token nào để gửi." });
    }

    // 3. CẤU HÌNH GÓI TIN
    const message = {
      notification: { title, body },
      android: { priority: "high" },
      apns: {
        payload: { aps: { "content-available": 1, alert: { title, body }, sound: "default" } },
      },
      tokens: tokens,
    };

    // 4. GỬI ĐI
    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`FCM Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    // Nếu có lỗi, log chi tiết lỗi đầu tiên ra để debug
    if (response.failureCount > 0) {
      console.error("FCM Failure Details:", JSON.stringify(response.responses));
    }

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    // Trả về 500 nhưng kèm thông báo lỗi cụ thể
    return res.status(500).json({ 
      error: "Server Error", 
      details: error.message,
      stack: error.stack 
    });
  }
}