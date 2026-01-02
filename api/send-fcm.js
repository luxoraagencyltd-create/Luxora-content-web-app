const admin = require("firebase-admin");

// Khởi tạo Admin SDK (Giữ nguyên)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (e) {
      console.error("Firebase Admin Init Error:", e);
    }
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { tokens, title, body } = req.body;

  if (!admin.apps.length) {
    return res.status(500).json({ error: "Firebase Admin config error" });
  }
  if (!tokens || !tokens.length) {
    return res.status(200).json({ message: "No tokens provided." });
  }

  // Lấy URL tuyệt đối cho icon
  const host = req.headers.host; 
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const iconUrl = `${protocol}://${host}/assets/logo-192.png`;

  try {
    // 👇 CẤU HÌNH GÓI TIN CHUẨN ĐỂ ĐÁNH THỨC MỌI THIẾT BỊ
    const message = {
      // 1. Dữ liệu chung cho Web Push (Chrome/Desktop)
      notification: {
        title: title || "Luxora Protocol",
        body: body || "Bạn có thông báo mới.",
        icon: iconUrl, // Icon cho Desktop
      },
      // 2. Cấu hình riêng cho Android (độ ưu tiên cao)
      android: {
        priority: "high",
        notification: {
          sound: "default",
        }
      },
      // 3. Cấu hình riêng cho Apple (quan trọng)
      apns: {
        payload: {
          aps: {
            alert: {
              title: title,
              body: body,
            },
            sound: "default",
            badge: 1,
            "content-available": 1, // Đánh thức app
          },
        },
      },
      // 4. Cấu hình Webpush (để Service Worker nhận diện)
      webpush: {
        notification: {
          icon: iconUrl,
          badge: iconUrl,
        },
        fcm_options: {
          link: `${protocol}://${host}/` // Bấm vào noti sẽ mở trang chủ
        }
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`FCM Sent: ${response.successCount} success.`);
    res.status(200).json({ success: true, sent: response.successCount });
    
  } catch (error) {
    console.error("FCM Send Error:", error);
    res.status(500).json({ error: error.message });
  }
}