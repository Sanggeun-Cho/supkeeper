import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 개발 중 백엔드가 8080, 프론트 dev가 5173일 때 프록시
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/user': 'http://localhost:8080',
      '/semester': 'http://localhost:8080',
      '/subject': 'http://localhost:8080',
      '/assignment': 'http://localhost:8080'
    }
  },
  build: { outDir: 'dist' }
})
