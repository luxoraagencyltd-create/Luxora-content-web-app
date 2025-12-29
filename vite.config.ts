
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
    ,
    proxy: {
      '/api/proxy': {
        target: process.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw7HIgfEnoIkUOWFB-xU7dlyno84OaSWrdvJ3LXlX9KryXRJ7uobHzShg6MCoEzbIdh-Q/exec',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
      }
    }
  }
});
