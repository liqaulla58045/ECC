import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../',
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/claude': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/openai': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
