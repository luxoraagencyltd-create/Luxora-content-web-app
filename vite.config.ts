import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Khi code gọi /api/proxy, Vite sẽ chuyển hướng nó
      // Nhưng vì proxy.js là file serverless, ta khó chạy nó trực tiếp bằng Vite thường.
      // CÁCH TỐT NHẤT Ở LOCAL: Trỏ thẳng vào Google Script để test
      
      '/api/proxy': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // Đoạn này hơi tricky: 
          // Code React của bạn gửi: /api/proxy?action=...&target=https://script.google.com/...
          // Chúng ta cần lấy cái tham số `target` để fetch, nhưng Vite proxy tĩnh không làm được logic động này dễ dàng.
          
          // GIẢI PHÁP TẠM THỜI CHO LOCAL:
          // Trả về chính cái URL script mặc định nếu chạy local
          return '/macros/s/AKfycbw7HIgfEnoIkUOWFB-xU7dlyno84OaSWrdvJ3LXlX9KryXRJ7uobHzShg6MCoEzbIdh-Q/exec';
        },
        // Cấu hình để xử lý redirect của Google
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Logic này để xử lý query params nếu cần
          });
        }
      }
    }
  }
});