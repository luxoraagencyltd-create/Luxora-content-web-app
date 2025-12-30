// api/proxy.js

export default async function handler(req, res) {
  // 1. Xử lý CORS (Cho phép React gọi vào)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Xử lý request OPTIONS (Preflight check của trình duyệt)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Lấy URL đích
  const { target } = req.query;
  const defaultTarget = 'https://script.google.com/macros/s/AKfycbxFTCYBBwC2s0Cu0KQkAjnJ15P9FmQx68orggfKhUtRMiA-VP2EaXWfruOCTfEmXdDUkQ/exec'; 
  
  // Ưu tiên target từ query, nếu không có thì dùng default (nhưng thường React đã gửi target rồi)
  let forwardTo = target || defaultTarget;

  // Xây dựng URL đích kèm query params (trừ target ra)
  const qs = Object.keys(req.query)
    .filter(k => k !== 'target')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(req.query[k])}`)
    .join('&');

  const url = qs ? `${forwardTo}?${qs}` : forwardTo;

  // 3. Cấu hình Fetch Options để gọi sang Google
  const fetchOptions = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json', // Bắt buộc để Google hiểu
    },
  };

  // --- ĐOẠN QUAN TRỌNG MỚI THÊM ---
  // Nếu là POST, phải chuyển tiếp body (dữ liệu feedback) sang Google
  if (req.method === 'POST') {
    // Vercel tự động parse body thành object, ta cần stringify lại để gửi đi
    fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }
  // ---------------------------------

  try {
    // 4. Gọi sang Google Script
    const response = await fetch(url, fetchOptions);
    
    // 5. Trả kết quả về cho React
    const text = await response.text();
    res.status(response.status).send(text);
    
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ status: "error", message: "Lỗi Proxy: " + error.message });
  }
}