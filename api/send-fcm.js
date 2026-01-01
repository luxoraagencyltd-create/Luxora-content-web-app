// api/send-fcm.js
const admin = require("firebase-admin");

// 1. KHỞI TẠO FIREBASE ADMIN SDK
// Kiểm tra xem đã khởi tạo chưa để tránh lỗi "App already exists" khi hot-reload
if (!admin.apps.length) {
  // Xử lý Private Key: Vercel lưu xuống dòng là '\n', cần replace lại thành xuống dòng thật
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Chỉ khởi tạo nếu đủ biến môi trường
  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      });
      console.log("Firebase Admin Initialized Successfully");
    } catch (e) {
      console.error("Firebase Admin Init Error:", e);
    }
  } else {
    console.error("MISSING ENV VARIABLES: Kiểm tra lại FIREBASE_PRIVATE_KEY, CLIENT_EMAIL, PROJECT_ID trên Vercel.");
  }
}

export default async function handler(req, res) {
  // 2. CẤU HÌNH CORS (Để React gọi được API này)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Trả về ngay nếu là preflight request
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3. LẤY DỮ LIỆU TỪ REQUEST
  const { tokens, title, body } = req.body;

  if (!admin.apps.length) {
    return res.status(500).json({ error: "Server Configuration Error: Firebase Admin not initialized." });
  }

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(200).json({ message: "No tokens provided. Skipping." });
  }

  // 4. XÂY DỰNG ĐƯỜNG DẪN TUYỆT ĐỐI CHO ICON
  // FCM yêu cầu ảnh phải là link đầy đủ (https://...)
  const host = req.headers.host; 
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const iconUrl = `${protocol}://${host}/assets/pwa-192x192.png`;

  try {
    // 5. CẤU HÌNH GÓI TIN THÔNG BÁO (PAYLOAD)
    const message = {
      notification: {
        title: title || "Notification",
        body: body || "",
      },
      // Cấu hình riêng cho Android
      android: {
        priority: "high", // Đánh thức máy khi ngủ
        notification: {
          icon: iconUrl,
          color: "#00f3ff", // Màu icon trên thanh trạng thái (Cyber Blue)
          priority: "high",
          channelId: "default",
          sound: "default",
          defaultSound: true
        }
      },
      // Cấu hình riêng cho iOS (Apple)
      apns: {
        headers: {
          "apns-priority": "10", // Mức ưu tiên cao nhất
        },
        payload: {
          aps: {
            "content-available": 1, // Cho phép chạy ngầm cập nhật
            alert: {
              title: title,
              body: body,
            },
            sound: "default",
            badge: 1
          },
        },
      },
      tokens: tokens, // Danh sách người nhận
    };

    console.log(`Sending FCM to ${tokens.length} devices with icon: ${iconUrl}`);

    // 6. GỬI ĐI
    const response = await admin.messaging().sendMulticast(message);
    
    // Log kết quả chi tiết
    console.log(`FCM Result -> Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error.message
          });
        }
      });
      console.warn("Failed details:", JSON.stringify(failedTokens));
    }

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount 
    });

  } catch (error) {
    console.error("FCM Send Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}