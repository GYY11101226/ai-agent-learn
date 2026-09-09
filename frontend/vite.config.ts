import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发环境把 /api 代理到 FastAPI（127.0.0.1:8000），避免跨域。
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})