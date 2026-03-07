import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../',
  server: {
    proxy: {
      '/claude-api': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/claude-api/, ''),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
