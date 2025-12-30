import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Tự động cập nhật khi có bản mới
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Luxora Protocol',
        short_name: 'Luxora',
        description: 'Digital Temple Protocol 2.0 - Content Management System',
        theme_color: '#0d0b0a', // Màu thanh status bar
        background_color: '#0d0b0a', // Màu nền lúc khởi động
        display: 'standalone', // Chạy như app native (mất thanh địa chỉ)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/assets/pwa-192x192.png', // Bạn cần tạo ảnh này
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/pwa-512x512.png', // Bạn cần tạo ảnh này
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/proxy': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
           // Giữ nguyên logic proxy cũ của bạn
           const googleScriptID = 'AKfycbxFTCYBBwC2s0Cu0KQkAjnJ15P9FmQx68orggfKhUtRMiA-VP2EaXWfruOCTfEmXdDUkQ'; 
           const query = path.split('?')[1] || '';
           return `/macros/s/${googleScriptID}/exec?${query}`;
        }
      }
    }
  }
});